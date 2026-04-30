"use client";

import React, { useState, useEffect, useRef } from "react";
import { THAI_PROVINCES } from "../constants/provinces";

interface ProvinceComboboxProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
}

export default function ProvinceCombobox({ value, onChange, error }: ProvinceComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredProvinces = THAI_PROVINCES.filter(p => p.toLowerCase().includes(inputValue.toLowerCase()));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setIsOpen(true);
        onChange(val);
    };

    const handleSelect = (province: string) => {
        setInputValue(province);
        onChange(province);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input 
                type="text" 
                value={inputValue} 
                onChange={handleInputChange} 
                onFocus={() => setIsOpen(true)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-gray-900 ${error ? 'border-red-400' : 'border-gray-300'}`} 
                placeholder="เช่น กรุงเทพมหานคร" 
                autoComplete="off"
            />
            
            {isOpen && filteredProvinces.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 text-left">
                    {filteredProvinces.map((province, index) => (
                        <li 
                            key={index}
                            onClick={() => handleSelect(province)}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                        >
                            {province}
                        </li>
                    ))}
                </ul>
            )}
            {isOpen && filteredProvinces.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-3 px-3 animate-in fade-in slide-in-from-top-1 text-center">
                    <p className="text-sm text-gray-500">ไม่พบจังหวัดที่ค้นหา</p>
                </div>
            )}
        </div>
    );
}
