import { ChanceSkeleton } from "@/components/chance-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <ChanceSkeleton />
    </main>
  );
}
