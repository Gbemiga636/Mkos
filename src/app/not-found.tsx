import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">404</p>
      <h1 className="mt-4 font-display text-5xl font-medium tracking-tight">Lost in the archive</h1>
      <p className="mt-4 text-mkos-muted">This page doesn&apos;t exist — or has been quietly retired.</p>
      <Link
        href="/"
        className="mt-10 inline-flex h-12 items-center bg-mkos-ink px-8 font-display text-[11px] tracking-[0.22em] text-white uppercase"
      >
        Return home
      </Link>
    </div>
  );
}
