"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../../lib/api";
import { signInWithGoogle } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await login(form);
      if (result?.token) {
        sessionStorage.setItem("token", result.token);
        router.push("/dashboard");
      } else {
        setError(result?.msg || result?.message || "Login failed. Check your email and password.");
      }
    });
  };

  const onGoogle = async () => {
    setError("");
    const { error } = await signInWithGoogle("Customer");
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8F6] px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 font-bold text-white">
            RP
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to track orders and routes.</p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2.5 text-slate-900 focus:border-[#65795C] focus:outline-none focus:ring-2 focus:ring-[#65795C]/30"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
              className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2.5 text-slate-900 focus:border-[#65795C] focus:outline-none focus:ring-2 focus:ring-[#65795C]/30"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#162B22] py-3 text-sm font-bold text-white transition hover:bg-[#1e3b2f] disabled:opacity-50"
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200" /> OR <span className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="w-full rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/auth" className="font-semibold text-[#65795C] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
