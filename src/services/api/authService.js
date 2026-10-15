import http from './http'

export function login(credentials) {
  return http.post('/auth/login', credentials)
}

export function logout() {
  return http.post('/auth/logout')
}