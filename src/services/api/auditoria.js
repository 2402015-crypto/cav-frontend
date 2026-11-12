import http from './http'

export async function listAuditRecords(params = {}) {
  return http.get('/bitacora', { params })
}

export async function getAuditRecord(id) {
  return http.get(`/bitacora/${id}`)
}

export async function registerAuditExport(descripcion) {
  return http.post('/bitacora/exportaciones', { descripcion })
}
