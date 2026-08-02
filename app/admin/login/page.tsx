import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "../../../lib/admin-auth";
import AdminLoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin");

  return (
    <Suspense fallback={<main className="admin-login"><p>Loading…</p></main>}>
      <AdminLoginForm />
    </Suspense>
  );
}
