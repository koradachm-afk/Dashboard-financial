import { cn } from "@/utils/cn";

/** Initials circle for a user. Callers set size and tone, e.g. `size-9 bg-primary-soft text-body text-primary`. */
export function Avatar({ username, className }: { username: string; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", className)}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}
