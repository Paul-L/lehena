# Custom CLI Script

A custom CLI script is a function to execute through Medusa's CLI tool. This is useful when creating custom Medusa tooling to run as a CLI tool.

> Learn more about custom CLI scripts in [this documentation](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts).

## How to Create a Custom CLI Script?

To create a custom CLI script, create a TypeScript or JavaScript file under the `src/scripts` directory. The file must default export a function.

For example, create the file `src/scripts/my-script.ts` with the following content:

```ts title="src/scripts/my-script.ts"
import { 
  ExecArgs,
} from "@medusajs/framework/types"

export default async function myScript ({
  container
}: ExecArgs) {
  const productModuleService = container.resolve("product")

  const [, count] = await productModuleService.listAndCountProducts()

  console.log(`You have ${count} product(s)`)
}
```

The function receives as a parameter an object having a `container` property, which is an instance of the Medusa Container. Use it to resolve resources in your Medusa application.

---

## How to Run Custom CLI Script?

To run the custom CLI script, run the `exec` command:

```bash
npx medusa exec ./src/scripts/my-script.ts
```

---

## Custom CLI Script Arguments

Your script can accept arguments from the command line. Arguments are passed to the function's object parameter in the `args` property.

For example:

```ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function myScript ({
  args
}: ExecArgs) {
  console.log(`The arguments you passed: ${args}`)
}
```

Then, pass the arguments in the `exec` command after the file path:

```bash
npx medusa exec ./src/scripts/my-script.ts arg1 arg2
```

> Note: `medusa exec` swallows `--flag=value` style args itself. Put a bare `--` separator between the script path and the flags so they reach `process.argv`:
>
> ```bash
> npx medusa exec ./src/scripts/migrate-products.ts -- --source=fixtures --commit
> ```

---

## WP → Medusa migration (Phase 14 cutover)

Three scripts cooperate to bring the legacy WooCommerce store into Medusa:

| Script | Reads | Writes |
| --- | --- | --- |
| `migrate-media.ts` | WC image URLs | Medusa File Module (S3 / local) |
| `migrate-products.ts` | WC products + variations | `product`, `product_details` (link), `variant_details` (link) |
| `migrate-customers.ts` | WC customers + addresses | `customer`, `customer_address` |

Each script is **idempotent by natural key** (`handle` for products, `email` for customers) — re-running it skips rows already present in Medusa. Reports land in `apps/backend/migration-reports/`.

### Prerequisites

1. **WC REST API credentials** in `apps/backend/.env`:
   - `WC_API_URL` (e.g. `https://lehena.fr`)
   - `WC_API_CONSUMER_KEY` / `WC_API_CONSUMER_SECRET` — read-only is enough
2. **Medusa side seeded** — sales channel, shipping profiles (`fresh_chronofresh`, `ambient_colissimo`), and product categories must exist. Run `npm run seed` once before the first commit pass; subsequent imports reuse the same IDs.
3. **Medusa server running** (`medusa develop`) is **not** required — `medusa exec` spins up its own container.

### Recommended order (cutover day)

```bash
# 1. Dry-run every script first; verify the reports.
npx medusa exec ./src/scripts/migrate-products.ts  -- --source=api
npx medusa exec ./src/scripts/migrate-customers.ts -- --source=api

# 2. Rehost media so product image URLs point to your CDN, not the legacy WP.
npx medusa exec ./src/scripts/migrate-media.ts     -- --source=api --commit

# 3. Commit products (creates Product + product_details + variant_details).
npx medusa exec ./src/scripts/migrate-products.ts  -- --source=api --commit

# 4. Commit customers.
npx medusa exec ./src/scripts/migrate-customers.ts -- --source=api --commit
```

### Recovery / partial re-runs

A failed run mid-batch leaves Medusa in a partially populated state. Just re-run the same command: existing rows are skipped (logged as `skipped: handle already exists`), and the remaining rows pick up where the previous run stopped.

To re-import a specific product from scratch, delete it in the admin first — the next `--commit` run will re-create it.

### Smoke testing locally

Without WC creds, drive the same code path off the checked-in fixtures:

```bash
npx medusa exec ./src/scripts/migrate-products.ts -- --source=fixtures --commit --limit=5
```

See `apps/backend/fixtures/migration/` for the CSV shape.

### Admin UI

The merchant-facing path lives at `http://localhost:9000/app/migration`. Same runs, same workflow — the page just wraps the API at `/admin/migration-runs`. Each run trigger creates a `migration_run` row in DB; the runner streams entries back into the row when it finishes. CLI runs (tagged `triggered_by=cli`) appear in the same list, so dev + operator views stay in sync.

**Stuck runs:** if Medusa crashes mid-run, the row stays in `status=running`. A scheduled job (`src/jobs/migration-recover-stuck.ts`, cron `* * * * *`) flips anything running for more than 10 minutes to `status=failed`. Tune the timeout if your runs trend longer.