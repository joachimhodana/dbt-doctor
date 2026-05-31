"use client";

import { useEffect, useState } from "react";
import { GITHUB_ICON_PATH, GITHUB_URL } from "@/constants/github";
import { formatStarCount } from "@/utils/format-star-count";

interface GithubStarButtonProps {
  className?: string;
  iconSize?: number;
}

export const GithubStarButton = ({
  className = "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-[#ff8e72] bg-[#ff694a] px-3 py-1.5 text-[#120d0b] transition-all hover:bg-[#ff7a5f] active:scale-[0.98]",
  iconSize = 18,
}: GithubStarButtonProps) => {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/github-stars")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { stars?: number } | null) => {
        if (!cancelled && data && typeof data.stars === "number") {
          setStars(data.stars);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={className}>
      <svg
        width={iconSize}
        height={iconSize}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path fillRule="evenodd" clipRule="evenodd" d={GITHUB_ICON_PATH} />
      </svg>
      Star on GitHub
      {stars !== null && (
        <span className="rounded bg-[#120d0b]/15 px-1.5 py-0.5 text-xs font-medium tabular-nums">
          {formatStarCount(stars)}
        </span>
      )}
    </a>
  );
};
