import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { GridApi, GridReadyEvent, ColDef, FilterChangedEvent } from 'ag-grid-community';
import type { DataTableProps, ColumnConfig, ActionCellContext } from './types';
import { useTpsDataTableState } from './hooks/useTpsDataTableState';
import { useTpsResponsiveColumns, useTpsIsMobile } from './hooks/useTpsResponsiveColumns';
import { useTpsColumnVisibility } from './hooks/useTpsColumnVisibility';
import { TpsDataTableToolbar } from './TpsDataTableToolbar';
import { TpsFilterToolbar, buildFilterInitialValues } from './filters/TpsFilterToolbar';
import { TpsDataTableFilterDrawer } from './TpsDataTableFilterDrawer';
import { TpsDataTableSkeleton } from './TpsDataTableSkeleton';
import { TpsEmptyState } from './TpsEmptyState';
import { TpsDataTableCardList } from './TpsDataTableCardList';
import { TpsDataTablePagination } from './TpsDataTablePagination';
import { tpsExportCsv } from './TpsDataTableExport';
import TpsTooltipCellRenderer from './cells/TpsTooltipCellRenderer';
import TpsCopyCellRenderer from './cells/TpsCopyCellRenderer';
import TpsActionsCellRenderer from './cells/TpsActionsCellRenderer';
import TpsGridTooltip from './cells/TpsGridTooltip';
import TpsDropdownFloatingFilter from './cells/TpsDropdownFloatingFilter';
import styles from './TpsDataTable.module.css';

/**
 * DataTable<T> — configurable, typed AG Grid wrapper.
 * Replaces Angular's TpsTableComponent across all 64+ usages.
 *
 * Features:
 * - AG Grid virtualization ON (not suppressed like Angular)
 * - AG Grid built-in paginator (styled via CSS tokens to match Lara theme)
 * - Global search (debounced via useDeferredValue)
 * - Column header filters (agTextColumnFilter / agNumberColumnFilter / agDateColumnFilter / agSetColumnFilter)
 * - Advanced filter drawer (PrimeReact Sidebar + DynamicForm from Step 8)
 * - Active filter chips row (unified view of all active filters)
 * - Column visibility toggle with localStorage persistence
 * - CSV export (AG Grid built-in) + Excel export (xlsx dynamic import)
 * - Mobile card list below md breakpoint
 * - Row actions: up to 3 visible icon buttons + overflow menu
 */
