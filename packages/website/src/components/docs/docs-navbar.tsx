import Link from "next/link";
import { GithubStarButton } from "@/components/github-star-button";

export const DocsNavbar = () => (
  <header className="sticky top-0 z-20 border-b border-orange-200/15 bg-[#0b0b0b]/90 backdrop-blur">
    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-neutral-100 transition-colors hover:text-white">
        <img src="/favicon.svg" alt="dbt Doctor" width={20} height={20} />
        <span className="text-sm sm:text-base">dbt Doctor</span>
      </Link>
      <GithubStarButton
        iconSize={16}
        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-[#ff8e72] bg-[#ff694a] px-3 py-1.5 text-xs text-[#120d0b] transition-all hover:bg-[#ff7a5f] active:scale-[0.98] sm:text-sm"
      />
    </div>
  </header>
);
