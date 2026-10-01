"use client";

import { useApp } from "@/components/app-state";
import { ActivityItem } from "@/components/activity-item";
import { Card, Empty, Spinner } from "@/components/ui";

export default function ActivityPage() {
  const { state } = useApp();
  if (!state) return <Spinner />;
  return (
    <div>
      <h1 className="mb-3 text-xl font-semibold">Aktivität</h1>
      {state.activity.length ? (
        <Card className="px-3.5">
          <ul className="divide-y divide-line">
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
