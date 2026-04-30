"use client";

import React, { useState, useEffect, useRef } from "react";

interface SearchableComboboxProps {
    value: string;
    options: string[];
    onChange: (val: string) => void;
    placeholder?: string;
    error?: string;
    notFoundText?: string;
}

export default function SearchableCombobox({ 
    value, 
    options, 
    onChange, 
    placeholder = "พิมพ์เพื่อค้นหา...", 
    error,
    notFoundText = "ไม่พบตัวเลือก"
}: SearchableComboboxProps) {
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

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setIsOpen(true);
        onChange(val);
    };

    const handleSelect = (selectedOpt: string) => {
        setInputValue(selectedOpt);
        onChange(selectedOpt);
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
                placeholder={placeholder} 
                autoComplete="off"
            />
            
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 text-left max-h-48 overflow-y-auto">
                    {filteredOptions.map((opt, index) => (
                        <li 
                            key={index}
                            onClick={() => handleSelect(opt)}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
            
            {isOpen && inputValue.trim().length > 0 && filteredOptions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-3 px-3 animate-in fade-in slide-in-from-top-1 text-center">
                    <p className="text-sm text-gray-500">{notFoundText}</p>
                </div>
            )}
        </div>
    );
}
