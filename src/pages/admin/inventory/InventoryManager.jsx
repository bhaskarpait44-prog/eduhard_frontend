import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useInventoryStore from '@/store/inventoryStore'
import { 
  Package, 
  Plus, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Pencil,
  Trash2,
  History
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatDate } from '@/utils/helpers'

export default function InventoryManager() {
  usePageTitle('Inventory Management')
  const { toastSuccess, toastError } = useToast()
  const { items, transactions, isLoading, fetchItems, createItem, updateItem, deleteItem, fetchTransactions, recordTransaction } = useInventoryStore()

  const [activeTab, setActiveTab] = useState('catalog') // 'catalog' | 'transactions'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [itemForm, setItemForm] = useState({ name: '', category: '', unit: '', reorder_level: 0 })

  const [txModalOpen, setTxModalOpen] = useState(false)
  const [txForm, setTxForm] = useState({ item_id: '', type: 'in', quantity: '', date: new Date().toISOString().split('T')[0], remarks: '' })

  useEffect(() => {
    if (activeTab === 'catalog') fetchItems()
    if (activeTab === 'transactions') {
      fetchItems()
      fetchTransactions(selectedItemId)
    }
  }, [activeTab, selectedItemId, fetchItems, fetchTransactions])

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter(i => 
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const handleItemSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateItem(editingId, itemForm)
        toastSuccess('Item updated')
      } else {
        await createItem(itemForm)
        toastSuccess('Item created')
      }
      setItemModalOpen(false)
    } catch (err) { toastError(err.message || 'Operation failed') }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item? This action is permanent.')) return
    try {
      await deleteItem(id)
      toastSuccess('Item deleted')
    } catch (err) { toastError('Deletion failed') }
  }

  const handleTxSubmit = async (e) => {
    e.preventDefault()
    try {
      await recordTransaction(txForm)
      toastSuccess('Transaction recorded')
      setTxModalOpen(false)
      setTxForm({ item_id: '', type: 'in', quantity: '', date: new Date().toISOString().split('T')[0], remarks: '' })
    } catch (err) { toastError(err.message || 'Transaction failed') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('catalog')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
            Item Catalog
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
            Transactions
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'catalog' ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64" />
              </div>
              <Button icon={Plus} onClick={() => { setEditingId(null); setItemForm({ name: '', category: '', unit: '', reorder_level: 0 }); setItemModalOpen(true) }} className="rounded-2xl">
                Add Item
              </Button>
            </>
          ) : (
            <>
              <Select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} options={[{value:'',label:'All Items'}, ...items.map(i => ({value:String(i.id),label:i.name}))]} />
              <Button icon={ArrowUpRight} onClick={() => { setTxForm(prev => ({...prev, type:'out', item_id: selectedItemId})); setTxModalOpen(true) }} variant="danger" className="rounded-2xl">Stock Out</Button>
              <Button icon={ArrowDownRight} onClick={() => { setTxForm(prev => ({...prev, type:'in', item_id: selectedItemId})); setTxModalOpen(true) }} className="rounded-2xl">Stock In</Button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.length > 0 ? filteredItems.map(item => {
            const isLowStock = parseFloat(item.quantity) <= parseFloat(item.reorder_level)
            return (
              <div key={item.id} className={`bg-white dark:bg-gray-900 rounded-3xl border shadow-sm p-6 flex flex-col transition-all ${isLowStock ? 'border-red-200 dark:border-red-900/50 hover:border-red-300' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <Package size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(item.id); setItemForm({ name: item.name, category: item.category, unit: item.unit, reorder_level: item.reorder_level }); setItemModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={14}/></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1" title={item.name}>{item.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{item.category}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Stock</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-black ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{parseFloat(item.quantity)}</span>
                      <span className="text-xs font-bold text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                  {isLowStock && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
                      <AlertTriangle size={12} /> Low Stock (Min: {parseFloat(item.reorder_level)})
                    </div>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full py-12"><EmptyState title="No items found" description="Add items to your inventory catalog." /></div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl"><History className="text-blue-600 dark:text-blue-400" size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
              <p className="text-sm text-gray-500">Track stock in and out movements</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Item</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Quantity</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Remarks & User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {transactions.length > 0 ? transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatDate(t.date, 'short')}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{t.item_name}</td>
                    <td className="px-6 py-4">
                      <Badge variant={t.type === 'in' ? 'green' : 'red'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md gap-1">
                        {t.type === 'in' ? <ArrowDownRight size={10}/> : <ArrowUpRight size={10}/>} {t.type}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-black ${t.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'in' ? '+' : '-'}{parseFloat(t.quantity)} {t.unit}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">{t.remarks || '—'}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">By {t.performed_by_name}</p>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="py-12"><EmptyState title="No transactions" description="No stock movements recorded yet." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      <Modal open={itemModalOpen} onClose={() => !isLoading && setItemModalOpen(false)} title={editingId ? 'Edit Item' : 'Add Item'} size="sm">
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <Input label="Item Name" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required placeholder="e.g. A4 Paper Rim" />
          <Input label="Category" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} required placeholder="e.g. Stationery" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit" value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} required placeholder="e.g. Boxes, Pcs" />
            <Input label="Reorder Level" type="number" step="0.01" min="0" value={itemForm.reorder_level} onChange={e => setItemForm({...itemForm, reorder_level: e.target.value})} required />
          </div>
          <div className="flex justify-end pt-4"><Button type="button" variant="secondary" onClick={() => setItemModalOpen(false)} className="mr-2">Cancel</Button><Button type="submit" loading={isLoading}>Save Item</Button></div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={txModalOpen} onClose={() => !isLoading && setTxModalOpen(false)} title={txForm.type === 'in' ? 'Record Stock In' : 'Record Stock Out'} size="sm">
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <Select label="Item" value={txForm.item_id} onChange={e => setTxForm({...txForm, item_id: e.target.value})} options={items.map(i => ({value:String(i.id),label:i.name}))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" step="0.01" min="0.01" value={txForm.quantity} onChange={e => setTxForm({...txForm, quantity: e.target.value})} required />
            <Input label="Date" type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} required />
          </div>
          <Input label="Remarks" value={txForm.remarks} onChange={e => setTxForm({...txForm, remarks: e.target.value})} placeholder="Reason or reference number..." />
          <div className="flex justify-end pt-4"><Button type="button" variant="secondary" onClick={() => setTxModalOpen(false)} className="mr-2">Cancel</Button><Button type="submit" loading={isLoading} variant={txForm.type==='in'?'primary':'danger'}>Confirm {txForm.type === 'in' ? 'Stock In' : 'Stock Out'}</Button></div>
        </form>
      </Modal>
    </div>
  )
}
