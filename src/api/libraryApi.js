import api from './axios';

const libraryApi = {
  // Dashboard
  getDashboardStats: () => api.get('/library/dashboard'),

  // Settings
  getSettings: () => api.get('/library/settings'),
  updateSettings: (data) => api.put('/library/settings', data),

  // Books
  getBooks: (params) => api.get('/library/books', { params }),
  getBook: (id) => api.get(`/library/books/${id}`),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),

  // Issues
  getIssues: (params) => api.get('/library/issues', { params }),
  getMyIssues: () => api.get('/library/issues/my'),
  issueBook: (data) => api.post('/library/issues', data),
  returnBook: (id, data) => api.patch(`/library/issues/${id}/return`, data),
  markOverdue: () => api.patch('/library/issues/mark-overdue'),

  // Fines
  getFines: (params) => api.get('/library/fines', { params }),
  getFineSummary: () => api.get('/library/fines/summary'),
  updateFineStatus: (id, data) => api.patch(`/library/fines/${id}`, data),
};

export default libraryApi;
