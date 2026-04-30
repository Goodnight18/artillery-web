"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ClientLayout from "../../components/ClientLayout";
import { useAuth } from "@/context/AuthContext";
import { writeAuditLog } from "@/lib/audit";
import RequirePagePermission from "@/lib/requirePagePermission";

type AuditLog = {
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;

  action: string;
  resource: string;
  resourceId?: string | null;

  before?: any;
  after?: any;
  meta?: any;

  createdAt?: any;
};

function toDateInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function asDate(v: any): Date | null {
  try {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === "function") return v.toDate();
    if (v instanceof Timestamp) return v.toDate();
    return null;
  } catch {
    return null;
  }
}

function formatDateTime(v: any) {
  const d = asDate(v);
  if (!d) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function AdminAuditLogsPage() {
  const { loading, isAdmin, isActiveUser } = useAuth();

  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [qText, setQText] = useState("");
  const [action, setAction] = useState<string>("all");
  const [resource, setResource] = useState<string>("all");

  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState<string>(() => toDateInputValue(new Date(today.getTime() - 7 * 86400000)));
  const [toDate, setToDate] = useState<string>(() => toDateInputValue(today));

  // pagination
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // derived: local options
  const actionOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.action).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const resourceOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.resource).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  useEffect(() => {
    // load initial
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildBaseQuery(nextCursor?: QueryDocumentSnapshot<DocumentData> | null) {
    const col = collection(db, "audit_logs");

    // date range (createdAt)
    // from 00:00:00 to 23:59:59
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T23:59:59.999`);

    const clauses: any[] = [
      where("createdAt", ">=", from),
      where("createdAt", "<=", to),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    ];

    if (resource !== "all") clauses.unshift(where("resource", "==", resource));
    if (action !== "all") clauses.unshift(where("action", "==", action));

    const q = query(col, ...clauses);
    return nextCursor ? query(col, ...clauses, startAfter(nextCursor)) : q;
  }

  async function reload() {
    setRows([]);
    setCursor(null);
    setHasMore(true);
    await fetchPage(true);
  }

  async function fetchPage(isFirst = false) {
    if (loadingData) return;
    setLoadingData(true);
    setError(null);

    try {
      const q = buildBaseQuery(isFirst ? null : cursor);
      const snap = await getDocs(q);

      const list = snap.docs.map((d) => d.data() as AuditLog);
      setRows((prev) => (isFirst ? list : [...prev, ...list]));

      const last = snap.docs[snap.docs.length - 1] || null;
      setCursor(last);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoadingData(false);
    }
  }

  const filteredRows = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const hay = [
        r.actorName,
        r.actorEmail,
        r.actorRole,
        r.action,
        r.resource,
        r.resourceId || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [rows, qText]);

  return (
    <RequirePagePermission module="audit">
      <ClientLayout>
        <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-bold text-slate-900">Audit Logs</div>
              <div className="text-sm text-slate-600">ตรวจสอบการเพิ่ม/ลบ/แก้ไขย้อนหลัง (Admin เท่านั้น)</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={reload}
                disabled={loadingData}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingData ? "กำลังโหลด..." : "รีเฟรช"}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">ค้นหา</label>
                <input
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="ชื่อ/อีเมล/Action/Resource/ID"
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {actionOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Resource</label>
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {resourceOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">จากวันที่</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">ถึงวันที่</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                แสดง {filteredRows.length} รายการ (โหลดมาแล้ว {rows.length})
              </div>

              <button
                onClick={() => reload()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                ใช้ตัวกรอง
              </button>
            </div>

            {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          </div>

          {/* Table */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-l-lg">เวลา</th>
                    <th className="px-4 py-3 font-semibold">ผู้กระทำ</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Resource</th>
                    <th className="px-4 py-3 font-semibold">Target</th>
                    <th className="px-4 py-3 font-semibold rounded-r-lg">รายละเอียด</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((r, idx) => (
                    <tr key={`${r.actorUid}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{formatDateTime(r.createdAt)}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.actorName || "-"}</div>
                        <div className="text-xs text-slate-500">{r.actorEmail || "-"}</div>
                        <div className="text-xs text-slate-500">role: {r.actorRole || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          {r.action}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {r.resource}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{(r as any).targetName || "-"}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{r.resourceId || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <details className="cursor-pointer group">
                          <summary className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors list-none flex items-center gap-1">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            เปรียบเทียบข้อมูล (Before/After)
                          </summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                ข้อมูลเดิม (BEFORE)
                              </div>
                              <pre className="overflow-auto text-[11px] leading-relaxed text-slate-700 max-h-[200px] custom-scrollbar">
                                {JSON.stringify(r.before ?? {}, null, 2)}
                              </pre>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 shadow-sm">
                              <div className="text-[10px] uppercase tracking-wider font-black text-emerald-500 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                ข้อมูลใหม่ (AFTER)
                              </div>
                              <pre className="overflow-auto text-[11px] leading-relaxed text-emerald-900 max-h-[200px] custom-scrollbar">
                                {JSON.stringify(r.after ?? {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                          {r.meta && (
                            <div className="mt-2 rounded-xl bg-slate-50 p-2">
                              <div className="text-[11px] font-bold text-slate-700">meta</div>
                              <pre className="mt-1 overflow-auto text-[11px] text-slate-700">
                                {JSON.stringify(r.meta ?? null, null, 2)}
                              </pre>
                            </div>
                          )}
                        </details>
                      </td>
                    </tr>
                  ))}

                  {!loadingData && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                โหลดทีละ {PAGE_SIZE} รายการ (เรียงเวลาล่าสุดก่อน)
              </div>

              <button
                onClick={() => fetchPage(false)}
                disabled={!hasMore || loadingData}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingData ? "กำลังโหลด..." : hasMore ? "โหลดเพิ่ม" : "ครบแล้ว"}
              </button>
            </div>
          </div>
        </div>
      </div>
      </ClientLayout>
    </RequirePagePermission>
  );
}