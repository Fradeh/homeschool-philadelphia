"use client";

import { canAccessPortal, type AuthUser, UserRole } from "@homeschool/shared";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { clearSession, saveSession } from "@/lib/session";

export function PortalAuthGate({
  role,
  children,
  onAuthenticated
}: {
  role: UserRole;
  children: ReactNode;
  onAuthenticated?: (user: AuthUser) => void;
}) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const user = await apiRequest<import("@homeschool/shared").AuthUser>("/auth/me");
        if (!canAccessPortal(user.roles, role)) {
          clearSession();
          router.replace("/");
          return;
        }

        saveSession({ user });
        onAuthenticated?.(user);
        if (isMounted) setIsAllowed(true);
      } catch {
        clearSession();
        router.replace("/");
      }
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [onAuthenticated, role, router]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
