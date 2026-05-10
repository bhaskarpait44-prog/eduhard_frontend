import axios from './axios';

const libraryApi = {
  // Dashboard
  getDashboardStats: () => axios.get('/library/dashboard'),

  // Settings
  getSettings: () => axios.get('/library/settings'),
  updateSettings: (data) => axios.put('/library/settings', data),

  // Books
  getBooks: (params) => axios.get('/library/books', { params }),
  getBook: (id) => axios.get(`/library/books/${id}`),
  createBook: (data) => axios.post('/library/books', data),
  updateBook: (id, data) => axios.put(`/library/books/${id}`, data),
  deleteBook: (id) => axios.delete(`/library/books/${id}`),

  // Issues
  getIssues: (params) => axios.get('/library/issues', { params }),
  getMyIssues: () => axios.get('/library/issues/my'),
  issueBook: (data) => axios.post('/library/issues', data),
  returnBook: (id, data) => axios.patch(`/library/issues/${id}/return`, data),
  markOverdue: () => axios.patch('/library/issues/mark-overdue'),

  // Fines
  getFines: (params) => axios.get('/library/fines', { params }),
  getFineSummary: () => axios.get('/library/fines/summary'),
  updateFineStatus: (id, data) => axios.patch(`/library/fines/${id}`, data),
};

export default libraryApi;
