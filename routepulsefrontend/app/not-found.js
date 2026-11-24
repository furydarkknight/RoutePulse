import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F6F8F6] px-4 text-center">
      <p className="text-6xl font-black text-[#162B22]">404</p>
      <h1 className="text-xl font-bold text-slate-900">This route doesn&apos;t exist</h1>
      <p className="text-sm text-slate-500">Even the best optimiser can&apos;t deliver to a missing page.</p>
      <Link href="/" className="rounded-xl bg-[#162B22] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e3b2f]">
        Back to the aisle
      </Link>
    </div>
  );
}
