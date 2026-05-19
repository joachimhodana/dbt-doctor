import { bigqueryPartitionFilter } from "./rules/bigquery-partition-filter.js";
import { clusterByHint } from "./rules/cluster-by-hint.js";
import { columnDescriptionRequired } from "./rules/column-description-required.js";
import { dbtExpectationsHint } from "./rules/dbt-expectations-hint.js";
import { dbtProjectName } from "./rules/dbt-project-name.js";
import { directSourceAndRef } from "./rules/direct-source-and-ref.js";
import { emptyModelFile } from "./rules/empty-model-file.js";
import { excessiveCteDepth } from "./rules/excessive-cte-depth.js";
import { exposureDocumented } from "./rules/exposure-documented.js";
import { genericTestPresent } from "./rules/generic-test-present.js";
import { hardcodedDatabase } from "./rules/hardcoded-database.js";
import { incrementalUniqueKey } from "./rules/incremental-unique-key.js";
import { intermediatePrefix } from "./rules/intermediate-prefix.js";
import { jinjaConfigBlock } from "./rules/jinja-config-block.js";
import { macroDocumented } from "./rules/macro-documented.js";
import { martsPrefix } from "./rules/marts-prefix.js";
import { materializationHint } from "./rules/materialization-hint.js";
import { modelContractEnforced } from "./rules/model-contract-enforced.js";
import { modelHasTests } from "./rules/model-has-tests.js";
import { modelLineLength } from "./rules/model-line-length.js";
import { modelOutsideLayerFolder } from "./rules/model-outside-layer-folder.js";
import { modelOwnerOrMeta } from "./rules/model-owner-or-meta.js";
import { modelPathLayerMismatch } from "./rules/model-path-layer-mismatch.js";
import { noAbbreviationsInNames } from "./rules/no-abbreviations-in-names.js";
import { noHardcodedEnv } from "./rules/no-hardcoded-env.js";
import { noRunQueryInModel } from "./rules/no-run-query-in-model.js";
import { noSelectStar } from "./rules/no-select-star.js";
import { nonCanonicalLayerFolder } from "./rules/non-canonical-layer-folder.js";
import { notNullOnRequiredKeys } from "./rules/not-null-on-required-keys.js";
import { perModelSchemaYml } from "./rules/per-model-schema-yml.js";
import { recommendedDbtPackages } from "./rules/recommended-dbt-packages.js";
import { refOverSource } from "./rules/ref-over-source.js";
import { relationshipTestOnFk } from "./rules/relationship-test-on-fk.js";
import { schemaDescription } from "./rules/schema-description.js";
import { seedDocumented } from "./rules/seed-documented.js";
import { snapshotStrategy } from "./rules/snapshot-strategy.js";
import { sourceFreshness } from "./rules/source-freshness.js";
import { sourceInDownstream } from "./rules/source-in-downstream.js";
import { sourcePiiMeta } from "./rules/source-pii-meta.js";
import { stagingMaterializedView } from "./rules/staging-materialized-view.js";
import { stagingNamingConvention } from "./rules/staging-naming-convention.js";
import { stagingNoJoin } from "./rules/staging-no-join.js";
import { stagingPrefix } from "./rules/staging-prefix.js";
import { undocumentedModel } from "./rules/undocumented-model.js";
import type { Rule } from "./types.js";

export const ALL_DBT_DOCTOR_RULES: readonly Rule[] = [
  modelLineLength,
  noSelectStar,
  stagingPrefix,
  stagingNamingConvention,
  stagingNoJoin,
  stagingMaterializedView,
  intermediatePrefix,
  martsPrefix,
  modelOutsideLayerFolder,
  nonCanonicalLayerFolder,
  modelPathLayerMismatch,
  schemaDescription,
  columnDescriptionRequired,
  perModelSchemaYml,
  undocumentedModel,
  seedDocumented,
  macroDocumented,
  exposureDocumented,
  modelOwnerOrMeta,
  sourcePiiMeta,
  sourceFreshness,
  sourceInDownstream,
  directSourceAndRef,
  noRunQueryInModel,
  hardcodedDatabase,
  noHardcodedEnv,
  dbtProjectName,
  refOverSource,
  bigqueryPartitionFilter,
  clusterByHint,
  genericTestPresent,
  notNullOnRequiredKeys,
  relationshipTestOnFk,
  modelHasTests,
  dbtExpectationsHint,
  materializationHint,
  incrementalUniqueKey,
  modelContractEnforced,
  snapshotStrategy,
  excessiveCteDepth,
  emptyModelFile,
  jinjaConfigBlock,
  noAbbreviationsInNames,
  recommendedDbtPackages,
];

export const ALL_DBT_DOCTOR_RULE_KEYS = ALL_DBT_DOCTOR_RULES.map((rule) => rule.id);
