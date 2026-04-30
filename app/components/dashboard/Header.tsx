"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, MessageSquare, Bell, Flag, User, Settings, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { useAuth } from '@/context/AuthContext';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { profile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to login page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="flex h-14 bg-yellow-300 text-white shadow-md z-20 sticky top-0">
      {/* Brand Logo Area */}
      <div className="w-80 flex-shrink-0 bg-[#2D2528] flex items-center justify-center px-4 font-bold text-xl tracking-wider hidden md:flex">
        <span>SES ระบบทางเข้าอัจฉริยะ</span>
      </div>
      <div className="w-auto flex-shrink-0 bg-[#2D2528] flex items-center justify-center px-4 font-bold text-xl tracking-wider md:hidden">
        <span>A</span><span className="font-light">LTE</span>
      </div>

      {/* Navbar Content */}
      <div className="flex-1 flex items-center justify-between px-4">
        {/* Left Side: Toggle button */}
        <button onClick={toggleSidebar} className="p-1 hover:bg-[#2D2528] rounded focus:outline-none">
          <Menu size={20} />
        </button>

        {/* Right Side: Icons */}
        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer hover:bg-blue-600 p-2 rounded hidden sm:block">
            <MessageSquare size={18} />
            <span className="absolute top-1 right-1 bg-green-500 text-[10px] font-bold px-1 rounded-sm">4</span>
          </div>
          <div className="relative cursor-pointer hover:bg-blue-600 p-2 rounded hidden sm:block">
            <Bell size={18} />
            <span className="absolute top-1 right-1 bg-yellow-500 text-[10px] font-bold px-1 rounded-sm">10</span>
          </div>
          <div className="relative cursor-pointer hover:bg-blue-600 p-2 rounded hidden sm:block">
            <Flag size={18} />
            <span className="absolute top-1 right-1 bg-red-500 text-[10px] font-bold px-1 rounded-sm">9</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 cursor-pointer hover:bg-blue-600 p-2 rounded focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 overflow-hidden">
                <User size={20} />
              </div>
              <span className="text-sm font-medium hidden md:block">{profile?.displayName || 'Loading...'}</span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800 ring-1 ring-black ring-opacity-5">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile?.displayName || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.email || ''}</p>
                </div>
                <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <User size={16} className="mr-2" /> Profile
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <LogOut size={16} className="mr-2" /> Sign Out
                </button>
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-blue-600 rounded">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
