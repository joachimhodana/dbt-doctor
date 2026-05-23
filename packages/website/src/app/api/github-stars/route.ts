import { GITHUB_STARS_REVALIDATE_SECONDS } from "@/constants/github";
import { getGithubStars } from "@/utils/get-github-stars";

// Must be a literal for Next.js static segment config analysis.
export const revalidate = 3600;

export const GET = async (): Promise<Response> => {
  const stars = await getGithubStars();

  if (stars === null) {
    return Response.json({ error: "Failed to fetch GitHub stars" }, { status: 502 });
  }

  return Response.json(
    { stars },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${GITHUB_STARS_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  );
};
