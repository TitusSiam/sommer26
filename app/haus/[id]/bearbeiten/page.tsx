"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-state";
import { HouseForm } from "@/components/house-form";
import { Empty, Spinner } from "@/components/ui";

export default function EditHousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updateHouse, withName, me } = useApp();
  const router = useRouter();
  if (!state) return <Spinner />;
  const house = state.houses.find((h) => h.id === id);
  if (!house) return <Empty title="Haus nicht gefunden" />;
  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold">Bearbeiten</h1>
      <HouseForm
        mode="edit"
        initial={house}
        onSubmit={(h) =>
          new Promise<void>((resolve) => {
            withName(async () => {
              const saved = await updateHouse(id, h);
              resolve();
              if (saved) router.push(`/haus/${id}`);
            });
            // Ohne Namen öffnet sich erst der Namensdialog, gespeichert wird danach
            if (!me) resolve();
          })
        }
      />
    </div>
  );
}
