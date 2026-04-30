"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { AppModule, hasPermission, Role } from "./permissions";
// @ts-ignore (silence tsconfig mapping mismatch)
import AccessDenied from "../../app/components/AccessDenied";

interface WithPageAuthProps {
  module: AppModule;
  children: React.ReactNode;
}

/**
 * A wrapper component that strictly enforces Role-Based Access Control (RBAC)
 * on a specific Application Module.
 * If the user's role does not qualify, it blocks them and renders AccessDenied.
 */
export default function RequirePagePermission({ module, children }: WithPageAuthProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user || !profile) {
      router.push("/");
      return;
    }

    const { role } = profile as { role?: Role };
    const canAccess = hasPermission(role, module);
    
    setAuthorized(canAccess);
  }, [user, profile, loading, module, router]);

  if (loading || authorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <AccessDenied requestedModule={module} />;
  }

  return <>{children}</>;
}
