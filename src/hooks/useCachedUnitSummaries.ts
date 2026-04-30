import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { UnitSummaryItem } from '../lib/records/processUnitSummary';

const CACHE_KEY = 'unit_summaries_cache';
const CACHE_TTL = 60 * 1000; // 60 seconds

interface CacheData {
    timestamp: number;
    data: UnitSummaryItem[];
}

export function useCachedUnitSummaries() {
    const [summaries, setSummaries] = useState<UnitSummaryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummaries = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        
        try {
            if (!forceRefresh && typeof window !== 'undefined') {
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed: CacheData = JSON.parse(cached);
                    const age = Date.now() - parsed.timestamp;
                    if (age < CACHE_TTL) {
                        setSummaries(parsed.data);
                        setLoading(false);
                        return; // Cache hit, exit without calling server
                    }
                }
            }

            // Cache miss, expired, or forced refresh -> Call Server
            const getSummaries = httpsCallable(functions, 'getUnitSummaries');
            const result = await getSummaries();
            const payload = result.data as any;
            
            if (payload.success) {
                const data = payload.summaries as UnitSummaryItem[];
                setSummaries(data);
                
                // Save to sessionStorage
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: data
                    }));
                }
            } else {
                setError("ไม่สามารถดึงข้อมูลสรุปจากเซิร์ฟเวอร์ได้");
            }
        } catch (err: any) {
            console.error("Fetch summaries error:", err);
            setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummaries();
    }, [fetchSummaries]);

    return { 
        summaries, 
        loading, 
        error, 
        refetch: () => fetchSummaries(true) 
    };
}
