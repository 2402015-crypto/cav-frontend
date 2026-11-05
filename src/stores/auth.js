import { defineStore } from 'pinia'
import * as authApi from '@/services/api/authService'

const TOKEN_KEY = 'cav_access_token'
const USER_KEY = 'cav_authenticated_user'

function readStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readStoredValue(TOKEN_KEY),
    user: JSON.parse(readStoredValue(USER_KEY) || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    roles: (state) => (state.user?.rol ? [state.user.rol] : []),
  },
  actions: {
    async login(credentials) {
      const response = await authApi.login(credentials)
      const data = response.data.data
      this.token = data.token
      this.user = { id: data.id, nombre: data.nombre, usuario: credentials.usuario, rol: data.rol }
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
    },
    async logout() {
      this.token = null
      this.user = null
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})