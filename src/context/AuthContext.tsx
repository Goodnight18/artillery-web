"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Role } from "../lib/permissions";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  display_name?: string;
  unit?: string;
  unit_code?: string;
  unit_name_th?: string;
  role: Role;
  status: "active" | "disabled";
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  // ✅ helpers (ใช้ซ่อนปุ่ม/กันหน้าได้เลย)
  role: Role | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;        // either super_admin or admin
  isUnitAdmin: boolean;
  isDataEntry: boolean;
  isViewer: boolean;
  isMaintenance: boolean;
  isActiveUser: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,

  role: null,
  isSuperAdmin: false,
  isAdmin: false,
  isUnitAdmin: false,
  isDataEntry: false,
  isViewer: false,
  isMaintenance: false,
  isActiveUser: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // ✅ อ่าน profile แบบตรงที่สุด: users/{uid}
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn("User profile not found for uid:", currentUser.uid, "Using fallback.");
          // Fallback to Auth data
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "",
            unit: "",
            unit_code: "",
            unit_name_th: "",
            role: "viewer",
            status: "active",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setProfile(fallbackProfile);
        } else {
          const p = snap.data() as any;
          const status = p.status || (p.isActive === false ? "disabled" : "active");

          // ✅ กัน profile ผิดคน / ข้อมูลไม่ครบ
          const merged: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || p.email || "",
            displayName: p.display_name || p.displayName || currentUser.displayName || "",
            display_name: p.display_name,
            unit: p.unit || p.unit_code || "",
            unit_code: p.unit_code || p.unit || "",
            unit_name_th: p.unit_name_th || p.display_name || p.displayName || "",
            role: (p.role as Role) || "viewer",
            status: status,
            isActive: status === "active",
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          };

          setProfile(merged);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // ✅ บังคับ Sign Out ถ้าบัญชีถูกระงับ (Disabled)
  useEffect(() => {
    if (user && profile && profile.status === "disabled") {
      console.warn("User account is disabled. Signing out...");
      signOut(auth).then(() => {
        // อธิบายเหตุผลหรือแสดงแจ้งเตือนถ้าจำเป็น
        window.location.href = "/?error=disabled";
      });
    }
  }, [user, profile]);

  const computed = useMemo(() => {
    const role = profile?.role ?? null;
    const isActiveUser = profile?.isActive === true;

    const isSuperAdmin = isActiveUser && role === "super_admin";
    const isAdmin = isActiveUser && (role === "admin" || role === "super_admin");
    const isUnitAdmin = isActiveUser && role === "unit_admin";
    const isDataEntry = isActiveUser && role === "data_entry";
    const isViewer = isActiveUser && role === "viewer";
    const isMaintenance = isActiveUser && role === "maintenance";

    return { 
      role, 
      isSuperAdmin, 
      isAdmin, 
      isUnitAdmin, 
      isDataEntry, 
      isViewer, 
      isMaintenance, 
      isActiveUser 
    };
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        ...computed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
