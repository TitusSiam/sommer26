"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-state";
import { HouseForm } from "@/components/house-form";
import { Empty, PageTitle, Spinner } from "@/components/ui";

export default function EditHousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, updateHouse, withName, me } = useApp();
  const router = useRouter();
  if (!state) return <Spinner />;
  const house = state.houses.find((h) => h.id === id);
  if (!house) return <Empty title="Haus nicht gefunden" />;
  return (
    <div>
      <PageTitle sub={house.name}>Bearbeiten</PageTitle>
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
