"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,         // ✅ เพิ่ม
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ClientLayout from "../components/ClientLayout";
import RequirePagePermission from "@/lib/requirePagePermission";
import { useAuth } from "@/context/AuthContext";

type Lane = "CAR" | "MOTORCYCLE";

type AccessLog = {
  ts?: any;
  plateCode?: string;
  decision?: "PASS" | "DENY";
  checkpointId?: string;
  reason?: string;
  lane?: Lane; // ✅ เพิ่ม
};

type VehicleDoc = {
  fullName?: string;
  vehicleType?: string;
  vehicleClass?: "CAR" | "MOTORCYCLE";
  brand?: string;
  model?: string;
  color?: string;
  photoUrl?: string;
  isActive?: boolean;
};

function normalizePlate(input: string) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
  let s = (input || "").trim();
  s = s.replace(/[\s\-_.]/g, "");
  s = s.replace(/[๐-๙]/g, (d) => String(thaiDigits.indexOf(d)));
  s = s.replace(/[oO]/g, "0");
  return s;
}

function formatPlateDisplay(input: string) {
  const s = normalizePlate(input);
  if (!s) return "";
  const m = s.match(/(\d{4})$/);
  if (!m) return s;
  const last4 = m[1];
  const head = s.slice(0, s.length - 4);
  return `${head} ${last4}`;
}

function formatTime(ts: any) {
  try {
    const d = ts?.toDate?.() ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : null;
    if (!d) return "-";
    return d.toLocaleString("th-TH");
  } catch {
    return "-";
  }
}

function getStatus(decision?: "PASS" | "DENY") {
  if (!decision) return { label: "รอข้อมูล...", tone: "neutral" as const };
  if (decision === "PASS") return { label: "อนุญาตผ่าน", tone: "pass" as const };
  return { label: "ไม่อนุญาต", tone: "deny" as const };
}

export default function MonitorPage() {
  return (
    <RequirePagePermission module="realtime">
      <MonitorContent />
    </RequirePagePermission>
  );
}

