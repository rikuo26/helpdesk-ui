export const runtime = "nodejs";
export async function GET() {
  return Response.json({
    FUNC_BASE: process.env["FUNC_BASE"] ?? null,
    API_BASE: process.env["API_BASE"] ?? null,
    NEXT_PUBLIC_API_BASE_URL: process.env["NEXT_PUBLIC_API_BASE_URL"] ?? null,
    has_FUNC_KEY: Boolean(process.env["FUNC_KEY"] || process.env["API_KEY"]),
  });
}


