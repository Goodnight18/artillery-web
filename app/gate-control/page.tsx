"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import ClientLayout from "../components/ClientLayout";
import { db } from "@/lib/firebase";
import RequirePagePermission from "@/lib/requirePagePermission";

type GateSignalState = "IDLE" | "GREEN" | "RED" | "YELLOW";

type Checkpoint = {
  name: string;
  order: number;
  isActive: boolean;
};

type GateCommand = {
  cmd: GateSignalState;
  reason: string;
  ttlSec: number;
  cmdId: string;
  issuedAt?: any;
  issuedBy?: string;
};

type GateStatus = {
  state: GateSignalState;
  reason: string;
  lastCmdId?: string;
  isOnline?: boolean;
  lastSeenAt?: any;
};

function newCmdId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function GateControlPage() {
  return (
    <RequirePagePermission module="monitoring">
      <GateControlContent />
    </RequirePagePermission>
  );
}

function GateControlContent() {
  const [checkpoints, setCheckpoints] = useState<{ id: string; data: Checkpoint }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, GateStatus>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Load checkpoints
  useEffect(() => {
    const qy = query(collection(db, "checkpoints"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as Checkpoint }));
        setCheckpoints(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Subscribe gate_status for each checkpoint
  useEffect(() => {
    if (!checkpoints.length) return;

    const unsubs = checkpoints.map(({ id }) =>
      onSnapshot(
        doc(db, "gate_status", id),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as GateStatus;
          setStatuses((prev) => ({ ...prev, [id]: data }));
        },
        (err) => console.error(err)
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [checkpoints]);

  async function initGateDocs() {
    setSeeding(true);
    try {
      const tasks = checkpoints.map(async ({ id }) => {
        // gate_commands
        await setDoc(
          doc(db, "gate_commands", id),
          {
            cmd: "IDLE",
            reason: "INIT",
            ttlSec: 8,
            cmdId: newCmdId(),
            issuedAt: serverTimestamp(),
          } satisfies GateCommand,
          { merge: true }
        );

        // gate_status (initial - will be overwritten by Pi)
        await setDoc(
          doc(db, "gate_status", id),
          {
            state: "IDLE",
            reason: "INIT",
            isOnline: false,
            lastSeenAt: serverTimestamp(),
          } satisfies GateStatus,
          { merge: true }
        );
      });

      await Promise.all(tasks);
      alert("Initialize gate_commands + gate_status สำเร็จ");
    } catch (e: any) {
      console.error(e);
      alert(`Init ล้มเหลว: ${e?.message || e}`);
    } finally {
      setSeeding(false);
    }
  }

  async function sendCommand(checkpointId: string, cmd: GateSignalState, reason: string) {
    try {
      const ttlSec = 8;

      const payload: GateCommand = {
        cmd,
        reason,
        ttlSec,
        cmdId: newCmdId(),
        issuedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "gate_commands", checkpointId), payload, { merge: true });
    } catch (e: any) {
      console.error(e);
      alert(`ส่งคำสั่งล้มเหลว: ${e?.message || e}`);
    }
  }

  const activeGates = useMemo(
    () => checkpoints.filter((x) => x.data?.isActive !== false),
    [checkpoints]
  );

  return (
    <RequirePagePermission module="electrical">
      <ClientLayout>
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Live Gate Control</h1>
                <p className="mt-1 text-sm text-slate-600">
                  ส่งคำสั่งไป Firestore: <b>gate_commands</b> และแสดงสถานะจริงจาก <b>gate_status</b>
                </p>
              </div>

              <button
                onClick={initGateDocs}
                disabled={seeding || loading || !checkpoints.length}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {seeding ? "กำลัง Initialize..." : "Initialize gate docs"}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {activeGates.map(({ id, data }) => {
                const st = statuses[id];
                const state: GateSignalState = st?.state ?? "IDLE";
                const reason = st?.reason ?? "NO_STATUS";
                const online = st?.isOnline === true;

                return (
                  <div key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-slate-500">{id}</div>
                        <div className="text-lg font-bold text-slate-900">{data.name || "-"}</div>
                        <div className="mt-1 text-xs">
                          <span
                            className={`rounded-full border px-2 py-0.5 ${
                              online ? "border-emerald-600 text-emerald-700" : "border-slate-300 text-slate-600"
                            }`}
                          >
                            {online ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>
                      </div>

                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass(state)}`}>
                        {state}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      reason: <span className="font-semibold text-slate-700">{reason}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => sendCommand(id, "GREEN", "MANUAL_ALLOW")}
                        className="rounded-lg border border-emerald-600 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        เขียว (ผ่าน)
                      </button>

                      <button
                        onClick={() => sendCommand(id, "RED", "MANUAL_DENY")}
                        className="rounded-lg border border-rose-600 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        แดง (ไม่ผ่าน)
                      </button>

                      <button
                        onClick={() => sendCommand(id, "YELLOW", "MANUAL_CHECK")}
                        className="rounded-lg border border-amber-600 bg-white px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        รอตรวจ
                      </button>

                      <button
                        onClick={() => sendCommand(id, "IDLE", "CLEAR")}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        ล้าง
                      </button>
                    </div>

                    {!st && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ยังไม่มี gate_status/{id} (Pi ยังไม่เขียนหรือยังไม่ initialize)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-xs text-slate-500">
              หมายเหตุ: เว็บ “ส่งคำสั่ง” เท่านั้น ส่วน “ไฟจริง” ให้ Raspberry Pi คุมและรายงานกลับผ่าน gate_status
            </div>
          </div>
        </div>
      </ClientLayout>
    </RequirePagePermission>
  );
}

function badgeClass(state: "IDLE" | "GREEN" | "RED" | "YELLOW") {
  switch (state) {
    case "GREEN":
      return "border-emerald-600 text-emerald-700";
    case "RED":
      return "border-rose-600 text-rose-700";
    case "YELLOW":
      return "border-amber-600 text-amber-700";
    default:
      return "border-slate-300 text-slate-600";
  }
}