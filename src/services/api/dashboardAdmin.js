import http from './http'

export function getAdminDashboard(days = 7) {
  return http.get('/admin/dashboard', { params: { dias: days } })
}
