import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบบันทึกข้อมูลรถ Artillery",
  description: "ระบบจัดการข้อมูลและบันทึกสถิติยานพาหนะ หน่วยทหารปืนใหญ่",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "ระบบบันทึกข้อมูลรถ Artillery",
    description: "ระบบจัดการข้อมูลและบันทึกสถิติยานพาหนะ หน่วยทหารปืนใหญ่",
    images: [{ url: "/logo.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ระบบบันทึกข้อมูลรถ Artillery",
    description: "ระบบจัดการข้อมูลและบันทึกสถิติยานพาหนะ หน่วยทหารปืนใหญ่",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
