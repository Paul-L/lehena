// Top-level seed entry point invoked by `pnpm seed`
// (`medusa exec ./src/scripts/seed.ts`).
//
// The actual seeding logic lives under ./seed/ and is split per concern:
//   - seed/store.ts        store currencies + sales channel + API key
//   - seed/regions.ts      3 regions FR/UE/Monde + product types +
//                          differentiated VAT (5,5 % alimentaire / 20 % accessoire)
//   - seed/fulfillment.ts  Boutique Lehena stock location + fresh/ambient
//                          shipping profiles + stub options
//
// Editorial pages have their own entry point: seed-pages.ts (cf. CMS series).
export { default } from "./seed/index"
