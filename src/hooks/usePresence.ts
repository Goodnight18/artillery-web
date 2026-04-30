"use client";

import { useEffect } from "react";
import { ref, set, update, onValue, onDisconnect, serverTimestamp } from "firebase/database";
import { usePathname } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export function usePresence() {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!user?.uid) return;

    const uid = user.uid;
    const pRef = ref(rtdb, `presence/${uid}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const payloadBase = {
      uid,
      online: true,
      displayName: profile?.displayName || user.email || "-",
      email: user.email || "",
      role: profile?.role || "viewer",
      page: pathname || "/",
      action: "IDLE",
      lastActiveAt: Date.now(),
      updatedAt: serverTimestamp(),
    };

    // รอให้ RTDB connected ก่อน
    const unsub = onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      if (!isConnected) return;

      // เขียน online
      set(pRef, payloadBase);

      // ตั้ง auto-offline เมื่อหลุด/ปิดแท็บ
      onDisconnect(pRef).update({
        online: false,
        action: "DISCONNECTED",
        lastActiveAt: Date.now(),
        updatedAt: serverTimestamp(),
      });
    });

    // heartbeat update
    const t = setInterval(() => {
      update(pRef, {
        page: pathname || "/",
        lastActiveAt: Date.now(),
        updatedAt: serverTimestamp(),
      });
    }, 15000);

    return () => {
      unsub();
      clearInterval(t);
      // ไม่ต้อง set offline ตรงนี้ก็ได้ เพราะ onDisconnect จัดการแล้ว
    };
  }, [user?.uid, user?.email, profile?.displayName, profile?.role, pathname]);
}