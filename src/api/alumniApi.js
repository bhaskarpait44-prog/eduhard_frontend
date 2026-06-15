import api from './axios';

export const getAlumniStats        = ()             => api.get('/alumni/stats');
export const getAlumniDirectory    = (params)       => api.get('/alumni/directory', { params });
export const getAlumniProfile      = (id)           => api.get(`/alumni/${id}`);
export const upsertAlumniProfile   = (id, data)     => api.put(`/alumni/${id}/profile`, data);
export const downloadAlumniPdf     = (params)       => api.get('/alumni/directory/download', { params, responseType: 'blob' });

export const listAlumniEvents      = (params)       => api.get('/alumni/events', { params });
export const createAlumniEvent     = (data)         => api.post('/alumni/events', data);
export const updateAlumniEvent     = (id, data)     => api.put(`/alumni/events/${id}`, data);
export const deleteAlumniEvent     = (id)           => api.delete(`/alumni/events/${id}`);
