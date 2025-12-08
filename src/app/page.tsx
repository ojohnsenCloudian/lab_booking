import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Check if admin exists
  const adminCount = await prisma.user.count({
    where: {
      role: "ADMIN",
    },
  });

  // If no admin exists, redirect to initial setup
  if (adminCount === 0) {
    redirect("/initial-setup");
  }

  const session = await auth();

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}

