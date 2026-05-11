import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.sendStatus(200)
}
