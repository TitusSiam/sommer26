"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-state";
import { HouseForm } from "@/components/house-form";

export default function NewHousePage() {
  const { createHouse, withName, me } = useApp();
  const router = useRouter();
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Haus hinzufügen</h1>
      <p className="mb-5 text-sm text-muted">Link einfügen, Preis und Schlafplätze ergänzen, fertig. Details gehen auch später.</p>
      <HouseForm
        mode="create"
        onSubmit={(h) =>
          new Promise<void>((resolve) => {
            withName(async () => {
              const created = await createHouse(h);
              resolve();
              if (created) router.push(`/haus/${created.id}`);
            });
            // Ohne Namen öffnet sich erst der Namensdialog, gespeichert wird danach
            if (!me) resolve();
          })
        }
      />
    </div>
  );
}
