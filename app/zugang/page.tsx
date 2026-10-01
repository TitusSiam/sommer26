"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { inputClass } from "@/components/ui";

export default function AccessPage() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}

function AccessForm() {
  const next = useSearchParams().get("next") || "/";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
          if (res.ok) window.location.href = next.startsWith("/") ? next : "/";
          else setError("Code stimmt nicht.");
        }}
      >
        <h1 className="text-xl font-semibold">Gruppen-Code</h1>
        <p className="text-sm text-muted">Den Code bekommst du von der Person, die die Reise organisiert. Links aus der WhatsApp-Gruppe enthalten ihn bereits.</p>
        <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="Code" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="w-full rounded-xl bg-accent py-3 font-semibold text-accent-fg">Weiter</button>
      </form>
    </div>
  );
}
