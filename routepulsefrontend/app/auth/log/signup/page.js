"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithGoogle } from "../../../../lib/supabase";

export default function SignupPage() {
  const [error, setError] = useState("");

  const handleGoogleAuth = async (role) => {
    setError("");
    const { error } = await signInWithGoogle(role);
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <h1 className="text-xl font-bold text-gray-900">Join RoutePulse</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={() => handleGoogleAuth("Customer")}
        className="w-64 rounded-xl bg-[#162B22] px-4 py-3 text-sm font-bold text-white hover:bg-[#1e3b2f]"
      >
        Sign up as Customer
      </button>
      <button
        onClick={() => handleGoogleAuth("Driver")}
        className="w-64 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-bold text-white hover:bg-[#e05a2b]"
      >
        Sign up as Driver
      </button>
      <Link href="/auth" className="text-sm text-gray-600 hover:underline">
        Use email instead
      </Link>
    </div>
  );
}
