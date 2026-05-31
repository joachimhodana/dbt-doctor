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
import { jinjaTagPadding } from "./rules/jinja-tag-padding.js";
import { jinjaSyntaxValid } from "./rules/jinja-syntax-valid.js";
import { macroArgumentsHaveDesc } from "./rules/macro-arguments-have-desc.js";
import { macroDocumented } from "./rules/macro-documented.js";
import { macroHasMetaKeys } from "./rules/macro-has-meta-keys.js";
import { macroSnakeCase } from "./rules/macro-snake-case.js";
import { martsPrefix } from "./rules/marts-prefix.js";
import { materializationHint } from "./rules/materialization-hint.js";
import { modelContractEnforced } from "./rules/model-contract-enforced.js";
import { modelColumnsHaveMetaKeys } from "./rules/model-columns-have-meta-keys.js";
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
import { modelHasExampleSql } from "./rules/model-has-example-sql.js";
import { modelHasUniquenessTest } from "./rules/model-has-uniqueness-test.js";
import { modelLineLength } from "./rules/model-line-length.js";
import { modelSingleColumnUniqueness } from "./rules/model-single-column-uniqueness.js";
import { modelSinglePkColumnLevel } from "./rules/model-single-pk-column-level.js";
import { modelNameContract } from "./rules/model-name-contract.js";
import { modelMaterializationByChilds } from "./rules/model-materialization-by-childs.js";
import { modelOutsideLayerFolder } from "./rules/model-outside-layer-folder.js";
import { modelOwnerOrMeta } from "./rules/model-owner-or-meta.js";
import { modelParentsDatabase } from "./rules/model-parents-database.js";
import { modelParentsNamePrefix } from "./rules/model-parents-name-prefix.js";
import { modelParentsSchema } from "./rules/model-parents-schema.js";
import { modelParentsAndChilds } from "./rules/model-parents-and-childs.js";
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
import { sqlOrderByDistinctCompatibility } from "./rules/sql-order-by-distinct-compatibility.js";
import { sqlPreferBangEquals } from "./rules/sql-prefer-bang-equals.js";
import { sqlReferencesQualified } from "./rules/sql-references-qualified.js";
import { sqlReferenceConsistency } from "./rules/sql-reference-consistency.js";
import { sqlReferenceObjectInFrom } from "./rules/sql-reference-object-in-from.js";
import { sqlReferenceTargetExists } from "./rules/sql-reference-target-exists.js";
import { sqlReferenceKeywordQuoted } from "./rules/sql-reference-keyword-quoted.js";
import { sqlReferenceSpecialCharsQuoted } from "./rules/sql-reference-special-chars-quoted.js";
import { sqlReferenceUnnecessaryQuoted } from "./rules/sql-reference-unnecessary-quoted.js";
import { sqlExplicitColumnAlias } from "./rules/sql-explicit-column-alias.js";
import { sqlExpressionAliasRequired } from "./rules/sql-expression-alias-required.js";
import { sqlUniqueColumnAliases } from "./rules/sql-unique-column-aliases.js";
import { sqlExplicitTableAlias } from "./rules/sql-explicit-table-alias.js";
import { sqlAliasLengthMin } from "./rules/sql-alias-length-min.js";
import { sqlDerivedTableAliasRequired } from "./rules/sql-derived-table-alias-required.js";
import { sqlAliasNotKeyword } from "./rules/sql-alias-not-keyword.js";
import { sqlNoSelfAlias } from "./rules/sql-no-self-alias.js";
import { sqlUniqueTableAliases } from "./rules/sql-unique-table-aliases.js";
import { sqlSelfJoinAliasDistinct } from "./rules/sql-self-join-alias-distinct.js";
import { sqlAmbiguousJoinType } from "./rules/sql-ambiguous-join-type.js";
import { sqlBooleanNullCase } from "./rules/sql-boolean-null-case.js";
import { sqlDataTypeCase } from "./rules/sql-data-type-case.js";
import { sqlFileTrailingNewline } from "./rules/sql-file-trailing-newline.js";
import { sqlFunctionNameCase } from "./rules/sql-function-name-case.js";
import { sqlNoLeadingWhitespace } from "./rules/sql-no-leading-whitespace.js";
import { sqlNoCommaJoin } from "./rules/sql-no-comma-join.js";
import { sqlJoinConditionRequired } from "./rules/sql-join-condition-required.js";
import { sqlJoinConditionInOnClause } from "./rules/sql-join-condition-in-on-clause.js";
import { sqlNoElseNullCase } from "./rules/sql-no-else-null-case.js";
import { sqlCountStarPreferred } from "./rules/sql-count-star-preferred.js";
import { sqlCastStyleConsistency } from "./rules/sql-cast-style-consistency.js";
import { sqlNullLiteralStyle } from "./rules/sql-null-literal-style.js";
import { sqlBooleanLiteralStyle } from "./rules/sql-boolean-literal-style.js";
import { sqlCoalescePreferred } from "./rules/sql-coalesce-preferred.js";
import { sqlBetweenSymmetricStyle } from "./rules/sql-between-symmetric-style.js";
import { sqlZeroLengthStringStyle } from "./rules/sql-zero-length-string-style.js";
import { sqlNullComparisonOperator } from "./rules/sql-null-comparison-operator.js";
import { sqlNoPositionalGroupOrder } from "./rules/sql-no-positional-group-order.js";
import { sqlOrderByOrdinalUnambiguous } from "./rules/sql-order-by-ordinal-unambiguous.js";
import { sqlNoSubqueryInJoin } from "./rules/sql-no-subquery-in-join.js";
import { sqlJoinUsingConsistency } from "./rules/sql-join-using-consistency.js";
import { sqlTsqlSpPrefix } from "./rules/sql-tsql-sp-prefix.js";
import { sqlTsqlBareTempTable } from "./rules/sql-tsql-bare-temp-table.js";
import { sqlTsqlSysSchemaQualified } from "./rules/sql-tsql-sys-schema-qualified.js";
import { sqlOperatorSpacing } from "./rules/sql-operator-spacing.js";
import { sqlBooleanComparisonSimplify } from "./rules/sql-boolean-comparison-simplify.js";
import { sqlQuotedLiteralStyle } from "./rules/sql-quoted-literal-style.js";
import { sqlTrailingWhitespace } from "./rules/sql-trailing-whitespace.js";
import { sqlIndentationConsistency } from "./rules/sql-indentation-consistency.js";
import { sqlFunctionSpacing } from "./rules/sql-function-spacing.js";
import { sqlCteBracketPosition } from "./rules/sql-cte-bracket-position.js";
import { sqlCteBlankLineAfter } from "./rules/sql-cte-blank-line-after.js";
import { sqlClauseNewlineConsistency } from "./rules/sql-clause-newline-consistency.js";
import { sqlAmbiguousOrderByTarget } from "./rules/sql-ambiguous-order-by-target.js";
import { sqlTrailingCommas } from "./rules/sql-trailing-commas.js";
import { sqlLeadingCommas } from "./rules/sql-leading-commas.js";
import { sqlDistinctWithOrderByNonSelected } from "./rules/sql-distinct-with-order-by-non-selected.js";
import { sqlDistinctParentheses } from "./rules/sql-distinct-parentheses.js";
import { sqlSetOperatorColumnCountMatch } from "./rules/sql-set-operator-column-count-match.js";
import { sqlUnionExplicitQualifier } from "./rules/sql-union-explicit-qualifier.js";
import { sqlUnionDistinctRedundant } from "./rules/sql-union-distinct-redundant.js";
import { sqlSetOperatorNewline } from "./rules/sql-set-operator-newline.js";
import { sqlUnquotedIdentifiersCase } from "./rules/sql-unquoted-identifiers-case.js";
import { sqlConstantExpression } from "./rules/sql-constant-expression.js";
import { sqlUnusedCte } from "./rules/sql-unused-cte.js";
import { sqlUnusedJoinAlias } from "./rules/sql-unused-join-alias.js";
import { sqlMaxConsecutiveBlankLines } from "./rules/sql-max-consecutive-blank-lines.js";
import { sqlSingleStatementModel } from "./rules/sql-single-statement-model.js";
import { sqlNoConsecutiveSemicolons } from "./rules/sql-no-consecutive-semicolons.js";
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
import { seedColumnsHaveDescription } from "./rules/seed-columns-have-description.js";
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
import { sourceColumnsHaveDesc } from "./rules/source-columns-have-desc.js";
import { sourceHasAllColumns } from "./rules/source-has-all-columns.js";
import { sourceHasDescription } from "./rules/source-has-description.js";
import { sourceHasTests } from "./rules/source-has-tests.js";
import { sourceHasTestsByName } from "./rules/source-has-tests-by-name.js";
import { sourceHasTestsByType } from "./rules/source-has-tests-by-type.js";
import { sourceHasTestsByGroup } from "./rules/source-has-tests-by-group.js";
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
import { scriptRefAndSource } from "./rules/script-ref-and-source.js";
import { scriptHasNoTableName } from "./rules/script-has-no-table-name.js";
import { sourceTableHasDescription } from "./rules/source-table-has-description.js";
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
  sqlOrderByDistinctCompatibility,
  sqlPreferBangEquals,
  sqlReferencesQualified,
  sqlReferenceConsistency,
  sqlReferenceObjectInFrom,
  sqlReferenceTargetExists,
  sqlReferenceKeywordQuoted,
  sqlReferenceSpecialCharsQuoted,
  sqlReferenceUnnecessaryQuoted,
  sqlExplicitColumnAlias,
  sqlExpressionAliasRequired,
  sqlUniqueColumnAliases,
  sqlExplicitTableAlias,
  sqlAliasLengthMin,
  sqlDerivedTableAliasRequired,
  sqlAliasNotKeyword,
  sqlNoSelfAlias,
  sqlUniqueTableAliases,
  sqlSelfJoinAliasDistinct,
  sqlAmbiguousJoinType,
  sqlBooleanNullCase,
  sqlDataTypeCase,
  sqlFileTrailingNewline,
  sqlFunctionNameCase,
  sqlNoLeadingWhitespace,
  sqlNoCommaJoin,
  sqlJoinConditionRequired,
  sqlJoinConditionInOnClause,
  sqlNoElseNullCase,
  sqlCountStarPreferred,
  sqlCastStyleConsistency,
  sqlNullLiteralStyle,
  sqlBooleanLiteralStyle,
  sqlCoalescePreferred,
  sqlBetweenSymmetricStyle,
  sqlZeroLengthStringStyle,
  sqlNoPositionalGroupOrder,
  sqlOrderByOrdinalUnambiguous,
  sqlNullComparisonOperator,
  sqlNoSubqueryInJoin,
  sqlJoinUsingConsistency,
  sqlTsqlSpPrefix,
  sqlTsqlBareTempTable,
  sqlTsqlSysSchemaQualified,
  sqlOperatorSpacing,
  sqlBooleanComparisonSimplify,
  sqlQuotedLiteralStyle,
  sqlTrailingWhitespace,
  sqlIndentationConsistency,
  sqlFunctionSpacing,
  sqlCteBracketPosition,
  sqlCteBlankLineAfter,
  sqlClauseNewlineConsistency,
  sqlAmbiguousOrderByTarget,
  sqlConstantExpression,
  sqlUnusedCte,
  sqlUnusedJoinAlias,
  sqlSingleStatementModel,
  sqlNoConsecutiveSemicolons,
  sqlUnquotedIdentifiersCase,
  sqlMaxConsecutiveBlankLines,
  sqlTrailingCommas,
  sqlLeadingCommas,
  sqlDistinctParentheses,
  sqlDistinctWithOrderByNonSelected,
  sqlSetOperatorColumnCountMatch,
  sqlUnionExplicitQualifier,
  sqlUnionDistinctRedundant,
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
  modelColumnsHaveMetaKeys,
  columnDescAreSame,
  columnNameContract,
  requiredDocsMet,
  perModelSchemaYml,
  undocumentedModel,
  seedDocumented,
  seedColumnsHaveDescription,
  seedHasMetaKeys,
  seedHasOwner,
  macroArgumentsHaveDesc,
  macroDocumented,
  macroHasMetaKeys,
  macroSnakeCase,
  exposureDocumented,
  exposureHasMetaKeys,
  modelOwnerOrMeta,
  sourcePiiMeta,
  sourceHasMetaKeys,
  sourceHasLabelsKeys,
  sourceHasLoader,
  sourceHasDescription,
  sourceHasTests,
  sourceHasTestsByName,
  sourceHasTestsByType,
  sourceHasTestsByGroup,
  sourceTableHasDescription,
  sourceColumnsHaveDesc,
  sourceHasAllColumns,
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
  modelHasExampleSql,
  modelHasTestsByName,
  modelHasTestsByType,
  modelHasTestsByGroup,
  modelHasUniquenessTest,
  modelSingleColumnUniqueness,
  modelSinglePkColumnLevel,
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
  modelParentsAndChilds,
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
  jinjaTagPadding,
  jinjaSyntaxValid,
  databaseCasingConsistency,
  scriptSemicolon,
  scriptHasNoTableName,
  scriptRefAndSource,
  noAbbreviationsInNames,
  recommendedDbtPackages,
];

export const ALL_DBT_DOCTOR_RULE_KEYS = ALL_DBT_DOCTOR_RULES.map((rule) => rule.id);
