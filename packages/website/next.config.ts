import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
        ],
      },
    ];
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/llms.txt",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*)text/markdown(.*)",
            },
          ],
        },
        {
          source: "/llm.txt",
          destination: "/llms.txt",
        },
      ],
    };
  },
};

export default nextConfig;
