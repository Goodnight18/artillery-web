"use client";
import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  PieChart, 
  PenTool, 
  Database, 
  Calendar, 
  Mail, 
  X,
  User,
  ShieldCheck,
  Activity,
  LogOut,
  Building2,
  Car,
  History as HistoryIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { hasPermission, AppModule, Role } from '@/lib/permissions';

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

type MenuItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  module: AppModule;
  badge?: string;
  badgeColor?: string;
  subItems?: { title: string; href: string }[];
};

const MAIN_MENU: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    title: "แสดงผลรถเข้าแบบเรียวไทม์",
    href: "/monitor",
    icon: Settings,
    module: "realtime",
    badge: "4",
    badgeColor: "bg-blue-500",
    subItems: [
      { title: "ภาพรวมทุกช่องทาง", href: "/monitor" },
      { title: "ช่องทางเสาธง", href: "#" },
      { title: "ช่องทางใต้", href: "#" },
      { title: "ช่องทางเหนือ", href: "#" },
    ]
  },
  {
    title: "บันทึกข้อมูลรถ (เข้า-ออก)",
    href: "/records",
    icon: Database,
    module: "vehicles",
  },

  {
    title: "ตรวจสอบข้อมูลรายหน่วย",
    href: "/records/review-by-unit",
    icon: Building2,
    module: "users",
    badge: "admin",
    badgeColor: "bg-purple-600",
  },
  {
    title: "ประวัติข้อมูลที่อนุมัติแล้ว",
    href: "/records/approved-by-unit",
    icon: HistoryIcon,
    module: "users",
    badge: "admin",
    badgeColor: "bg-purple-600",
  },
  {
    title: "แสดงข้อมูลรถเข้า-ออกย้อนหลัง",
    href: "/history",
    icon: PieChart,
    module: "history",
  },
  {
    title: "สถิติข้อมูลรถเข้า-ออก",
    href: "/statistics",
    icon: PenTool,
    module: "stats",
  },
  {
    title: "ข้อมูลบุคคลภายนอก",
    href: "/visitors",
    icon: FileText,
    module: "external_persons",
  },
  {
    title: "ตรวจสอบระบบไฟฟ้า",
    href: "/gate-control",
    icon: Activity,
    module: "electrical",
  },
  {
    title: "จัดการผู้ใช้",
    href: "/admin/users",
    icon: User,
    module: "users",
  },
  {
    title: "จัดการพื้นที่รับผิดชอบ",
    href: "/admin/visitor-units",
    icon: Settings,
    module: "users",
  },
  {
    title: "ตรวจสอบการทำงาน (Audit Logs)",
    href: "/admin/audit-logs",
    icon: ShieldCheck,
    module: "audit",
  },
  {
    title: "ผู้ใช้ที่กำลังใช้งาน",
    href: "/admin/online-users",
    icon: Activity,
    module: "online_users",
  }
];

const Sidebar = ({ isOpen, isMobile = false, onClose }: SidebarProps) => {
  const { profile } = useAuth();
  const pathname = usePathname();

  const baseClasses = "bg-[#2D2528] text-slate-300 h-screen overflow-y-auto transition-all duration-300 ease-in-out flex flex-col";
  const mobileClasses = isMobile
    ? `fixed top-0 left-0 z-30 shadow-2xl w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `flex-shrink-0 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`;

  const role: Role | undefined = profile?.role as Role | undefined;

  return (
    <aside className={`${baseClasses} ${mobileClasses}`}>
      {/* Brand Logo Area Mobile Only */}
      <div className="h-14 bg-slate-900 flex items-center justify-between px-4 font-bold text-xl tracking-wider text-white md:hidden">
        <span>Admin</span>
        {isMobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        )}
      </div>

      {/* User Panel */}
      <div className="flex items-center p-4 border-b border-slate-700 mb-2">
        <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center mr-3 flex-shrink-0">
          <span className="text-white font-bold">{profile?.displayName?.charAt(0) || 'U'}</span>
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-medium text-sm whitespace-nowrap">{profile?.displayName || 'Loading...'}</p>
          <div className="flex items-center text-xs text-emerald-400 font-mono mt-0.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span> 
            {profile?.role || 'Guest'}
            {profile?.unit_code && <span className="ml-2 text-slate-500">[{profile.unit_code}]</span>}
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="mt-2 flex-1">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">เมนูหลัก SES</p>

        <ul className="space-y-1">
          {MAIN_MENU.map((item, idx) => {
            if (!hasPermission(role, item.module)) return null;

            // Fix overlapping highlights by checking for exact match or ensuring no deeper match exists
            const isActive = pathname === item.href || (
              item.href !== '/' && 
              pathname?.startsWith(item.href + '/') && 
              !MAIN_MENU.some(m => m.href !== item.href && m.href.startsWith(item.href) && pathname.startsWith(m.href))
            );

            if (item.subItems) {
              return (
                <li key={idx} className="group">
                  <div className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-slate-700 text-white border-l-4 border-blue-500' : 'hover:bg-slate-700 hover:text-white border-l-4 border-transparent'}`}>
                    <item.icon size={18} className="mr-3" />
                    <span className="text-sm">{item.title}</span>
                    {item.badge && (
                      <span className={`ml-auto text-white text-[10px] px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden max-h-0 opacity-0 transition-all duration-200 ease-in-out group-hover:max-h-40 group-hover:opacity-100">
                    <ul className="mt-1 space-y-1 pl-12 pr-3 pb-2">
                      {item.subItems.map((sub, sIdx) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <li key={sIdx}>
                            <Link href={sub.href} className={`block rounded px-3 py-2 text-sm transition-colors ${isSubActive ? 'text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                              • {sub.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            return (
              <li key={idx}>
                <Link href={item.href} className={`flex items-center px-4 py-2 transition-colors ${isActive ? 'bg-slate-700 text-white border-l-4 border-blue-500' : 'text-slate-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent'}`}>
                  <item.icon size={18} className="mr-3" />
                  <span className="text-sm">{item.title}</span>
                  {item.badge && (
                    <span className={`ml-auto text-white text-[10px] px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout / Footer */}
      <div className="p-4 border-t border-slate-700 mt-auto">
        <button className="flex w-full items-center px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors">
          <LogOut size={18} className="mr-3" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
