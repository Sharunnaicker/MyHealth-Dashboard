import { cn } from "@/lib/utils";

// A section title + optional description, e.g. "Activity and recovery".
export default function SectionHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3", className)}>
      <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
