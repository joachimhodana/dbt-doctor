import { bigqueryPartitionFilter } from "./rules/bigquery-partition-filter.js";
import { chainedViews } from "./rules/chained-views.js";
import { clusterByHint } from "./rules/cluster-by-hint.js";
import { columnDescAreSame } from "./rules/column-desc-are-same.js";
import { columnDescriptionRequired } from "./rules/column-description-required.js";
import { columnNameContract } from "./rules/column-name-contract.js";
import { databaseCasingConsistency } from "./rules/database-casing-consistency.js";
import { dbtExpectationsHint } from "./rules/dbt-expectations-hint.js";
import { dbtProjectName } from "./rules/dbt-project-name.js";
import { directSourceAndRef } from "./rules/direct-source-and-ref.js";
import { duplicateSources } from "./rules/duplicate-sources.js";
import { emptyModelFile } from "./rules/empty-model-file.js";
import { exposureHasMetaKeys } from "./rules/exposure-has-meta-keys.js";
import { excessiveCteDepth } from "./rules/excessive-cte-depth.js";
import { exposureDocumented } from "./rules/exposure-documented.js";
import { exposureParentsMaterializations } from "./rules/exposure-parents-materializations.js";
import { exposuresOnPrivateModels } from "./rules/exposures-on-private-models.js";
import { genericTestPresent } from "./rules/generic-test-present.js";
import { hardcodedDatabase } from "./rules/hardcoded-database.js";
import { incrementalUniqueKey } from "./rules/incremental-unique-key.js";
import { intermediatePrefix } from "./rules/intermediate-prefix.js";
import { jinjaConfigBlock } from "./rules/jinja-config-block.js";
import { macroArgumentsHaveDesc } from "./rules/macro-arguments-have-desc.js";
import { macroDocumented } from "./rules/macro-documented.js";
import { macroSnakeCase } from "./rules/macro-snake-case.js";
import { martsPrefix } from "./rules/marts-prefix.js";
import { materializationHint } from "./rules/materialization-hint.js";
import { modelContractEnforced } from "./rules/model-contract-enforced.js";
import { modelFanout } from "./rules/model-fanout.js";
import { modelHasAllColumns } from "./rules/model-has-all-columns.js";
import { modelHasConstraints } from "./rules/model-has-constraints.js";
import { modelHasGenericConstraints } from "./rules/model-has-generic-constraints.js";
import { modelHasLabelsKeys } from "./rules/model-has-labels-keys.js";
import { modelHasTests } from "./rules/model-has-tests.js";
import { modelHasMetaKeys } from "./rules/model-has-meta-keys.js";
import { modelHasTestsByGroup } from "./rules/model-has-tests-by-group.js";
import { modelHasTestsByName } from "./rules/model-has-tests-by-name.js";
import { modelHasTestsByType } from "./rules/model-has-tests-by-type.js";
import { modelLineLength } from "./rules/model-line-length.js";
import { modelNameContract } from "./rules/model-name-contract.js";
import { modelMaterializationByChilds } from "./rules/model-materialization-by-childs.js";
import { modelOutsideLayerFolder } from "./rules/model-outside-layer-folder.js";
import { modelOwnerOrMeta } from "./rules/model-owner-or-meta.js";
import { modelParentsDatabase } from "./rules/model-parents-database.js";
import { modelParentsNamePrefix } from "./rules/model-parents-name-prefix.js";
import { modelParentsSchema } from "./rules/model-parents-schema.js";
import { modelPathLayerMismatch } from "./rules/model-path-layer-mismatch.js";
import { noAbbreviationsInNames } from "./rules/no-abbreviations-in-names.js";
import { noHardcodedEnv } from "./rules/no-hardcoded-env.js";
import { noRunQueryInModel } from "./rules/no-run-query-in-model.js";
import { noUnusedIsIncremental } from "./rules/no-unused-is-incremental.js";
import { noSelectStar } from "./rules/no-select-star.js";
import { sqlKeywordsCase } from "./rules/sql-keywords-case.js";
import { sqlSelectTargetsLayout } from "./rules/sql-select-targets-layout.js";
import { sqlSelectTrailingComma } from "./rules/sql-select-trailing-comma.js";
import { sqlExplicitJoinType } from "./rules/sql-explicit-join-type.js";
import { sqlAmbiguousDistinctGroupBy } from "./rules/sql-ambiguous-distinct-group-by.js";
import { sqlSimpleCasePreferred } from "./rules/sql-simple-case-preferred.js";
import { sqlCaseNesting } from "./rules/sql-case-nesting.js";
import { sqlOrderByDirectionConsistency } from "./rules/sql-order-by-direction-consistency.js";
import { sqlReferencesQualified } from "./rules/sql-references-qualified.js";
import { sqlReferenceConsistency } from "./rules/sql-reference-consistency.js";
import { sqlExplicitColumnAlias } from "./rules/sql-explicit-column-alias.js";
import { sqlExplicitTableAlias } from "./rules/sql-explicit-table-alias.js";
import { sqlBooleanNullCase } from "./rules/sql-boolean-null-case.js";
import { sqlFileTrailingNewline } from "./rules/sql-file-trailing-newline.js";
import { sqlFunctionNameCase } from "./rules/sql-function-name-case.js";
import { sqlNoLeadingWhitespace } from "./rules/sql-no-leading-whitespace.js";
import { sqlOperatorSpacing } from "./rules/sql-operator-spacing.js";
import { sqlTrailingWhitespace } from "./rules/sql-trailing-whitespace.js";
import { sqlIndentationConsistency } from "./rules/sql-indentation-consistency.js";
import { sqlFunctionSpacing } from "./rules/sql-function-spacing.js";
import { sqlCteBracketPosition } from "./rules/sql-cte-bracket-position.js";
import { sqlCteBlankLineAfter } from "./rules/sql-cte-blank-line-after.js";
import { sqlTrailingCommas } from "./rules/sql-trailing-commas.js";
import { sqlLeadingCommas } from "./rules/sql-leading-commas.js";
import { sqlUnionExplicitQualifier } from "./rules/sql-union-explicit-qualifier.js";
import { sqlSetOperatorNewline } from "./rules/sql-set-operator-newline.js";
import { sqlUnquotedIdentifiersCase } from "./rules/sql-unquoted-identifiers-case.js";
import { sqlUnusedCte } from "./rules/sql-unused-cte.js";
import { nonCanonicalLayerFolder } from "./rules/non-canonical-layer-folder.js";
import { notNullOnRequiredKeys } from "./rules/not-null-on-required-keys.js";
import { multipleSourcesJoined } from "./rules/multiple-sources-joined.js";
import { modelTags } from "./rules/model-tags.js";
import { perModelSchemaYml } from "./rules/per-model-schema-yml.js";
import { recommendedDbtPackages } from "./rules/recommended-dbt-packages.js";
import { requiredDocsMet } from "./rules/required-docs-met.js";
import { requiredTagsMet } from "./rules/required-tags-met.js";
import { requiredTestsMet } from "./rules/required-tests-met.js";
import { rejoiningUpstreamConcepts } from "./rules/rejoining-upstream-concepts.js";
import { refOverSource } from "./rules/ref-over-source.js";
import { relationshipTestOnFk } from "./rules/relationship-test-on-fk.js";
import { rootModels } from "./rules/root-models.js";
import { schemaDescription } from "./rules/schema-description.js";
import { seedDocumented } from "./rules/seed-documented.js";
import { seedHasMetaKeys } from "./rules/seed-has-meta-keys.js";
import { seedHasOwner } from "./rules/seed-has-owner.js";
import { snapshotHasMetaKeys } from "./rules/snapshot-has-meta-keys.js";
import { snapshotStrategy } from "./rules/snapshot-strategy.js";
import { snapshotUniqueKey } from "./rules/snapshot-unique-key.js";
import { sourceFreshness } from "./rules/source-freshness.js";
import { sourceFanout } from "./rules/source-fanout.js";
import { sourceHasMetaKeys } from "./rules/source-has-meta-keys.js";
import { sourceHasLabelsKeys } from "./rules/source-has-labels-keys.js";
import { sourceHasLoader } from "./rules/source-has-loader.js";
import { sourceInDownstream } from "./rules/source-in-downstream.js";
import { sourcePiiMeta } from "./rules/source-pii-meta.js";
import { sourceTags } from "./rules/source-tags.js";
import { sourceChilds } from "./rules/source-childs.js";
import { stagingMaterializedView } from "./rules/staging-materialized-view.js";
import { stagingDependsOnDownstream } from "./rules/staging-depends-on-downstream.js";
import { stagingDependsOnStaging } from "./rules/staging-depends-on-staging.js";
import { stagingNamingConvention } from "./rules/staging-naming-convention.js";
import { stagingNoJoin } from "./rules/staging-no-join.js";
import { stagingPrefix } from "./rules/staging-prefix.js";
import { tooManyJoins } from "./rules/too-many-joins.js";
import { testHasMetaKeys } from "./rules/test-has-meta-keys.js";
import { testTags } from "./rules/test-tags.js";
import { undocumentedModel } from "./rules/undocumented-model.js";
import { undocumentedSources } from "./rules/undocumented-sources.js";
import { unusedSources } from "./rules/unused-sources.js";
import { scriptSemicolon } from "./rules/script-semicolon.js";
import type { Rule } from "./types.js";

