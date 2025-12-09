"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        signOut({ redirect: false }).then(() => {
          router.push("/login");
        });
      }}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

