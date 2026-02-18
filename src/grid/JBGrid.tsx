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
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';
import { Box, CircularProgress, TablePagination, Typography } from '@mui/material';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { resolveGridDefaults } from './defaults';
import { JBGridLoading } from './JBGridLoading';
import {
  JBBooleanTypeProvider,
  JBCurrencyTypeProvider,
  JBDateTypeProvider,
  JBImageTypeProvider
} from './JBGridProviders';
import { JBGridProps } from './types';

export function JBGrid<TData extends Record<string, unknown>>(props: JBGridProps<TData>) {
  let error: ReactNode | string | undefined = props.error;  
  error = error ? 'No se pudo cargar el listado.' : undefined;

  const {
    gridConfig,
    service,
    rows: controlledRows,
    totalCount: controlledTotalCount,
    loading: controlledLoading,
    currentPage: controlledCurrentPage,
    onCurrentPageChange,
    pageSize: controlledPageSize,
    onPageSizeChange,
    searchText,
    onSearchTextChange,
    onRowSelected,
    loadData,
    loadingComponent,
    getRowId,
    paginationPosition = 'top',
    stickyPagination = true,
    height = '100%',
    stickyHeader = true,
    infiniteScroll = false,
    hasMore = false,
    isLoadingMore = false,
    loadMoreThreshold = 200,
    onLoadMore
  } = props;

  const defaults = resolveGridDefaults(gridConfig.defaults);
  const pageSizes = defaults.pageSizes;
  const virtualScrolling = defaults.virtualScrolling;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(defaults.virtualTableHeight);
  const resolvedVirtualTableHeight =
    defaults.virtualTableHeightMode === 'fill'
      ? Math.max(240, Math.floor(containerHeight * defaults.virtualTableHeightRatio))
      : defaults.virtualTableHeight;
  const isControlledPaging = controlledCurrentPage !== undefined && controlledPageSize !== undefined;

  const [rows, setRows] = useState<TData[]>(controlledRows ?? []);
  const [totalCount, setTotalCount] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(defaults.pageSize);
  const [internalCurrentPage, setInternalCurrentPage] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [selection, setSelection] = useState<Array<string | number>>([]);

  const currentPage = isControlledPaging ? (controlledCurrentPage as number) : internalCurrentPage;
  const pageSize = isControlledPaging ? (controlledPageSize as number) : internalPageSize;
  const loading = controlledLoading ?? internalLoading;

  useEffect(() => {
    if (controlledRows) {
      setRows(controlledRows);
    }
  }, [controlledRows]);

  useEffect(() => {
    if (controlledTotalCount !== undefined) {
      setTotalCount(controlledTotalCount);
      return;
    }

    if (controlledRows) {
      setTotalCount(controlledRows.length);
    }
  }, [controlledRows, controlledTotalCount]);

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
          setLoading: setInternalLoading,
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
        setInternalLoading(true);
        const response = await service.list(currentPage, pageSize, searchText);
        setRows(response?.data?.results ?? []);
        setTotalCount(response?.data?.count ?? 0);
        setLastQuery(queryString);
      } finally {
        setInternalLoading(false);
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

  const handleCurrentPageChange = (nextPage: number) => {
    if (isControlledPaging) {
      onCurrentPageChange?.(nextPage);
      return;
    }
    setInternalCurrentPage(nextPage);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (isControlledPaging) {
      onPageSizeChange?.(nextPageSize);
      return;
    }
    setInternalPageSize(nextPageSize);
  };

  const handleSelection = (nextSelection: Array<string | number>) => {
    const lastSelected = nextSelection.find((selected) => selection.indexOf(selected) === -1);

    if (lastSelected === undefined) {
      setSelection([]);
      return;
    }

    setSelection([lastSelected]);
    const selectedRow = rows.find((row) => rowIdGetter(row) === lastSelected);
    if (selectedRow && onRowSelected) {
      onRowSelected(selectedRow);
    }
  };

  const rowIdGetter = getRowId
    ? (row: TData) => getRowId(row)
    : (row: TData) => (row.id as string | number);
  const showTopPagination = paginationPosition === 'top' || paginationPosition === 'both';
  const showBottomPagination = paginationPosition === 'bottom' || paginationPosition === 'both';
  const showPaging = paginationPosition !== 'none';
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPageSize = Number.parseInt(event.target.value, 10);
    handlePageSizeChange(nextPageSize);
    handleCurrentPageChange(0);
  };

  useEffect(() => {
    if (!virtualScrolling || defaults.virtualTableHeightMode !== 'fill' || !rootRef.current) return;

    const node = rootRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [defaults.virtualTableHeightMode, virtualScrolling]);

  useEffect(() => {
    if (!virtualScrolling || !infiniteScroll || !onLoadMore || !rootRef.current) return;

    const tableContainer = rootRef.current.querySelector('.MuiTableContainer-root');
    if (!tableContainer) return;

    const handleScroll = () => {
      const target = tableContainer as HTMLElement;
      const distanceToBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
      if (distanceToBottom <= loadMoreThreshold && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    };

    tableContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => tableContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, infiniteScroll, isLoadingMore, loadMoreThreshold, onLoadMore, rows.length, virtualScrolling]);

  useEffect(() => {
    if (!rootRef.current) return;

    const contentWrapper = rootRef.current.closest('.FusePageCarded-contentWrapper') as HTMLElement | null;
    const contentNode = rootRef.current.closest('.FusePageCarded-content') as HTMLElement | null;
    if (!contentWrapper) return;

    const lockCount = Number.parseInt(contentWrapper.dataset.jbGridLockCount ?? '0', 10) || 0;
    contentWrapper.dataset.jbGridLockCount = String(lockCount + 1);

    if (lockCount === 0) {
      const prevWrapperOverflow = contentWrapper.style.overflow;
      const prevWrapperScrollbarWidth = (contentWrapper.style as CSSStyleDeclaration & { scrollbarWidth?: string }).scrollbarWidth;
      const prevContentOverflow = contentNode?.style.overflow ?? '';
      const prevContentHeight = contentNode?.style.height ?? '';
      const prevContentMinHeight = contentNode?.style.minHeight ?? '';

      contentWrapper.dataset.jbGridPrevOverflow = prevWrapperOverflow;
      contentWrapper.dataset.jbGridPrevScrollbarWidth = prevWrapperScrollbarWidth ?? '';
      contentWrapper.dataset.jbGridPrevContentOverflow = prevContentOverflow;
      contentWrapper.dataset.jbGridPrevContentHeight = prevContentHeight;
      contentWrapper.dataset.jbGridPrevContentMinHeight = prevContentMinHeight;

      contentWrapper.style.overflow = 'hidden';
      (contentWrapper.style as CSSStyleDeclaration & { scrollbarWidth?: string }).scrollbarWidth = 'none';

      // Hide perfect-scrollbar rails when present in Fuse wrappers.
      const rails = contentWrapper.querySelectorAll<HTMLElement>('.ps__rail-x, .ps__rail-y');
      rails.forEach((rail) => {
        rail.dataset.jbGridPrevDisplay = rail.style.display ?? '';
        rail.style.display = 'none';
      });

      if (contentNode) {
        contentNode.style.overflow = 'hidden';
        contentNode.style.height = '100%';
        contentNode.style.minHeight = '0';
      }
    }

    return () => {
      const currentCount = Number.parseInt(contentWrapper.dataset.jbGridLockCount ?? '1', 10) || 1;
      const nextCount = Math.max(0, currentCount - 1);
      contentWrapper.dataset.jbGridLockCount = String(nextCount);

      if (nextCount > 0) return;

      contentWrapper.style.overflow = contentWrapper.dataset.jbGridPrevOverflow ?? '';
      (contentWrapper.style as CSSStyleDeclaration & { scrollbarWidth?: string }).scrollbarWidth =
        contentWrapper.dataset.jbGridPrevScrollbarWidth ?? '';

      const rails = contentWrapper.querySelectorAll<HTMLElement>('.ps__rail-x, .ps__rail-y');
      rails.forEach((rail) => {
        rail.style.display = rail.dataset.jbGridPrevDisplay ?? '';
        delete rail.dataset.jbGridPrevDisplay;
      });

      if (contentNode) {
        contentNode.style.overflow = contentWrapper.dataset.jbGridPrevContentOverflow ?? '';
        contentNode.style.height = contentWrapper.dataset.jbGridPrevContentHeight ?? '';
        contentNode.style.minHeight = contentWrapper.dataset.jbGridPrevContentMinHeight ?? '';
      }

      delete contentWrapper.dataset.jbGridPrevOverflow;
      delete contentWrapper.dataset.jbGridPrevScrollbarWidth;
      delete contentWrapper.dataset.jbGridPrevContentOverflow;
      delete contentWrapper.dataset.jbGridPrevContentHeight;
      delete contentWrapper.dataset.jbGridPrevContentMinHeight;
    };
  }, []);

  return (
    <Box
      className="jb-grid-root"
      ref={rootRef}
      sx={{
        width: '100%',
        height,
        minHeight: 0,
        overflow: virtualScrolling ? 'hidden !important' : 'auto',
        ...(!virtualScrolling && stickyHeader
          ? {
              '& .MuiTableCell-head': {
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: 'background.paper'
              }
            }
          : undefined)
        ,
        ...(virtualScrolling
          ? {
              '& .dx-rg-grid': {
                height: '100%',
                minHeight: 0
              },
              '& .MuiTableContainer-root': {
                overflowY: 'auto !important',
                overflowX: 'auto',
                overscrollBehavior: 'contain',
                maxHeight: `${resolvedVirtualTableHeight}px`
              }
            }
          : undefined)
      }}>
      {error ? (
        <Box sx={{ p: 2 }}>
          {typeof error === 'string' ? <Typography color="error.main">{error}</Typography> : error}
        </Box>
      ) : loading ? (
        <div>{loadingComponent ?? <JBGridLoading message="" />}</div>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            minHeight: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3
          }}>
          {props.emptyComponent ?? (
            <Typography
              variant="h5"
              sx={{ fontWeight: 600 }}
              color="text.secondary">
              No hay resultados.
            </Typography>
          )}
        </Box>
      ) : (
        <>
          {showTopPagination ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                px: 1,
                ...(stickyPagination
                  ? {
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      backgroundColor: 'background.paper',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }
                  : undefined)
              }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={currentPage}
                onPageChange={(_, nextPage) => handleCurrentPageChange(nextPage)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={pageSizes}
              />
            </Box>
          ) : null}

          <Grid
            rows={rows}
            columns={gridConfig.columns}
            getRowId={rowIdGetter}>
          <SortingState defaultSorting={defaults.sorting as never} />

            {showPaging ? (
              <PagingState
                currentPage={currentPage}
                onCurrentPageChange={handleCurrentPageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            ) : null}

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
          {gridConfig.dateColumns?.length ? <JBDateTypeProvider for={gridConfig.dateColumns} /> : null}

            {virtualScrolling ? (
              <VirtualTable
                columnExtensions={gridConfig.tableColumnExtensions as never}
                estimatedRowHeight={defaults.estimatedRowHeight}
                height={resolvedVirtualTableHeight}
              />
            ) : (
              <Table columnExtensions={gridConfig.tableColumnExtensions as never} />
            )}

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

            {showBottomPagination ? (
              <Box
                sx={
                  stickyPagination
                    ? {
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 3,
                        backgroundColor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }
                    : undefined
                }
              >
                <PagingPanel pageSizes={pageSizes} />
              </Box>
            ) : null}

          {defaults.allowGrouping !== false ? (
            <TableGroupRow showColumnsWhenGrouped={false} />
          ) : null}

          <Toolbar />
          {defaults.allowGrouping !== false ? <GroupingPanel showSortingControls /> : null}
          <TableSummaryRow />
            {showPaging ? <CustomPaging totalCount={totalCount} /> : null}
          </Grid>
          {virtualScrolling && infiniteScroll && isLoadingMore ? (
            <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
}
