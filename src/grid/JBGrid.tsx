import {
  CustomPaging,
  FilteringState,
  GroupingState,
  IntegratedFiltering,
  IntegratedGrouping,
  IntegratedSelection,
  IntegratedSorting,
  IntegratedSummary,
  PagingState,
  SearchState,
  SelectionState,
  SortingState,
  SummaryState
} from '@devexpress/dx-react-grid';
import {
  DragDropProvider,
  Grid,
  GroupingPanel,
  PagingPanel,
  Table,
  TableColumnResizing,
  TableFilterRow,
  TableGroupRow,
  TableHeaderRow,
  TableSelection,
  TableSummaryRow,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { JBBooleanTypeProvider, JBCurrencyTypeProvider, JBImageTypeProvider } from './JBGridProviders';
import { JBGridProps } from './types';

const DEFAULT_PAGE_SIZES = [10, 30, 50, 100, 200, 500, 1000];

export function JBGrid<TData extends Record<string, unknown>>(props: JBGridProps<TData>) {
  const {
    gridConfig,
    service,
    rows: controlledRows,
    searchText,
    onSearchTextChange,
    onRowSelected,
    loadData,
    loadingComponent,
    getRowId
  } = props;

  const { defaults } = gridConfig;
  const pageSizes = defaults.pageSizes ?? DEFAULT_PAGE_SIZES;

  const [rows, setRows] = useState<TData[]>(controlledRows ?? []);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(defaults.pageSize || 10);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [selection, setSelection] = useState<Array<string | number>>([]);

  useEffect(() => {
    if (controlledRows) {
      setRows(controlledRows);
      setTotalCount(controlledRows.length);
    }
  }, [controlledRows]);

  const computeQueryString = useMemo(
    () => () => `pageSize=${pageSize}&skip=${pageSize * currentPage}&terms=${searchText || ''}`,
    [currentPage, pageSize, searchText]
  );

  useEffect(() => {
    if (controlledRows) return;

    const execute = async () => {
      if (loadData) {
        await loadData({
          lastQuery,
          loading,
          setRows,
          setTotalCount,
          setLastQuery,
          setLoading,
          getQueryString: computeQueryString,
          currentPage,
          pageSize,
          searchText
        });
        return;
      }

      if (!service) return;

      const queryString = computeQueryString();
      if (queryString === lastQuery || loading) return;

      try {
        setLoading(true);
        const response = await service.list(currentPage, pageSize, searchText);
        setRows(response?.data?.results ?? []);
        setTotalCount(response?.data?.count ?? 0);
        setLastQuery(queryString);
      } finally {
        setLoading(false);
      }
    };

    void execute();
  }, [
    computeQueryString,
    controlledRows,
    currentPage,
    lastQuery,
    loadData,
    loading,
    pageSize,
    searchText,
    service
  ]);

  const handleSelection = (nextSelection: Array<string | number>) => {
    const lastSelected = nextSelection.find((selected) => selection.indexOf(selected) === -1);

    if (lastSelected === undefined) {
      setSelection([]);
      return;
    }

    setSelection([lastSelected]);
    const selectedIndex =
      typeof lastSelected === 'number' ? lastSelected : Number.parseInt(String(lastSelected), 10);
    const selectedRow = rows[selectedIndex];
    if (selectedRow && onRowSelected) {
      onRowSelected(selectedRow);
    }
  };

  const rowIdGetter = getRowId
    ? (row: TData) => getRowId(row)
    : (row: TData) => (row.id as string | number);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {loading ? (
        <div>{loadingComponent ?? <span>Loading...</span>}</div>
      ) : (
        <Grid
          rows={rows}
          columns={gridConfig.columns}
          getRowId={rowIdGetter}>
          <SortingState defaultSorting={defaults.sorting as never} />

          <PagingState
            currentPage={currentPage}
            onCurrentPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          <GroupingState
            defaultGrouping={defaults.grouping as never}
            defaultExpandedGroups={defaults.expandedGroups as never}
          />

          <SummaryState
            totalItems={gridConfig.totalSummaryItems as never}
            groupItems={gridConfig.groupSummaryItems as never}
          />

          <FilteringState defaultFilters={defaults.filters as never} />
          <SearchState
            value={searchText}
            onValueChange={onSearchTextChange}
          />
          <SelectionState
            selection={selection}
            onSelectionChange={handleSelection}
          />

          {defaults.allowGrouping !== false ? <IntegratedGrouping /> : null}
          <IntegratedFiltering />
          <IntegratedSorting />
          <IntegratedSelection />
          <IntegratedSummary />

          <DragDropProvider />

          {gridConfig.booleanColumns?.length ? (
            <JBBooleanTypeProvider for={gridConfig.booleanColumns} />
          ) : null}

          {gridConfig.imageColumns?.length ? <JBImageTypeProvider for={gridConfig.imageColumns} /> : null}

          {gridConfig.currencyColumns?.length ? (
            <JBCurrencyTypeProvider for={gridConfig.currencyColumns} />
          ) : null}

          <Table columnExtensions={gridConfig.tableColumnExtensions as never} />

          {defaults.allowColumnResizing !== false ? (
            <TableColumnResizing defaultColumnWidths={gridConfig.columnsWidths} />
          ) : null}

          {defaults.allowSelection !== false ? (
            <TableSelection
              showSelectAll={defaults.allowSelectAll}
              showSelectionColumn={defaults.showSelectionColumn}
              selectByRowClick
              highlightRow
            />
          ) : null}

          <TableHeaderRow showSortingControls={defaults.allowSorting !== false} />

          {defaults.allowFiltering ? (
            <TableFilterRow showFilterSelector={defaults.advancedFiltering} />
          ) : null}

          <PagingPanel pageSizes={pageSizes} />

          {defaults.allowGrouping !== false ? (
            <TableGroupRow showColumnsWhenGrouped={false} />
          ) : null}

          <Toolbar />
          {defaults.allowGrouping !== false ? <GroupingPanel showSortingControls /> : null}
          <TableSummaryRow />
          <CustomPaging totalCount={totalCount} />
        </Grid>
      )}
    </div>
  );
}
