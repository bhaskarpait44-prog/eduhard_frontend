// src/api/inventoryApi.js
import api from './axios'

export const getItems = () => api.get('/inventory/items')
export const createItem = (data) => api.post('/inventory/items', data)
export const updateItem = (id, data) => api.patch(`/inventory/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/inventory/items/${id}`)

export const getTransactions = (itemId) => api.get('/inventory/transactions', { params: { item_id: itemId } })
export const recordTransaction = (data) => api.post('/inventory/transactions', data)
