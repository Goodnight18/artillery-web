"use client";

import { useMemo, useState } from "react";
import { Copy, CheckCircle2, Shield, User as UserIcon, Mail, KeyRound, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "../components/ClientLayout";

function formatDate(input: any) {
  // รองรับ: Firestore Timestamp, Date, string, number(ms)
  try {
    const d =
      input?.toDate?.() ??
      (typeof input === "number" ? new Date(input) : input instanceof Date ? input : input ? new Date(input) : null);

    if (!d || isNaN(d.getTime())) return "-";
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function maskUid(uid?: string) {
  if (!uid) return "-";
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

function RoleBadge({ role }: { role?: string }) {
  const r = (role || "user").toLowerCase();
  const label = r === "admin" ? "Admin" : r === "operator" ? "Operator" : "User";

  const cls =
    r === "admin"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : r === "operator"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${cls}`}>{label}</span>;
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  const active = !!isActive;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`} />
      {active ? "Active" : "Suspended"}
    </span>
  );
}

export default function ProfilePage() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const createdAt = useMemo(() => formatDate(profile?.createdAt), [profile?.createdAt]);
  const updatedAt = useMemo(() => formatDate(profile?.updatedAt), [profile?.updatedAt]);

  const handleCopyUid = async () => {
    if (!profile?.uid) return;
    try {
      await navigator.clipboard.writeText(profile.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // เผื่อบาง browser block clipboard
      setCopied(false);
    }
  };

  return (
    <ClientLayout>
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">ข้อมูลบัญชีผู้ใช้งาน (จัดการโดยแอดมิน)</p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge isActive={profile?.isActive} />
            <RoleBadge role={profile?.role} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Card: User Info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <UserIcon className="h-5 w-5" />
              <h2 className="text-sm font-semibold">User Information</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-4 w-4 text-slate-500" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Display Name</p>
                  <p className="truncate text-sm font-medium text-slate-900">{profile?.displayName || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="truncate text-sm font-medium text-slate-900">{profile?.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 text-slate-500" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-900">{(profile?.role || "user").toString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">UID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{maskUid(profile?.uid)}</p>
                    <button
                      onClick={handleCopyUid}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      type="button"
                      title="Copy UID"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">* ข้อมูลบัญชีถูกจัดการโดยผู้ดูแลระบบ</p>
          </div>

          {/* Card: System Info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <Clock className="h-5 w-5" />
              <h2 className="text-sm font-semibold">System Information</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="text-sm font-medium text-slate-900">{createdAt}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Updated At</p>
                  <p className="text-sm font-medium text-slate-900">{updatedAt}</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold text-slate-700">Tip</p>
                  <p className="mt-1 text-xs text-slate-600">
                    ถ้าต้องการให้ดูโปรขึ้นอีก ให้เพิ่ม field: <span className="font-medium">unit, checkpoints, lastLoginAt</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!profile && (
          <div className="mt-6 rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            กำลังโหลดข้อมูลโปรไฟล์…
          </div>
        )}
      </div>
    </div>
    </ClientLayout>
  );
}
