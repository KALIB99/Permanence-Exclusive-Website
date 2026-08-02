import { requireAdminUser } from "../../lib/admin-auth";
import AdminDashboard from "./AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  return <AdminDashboard ownerName={user.displayName} />;
}
