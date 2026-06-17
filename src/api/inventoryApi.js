import api from './axios'

export const getItems = (params) => api.get('/inventory/items', { params })
export const getCategories = () => api.get('/inventory/items/categories')
export const createItem = (data) => api.post('/inventory/items', data)
export const updateItem = (id, data) => api.patch(`/inventory/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/inventory/items/${id}`)

export const getTransactions = (params) => api.get('/inventory/transactions', { params })
export const recordTransaction = (data) => api.post('/inventory/transactions', data)

export const getCatalogPdfData  = () => api.get('/inventory/pdf/catalog')
export const getStockInPdfData  = (params) => api.get('/inventory/pdf/stock-in', { params })
export const getStockOutPdfData = (params) => api.get('/inventory/pdf/stock-out', { params })
export const getLowStockPdfData = () => api.get('/inventory/pdf/low-stock')
