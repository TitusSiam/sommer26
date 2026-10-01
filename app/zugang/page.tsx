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
        className="glass specular sheet-in w-full max-w-sm space-y-4 rounded-[32px] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
          if (res.ok) window.location.href = next.startsWith("/") ? next : "/";
          else setError("Code stimmt nicht.");
        }}
      >
        <h1 className="font-display text-[44px] leading-none">Gruppen-Code</h1>
        <p className="text-sm text-muted">Den Code bekommst du von der Person, die die Reise organisiert. Links aus der WhatsApp-Gruppe enthalten ihn bereits.</p>
        <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="Code" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary press w-full py-4 text-[16px]">Weiter</button>
      </form>
    </div>
  );
}
