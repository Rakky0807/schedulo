/**
 * app/(auth)/layout.js
 * Centered card layout for auth pages.
 */

import Link from "next/link";
import { Calendar } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-md">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl">Schedulo</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
