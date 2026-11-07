import { Suspense } from "react";
import { PaySearch } from "./_components/pay-search";

export default function PayPage({
  searchParams,
}: PageProps<"/pay">) {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-full flex-1 bg-page" />}>
      <SearchPage searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPage({
  searchParams,
}: Pick<PageProps<"/pay">, "searchParams">) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q ?? "";

  return <PaySearch key={query} query={query} />;
}
