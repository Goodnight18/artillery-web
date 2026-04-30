"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    try {
      console.log('Attempting login with:', trimmedEmail);
      console.log('Firebase Project ID:', auth.app.options.projectId);
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      // ✅ ตรวจสอบสถานะบัญชีจาก Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.status === "disabled") {
          await signOut(auth);
          setError("บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
          setLoading(false);
          return;
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-100 flex items-center justify-center font-sans relative">
      {/* Logo */}
      <div className="absolute top-6 left-6">
        <img
          src="/hero/123.png"
          alt="Logo"
          className="h-20 w-auto object-contain"
        />
      </div>

      <div className="w-full max-w-sm bg-white rounded shadow-lg overflow-hidden">
        <div className="bg-yellow-400 p-4 text-center">
          <h1 className="text-2xl font-bold text-white tracking-widest">
            Smart Entry Solution
          </h1>
          <h1 className="text-2xl font-bold text-white tracking-widest">
            ระบบทางเข้าอัจฉริยะ
          </h1>
        </div>

        <div className="p-8">
          <p className="text-center text-gray-600 mb-6 font-medium">เข้าสู่ระบบ</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-200 rounded p-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <Mail size={18} />
              </div>
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 rounded p-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <Lock size={18} />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mt-4">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2" />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-white font-bold py-2 rounded hover:bg-yellow-600 transition-colors mt-6 shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-gray-500 hover:text-blue-500">ลืมรหัสผ่าน ติดต่อเจ้าหน้าที่</a>
          </div>
          <div className="mt-1 text-center">
            <a href="#" className="text-sm text-gray-500 hover:text-blue-500">โทร. 081-234-5678</a>
          </div>
        </div>

      </div>
    </div>
  );
}
