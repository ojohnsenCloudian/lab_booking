import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session as {
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

export async function isAdmin() {
  const session = await auth();
  return session?.user && (session.user as any).role === "ADMIN";
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}
