/**
 * Regression guardrails: SQL/YAML/manifest fixtures that must NOT trigger listed rules.
 *
 * Keep fixtures generic — no client/project-specific model names, sources, or comments.
 *
 * When you fix a false positive on a real dbt project:
 * 1. Add a minimal anonymized repro here (one edge case per `id`).
 * 2. List every rule that must stay silent in `rules`.
 * 3. Run `pnpm test` — failures name the broken guardrail id.
 *
 * To probe another project for surprises: `pnpm fp-scan /path/to/dbt-project`
 */

export interface DbtFpGuardrail {
  id: string;
  label: string;
  rules: string[];
  modelSql: string;
  modelPath?: string;
  extraFiles?: Record<string, string>;
}

export const DBT_FP_GUARDRAILS: DbtFpGuardrail[] = [
  {
    id: "model-name-cte-and-source",
    label: "{{ model.name }} CTE alias and source() commas",
    rules: [
      "sql-reference-object-in-from",
      "sql-no-comma-join",
      "sql-expression-alias-required",
      "sql-reference-unnecessary-quoted",
    ],
    modelSql: [
      "with",
      "    {{ model.name }} as (",
      "        select {{ trim_all_columns(source('raw', 'orders')) }}",
      "        from {{ source('raw', 'orders') }}",
      "    ),",
      "    final as (",
      "        select orders.id",
      "        from {{ model.name }} orders",
      "    )",
      "select id from final",
    ].join("\n"),
  },
  {
    id: "config-meta-literals",
    label: "boolean and quoted literals inside {{ config(meta=...) }}",
    rules: ["sql-boolean-literal-style", "sql-quoted-literal-style"],
    modelSql: [
      '{{ config(meta={ "active": true, "enabled": false, "note": "ok" }) }}',
      "select id from {{ ref('orders') }}",
    ].join("\n"),
  },
  {
    id: "line-comment-where",
    label: "SQL keyword in trailing line comment",
    rules: ["sql-clause-newline-consistency"],
    modelSql: ["select id", "from orders", "        -- where active"].join("\n"),
  },
  {
    id: "join-on-next-line",
    label: "JOIN with ON on the following line",
    rules: ["sql-join-condition-required"],
    modelSql: [
      "select o.id, t.code",
      "from orders o",
      "left join types t",
      "on o.type_code = t.code",
    ].join("\n"),
  },
  {
    id: "union-by-name",
    label: "UNION BY NAME column-count mismatch",
    rules: ["sql-set-operator-column-count-match"],
    modelSql: [
      "select *, 'a' as src from {{ ref('left') }}",
      "union by name",
      "select *, 'b' as src, 1 as extra from {{ ref('right') }}",
    ].join("\n"),
  },
  {
    id: "ref-to-seed",
    label: "ref() to seeds with manifest graph",
    rules: ["sql-reference-target-exists", "root-models"],
    modelSql: "select * from {{ ref('country_codes') }}\n",
    extraFiles: {
      "target/manifest.json": JSON.stringify({
        nodes: {
          "seed.fp_fixture.country_codes": {
            unique_id: "seed.fp_fixture.country_codes",
            name: "country_codes",
            resource_type: "seed",
            depends_on: { nodes: [] },
          },
          "model.fp_fixture.country_code_lookup": {
            unique_id: "model.fp_fixture.country_code_lookup",
            name: "country_code_lookup",
            resource_type: "model",
            original_file_path: "models/staging/stg_fixture.sql",
            depends_on: { nodes: ["seed.fp_fixture.country_codes"] },
          },
        },
      }),
    },
  },
  {
    id: "materialized-in-yaml",
    label: "materialization-hint reads model YAML config",
    rules: ["materialization-hint"],
    modelPath: "models/staging/stg_large.sql",
    modelSql: `${"select 1\n".repeat(90)}`,
    extraFiles: {
      "models/staging/_staging__models.yml": [
        "version: 2",
        "models:",
        "  - name: stg_large",
        "    config:",
        "      materialized: incremental",
      ].join("\n"),
    },
  },
  {
    id: "incremental-if-subquery",
    label: "max() subquery inside {% if is_incremental() %}",
    rules: ["sql-expression-alias-required"],
    modelPath: "models/intermediate/int_orders.sql",
    modelSql: [
      "select *",
      "from {{ ref('stg_orders_raw') }}",
      "{% if is_incremental() %}",
      "where updated_at >= (select max(updated_at)::date from {{ this }})",
      "{% endif %}",
    ].join("\n"),
  },
  {
    id: "snowflake-star-exclude",
    label: "Snowflake * EXCLUDE (cols) projection",
    rules: ["sql-expression-alias-required"],
    modelPath: "models/intermediate/int_orders.sql",
    modelSql: [
      "with ranked as (select * exclude (priority_rank) from {{ ref('stg_orders') }})",
      "select * exclude (priority_rank, batch_id) from ranked",
    ].join("\n"),
  },
  {
    id: "subquery-join-alias",
    label: "derived table alias in JOIN … on",
    rules: ["sql-reference-object-in-from", "sql-no-comma-join"],
    modelPath: "models/staging/stg_orders_enriched.sql",
    modelSql: [
      "with final as (",
      "    select coalesce(cat.alt_code, orders.product_code) as product_code",
      "    from {{ model.name }} orders",
      "    left join (",
      "        select group_code, alt_code",
      "        from {{ source('raw', 'product_catalog') }}",
      "        where is_current",
      "    ) cat",
      "        on orders.product_id = cat.group_code",
      ")",
      "select * from final",
    ].join("\n"),
  },
  {
    id: "multiline-join-ref-alias",
    label: "multi-line JOIN with {{ ref() }} alias on next lines",
    rules: ["sql-reference-object-in-from"],
    modelPath: "models/staging/stg_orders_raw.sql",
    modelSql: [
      "with final as (",
      "    select audit.file_name",
      "    from {{ model.name }} orders",
      "    left join",
      '        {{ ref("stg_import_audit") }} audit',
      "        on orders.import_id = audit.id",
      ")",
      "select * from final",
    ].join("\n"),
  },
  {
    id: "from-base-cte-alias",
    label: "from named CTE with table alias",
    rules: ["sql-reference-object-in-from"],
    modelPath: "models/staging/stg_orders_enriched.sql",
    modelSql: [
      "with base as (select id from {{ model.name }}),",
      "final as (",
      "    select orders.id",
      "    from base orders",
      "    left join {{ ref('stg_import_audit') }} audit",
      "        on orders.import_id = audit.id",
      ")",
      "select * from final",
    ].join("\n"),
  },
  {
    id: "dim-header-comments",
    label: "dim template header comments (from / e.g.) and inline select comments",
    rules: ["sql-no-comma-join", "sql-reference-object-in-from", "sql-expression-alias-required"],
    modelPath: "models/marts/dim_customer.sql",
    modelSql: [
      "{{ config(meta={",
      '    "compare_columns": [',
      '        "region_code",',
      '        "customer_name"',
      "    ]",
      "}) }}",
      "-- Columns from the upstream model to include in the target dimension",
      "-- Map source columns to target names e.g. STG_UNIT AS unit_code",
      "select",
      "    customer_id,",
      "    synced_at, -- do not take dates in the future",
      "    false::boolean as is_deleted",
      "from {{ ref('int_customer') }}",
    ].join("\n"),
  },
  {
    id: "wildcard-a-star",
    label: "select a.* with trim_all_columns pattern",
    rules: ["sql-expression-alias-required"],
    modelPath: "models/staging/stg_region_mapping.sql",
    modelSql: [
      "with {{ model.name }} as (",
      "    select {{ trim_all_columns(ref('seed_region_map')) }}",
      "    from {{ ref('seed_region_map') }}",
      "),",
      "final as (",
      "    select a.*, loaded_at as synced_at",
      "    from {{ model.name }} a",
      ")",
      "select * from final",
    ].join("\n"),
  },
  {
    id: "model-name-star",
    label: "{{ model.name }}.* in SELECT",
    rules: ["sql-expression-alias-required"],
    modelPath: "models/marts/fct_orders.sql",
    modelSql: [
      "with dedup as (",
      "    select {{ model.name }}.*, row_number() over (partition by id) as rn",
      "    from {{ model.name }}",
      ")",
      "select id from dedup",
    ].join("\n"),
  },
  {
    id: "union-same-column-count",
    label: "UNION ALL branches with same column count (comment smoke)",
    rules: ["sql-set-operator-column-count-match", "sql-no-comma-join"],
    modelPath: "models/marts/dim_region.sql",
    modelSql: [
      "-- IN THE SELECT LIST INCLUDE ONLY COLUMNS FROM THE REFERENCED MODEL",
      "with combined as (",
      "    select region_code, 1 as source_rank",
      "    from {{ ref('stg_regions') }}",
      "    union all",
      "    select region_code, 2 as source_rank",
      "    from {{ ref('stg_region_mapping') }}",
      ")",
      "select region_code from combined",
    ].join("\n"),
  },
];

/** Rules covered by at least one guardrail (for coverage reporting in fp-scan). */
export const GUARDRAIL_COVERED_RULES = [
  ...new Set(DBT_FP_GUARDRAILS.flatMap((guardrail) => guardrail.rules)),
].sort();
