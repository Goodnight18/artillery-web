"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-pastel-yellow-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-pastel-yellow-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-800 tracking-wide">
              Artillery<span className="text-pastel-yellow-500">.</span>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className="text-gray-700 hover:text-pastel-yellow-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/records"
              className="text-gray-700 hover:text-pastel-yellow-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Manage Records
            </Link>
            <Link
              href="/monitor"
              className="text-gray-700 hover:text-pastel-yellow-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Monitor
            </Link>
            <button className="bg-pastel-yellow-400 hover:bg-pastel-yellow-500 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all hover:scale-105">
              Get Started
            </button>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-pastel-yellow-200 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-pastel-yellow-50" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="text-gray-700 hover:text-pastel-yellow-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              href="/records"
              className="text-gray-700 hover:text-pastel-yellow-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Manage Records
            </Link>
            <Link
              href="/monitor"
              className="text-gray-700 hover:text-pastel-yellow-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Monitor
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
