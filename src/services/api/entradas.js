import http from './http'
import { suggestCatalog } from './catalogos'

export function searchManualEntry(placa) {
  return http.get('/entradas/manual/buscar', { params: { placa } })
}

export function createManualEntry(payload) {
  return http.post('/entradas/manual', payload)
}

export function recognizePlate(image) {
  const formData = new FormData()
  formData.append('image', image, 'capture.jpg')
  return http.post('/ocr/recognize', formData)
}

export function getDailyStats() {
  return http.get('/entradas/manual/estadisticas-hoy')
}

export function getOperationalDashboard() {
  return http.get('/entradas/manual/dashboard-hoy')
}

export function suggestBrands(query) {
  return suggestCatalog('marcas', query)
}

export function suggestColors(query) {
  return suggestCatalog('colores', query)
}

export function suggestCompanies(query) {
  return suggestCatalog('empresas', query)
}

export function suggestTransporters(query) {
  return suggestCatalog('transportadoras', query)
}