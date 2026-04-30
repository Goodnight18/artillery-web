import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useOnlineUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const presenceRef = ref(rtdb, "presence");

    const unsubscribe = onValue(presenceRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.values(data);
      setUsers(arr as any[]);
    });

    return () => unsubscribe();
  }, []);

  return users;
}