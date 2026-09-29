export {
  formatGherkin,
  resolveIndentSize,
  DEFAULT_INDENT_SIZE,
  INDENT_UNIT,
  type FormatOptions,
  type FormatRange,
} from './formatGherkin';
export { classifyLine, indentLevelFor, matchStep, matchHeading, type LineKind } from './classify';
export {
  alignTableBlock,
  parseTableRow,
  formatTableRow,
  isNumericCell,
  tableCellSpans,
  tableRowSkeleton,
  type AlignTableOptions,
  type TableCellSpan,
} from './alignTables';
export {
  detectDialectId,
  resolveDialect,
  DIALECTS,
  allDialectWords,
  allStepWords,
  keywordAlternation,
  DEFAULT_DIALECT_ID,
} from './dialects';
export {
  parseDocument,
  selectionRangesAt,
  placeholderHighlights,
  blocksAt,
  type GherkinBlock,
  type ParsedDocument,
} from './structure';
export { minimalEdit, type MinimalEdit } from './minimalEdit';
