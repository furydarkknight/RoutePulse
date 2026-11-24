"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F6F8F6] px-4 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
      <p className="max-w-sm text-sm text-slate-500">{error?.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-[#162B22] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e3b2f]"
      >
        Try again
      </button>
    </div>
  );
}
