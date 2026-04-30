"use client";

import { useState } from "react";
import ClientLayout from "../components/ClientLayout";
import { Search, Filter, Download, Calendar, CarFront, Hash, Clock, MapPin } from "lucide-react";
import RequirePagePermission from "@/lib/requirePagePermission";

// Mock data
const mockHistory = [
    {
        id: "1",
        plate: "1กข 1234 ลพบุรี",
        type: "เก๋ง",
        gate: "ช่องทางเสาธง",
        direction: "เข้า",
        time: "2024-03-04T16:45:00",
        image: "https://images.pexels.com/photos/746684/pexels-photo-746684.jpeg?w=200&h=150&fit=crop",
        status: "ปกติ"
    },
    {
        id: "2",
        plate: "ฮภ 9999 อยุธยา",
        type: "กระบะ",
        gate: "ช่องทางใต้",
        direction: "ออก",
        time: "2024-03-04T16:30:00",
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&h=150&fit=crop",
        status: "ปกติ"
    },
    {
        id: "3",
        plate: "รถยนต์ทหาร",
        type: "รถบรรทุกทหาร",
        gate: "ช่องทางเหนือ",
        direction: "เข้า",
        time: "2024-03-04T16:15:00",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=150&fit=crop",
        status: "รถส่วนราชการ"
    },
    {
        id: "4",
        plate: "3กค 5678 สุโขทัย",
        type: "SUV",
        gate: "ช่องทางเสาธง",
        direction: "ออก",
        time: "2024-03-04T15:50:00",
        image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&h=150&fit=crop",
        status: "ปกติ"
    },
    {
        id: "5",
        plate: "4ขข 4409 กรุงเทพฯ",
        type: "จักรยานยนต์",
        gate: "ช่องทางใต้",
        direction: "เข้า",
        time: "2024-03-04T15:20:00",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&h=150&fit=crop",
        status: "ต้องสงสัย"
    }
];

