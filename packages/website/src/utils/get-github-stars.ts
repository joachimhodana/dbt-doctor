import { GITHUB_REPO, GITHUB_STARS_REVALIDATE_SECONDS } from "@/constants/github";

export const getGithubStars = async (): Promise<number | null> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      next: { revalidate: GITHUB_STARS_REVALIDATE_SECONDS },
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "dbt-doctor-website",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
};
