"use client";

import { useApp } from "@/components/app-state";
import { ActivityItem } from "@/components/activity-item";
import { Card, Empty, PageTitle, Spinner } from "@/components/ui";

export default function ActivityPage() {
  const { state } = useApp();
  if (!state) return <Spinner />;
  return (
    <div>
      <PageTitle sub="Was die Gruppe zuletzt gemacht hat">Aktivität</PageTitle>
      {state.activity.length ? (
        <Card className="rise px-4 py-1">
          <ul className="divide-y divide-[var(--hairline)]">
            {state.activity.map((a) => (
              <ActivityItem key={a.id} a={a} />
            ))}
          </ul>
        </Card>
      ) : (
        <Empty title="Noch nichts passiert">Neue Häuser, Stimmen und Kommentare erscheinen hier.</Empty>
      )}
    </div>
  );
}