export default function HistoryPage() {
    const [date, setDate] = useState("2024-03-04");
    const [gateFilter, setGateFilter] = useState("all");
    const [dirFilter, setDirFilter] = useState("all");

    // Modal state
    const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

    return (
        <RequirePagePermission module="history">
            <ClientLayout>
                <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">บันทึกข้อมูลรถเข้า-ออก</h1>
                            <p className="text-sm text-slate-500 mt-1">แสดงประวัติยานพาหนะที่ผ่านเข้า-ออกช่องทางต่างๆ</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">ค้นหาทะเบียนรถ</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50 focus:bg-white"
                                        placeholder="พิมพ์ป้ายทะเบียน..."
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-48">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">วันที่</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-48">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">ช่องทาง</label>
                                <select
                                    value={gateFilter}
                                    onChange={(e) => setGateFilter(e.target.value)}
                                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white appearance-none"
                                >
                                    <option value="all">ทุกช่องทาง</option>
                                    <option value="gate1">ช่องทางเสาธง</option>
                                    <option value="gate2">ช่องทางใต้</option>
                                    <option value="gate3">ช่องทางเหนือ</option>
                                </select>
                            </div>

                            <div className="w-full md:w-32">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">เข้า/ออก</label>
                                <select
                                    value={dirFilter}
                                    onChange={(e) => setDirFilter(e.target.value)}
                                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white appearance-none"
                                >
                                    <option value="all">ทั้งหมด</option>
                                    <option value="in">เข้า</option>
                                    <option value="out">ออก</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Info */}
                    <div className="flex items-center justify-between text-sm text-slate-500 px-1">
                        <span>พบข้อมูล <strong>1,245</strong> รายการในวันที่ {date}</span>
                        <div className="flex items-center gap-2">
                            <span>เรียงตาม:</span>
                            <select className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer">
                                <option>เวลา (ล่าสุดก่อน)</option>
                                <option>เวลา (เก่าสุดก่อน)</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">ภาพถ่าย</th>
                                        <th className="px-6 py-4 font-semibold">ป้ายทะเบียน</th>
                                        <th className="px-6 py-4 font-semibold">วันเวลา</th>
                                        <th className="px-6 py-4 font-semibold">ช่องทาง</th>
                                        <th className="px-6 py-4 font-semibold">ทิศทาง</th>
                                        <th className="px-6 py-4 font-semibold">ประเภทรถ</th>
                                        <th className="px-6 py-4 font-semibold">สถานะ</th>
                                        <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mockHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-3 text-slate-900">
                                                <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                                                    <img
                                                        src={item.image}
                                                        alt={`รถทะเบียน ${item.plate}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 text-base">{item.plate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">
                                                        {new Date(item.time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} น.
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(item.time).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-700">
                                                    <MapPin size={14} className="mr-1.5 text-slate-400" />
                                                    {item.gate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${item.direction === 'เข้า'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                    }`}>
                                                    {item.direction === 'เข้า' ? '→ รถเข้า' : '← รถออก'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-700">
                                                    <CarFront size={14} className="mr-1.5 text-slate-400" />
                                                    {item.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'ปกติ' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedVehicle(item)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    ดูรายละเอียด
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t border-slate-200 p-4 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-sm text-slate-500">แสดง 1 ถึง 5 จาก 1,245 รายการ</span>
                            <div className="flex items-center gap-1 text-sm">
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50">ก่อนหน้า</button>
                                <button className="px-3 py-1.5 border border-blue-500 bg-blue-50 text-blue-700 rounded-lg font-medium">1</button>
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-700 hover:bg-slate-50">2</button>
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-700 hover:bg-slate-50">3</button>
                                <span className="px-2 text-slate-400">...</span>
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-700 hover:bg-slate-50">249</button>
                                <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-700 hover:bg-slate-50">ถัดไป</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Vehicle Details Modal */}
            {selectedVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">รายละเอียดข้อมูลรถผ่านเข้า-ออก</h2>
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left: Image */}
                                <div className="w-full md:w-1/2 flex flex-col gap-3">
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]">
                                        <img
                                            src={selectedVehicle.image}
                                            alt={`รถทะเบียน ${selectedVehicle.plate}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className={`self-start inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedVehicle.status === 'ปกติ' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedVehicle.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                                                'bg-rose-100 text-rose-700'
                                        }`}>
                                        สถานะ: {selectedVehicle.status}
                                    </span>
                                </div>

                                {/* Right: Details */}
                                <div className="w-full md:w-1/2 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">ป้ายทะเบียน</h3>
                                        <div className="text-2xl font-bold text-slate-900">{selectedVehicle.plate}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ประเภทรถ</h3>
                                            <div className="flex items-center text-sm font-medium text-slate-800">
                                                <CarFront size={16} className="mr-2 text-slate-400" />
                                                {selectedVehicle.type}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ทิศทาง</h3>
                                            <div className="text-sm font-medium text-slate-800">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${selectedVehicle.direction === 'เข้า'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                        : 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    }`}>
                                                    {selectedVehicle.direction === 'เข้า' ? 'รถเข้า' : 'รถออก'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ข้อมูลเวลา</h3>
                                            <div className="text-sm font-medium text-slate-800">
                                                {new Date(selectedVehicle.time).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}  เวลา {new Date(selectedVehicle.time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} น.
                                            </div>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">จุดตรวจสอบ</h3>
                                            <div className="text-sm font-medium text-slate-800 flex items-center">
                                                <MapPin size={16} className="mr-2 text-slate-400" />
                                                {selectedVehicle.gate}
                                            </div>
                                        </div>

                                        <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ข้อมูลเจ้าของรถ</h3>
                                            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mt-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">คุณสมชาย ใจดี</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">เบอร์ติดต่อ: 081-234-5678</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">สังกัด: กองบังคับการ</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientLayout>
        </RequirePagePermission>
    );
}
