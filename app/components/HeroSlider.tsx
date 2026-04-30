"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    title: "ระบบรักษาความปลอดภัยอัจฉริยะ",
    subtitle: "ควบคุมการเข้า-ออกค่ายฯ ด้วยเทคโนโลยีปัญญาประดิษฐ์",
    bg: "bg-pastel-yellow-100",
    image: "/hero/1.png",
    textData: "เพิ่มขีดความสามารถในการระวังป้องกันให้หน่วยงาน",
  },
  {
    id: 2,
    title: "การเฝ้าระวังตลอด 24 ชั่วโมง",
    subtitle: "ติดตามและบันทึกข้อมูลการผ่านเข้า-ออก อย่างเป็นระบบ",
    bg: "bg-pastel-yellow-200",
    image: "/hero/2.jpg",
    textData: "ตรวจสอบย้อนหลังและวิเคราะห์สถานการณ์ได้ทันท่วงที",
  },
  {
    id: 3,
    title: "มาตรการป้องกันเชิงกลยุทธ์",
    subtitle: "เสริมสร้างเกราะป้องกันด้วยยุทโธปกรณ์ที่ทันสมัย",
    bg: "bg-pastel-yellow-300",
    // image: "/hero/3.jpg", // Uncomment when image is available
    textData: "ความปลอดภัยสูงสุดคือหัวใจสำคัญของภารกิจ",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl shadow-lg mt-8 bg-gray-100">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`w-full flex-shrink-0 relative flex items-center justify-center p-12 ${
              !slide.image ? slide.bg : ""
            }`}
          >
            {slide.image && (
              <>
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={slide.id === 1}
                />
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
              </>
            )}

            <div className={`relative z-10 text-center max-w-2xl p-10 rounded-2xl shadow-sm border ${
                slide.image ? 'bg-white/70 border-white/60' : 'bg-white/40 border-white/50'
            } backdrop-blur-md`}>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 drop-shadow-sm">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-gray-800 mb-6 font-medium">
                  {slide.subtitle}
                </p>
                <div className="inline-block px-6 py-3 bg-white/90 text-gray-800 rounded-full text-sm font-semibold tracking-wider uppercase shadow-sm">
                    {slide.textData}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute z-20 top-1/2 left-4 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 text-gray-800 p-3 rounded-full backdrop-blur-sm transition-all shadow-md hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute z-20 top-1/2 right-4 transform -translate-y-1/2 bg-white/30 hover:bg-white/60 text-gray-800 p-3 rounded-full backdrop-blur-sm transition-all shadow-md hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute z-20 bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${
              current === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
