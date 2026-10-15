import http from './http'

export function getBackendStatus() {
  return http.get('/status')
}