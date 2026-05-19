import { bigqueryPartitionFilter } from "./rules/bigquery-partition-filter.js";
import { dbtProjectName } from "./rules/dbt-project-name.js";
import { directSourceAndRef } from "./rules/direct-source-and-ref.js";
import { emptyModelFile } from "./rules/empty-model-file.js";
import { genericTestPresent } from "./rules/generic-test-present.js";
import { hardcodedDatabase } from "./rules/hardcoded-database.js";
import { intermediatePrefix } from "./rules/intermediate-prefix.js";
import { jinjaConfigBlock } from "./rules/jinja-config-block.js";
import { martsPrefix } from "./rules/marts-prefix.js";
import { materializationHint } from "./rules/materialization-hint.js";
import { modelOutsideLayerFolder } from "./rules/model-outside-layer-folder.js";
import { noRunQueryInModel } from "./rules/no-run-query-in-model.js";
import { noSelectStar } from "./rules/no-select-star.js";
import { refOverSource } from "./rules/ref-over-source.js";
import { schemaDescription } from "./rules/schema-description.js";
import { sourceFreshness } from "./rules/source-freshness.js";
import { sourceInDownstream } from "./rules/source-in-downstream.js";
import { stagingMaterializedView } from "./rules/staging-materialized-view.js";
import { stagingNamingConvention } from "./rules/staging-naming-convention.js";
import { stagingNoJoin } from "./rules/staging-no-join.js";
import { stagingPrefix } from "./rules/staging-prefix.js";
import type { Rule } from "./types.js";

export const ALL_DBT_DOCTOR_RULES: readonly Rule[] = [
  noSelectStar,
  stagingPrefix,
  stagingNamingConvention,
  stagingNoJoin,
  stagingMaterializedView,
  intermediatePrefix,
  martsPrefix,
  modelOutsideLayerFolder,
  schemaDescription,
  sourceFreshness,
  sourceInDownstream,
  directSourceAndRef,
  noRunQueryInModel,
  hardcodedDatabase,
  dbtProjectName,
  refOverSource,
  bigqueryPartitionFilter,
  genericTestPresent,
  materializationHint,
  emptyModelFile,
  jinjaConfigBlock,
];

export const ALL_DBT_DOCTOR_RULE_KEYS = ALL_DBT_DOCTOR_RULES.map((rule) => rule.id);