function MonitorContent() {
  const { profile, loading } = useAuth();

  // ✅ แยก logs 2 ชุด
  const [carLogs, setCarLogs] = useState<AccessLog[]>([]);
  const [motoLogs, setMotoLogs] = useState<AccessLog[]>([]);

  const latestCar = carLogs[0];
  const latestMoto = motoLogs[0];

  // ✅ cache รถร่วมกัน
  const vehicleCacheRef = useRef<Record<string, VehicleDoc | null>>({});
  const [vehicleMap, setVehicleMap] = useState<Record<string, VehicleDoc | null>>({});

  async function getVehicleByPlate(plateCode?: string) {
    const key = plateCode ? normalizePlate(plateCode) : "";
    if (!key) return null;

    if (key in vehicleCacheRef.current) return vehicleCacheRef.current[key];

    try {
      const snap = await getDoc(doc(db, "vehicles", key));
      const data = snap.exists() ? (snap.data() as VehicleDoc) : null;

      vehicleCacheRef.current[key] = data;
      setVehicleMap((prev) => ({ ...prev, [key]: data }));
      return data;
    } catch (e) {
      console.error("getVehicleByPlate error:", e);
      vehicleCacheRef.current[key] = null;
      setVehicleMap((prev) => ({ ...prev, [key]: null }));
      return null;
    }
  }

  // ✅ subscribe CAR + MOTORCYCLE
  useEffect(() => {
    if (loading) return;

    const base = collection(db, "access_logs");

    const conditionsCar: any[] = [where("lane", "==", "CAR")];
    const conditionsMoto: any[] = [where("lane", "==", "MOTORCYCLE")];

    if (profile?.role !== "super_admin" && profile?.role !== "admin") {
      if (profile?.unit_code) {
        conditionsCar.push(where("unit_code", "==", profile.unit_code));
        conditionsMoto.push(where("unit_code", "==", profile.unit_code));
      } else {
        conditionsCar.push(where("unit_code", "==", "NONE_FORCED_EMPTY"));
        conditionsMoto.push(where("unit_code", "==", "NONE_FORCED_EMPTY"));
      }
    }

    const qCar = query(base, ...conditionsCar, orderBy("ts", "desc"), limit(50));
    const qMoto = query(base, ...conditionsMoto, orderBy("ts", "desc"), limit(50));

    const unsubCar = onSnapshot(
      qCar,
      (snap) => setCarLogs(snap.docs.map((d) => d.data() as AccessLog)),
      (err) => console.error("car onSnapshot error:", err)
    );

    const unsubMoto = onSnapshot(
      qMoto,
      (snap) => setMotoLogs(snap.docs.map((d) => d.data() as AccessLog)),
      (err) => console.error("moto onSnapshot error:", err)
    );

    return () => {
      unsubCar();
      unsubMoto();
    };
  }, [profile, loading]);

  // ✅ prefetch รถของทั้ง 2 ฝั่ง
  useEffect(() => {
    const plates = Array.from(
      new Set(
        [...carLogs, ...motoLogs]
          .map((x) => x.plateCode)
          .filter(Boolean)
          .map((p) => normalizePlate(p as string))
      )
    );
    if (!plates.length) return;

    (async () => {
      for (const key of plates) {
        if (!(key in vehicleCacheRef.current)) {
          await getVehicleByPlate(key);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carLogs, motoLogs]);

  const latestCarKey = useMemo(() => (latestCar?.plateCode ? normalizePlate(latestCar.plateCode) : ""), [latestCar?.plateCode]);
  const latestMotoKey = useMemo(() => (latestMoto?.plateCode ? normalizePlate(latestMoto.plateCode) : ""), [latestMoto?.plateCode]);

  const latestCarVehicle = latestCarKey ? vehicleMap[latestCarKey] ?? null : null;
  const latestMotoVehicle = latestMotoKey ? vehicleMap[latestMotoKey] ?? null : null;

  return (
    <RequirePagePermission module="realtime">
      <ClientLayout>
        <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">หน้าจอแสดงผล (Live Monitor)</h1>
              <p className="mt-1 text-sm text-slate-600">
                แยก 2 ช่อง: รถยนต์ (CAR) และ มอเตอร์ไซค์ (MOTORCYCLE)
              </p>
            </div>
            <div className="flex gap-2">
              <a className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/records">
                เข้าสู่หน้าบันทึกข้อมูล
              </a>
              <a className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/">
                หน้าแรก
              </a>
            </div>
          </div>

          {/* ✅ 2 คอลัมน์ */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <LanePanel
              title="ช่องรถยนต์"
              logs={carLogs}
              latest={latestCar}
              latestVehicle={latestCarVehicle}
            />
            <LanePanel
              title="ช่องมอเตอร์ไซค์"
              logs={motoLogs}
              latest={latestMoto}
              latestVehicle={latestMotoVehicle}
            />
          </div>
        </div>
        </div>
      </ClientLayout>
    </RequirePagePermission>
  );
}

function LanePanel({
  title,
  logs,
  latest,
  latestVehicle,
}: {
  title: string;
  logs: AccessLog[];
  latest?: AccessLog;
  latestVehicle: VehicleDoc | null;
}) {
  const status = useMemo(() => getStatus(latest?.decision), [latest?.decision]);

  const toneClass =
    status.tone === "pass"
      ? "border-emerald-300 bg-emerald-50"
      : status.tone === "deny"
      ? "border-rose-300 bg-rose-50"
      : "border-slate-200 bg-white";

  const badgeClass =
    status.tone === "pass"
      ? "bg-emerald-600"
      : status.tone === "deny"
      ? "bg-rose-600"
      : "bg-slate-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-base font-bold text-slate-900">{title}</div>

      {/* Big Status */}
      <div className={`mt-3 rounded-2xl border p-4 ${toneClass}`}>
        <div className="flex items-center gap-3">
          <span className={`h-3 w-3 rounded-full ${badgeClass}`} />
          <div className="text-2xl font-extrabold text-slate-900">{status.label}</div>
        </div>

        <div className="mt-2 text-sm text-slate-700">
          <div>
            <span className="font-semibold">ทะเบียน:</span>{" "}
            <span className="text-lg font-bold">{latest?.plateCode ? formatPlateDisplay(latest.plateCode) : "-"}</span>
          </div>
          <div className="mt-1">
            <span className="font-semibold">เวลา:</span> {formatTime(latest?.ts)}
          </div>
          <div className="mt-1">
            <span className="font-semibold">ด่าน:</span> {latest?.checkpointId || "-"}
            <span className="ml-3 font-semibold">เหตุผล:</span> {latest?.reason || "-"}
          </div>
        </div>

        {/* Vehicle card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-sm font-semibold text-slate-800">ข้อมูลรถ (vehicles)</div>

          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {latestVehicle?.photoUrl ? (
              <img src={latestVehicle.photoUrl} alt="vehicle" className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center text-sm text-slate-500">ไม่มีรูปในฐานข้อมูล</div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
            <Info label="ชื่อ-นามสกุล" value={latestVehicle?.fullName} />
            <Info label="ประเภท" value={latestVehicle?.vehicleType} />
            <Info label="ยี่ห้อ" value={latestVehicle?.brand} />
            <Info label="รุ่น" value={latestVehicle?.model} />
            <Info label="สี" value={latestVehicle?.color} />
          </div>

          {!latestVehicle && latest?.plateCode && (
            <div className="mt-2 text-xs text-slate-500">
              * ไม่พบข้อมูลรถใน vehicles สำหรับทะเบียนนี้
            </div>
          )}
        </div>
      </div>

      {/* Recent table */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-2 text-sm font-semibold text-slate-800">รายการล่าสุด (50)</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b">
                <th className="px-2 py-3 font-semibold">เวลา</th>
                <th className="px-2 py-3 font-semibold">ทะเบียน</th>
                <th className="px-2 py-3 font-semibold">ผล</th>
                <th className="px-2 py-3 font-semibold">เหตุผล</th>
                <th className="px-2 py-3 font-semibold">จุดตรวจ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((x, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="px-2 py-3">{formatTime(x.ts)}</td>
                  <td className="px-2 py-3 font-semibold">{x.plateCode ? formatPlateDisplay(x.plateCode) : "-"}</td>
                  <td className="px-2 py-3">
                    {x.decision === "PASS" ? (
                      <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">PASS</span>
                    ) : x.decision === "DENY" ? (
                      <span className="rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">DENY</span>
                    ) : (
                      <span className="rounded-full bg-slate-600 px-2 py-1 text-xs font-semibold text-white">-</span>
                    )}
                  </td>
                  <td className="px-2 py-3">{x.reason || "-"}</td>
                  <td className="px-2 py-3">{x.checkpointId || "-"}</td>
                </tr>
              ))}

              {!logs.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value || "-"}</div>
    </div>
  );
}
