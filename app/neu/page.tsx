"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-state";
import { HouseForm } from "@/components/house-form";
import { PageTitle } from "@/components/ui";

export default function NewHousePage() {
  const { createHouse, withName, me } = useApp();
  const router = useRouter();
  return (
    <div>
      <PageTitle sub="Link einfügen, Preis und Schlafplätze ergänzen, fertig. Details gehen auch später.">Neues Haus</PageTitle>
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
