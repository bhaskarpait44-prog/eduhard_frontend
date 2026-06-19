import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

const AgTable = ({
  columns = [],
  data = [],
  loading = false,
  height = 520,
  onRowClick,
  quickFilter = '',
  paginationPageSize = 20,
  rowSelection,
  onSelectionChanged,
  selectedRowIds,
  getRowId,
  gridOptions = {},
}) => {
  const gridRef = useRef(null)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    minWidth: 80,
    suppressMovable: false,
  }), [])

  const selectionConfig = useMemo(() => {
    if (rowSelection === false) return undefined
    if (rowSelection) return rowSelection

    return {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      selectAll: 'filtered',
      enableClickSelection: false,
    }
  }, [rowSelection])

  const handleRowClicked = useCallback((event) => {
    if (onRowClick) onRowClick(event.data)
  }, [onRowClick])

  const handleSelectionChanged = useCallback((event) => {
    if (onSelectionChanged) onSelectionChanged(event.api.getSelectedRows())
  }, [onSelectionChanged])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api || !selectedRowIds || !getRowId) return

    const selectedIds = new Set(selectedRowIds.map(String))
    api.forEachNode((node) => {
      const id = getRowId({ data: node.data })
      node.setSelected(selectedIds.has(String(id)))
    })
  }, [data, getRowId, selectedRowIds])

  return (
    <div
      className={`eduhard-ag-table ${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}
      style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        quickFilterText={quickFilter}
        loading={loading}
        onRowClicked={handleRowClicked}
        rowSelection={selectionConfig}
        onSelectionChanged={handleSelectionChanged}
        getRowId={getRowId}
        animateRows
        suppressCellFocus
        pagination
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={[20, 50, 100]}
        {...gridOptions}
      />
    </div>
  )
}

export default AgTable
