import http from './http'

export function searchActiveExit(placa) {
  return http.get('/salidas/buscar', { params: { placa } })
}

export function registerExit(id, observaciones) {
  return http.put(`/salidas/${id}`, { observaciones })
}