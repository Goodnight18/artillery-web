"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import ClientLayout from "../../components/ClientLayout";
import { useAuth } from "@/context/AuthContext";
import RequirePagePermission from "@/lib/requirePagePermission";

type Presence = {
  uid: string;
  online: boolean;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  page?: string;
  action?: string;
  lastActiveAt?: number;
};

function since(ms?: number) {
  if (!ms) return "-";

  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);

  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);

  if (m < 60) return `${m}m`;

  const h = Math.floor(m / 60);

  return `${h}h`;
}

function status(ms?: number) {
  if (!ms) return "offline";

  const diff = Date.now() - ms;

  if (diff < 30000) return "online";
  if (diff < 300000) return "idle";

  return "offline";
}

export default function OnlineUsersPage() {
  const { loading, isAdmin, isActiveUser } = useAuth();

  const [list, setList] = useState<Presence[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const presenceRef = ref(rtdb, "presence");

    const unsubscribe = onValue(
      presenceRef,
      (snap) => {
        const val = (snap.val() || {}) as Record<string, Presence>;

        const arr = Object.values(val)
          .filter((x) => x?.online === true)
          .sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));

        setList(arr);
      },
      (err) => {
        console.error("presence read error:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    if (roleFilter === "all") return list;
    return list.filter((u) => u.role === roleFilter);
  }, [list, roleFilter]);

  return (
    <RequirePagePermission module="online_users">
      <ClientLayout>
        <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">

          <div className="mb-6">
            <div className="text-2xl font-bold text-slate-900">
              ผู้ใช้งานออนไลน์
            </div>
            <div className="text-sm text-slate-600">
              แสดงผู้ที่ online อยู่ในระบบแบบเรียลไทม์
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between mb-4">

              <div className="text-sm text-slate-600">
                ออนไลน์ตอนนี้: {list.length} คน
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
              </select>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-left text-sm">

                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-l-lg">
                      ผู้ใช้
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Role
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      หน้าปัจจุบัน
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Action
                    </th>
                    <th className="px-4 py-3 font-semibold rounded-r-lg">
                      ล่าสุด
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filtered.map((u) => {

                    const s = status(u.lastActiveAt);

                    return (
                      <tr
                        key={u.uid}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">

                            <img
                              src={u.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                              className="w-8 h-8 rounded-full"
                            />

                            <div>
                              <div className="font-medium text-slate-900">
                                {u.displayName || "-"}
                              </div>

                              <div className="text-xs text-slate-500">
                                {u.email}
                              </div>
                            </div>

                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {u.page || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3">

                          {s === "online" && (
                            <span className="text-green-600 font-medium">
                              ● Online
                            </span>
                          )}

                          {s === "idle" && (
                            <span className="text-yellow-600 font-medium">
                              ● Idle
                            </span>
                          )}

                          {s === "offline" && (
                            <span className="text-gray-500 font-medium">
                              ● Offline
                            </span>
                          )}

                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {u.action || "IDLE"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {since(u.lastActiveAt)} ago
                          </span>
                        </td>

                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-slate-500"
                      >
                        ไม่มีผู้ใช้งานออนไลน์
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      </div>
      </ClientLayout>
    </RequirePagePermission>
  );
}