// src/store/inventoryStore.js
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
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateItem: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.updateItem(id, data)
      await get().fetchItems()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true })
    try {
      await api.deleteItem(id)
      await get().fetchItems()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchTransactions: async (itemId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getTransactions(itemId)
      set({ transactions: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  recordTransaction: async (data) => {
    set({ isLoading: true })
    try {
      await api.recordTransaction(data)
      await get().fetchItems()
      await get().fetchTransactions()
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))

export default useInventoryStore
