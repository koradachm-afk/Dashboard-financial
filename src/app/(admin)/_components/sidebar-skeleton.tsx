/** Suspense fallback with the sidebar's width and padding, so the layout does not jump. */
export default function SidebarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-64 shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 pb-4 pt-5"
    >
      <div className="flex items-center gap-2.5 pl-2">
        <div className="size-9 rounded-md bg-subtle animate-pulse" />
        <div className="h-9 flex-1 rounded-md bg-subtle animate-pulse" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded-md bg-subtle animate-pulse" />
        ))}
      </div>
      <div className="h-14 rounded-md bg-subtle animate-pulse" />
    </div>
  );
}
