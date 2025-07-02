"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  allowedRole: "ADMIN" | "STAFF";
  children: React.ReactNode;
}

function decodeJWT(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    const payload = decodeJWT(token);
    if (!payload || !payload.role) {
      router.replace("/login");
      return;
    }
    if (payload.role !== allowedRole) {
      router.replace("/unauthorized");
      return;
    }
    setIsAuthorized(true);
  }, [allowedRole, router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
} 