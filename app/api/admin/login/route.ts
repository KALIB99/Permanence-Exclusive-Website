import { createAdminSession, validateAdminPassword } from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";

  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 503 },
    );
  }

  if (!(await validateAdminPassword(password))) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createAdminSession();
  return Response.json({ ok: true });
}
