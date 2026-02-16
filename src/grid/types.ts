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

export type JBModuleTextsConfig = {
  moduleName?: string;
  iconName?: string;
  newText?: string;
  editText?: string;
  searchPlaceholder?: string;
  goBackOnItemNotFoundText?: string;
  goBackToGrid?: string;
  formHeaderSubtitle?: string;
};

export type JBModuleUrlsConfig = {
  base?: string;
  list?: string;
  new?: string;
  edit?: string;
};

export type JBModuleApiConfig = {
  basePath: string;
  [key: string]: unknown;
};

export type JBModuleConfig = {
  urls?: JBModuleUrlsConfig;
  texts?: JBModuleTextsConfig;
  api?: JBModuleApiConfig;
};

export type JBGridHeaderProps = {
  moduleConfig?: JBModuleConfig;
  iconNameRenderer?: (iconName: string) => ReactNode;
  breadcrumb?: ReactNode;
  title?: string;
  icon?: ReactNode;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  rightContent?: ReactNode;
};

export type JBFormHeaderProps = {
  moduleConfig?: JBModuleConfig;
  iconNameRenderer?: (iconName: string) => ReactNode;
  animated?: boolean;
  animationDurationMs?: number;
  animationStaggerMs?: number;
  animationPreset?: 'vertical' | 'sides';
  breadcrumb?: ReactNode;
  showBackButton?: boolean;
  backLabel?: string;
  onBackClick?: () => void;
  backContent?: ReactNode;
  isNew?: boolean;
  title?: string;
  dynamicTitle?: string;
  formValues?: Record<string, unknown>;
  getDynamicTitle?: (args: {
    isNew: boolean;
    values?: Record<string, unknown>;
  }) => string | undefined;
  subtitle?: string;
  dynamicSubtitle?: string;
  getDynamicSubtitle?: (args: {
    isNew: boolean;
    values?: Record<string, unknown>;
  }) => string | undefined;
  icon?: ReactNode;
  actions?: {
    formDisabled?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    showDeleteWhenEditing?: boolean;
    disableSave?: boolean;
    disableCancel?: boolean;
    disableEdit?: boolean;
    disableDelete?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    editLabel?: string;
    deleteLabel?: string;
    saveIcon?: ReactNode;
    cancelIcon?: ReactNode;
    editIcon?: ReactNode;
    deleteIcon?: ReactNode;
    onSave?: () => void;
    onCancel?: () => void;
    onStartEdit?: () => void;
    onDelete?: () => void;
  };
  rightContent?: ReactNode;
};