export function TpsDataTable<T extends object>({
  rowIdField = 'id' as keyof T,
  data,
  loading = false,
  columns,
  actions = [],
  onAction = () => {},
  header,
  headerSubtitle,
  headerIcon,
  headerDescription,
  showTableHeader = true,
  showBackIcon = false,
  onBack,
  headerTooltip,
  showRowCount = true,
  enableColumnFilters = false,
  enableFloatingFilters = false,
  showHeaderFilterIconAlways = false,
  showSearch = true,
  showExport = true,
  exportFilename,
  showColumnToggle = false,
  showRefresh = true,
  onRefresh,
  headerActions = [],
  toolbarActions = [],
  filters = [],
  filterSlots = [],
  onFilterChange,
  filterLayout = 'single-row',
  filterTableData,
  filterStagedSlots,
  filterInstantSlots,
  filterShowApplyButton,
  filterApplyButtonLabel = 'Apply Filters',
  onFilterApply,
  filterHasUnappliedChanges,
  pageSizes = [10, 20, 50, 100],
  defaultPageSize = 20,
  selectable = false,
  selectionMode = 'single',
  onSelectionChange,
  tableKey,
  height,
  emptyMessage,
  error,
  onAdd,
  entityName = 'Item',
  entityNamePlural,
  emptyDescription,
}: DataTableProps<T>) {
  const gridApiRef = useRef<GridApi | null>(null);
  const isMobile = useTpsIsMobile();

  // Derive entity name from header when not explicitly provided
  const resolvedEntityName = entityName !== 'Item' ? entityName : (header ?? entityName);
  const resolvedEntityNamePlural = entityNamePlural ?? resolvedEntityName;

  // Floating filter toggle state — mirrors Angular showFloatingFilters + toggleFloatingFilters()
  const [showFloatingFilters, setShowFloatingFilters] = useState(enableFloatingFilters);

  // Reactive displayed row count — updated from AG Grid events, not computed from ref during render
  const [filteredRows, setFilteredRows] = useState(data.length);

  // ── Row 2 filter toolbar state ────────────────────────────────────────────
  const hasFilterSlots =
    filterSlots.length > 0 ||
    (filterLayout === 'split' && (filterStagedSlots?.length ?? 0) > 0) ||
    (filterInstantSlots?.length ?? 0) > 0;

  // For split layout, combine staged and instant slots for initial values
  const allSlots = useMemo(() => {
    if (filterLayout === 'split') {
      return [...(filterStagedSlots ?? []), ...(filterInstantSlots ?? [])];
    }
    return filterSlots;
  }, [filterLayout, filterSlots, filterStagedSlots, filterInstantSlots]);

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(() => buildFilterInitialValues(allSlots));
  const filterValuesRef = useRef<Record<string, unknown>>(filterValues);

  const handleFilterChange = useCallback(
    (next: Record<string, unknown>) => {
      filterValuesRef.current = next;
      setFilterValues(next);
      onFilterChange?.(next);
    },
    [onFilterChange]
  );

  const handleFilterClearAll = useCallback(() => {
    const empty = buildFilterInitialValues(allSlots);
    setFilterValues(empty);
    onFilterChange?.(empty);
  }, [allSlots, onFilterChange]);

  const state = useTpsDataTableState();
  const responsiveColumns = useTpsResponsiveColumns(columns);
  const { hiddenFields, toggleField, showAll, isVisible } = useTpsColumnVisibility(columns, tableKey);

  // Sync deferred search text to AG Grid quick filter + update row count
  useEffect(() => {
    if (!gridApiRef.current) return;
    gridApiRef.current.setGridOption('quickFilterText', state.deferredSearchText);
    // Row count updates via onFilterChanged, but sync immediately for instant empty state
    setTimeout(() => {
      if (gridApiRef.current) setFilteredRows(gridApiRef.current.getDisplayedRowCount());
    }, 0);
  }, [state.deferredSearchText]);

  // Keep filteredRows in sync when data itself changes (refresh / reload)
  useEffect(() => {
    if (!gridApiRef.current) {
      setFilteredRows(data.length);
      return;
    }
    setFilteredRows(gridApiRef.current.getDisplayedRowCount());
  }, [data]);

  // Force-refresh actions column when data changes — AG Grid doesn't re-render
  // cell renderers automatically since __actions__ has no real field binding.
  useEffect(() => {
    if (!gridApiRef.current || actions.length === 0) return;
    gridApiRef.current.refreshCells({ columns: ['__actions__'], force: true });
  }, [data, actions]);

  // ── AG Grid context (stable reference via useMemo) ───────────────────────
  const gridContext = useMemo<ActionCellContext<T>>(
    () => ({
      actions,
      onAction,
    }),

    [actions, onAction]
  );

  // ── Build AG Grid ColDef[] from ColumnConfig<T>[] ───────────────────────
  // Mirrors Angular setColumnsDefs() — enableColumnFilters adds agTextColumnFilter to
  // columns without an explicit filterVariant; showFloatingFilters controls floatingFilter.
  const agColumnDefs = useMemo<ColDef[]>(() => {
    const visibleCols = responsiveColumns.filter((col) => !col.hide && isVisible(String(col.field)));

    const dataCols: ColDef[] = [];

    // Prepend checkbox selection column when selectable — mirrors Angular checkboxSelection: true
    if (selectable) {
      dataCols.push({
        headerName: '',
        field: '__selection__',
        width: 48,
        minWidth: 48,
        maxWidth: 48,
        sortable: false,
        filter: false,
        resizable: false,
        suppressSizeToFit: true,
        pinned: 'left' as const,
        checkboxSelection: true,
        headerCheckboxSelection: selectionMode === 'multiple',
        headerCheckboxSelectionFilteredOnly: true,
      });
    }

    visibleCols.forEach((col) => {
      const isDropdownFilter = col.filterVariant === 'dropdown';

      // Determine filter: explicit variant wins; fallback to text if enableColumnFilters
      // 'dropdown' uses agTextColumnFilter as the parent filter — the Dropdown floating filter
      // sets model on it (same pattern as Angular CustomHeaderFilterDropdownComponent).
      const filterType = col.filterVariant
        ? filterVariantToAgFilter(col.filterVariant)
        : enableColumnFilters && col.header !== 'Actions'
          ? 'agTextColumnFilter'
          : false;

      const colDef: ColDef = {
        field: String(col.field),
        headerName: col.header,
        headerTooltip: col.header,
        sortable: col.sortable !== false,
        resizable: true,
        minWidth: col.minWidth ?? 100,
        flex: col.width ? undefined : 1,
        width: col.width,
        pinned: col.frozen ?? undefined,
        cellStyle: col.align ? { textAlign: col.align, justifyContent: col.align } : undefined,

        // Tooltip — custom dark bubble (TpsGridTooltip), rendered in AG Grid
        // overlay so it's never clipped. Returns the full display value.
        tooltipValueGetter: (p: { valueFormatted?: string; value?: unknown }) => {
          const raw = p.valueFormatted ?? p.value;
          return raw == null || raw === '' ? undefined : String(raw);
        },
        tooltipComponent: 'tpsGridTooltip',

        // Filter configuration — mirrors Angular setColumnsDefs() logic
        filter: filterType,
        // floatingFilter only when filter is enabled and floating filters are toggled on
        floatingFilter: !!filterType && showFloatingFilters,

        // Dropdown floating filter — mirrors Angular CustomHeaderFilterDropdownComponent
        ...(isDropdownFilter && {
          floatingFilterComponent: TpsDropdownFloatingFilter,
          floatingFilterComponentParams: { options: col.filterOptions ?? [] },
        }),

        // Cell renderer
        cellRenderer: col.copyable
          ? TpsCopyCellRenderer
          : col.render
            ? (params: { value: unknown; data: T }) => col.render!(params.value, params.data)
            : TpsTooltipCellRenderer,
        cellRendererParams: col.copyable
          ? {
              getCopyValue:
                typeof col.copyable === 'function'
                  ? (row: T, value: unknown) => (col.copyable as (_r: T, _v: unknown) => string)(row, value)
                  : undefined,
            }
          : undefined,

        // Value formatter — used for display + export + global search
        valueFormatter: col.valueFormatter
          ? (params: { value: unknown; data: T }) => col.valueFormatter!(params.value, params.data)
          : undefined,

        // Global search uses formatted value, not raw
        getQuickFilterText: col.valueFormatter
          ? (params: { value: unknown; data: T }) => col.valueFormatter!(params.value, params.data)
          : undefined,
      };

      dataCols.push(colDef);
    });

    // Append actions column if any actions are defined
    if (actions.length > 0) {
      dataCols.push({
        headerName: 'Actions',
        field: '__actions__',
        sortable: false,
        filter: false,
        resizable: false,
        width: (Math.min(actions.length, 2) + (actions.length > 2 ? 1 : 0)) * 42 + 16,
        minWidth: 80,
        pinned: 'right',
        cellRenderer: TpsActionsCellRenderer,
        suppressSizeToFit: true,
      });
    }

    return dataCols;
  }, [responsiveColumns, isVisible, actions, enableColumnFilters, showFloatingFilters, selectable, selectionMode]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      cellRenderer: TpsTooltipCellRenderer,
    }),
    []
  );

  // ── Row ID ───────────────────────────────────────────────────────────────
  const getRowId = useCallback((params: { data: T }) => String(params.data[rowIdField]), [rowIdField]);

  // ── Grid ready ───────────────────────────────────────────────────────────
  const onGridReady = useCallback((e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    setFilteredRows(e.api.getDisplayedRowCount());

    // Pre-warm AG Grid's quick filter cache so the first keystroke isn't laggy.
    // With cacheQuickFilter enabled, AG Grid builds a lowercase concatenated string
    // per row on the first filter call — for 20k+ rows this causes a noticeable freeze.
    // Triggering it here (off the critical path) front-loads that cost.
    requestIdleCallback(() => {
      e.api.setGridOption('quickFilterText', ' ');
      e.api.setGridOption('quickFilterText', '');
    });
  }, []);

  // ── Filter changed → sync column filter state to chips + update row count ──
  const onFilterChanged = useCallback(
    (e: FilterChangedEvent) => {
      const model = e.api.getFilterModel();
      state.setActiveColumnFilters(model ?? {});
      setFilteredRows(e.api.getDisplayedRowCount());
    },
    [state]
  );

  // ── Selection changed ────────────────────────────────────────────────────
  const onSelectionChanged = useCallback(() => {
    if (!onSelectionChange || !gridApiRef.current) return;
    onSelectionChange(gridApiRef.current.getSelectedRows() as T[]);
  }, [onSelectionChange]);

  // ── Drawer apply ─────────────────────────────────────────────────────────
  const handleApplyDrawerFilters = useCallback(
    (values: Record<string, unknown>) => {
      state.setDrawerFilters(values);
      // Drawer filters are applied client-side via AG Grid external filter
      gridApiRef.current?.onFilterChanged();
    },
    [state]
  );

  // ── Export CSV ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    tpsExportCsv(gridApiRef, columns, exportFilename, data);
  }, [columns, exportFilename, data]);

  // ── Floating filter toggle — mirrors Angular toggleFloatingFilters() ────
  const handleToggleFloatingFilters = useCallback(() => {
    setShowFloatingFilters((prev) => !prev);
  }, []);

  // ── Refresh — mirrors Angular onViewRefresh(): clears floating filters then emits ──
  const handleRefresh = useCallback(() => {
    if (showFloatingFilters && gridApiRef.current) {
      gridApiRef.current.setFilterModel(null);
      state.setActiveColumnFilters({});
    }
    onRefresh?.();
  }, [showFloatingFilters, onRefresh, state]);

  // ── Active drawer filter count — mirrors Angular showActiveFiltersCount ──
  const activeFiltersCount = Object.values(state.drawerFilters).filter((v) => v != null && v !== '').length;

  return (
    <div className={styles.root} style={height ? { height } : undefined}>
      {/* Toolbar */}
      <TpsDataTableToolbar
        header={header}
        headerSubtitle={headerSubtitle}
        headerIcon={headerIcon}
        headerDescription={headerDescription}
        totalRows={data.length}
        filteredRows={filteredRows}
        showRowCount={showRowCount}
        showTableHeader={showTableHeader}
        showBackIcon={showBackIcon}
        onBack={onBack}
        headerTooltip={headerTooltip}
        headerActions={headerActions}
        tableKey={tableKey}
        showSearch={data.length > 0 && showSearch}
        searchText={state.searchText}
        onSearchChange={state.setSearchText}
        toolbarActions={toolbarActions}
        enableColumnFilters={enableColumnFilters}
        showFloatingFilters={showFloatingFilters}
        onToggleFloatingFilters={handleToggleFloatingFilters}
        hasFilters={filters.length > 0}
        hasActiveFilters={Object.keys(state.drawerFilters).length > 0}
        activeFiltersCount={activeFiltersCount}
        onOpenFilterDrawer={state.openFilterDrawer}
        showExport={showExport}
        onExport={handleExport}
        showColumnToggle={data.length > 0 && showColumnToggle}
        columns={columns}
        hiddenFields={hiddenFields}
        onToggleColumn={toggleField}
        onShowAllColumns={showAll}
        showRefresh={showRefresh}
        onRefresh={handleRefresh}
        deferUtilityToRow2={false}
      />

      {/* Row 2: Slot-based filter toolbar — only when filterSlots are configured */}
      {hasFilterSlots && (
        <TpsFilterToolbar
          slots={filterSlots}
          values={filterValues}
          onChange={handleFilterChange}
          onClearAll={
            filterSlots.every((s) => s.type === 'dateRange' && (s as { inline?: boolean }).inline)
              ? undefined
              : handleFilterClearAll
          }
          layout={filterLayout}
          tableData={filterTableData ?? data}
          stagedSlots={filterStagedSlots}
          instantSlots={filterInstantSlots}
          showApplyButton={filterShowApplyButton}
          applyButtonLabel={filterApplyButtonLabel}
          onApply={onFilterApply ? () => onFilterApply(filterValuesRef.current) : undefined}
          hasUnappliedChanges={filterHasUnappliedChanges}
          hasFilters={filters.length > 0}
          hasActiveFilters={Object.keys(state.drawerFilters).length > 0}
          activeFiltersCount={activeFiltersCount}
          onOpenFilterDrawer={state.openFilterDrawer}
        />
      )}

      {/* Loading skeleton — only for table body, toolbar stays visible */}
      {loading ? (
        <TpsDataTableSkeleton rows={10} columns={columns.length} />
      ) : isMobile ? (
        <TpsDataTableCardList
          data={data}
          columns={columns}
          actions={actions}
          onAction={onAction}
          emptyMessage={emptyMessage}
          searchText={state.deferredSearchText}
          defaultPageSize={defaultPageSize}
          pageSizes={pageSizes}
        />
      ) : (
        <div
          className={[styles.tableFrame, data.length === 0 || filteredRows === 0 ? styles.tableFrameEmpty : ''].join(
            ' '
          )}
        >
          <div
            className={[
              'ag-theme-alpine ag-theme-isentinel',
              styles.grid,
              showHeaderFilterIconAlways ? 'tps-table-show-filter-always' : 'tps-table-show-filter-on-hover',
            ].join(' ')}
          >
            {/* Empty state — true empty OR filtered/searched to zero */}
            {(data.length === 0 || filteredRows === 0) && (
              <div className={styles.emptyState}>
                <TpsEmptyState
                  isError={!!error}
                  errorMessage={error?.message}
                  isSearching={!!state.deferredSearchText}
                  isFiltered={data.length > 0 && Object.keys(state.activeColumnFilters).length > 0}
                  searchText={state.deferredSearchText}
                  onClear={() => {
                    state.setSearchText('');
                    gridApiRef.current?.setFilterModel(null);
                    state.setActiveColumnFilters({});
                  }}
                  onRetry={onRefresh}
                  onAdd={data.length === 0 ? onAdd : undefined}
                  entityName={resolvedEntityName}
                  entityNamePlural={resolvedEntityNamePlural}
                  description={emptyDescription ?? (hasFilterSlots ? undefined : emptyMessage)}
                  onRefresh={data.length === 0 ? onRefresh : undefined}
                  emptyStateActions={data.length === 0 ? headerActions : undefined}
                  hasFilters={hasFilterSlots}
                />
              </div>
            )}

            {/* AG Grid — always mounted when data exists so filter events keep firing */}
            {data.length > 0 && (
              <div style={{ display: filteredRows === 0 ? 'none' : 'contents' }}>
                <AgGridReact
                  rowData={data}
                  columnDefs={agColumnDefs}
                  defaultColDef={defaultColDef}
                  context={gridContext}
                  getRowId={getRowId}
                  onGridReady={onGridReady}
                  onFilterChanged={onFilterChanged}
                  onSelectionChanged={onSelectionChanged}
                  pagination
                  suppressPaginationPanel
                  paginationPageSize={defaultPageSize}
                  paginationPageSizeSelector={pageSizes}
                  rowHeight={42}
                  headerHeight={44}
                  rowBuffer={10}
                  animateRows={false}
                  domLayout="normal"
                  cacheQuickFilter
                  suppressCellFocus
                  tooltipShowDelay={0}
                  tooltipHideDelay={60000}
                  components={{ tpsGridTooltip: TpsGridTooltip }}
                  rowSelection={selectable ? selectionMode : undefined}
                  suppressRowClickSelection
                  sortingOrder={['desc', 'asc', null]}
                />
              </div>
            )}
          </div>
          {data.length > 0 && filteredRows > 0 && (
            <TpsDataTablePagination
              api={gridApiRef.current}
              entityName={entityName}
              entityNamePlural={entityNamePlural}
            />
          )}
        </div>
      )}

      {/* Advanced filter drawer */}
      {filters.length > 0 && (
        <TpsDataTableFilterDrawer
          open={state.filterDrawerOpen}
          onClose={state.closeFilterDrawer}
          filters={filters}
          values={state.drawerFilters}
          onApply={handleApplyDrawerFilters}
          onReset={state.clearDrawerFilters}
        />
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function filterVariantToAgFilter(variant: ColumnConfig['filterVariant']): string {
  switch (variant) {
    case 'number':
      return 'agNumberColumnFilter';
    case 'date':
      return 'agDateColumnFilter';
    case 'set':
      return 'agSetColumnFilter';
    case 'dropdown':
      return 'agTextColumnFilter'; // parent filter for TpsDropdownFloatingFilter
    default:
      return 'agTextColumnFilter';
  }
}
