"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { AUTHORIZED_UNITS, UnitOption } from "../../app/records/constants/units";

export type UnitSourceType = "internal" | "visitor";

export const useUnits = (type: UnitSourceType = "internal") => {
    const [units, setUnits] = useState<UnitOption[]>(type === "internal" ? AUTHORIZED_UNITS : []);
    const [loadingUnits, setLoadingUnits] = useState(true);

    useEffect(() => {
        const CACHE_KEY = `units_cache_${type}`;
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

        const fetchDynamicUnits = async () => {
            try {
                // Check Session Storage First
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < CACHE_TTL) {
                        setUnits(parsed.data);
                        setLoadingUnits(false);
                        return; // Cache hit
                    }
                }
                if (type === "internal") {
                    // Internal Units: Fetch from 'users' collection to get currently assigned units
                    const usersRef = collection(db, "users");
                    const snapshot = await getDocs(usersRef);
                    
                    const dynamicUnitsMap = new Map<string, string>();
                    
                    // Add hardcoded units first
                    AUTHORIZED_UNITS.forEach(u => dynamicUnitsMap.set(u.code, u.name_th));
                    
                    // Extract units from users
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        const code = data.unit_code || data.unit;
                        const name = data.unit_name_th || data.display_name || data.displayName || "";
                        
                        if (code && !dynamicUnitsMap.has(code)) {
                            dynamicUnitsMap.set(code, name);
                        }
                    });
                    
                    // Convert back to Array
                    const mergedUnits: UnitOption[] = Array.from(dynamicUnitsMap.entries()).map(([code, name_th]) => ({
                        code,
                        name_th
                    }));
                    
                    // Sort by name (Thai sorting)
                    mergedUnits.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
                    
                    // Save to cache
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: mergedUnits
                    }));
                    setUnits(mergedUnits);
                } else {
                    // Visitor Units: Fetch from 'visitor_units' collection
                    const visitorUnitsRef = collection(db, "visitor_units");
                    const snapshot = await getDocs(visitorUnitsRef);
                    
                    if (snapshot.empty) {
                        // Fallback: If empty, use a curated set of large areas
                        const fallbackVisitorAreas: UnitOption[] = [
                            { code: "HQ", name_th: "กองบังคับการ (HQ)" },
                            { code: "ADMIN", name_th: "ติดต่องาน/ธุรการ (ADMIN)" },
                            { code: "DELIVERY", name_th: "ส่งของ/พัสดุ (DELIVERY)" },
                            { code: "HOUSING", name_th: "บ้านพักข้าราชการ (HOUSING)" },
                            { code: "HOSPITAL", name_th: "โรงพยาบาลค่าย (HOSPITAL)" },
                            { code: "WELFARE", name_th: "สโมสร/สวัสดิการ (WELFARE)" },
                        ];
                        setUnits(fallbackVisitorAreas);
                    } else {
                        const visitorUnits: UnitOption[] = snapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                code: data.code || doc.id,
                                name_th: data.name_th || doc.id
                            };
                        });
                        visitorUnits.sort((a, b) => a.name_th.localeCompare(b.name_th, 'th'));
                        
                        // Save to cache
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                            timestamp: Date.now(),
                            data: visitorUnits
                        }));
                        setUnits(visitorUnits);
                    }
                }
                
                if (type === "internal") {
                    // (Ensure cache is saved for internal too) We should save it right before setUnits(mergedUnits)
                    // Moving that block here or just accessing it
                }
            } catch (error) {
                console.error("Error fetching units:", error);
            } finally {
                setLoadingUnits(false);
            }
        };

        fetchDynamicUnits();
    }, [type]);

    return { units, loadingUnits };
};
