import { sdk } from "../../lib/sdk"

/**
 * Uploads an image file via Medusa's native file module.
 *
 * Uses the built-in `POST /admin/uploads` route which is wired to the
 * configured file provider (local in dev, S3/MinIO in production). Returns
 * the public URL of the hosted asset, suitable for `<img src="...">`.
 *
 * Throws if the upload fails or no URL was returned.
 */
export async function uploadImageToMedusa(file: File): Promise<string> {
  const result = await sdk.admin.upload.create({
    files: [file],
  })

  const uploaded = result.files?.[0]
  if (!uploaded?.url) {
    throw new Error("L'upload a réussi mais aucune URL n'a été renvoyée.")
  }

  return uploaded.url
}
