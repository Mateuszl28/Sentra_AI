import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Logo />
        <div className="kicker mt-3">
          <Compass size={11} /> 404 · off the trail
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          That page is not in our{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            phishing playbook.
          </span>
        </h1>
        <p className="max-w-md text-balance text-sm leading-relaxed text-muted">
          The URL you opened doesn&apos;t lead anywhere on Sentra. No tracker
          fired, no LLM was harmed — just a wrong turn.
        </p>
      </div>

      <Link
        href="/"
        className="btn-primary"
      >
        <ArrowLeft size={14} />
        Back to the workbench
      </Link>
    </main>
  );
}
