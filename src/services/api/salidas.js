import http from './http'

export function searchActiveExit(placa) {
  return http.get('/salidas/buscar', { params: { placa } })
}

export function registerExit(id, observaciones) {
  return http.put(`/salidas/${id}`, { observaciones })
}

export function updateExitObservations(id, observaciones) {
  return http.patch(`/salidas/${id}/observaciones`, { observaciones })
}

export function listActiveExits(query = '') {
  return http.get('/salidas/activos', { params: query ? { q: query } : {} })
}

export function getExitDetails(id) {
  return http.get(`/salidas/activos/${id}`)
}