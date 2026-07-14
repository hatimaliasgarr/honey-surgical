import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import type { UserRole } from "@/lib/types/catalog";

export type AdminSession = {
  demo: boolean;
  userId: string;
  email: string;
  role: UserRole;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  // Check simple cookie-based auth (set by admin/admin login form)
  const cookieStore = await cookies();
  const adminSessionCookie = cookieStore.get("admin_session");

  if (adminSessionCookie?.value === "authenticated") {
    // Basic hardcoded auth for backward compatibility or simple setups
    return {
      demo: false,
      userId: "admin",
      email: "admin@honeysurgicals.local",
      role: "super_admin"
    };
  }

  // TODO: Add proper JWT or Session token validation here reading from cookies
  // For now, if there's no authenticated cookie, we deny access
  return null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