export const ALL_DBT_DOCTOR_RULES: readonly Rule[] = [
  modelLineLength,
  sqlKeywordsCase,
  sqlSelectTargetsLayout,
  sqlSelectTrailingComma,
  sqlExplicitJoinType,
  sqlAmbiguousDistinctGroupBy,
  sqlSimpleCasePreferred,
  sqlCaseNesting,
  sqlOrderByDirectionConsistency,
  sqlReferencesQualified,
  sqlReferenceConsistency,
  sqlExplicitColumnAlias,
  sqlExplicitTableAlias,
  sqlBooleanNullCase,
  sqlFileTrailingNewline,
  sqlFunctionNameCase,
  sqlNoLeadingWhitespace,
  sqlOperatorSpacing,
  sqlTrailingWhitespace,
  sqlIndentationConsistency,
  sqlFunctionSpacing,
  sqlCteBracketPosition,
  sqlCteBlankLineAfter,
  sqlUnusedCte,
  sqlUnquotedIdentifiersCase,
  sqlTrailingCommas,
  sqlLeadingCommas,
  sqlUnionExplicitQualifier,
  sqlSetOperatorNewline,
  noSelectStar,
  stagingPrefix,
  stagingNamingConvention,
  stagingNoJoin,
  stagingDependsOnStaging,
  stagingDependsOnDownstream,
  stagingMaterializedView,
  intermediatePrefix,
  martsPrefix,
  modelOutsideLayerFolder,
  nonCanonicalLayerFolder,
  modelPathLayerMismatch,
  schemaDescription,
  columnDescriptionRequired,
  columnDescAreSame,
  columnNameContract,
  requiredDocsMet,
  perModelSchemaYml,
  undocumentedModel,
  seedDocumented,
  seedHasMetaKeys,
  seedHasOwner,
  macroArgumentsHaveDesc,
  macroDocumented,
  macroSnakeCase,
  exposureDocumented,
  exposureHasMetaKeys,
  modelOwnerOrMeta,
  sourcePiiMeta,
  sourceHasMetaKeys,
  sourceHasLabelsKeys,
  sourceHasLoader,
  sourceTags,
  sourceChilds,
  unusedSources,
  sourceFanout,
  duplicateSources,
  undocumentedSources,
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
  requiredTestsMet,
  requiredTagsMet,
  testHasMetaKeys,
  testTags,
  tooManyJoins,
  multipleSourcesJoined,
  modelHasTests,
  modelHasTestsByName,
  modelHasTestsByType,
  modelHasTestsByGroup,
  modelHasConstraints,
  modelHasGenericConstraints,
  modelHasAllColumns,
  modelHasMetaKeys,
  modelHasLabelsKeys,
  modelNameContract,
  modelTags,
  dbtExpectationsHint,
  modelFanout,
  modelParentsSchema,
  modelParentsNamePrefix,
  modelParentsDatabase,
  modelMaterializationByChilds,
  rejoiningUpstreamConcepts,
  rootModels,
  exposureParentsMaterializations,
  exposuresOnPrivateModels,
  chainedViews,
  materializationHint,
  incrementalUniqueKey,
  noUnusedIsIncremental,
  modelContractEnforced,
  snapshotStrategy,
  snapshotHasMetaKeys,
  snapshotUniqueKey,
  excessiveCteDepth,
  emptyModelFile,
  jinjaConfigBlock,
  databaseCasingConsistency,
  scriptSemicolon,
  noAbbreviationsInNames,
  recommendedDbtPackages,
];

export const ALL_DBT_DOCTOR_RULE_KEYS = ALL_DBT_DOCTOR_RULES.map((rule) => rule.id);
