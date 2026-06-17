import { create } from 'zustand'
import * as api from '@/api/inventoryApi'

const useInventoryStore = create((set, get) => ({
  items: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getItems()
      set({ items: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  createItem: async (data) => {
    set({ isLoading: true })
    try {
      await api.createItem(data)
      await get().fetchItems()
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  updateItem: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.updateItem(id, data)
      await get().fetchItems()
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteItem(id)
      await get().fetchItems()
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  fetchTransactions: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getTransactions(params)
      const data = res.data
      // Handle both paginated { transactions, total } and flat array
      const txList = Array.isArray(data) ? data : (data.transactions || [])
      set({ transactions: txList, isLoading: false })
      return data  // return for pagination info
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  recordTransaction: async (data) => {
    set({ isLoading: true })
    try {
      await api.recordTransaction(data)
      await get().fetchItems()
      set({ isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },
}))

export default useInventoryStore
