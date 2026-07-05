import { Card } from "@/components/ui/card";

// Temporary landing for routes not yet built out (phased rollout). Intentionally shows no fake
// data — just what's coming.
export default function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg items-center gap-2 p-10 text-center">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{note}</p>
    </Card>
  );
}
