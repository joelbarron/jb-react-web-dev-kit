import { JBGridDefaults } from './types';

export const DEFAULT_GRID_DEFAULTS: Required<JBGridDefaults> = {
  pageSize: 30,
  virtualScrolling: false,
  estimatedRowHeight: 48,
  virtualTableHeight: 640,
  virtualTableHeightMode: 'fixed',
  virtualTableHeightRatio: 1,
  allowSorting: true,
  allowColumnResizing: true,
  allowSelection: true,
  allowSelectAll: false,
  showSelectionColumn: false,
  allowFiltering: false,
  advancedFiltering: false,
  allowGrouping: true,
  filters: [],
  sorting: [],
  grouping: [],
  expandedGroups: [],
  pageSizes: [10, 30, 50, 100, 200, 500, 1000]
};

export function resolveGridDefaults(defaults?: JBGridDefaults): Required<JBGridDefaults> {
  return {
    ...DEFAULT_GRID_DEFAULTS,
    ...(defaults ?? {})
  };
}
