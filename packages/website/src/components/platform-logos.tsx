import { Fragment } from "react";

interface PlatformLogo {
  name: string;
  src: string;
  /** Rendered width in px (height follows SVG aspect ratio). */
  width: number;
}

/** Per-logo width — 2× previous values; height is automatic (no letterbox gaps). */
const PLATFORM_LOGOS: PlatformLogo[] = [
  { name: "Snowflake", src: "/logos/snowflake.svg", width: 94 },
  { name: "Google BigQuery", src: "/logos/googlebigquery.svg", width: 96 },
  { name: "Amazon Web Services", src: "/logos/aws.svg", width: 64 },
  { name: "PostgreSQL", src: "/logos/postgresql.svg", width: 100 },
  { name: "DuckDB", src: "/logos/duckdb.svg", width: 92 },
  { name: "dbt", src: "/logos/dbt.svg", width: 72 },
];

const LOGO_CLASS = "block h-auto shrink-0 opacity-90 transition-opacity hover:opacity-100";

export const PlatformLogos = () => (
  <div className="flex flex-wrap items-center gap-y-2" aria-label="Supported platforms">
    {PLATFORM_LOGOS.map((logo, index) => (
      <Fragment key={logo.name}>
        {index > 0 && (
          <span className="mx-1 select-none text-neutral-500" aria-hidden="true">
            ,
          </span>
        )}
        <img
          src={logo.src}
          alt={logo.name}
          width={logo.width}
          className={LOGO_CLASS}
          style={{ width: logo.width }}
          loading="lazy"
          decoding="async"
        />
      </Fragment>
    ))}
    <span className="ml-1.5 text-sm font-medium text-neutral-400">and more</span>
  </div>
);
