import { ReactNode } from 'react';

export type JBGridDefaults = {
  pageSize: number;
  allowSorting?: boolean;
  allowColumnResizing?: boolean;
  allowSelection?: boolean;
  allowSelectAll?: boolean;
  showSelectionColumn?: boolean;
  allowFiltering?: boolean;
  advancedFiltering?: boolean;
  allowGrouping?: boolean;
  filters?: unknown[];
  sorting?: unknown[];
  grouping?: unknown[];
  expandedGroups?: unknown[];
  pageSizes?: number[];
};

export type JBGridColumn = {
  name: string;
  title: string;
  [key: string]: unknown;
};

export type JBGridColumnWidth = {
  columnName: string;
  width: number;
};

export type JBGridConfig = {
  columns: JBGridColumn[];
  columnsWidths: JBGridColumnWidth[];
  imageColumns?: string[];
  booleanColumns?: string[];
  currencyColumns?: string[];
  totalSummaryItems?: unknown[];
  groupSummaryItems?: unknown[];
  tableColumnExtensions?: unknown[];
  defaults: JBGridDefaults;
};

export type JBGridListResponse<TData> = {
  data?: {
    results?: TData[];
    count?: number;
  };
};

export type JBGridService<TData> = {
  list: (
    currentPage: number,
    pageSize: number,
    searchText?: string
  ) => Promise<JBGridListResponse<TData>>;
};

export type JBGridLoadDataArgs<TData> = {
  lastQuery: string;
  loading: boolean;
  setRows: (rows: TData[]) => void;
  setTotalCount: (totalCount: number) => void;
  setLastQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  getQueryString: () => string;
  currentPage: number;
  pageSize: number;
  searchText: string;
};

export type JBGridProps<TData extends Record<string, unknown>> = {
  gridConfig: JBGridConfig;
  service?: JBGridService<TData>;
  rows?: TData[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onRowSelected?: (row: TData) => void;
  loadData?: (args: JBGridLoadDataArgs<TData>) => void | Promise<void>;
  loadingComponent?: ReactNode;
  getRowId?: (row: TData) => string | number;
};

export type JBGridHeaderProps = {
  title: string;
  icon?: ReactNode;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  rightContent?: ReactNode;
};

