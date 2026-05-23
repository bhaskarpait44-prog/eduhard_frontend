import api from './axios'

export const getCertificates    = (params) => api.get('/certificates', { params })
export const generateCertificate = (data)   => api.post('/certificates/generate', data)
export const getCertificateById  = (id)     => api.get(`/certificates/${id}`)
export const downloadCertificate = (id)     => api.get(`/certificates/${id}/download`, { responseType: 'blob' })
export const revokeCertificate   = (id)     => api.patch(`/certificates/${id}/revoke`)
