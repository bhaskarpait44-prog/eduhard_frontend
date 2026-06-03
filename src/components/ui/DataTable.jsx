import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Button from './Button'
import { cn } from '@/utils/helpers'

/**
 * A generic, styled Data Table component.
 * 
 * @param {Array}  columns - Array of { header, accessor, render, className }
 * @param {Array}  data - The data array to display
 * @param {Boolean} loading - Loading state
 * @param {Object}  pagination - { currentPage, totalPages, onPageChange }
 * @param {String}  emptyMessage - Message to show when data is empty
 */
const DataTable = ({ 
  columns = [], 
  data = [], 
  loading = false, 
  pagination = null, 
  emptyMessage = "No data found." 
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-raised border-b border-border">
                {columns.map((col, i) => (
                  <th 
                    key={i} 
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-text-muted">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-sm font-medium tracking-wide">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted italic text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-surface-alt transition-colors group">
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx} 
                        className={cn("px-6 py-4", col.className)}
                      >
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
