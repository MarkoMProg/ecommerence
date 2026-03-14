import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#FF4D00] sm:text-xs">
        Error 404
      </p>
      <h1
        className="mb-4 text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl md:text-5xl"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-center text-sm text-white/70">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
      >
        Back to Home
      </Link>
    </div>
  );
}
