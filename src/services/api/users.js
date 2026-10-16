import http from './http'

export function listUsers() {
  return http.get('/usuarios')
}

export function createUser(user) {
  return http.post('/usuarios', user)
}

export function updateUser(id, user) {
  return http.put(`/usuarios/${id}`, user)
}

export function setUserStatus(id, active) {
  return http.put(`/usuarios/${id}/${active ? 'activar' : 'desactivar'}`)
}

export function deleteUser(id) {
  return http.delete(`/usuarios/${id}`)
}
