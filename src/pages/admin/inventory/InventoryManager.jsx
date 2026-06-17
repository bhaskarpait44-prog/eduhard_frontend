import { useEffect, useState, useMemo, useCallback } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useInventoryStore from '@/store/inventoryStore'
import * as inventoryApi from '@/api/inventoryApi'
import {
  generateItemCatalogPdf,
  generateStockInPdf,
  generateStockOutPdf,
  generateLowStockPdf,
} from '@/utils/inventoryPdf'
import {
  Package, Plus, Search, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Pencil, Trash2, History, FileDown,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatDate } from '@/utils/helpers'

const TABS = ['catalog', 'transactions', 'low-stock']
const TX_PAGE_SIZE = 50

export default function InventoryManager() {
  usePageTitle('Inventory Management')
  const { toastSuccess, toastError } = useToast()
  const {
    items, transactions, isLoading,
    fetchItems, createItem, updateItem, deleteItem,
    fetchTransactions, recordTransaction
  } = useInventoryStore()

  const [activeTab, setActiveTab]       = useState('catalog')
  const [searchQuery, setSearchQuery]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories]     = useState([])

  // Transactions filters
  const [txItemId, setTxItemId]     = useState('')
  const [txType, setTxType]         = useState('')
  const [txDateFrom, setTxDateFrom] = useState('')
  const [txDateTo, setTxDateTo]     = useState('')
  const [txPage, setTxPage]         = useState(1)
  const [txTotal, setTxTotal]       = useState(0)

  // Item modal
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [itemForm, setItemForm] = useState({
    name: '', category: '', unit: '', reorder_level: 0,
    description: '', location: '', unit_price: ''
  })

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Transaction modal
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [txForm, setTxForm] = useState({
    item_id: '', type: 'in', quantity: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '', vendor: ''
  })

  // PDF loading states
  const [pdfLoading, setPdfLoading] = useState({ catalog: false, stockIn: false, stockOut: false, lowStock: false })

  // ── Data Loading ───────────────────────────────────────

  const loadTransactions = useCallback(async () => {
    const params = { item_id: txItemId || undefined, type: txType || undefined,
      date_from: txDateFrom || undefined, date_to: txDateTo || undefined,
      page: txPage, limit: TX_PAGE_SIZE }
    const res = await inventoryApi.getTransactions(params)
    // Update store manually with paginated data
    useInventoryStore.setState({
      transactions: res.data?.transactions || res.data || [],
      isLoading: false
    })
    setTxTotal(res.data?.total || 0)
  }, [txItemId, txType, txDateFrom, txDateTo, txPage])

  useEffect(() => {
    fetchItems()
    inventoryApi.getCategories().then(r => setCategories(r.data || []))
  }, [fetchItems])

  useEffect(() => {
    if (activeTab === 'transactions') loadTransactions()
  }, [activeTab, loadTransactions])

  // ── Filtered Items ─────────────────────────────────────

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !searchQuery ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = !categoryFilter || i.category === categoryFilter
      return matchSearch && matchCat
    })
  }, [items, searchQuery, categoryFilter])

  const lowStockItems = useMemo(() =>
    items.filter(i =>
      parseFloat(i.reorder_level) > 0 &&
      parseFloat(i.quantity) <= parseFloat(i.reorder_level)
    ), [items])

  // ── Item CRUD ──────────────────────────────────────────

  const handleItemSubmit = async (e) => {
    e.preventDefault()
    if (!itemForm.name.trim()) return toastError('Item name is required.')
    if (!itemForm.category.trim()) return toastError('Category is required.')
    if (!itemForm.unit.trim()) return toastError('Unit is required.')
    try {
      if (editingId) {
        await updateItem(editingId, itemForm)
        toastSuccess('Item updated successfully.')
      } else {
        await createItem(itemForm)
        toastSuccess('Item added to catalog.')
      }
      setItemModalOpen(false)
      inventoryApi.getCategories().then(r => setCategories(r.data || []))
    } catch (err) { toastError(err.response?.data?.message || err.message || 'Operation failed.') }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteItem(deleteTarget.id)
      toastSuccess(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
    } catch (err) { toastError(err.response?.data?.message || 'Deletion failed.') }
  }

  // ── Transaction ────────────────────────────────────────

  const openTxModal = (type, preItemId) => {
    setTxForm({
      item_id: preItemId || txItemId || '',
      type,
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
      vendor: '',
    })
    setTxModalOpen(true)
  }

  const handleTxSubmit = async (e) => {
    e.preventDefault()
    if (!txForm.item_id) return toastError('Please select an item.')
    if (!txForm.quantity || parseFloat(txForm.quantity) <= 0) return toastError('Please enter a valid quantity greater than zero.')
    try {
      await recordTransaction(txForm)
      toastSuccess(`Stock ${txForm.type === 'in' ? 'in' : 'out'} recorded successfully.`)
      setTxModalOpen(false)
      if (activeTab === 'transactions') loadTransactions()
    } catch (err) { toastError(err.response?.data?.message || err.message || 'Transaction failed.') }
  }

  // ── PDF Downloads ──────────────────────────────────────

  const handleCatalogPdf = async () => {
    setPdfLoading(p => ({ ...p, catalog: true }))
    try {
      const res = await inventoryApi.getCatalogPdfData()
      generateItemCatalogPdf(res.data)
    } catch { toastError('Failed to generate catalog PDF.') }
    finally { setPdfLoading(p => ({ ...p, catalog: false })) }
  }

  const handleStockInPdf = async () => {
    setPdfLoading(p => ({ ...p, stockIn: true }))
    try {
      const res = await inventoryApi.getStockInPdfData({
        date_from: txDateFrom || undefined, date_to: txDateTo || undefined
      })
      generateStockInPdf(res.data)
    } catch { toastError('Failed to generate stock in PDF.') }
    finally { setPdfLoading(p => ({ ...p, stockIn: false })) }
  }

  const handleStockOutPdf = async () => {
    setPdfLoading(p => ({ ...p, stockOut: true }))
    try {
      const res = await inventoryApi.getStockOutPdfData({
        date_from: txDateFrom || undefined, date_to: txDateTo || undefined
      })
      generateStockOutPdf(res.data)
    } catch { toastError('Failed to generate stock out PDF.') }
    finally { setPdfLoading(p => ({ ...p, stockOut: false })) }
  }

  const handleLowStockPdf = async () => {
    setPdfLoading(p => ({ ...p, lowStock: true }))
    try {
      const res = await inventoryApi.getLowStockPdfData()
      generateLowStockPdf(res.data)
    } catch { toastError('Failed to generate low stock PDF.') }
    finally { setPdfLoading(p => ({ ...p, lowStock: false })) }
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Tab Bar + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl w-fit">
          {[
            { key: 'catalog',      label: 'Item Catalog' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'low-stock',    label: `Low Stock${lowStockItems.length > 0 ? ` (${lowStockItems.length})` : ''}` },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              } ${tab.key === 'low-stock' && lowStockItems.length > 0 ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'catalog' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" placeholder="Search items..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-48" />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button icon={FileDown} variant="secondary" size="sm" loading={pdfLoading.catalog} onClick={handleCatalogPdf}>
                Catalog PDF
              </Button>
              <Button icon={Plus} onClick={() => {
                setEditingId(null)
                setItemForm({ name: '', category: '', unit: '', reorder_level: 0, description: '', location: '', unit_price: '' })
                setItemModalOpen(true)
              }} className="rounded-2xl">
                Add Item
              </Button>
            </>
          )}
          {activeTab === 'transactions' && (
            <>
              <Button icon={FileDown} variant="secondary" size="sm" loading={pdfLoading.stockIn} onClick={handleStockInPdf}>
                Stock In PDF
              </Button>
              <Button icon={FileDown} variant="secondary" size="sm" loading={pdfLoading.stockOut} onClick={handleStockOutPdf}>
                Stock Out PDF
              </Button>
              <Button icon={ArrowDownRight} onClick={() => openTxModal('in')} size="sm">
                Stock In
              </Button>
              <Button icon={ArrowUpRight} variant="danger" onClick={() => openTxModal('out')} size="sm">
                Stock Out
              </Button>
            </>
          )}
          {activeTab === 'low-stock' && (
            <Button icon={FileDown} variant="danger" size="sm" loading={pdfLoading.lowStock} onClick={handleLowStockPdf}>
              Low Stock PDF
            </Button>
          )}
        </div>
      </div>

      {/* ── Catalog Tab ── */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.length > 0 ? filteredItems.map(item => {
            const isLowStock = parseFloat(item.reorder_level) > 0 &&
                               parseFloat(item.quantity) <= parseFloat(item.reorder_level)
            return (
              <div key={item.id} className={`bg-white dark:bg-gray-900 rounded-3xl border shadow-sm p-5 flex flex-col transition-all ${
                isLowStock ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500">
                    <Package size={18} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openTxModal('in', String(item.id))}
                      className="p-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors" title="Stock In">
                      <ArrowDownRight size={13} />
                    </button>
                    <button onClick={() => openTxModal('out', String(item.id))}
                      className="p-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors" title="Stock Out">
                      <ArrowUpRight size={13} />
                    </button>
                    <button onClick={() => {
                      setEditingId(item.id)
                      setItemForm({
                        name: item.name, category: item.category, unit: item.unit,
                        reorder_level: item.reorder_level,
                        description: item.description || '',
                        location: item.location || '',
                        unit_price: item.unit_price || ''
                      })
                      setItemModalOpen(true)
                    }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                {item.location && <p className="text-[10px] text-gray-400 mt-0.5">📍 {item.location}</p>}

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Stock</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-black ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {parseFloat(item.quantity)}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{item.unit}</span>
                    </div>
                  </div>
                  {isLowStock && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
                      <AlertTriangle size={10} /> LOW (Min {parseFloat(item.reorder_level)})
                    </div>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full py-16">
              <EmptyState title="No items found" description="Try a different search or add items to the catalog." />
            </div>
          )}
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
              <Filter size={14} /> Filters
            </div>
            <select value={txItemId} onChange={e => { setTxItemId(e.target.value); setTxPage(1) }}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm">
              <option value="">All Items</option>
              {items.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
            </select>
            <select value={txType} onChange={e => { setTxType(e.target.value); setTxPage(1) }}
              className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm">
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
            <div className="flex items-center gap-2">
              <input type="date" value={txDateFrom} onChange={e => { setTxDateFrom(e.target.value); setTxPage(1) }}
                className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={txDateTo} onChange={e => { setTxDateTo(e.target.value); setTxPage(1) }}
                className="py-1.5 px-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm" />
            </div>
            {(txItemId || txType || txDateFrom || txDateTo) && (
              <button onClick={() => { setTxItemId(''); setTxType(''); setTxDateFrom(''); setTxDateTo(''); setTxPage(1) }}
                className="text-xs text-indigo-600 font-bold hover:underline">
                Clear filters
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr>
                    {['Date', 'Item', 'Category', 'Type', 'Quantity', 'Vendor / Remarks', 'By'].map(h => (
                      <th key={h} className="px-5 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {transactions.length > 0 ? transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(t.date, 'short')}</td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white">{t.item_name}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">{t.category}</td>
                      <td className="px-5 py-3">
                        <Badge variant={t.type === 'in' ? 'green' : 'red'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md gap-1">
                          {t.type === 'in' ? <ArrowDownRight size={9}/> : <ArrowUpRight size={9}/>} {t.type}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 text-sm font-black text-right ${t.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'in' ? '+' : '-'}{parseFloat(t.quantity)} {t.unit}
                      </td>
                      <td className="px-5 py-3">
                        {t.vendor && <p className="text-xs font-semibold text-indigo-600">{t.vendor}</p>}
                        <p className="text-sm text-gray-700 dark:text-gray-300">{t.remarks || '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-bold">{t.performed_by_name || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-16">
                        <EmptyState title="No transactions found" description="Try adjusting the filters above." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {txTotal > TX_PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                <span className="text-gray-500 text-xs">
                  Showing {((txPage-1)*TX_PAGE_SIZE)+1}–{Math.min(txPage*TX_PAGE_SIZE, txTotal)} of {txTotal}
                </span>
                <div className="flex gap-2">
                  <button disabled={txPage === 1}
                    onClick={() => setTxPage(p => p - 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  <button disabled={txPage * TX_PAGE_SIZE >= txTotal}
                    onClick={() => setTxPage(p => p + 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Low Stock Tab ── */}
      {activeTab === 'low-stock' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden">
          {lowStockItems.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title="No low stock items"
                description="All items are currently above their reorder levels."
              />
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Low Stock Alert — {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm text-gray-500">These items are at or below their minimum reorder level</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-red-50/50 dark:bg-red-500/5">
                    <tr>
                      {['Item Name', 'Category', 'Unit', 'Current Stock', 'Reorder Level', 'Shortfall', 'Action'].map(h => (
                        <th key={h} className="px-5 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50 dark:divide-red-900/20">
                    {lowStockItems.map(item => (
                      <tr key={item.id} className="hover:bg-red-50/30">
                        <td className="px-5 py-3 font-bold text-sm text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-semibold">{item.category}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{item.unit}</td>
                        <td className="px-5 py-3 text-sm font-black text-red-600">{parseFloat(item.quantity)}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{parseFloat(item.reorder_level)}</td>
                        <td className="px-5 py-3 text-sm font-bold text-red-700">
                          {(parseFloat(item.reorder_level) - parseFloat(item.quantity)).toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <Button size="xs" icon={ArrowDownRight} onClick={() => {
                            setActiveTab('transactions')
                            setTimeout(() => openTxModal('in', String(item.id)), 100)
                          }}>
                            Stock In
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Item Modal ── */}
      <Modal open={itemModalOpen} onClose={() => !isLoading && setItemModalOpen(false)}
        title={editingId ? 'Edit Item' : 'Add Item to Catalog'} size="md">
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item Name" required value={itemForm.name}
              onChange={e => setItemForm(f => ({...f, name: e.target.value}))}
              placeholder="e.g. A4 Paper Rim" className="col-span-2" />
            <Input label="Category" required value={itemForm.category}
              onChange={e => setItemForm(f => ({...f, category: e.target.value}))}
              placeholder="e.g. Stationery, Lab, Sports" />
            <Input label="Unit" required value={itemForm.unit}
              onChange={e => setItemForm(f => ({...f, unit: e.target.value}))}
              placeholder="e.g. Pcs, Box, Rim, Kg" />
            <Input label="Reorder Level (Min Stock)" type="number" step="0.01" min="0"
              value={itemForm.reorder_level}
              onChange={e => setItemForm(f => ({...f, reorder_level: e.target.value}))}
              hint="Alert triggers when stock falls to or below this number" />
            <Input label="Unit Price (₹) (Optional)" type="number" step="0.01" min="0"
              value={itemForm.unit_price}
              onChange={e => setItemForm(f => ({...f, unit_price: e.target.value}))}
              placeholder="0.00" />
          </div>
          <Input label="Storage Location (Optional)" value={itemForm.location}
            onChange={e => setItemForm(f => ({...f, location: e.target.value}))}
            placeholder="e.g. Room 3 Shelf B, Science Lab Cabinet" />
          <Input label="Description (Optional)" value={itemForm.description}
            onChange={e => setItemForm(f => ({...f, description: e.target.value}))}
            placeholder="Brief description of the item" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setItemModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isLoading}>Save Item</Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Item" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
            This action cannot be undone.
          </p>
          <p className="text-xs text-gray-500 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
            ⚠️ If this item has any transaction history, deletion will be blocked to protect audit records.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={isLoading} onClick={handleDeleteConfirm}>Delete Item</Button>
          </div>
        </div>
      </Modal>

      {/* ── Transaction Modal ── */}
      <Modal open={txModalOpen} onClose={() => !isLoading && setTxModalOpen(false)}
        title="Record Stock Movement" size="sm">
        <form onSubmit={handleTxSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <button type="button"
              onClick={() => setTxForm(f => ({...f, type: 'in'}))}
              className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                txForm.type === 'in'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
              }`}>
              <ArrowDownRight size={15} /> Stock In
            </button>
            <button type="button"
              onClick={() => setTxForm(f => ({...f, type: 'out'}))}
              className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                txForm.type === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
              }`}>
              <ArrowUpRight size={15} /> Stock Out
            </button>
          </div>

          <Select label="Item" required value={txForm.item_id}
            onChange={e => setTxForm(f => ({...f, item_id: e.target.value}))}
            options={[{value:'',label:'Select an item...'}, ...items.map(i => ({
              value: String(i.id),
              label: `${i.name} (${parseFloat(i.quantity)} ${i.unit} in stock)`
            }))]} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" required type="number" step="0.01" min="0.01"
              value={txForm.quantity}
              onChange={e => setTxForm(f => ({...f, quantity: e.target.value}))} />
            <Input label="Date" required type="date"
              value={txForm.date}
              onChange={e => setTxForm(f => ({...f, date: e.target.value}))} />
          </div>

          {txForm.type === 'in' && (
            <Input label="Vendor / Supplier (Optional)"
              placeholder="Where was this purchased from?"
              value={txForm.vendor}
              onChange={e => setTxForm(f => ({...f, vendor: e.target.value}))} />
          )}

          <Input label={txForm.type === 'out' ? 'Issued To / Remarks (Optional)' : 'Remarks / PO Number (Optional)'}
            placeholder={txForm.type === 'out' ? 'e.g. Class 10 Exams, Staff Room' : 'e.g. Monthly stock, PO#123'}
            value={txForm.remarks}
            onChange={e => setTxForm(f => ({...f, remarks: e.target.value}))} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTxModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isLoading}
              className={txForm.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
              Confirm {txForm.type === 'in' ? 'Stock In' : 'Stock Out'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
