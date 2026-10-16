import { defineStore } from 'pinia'
import * as authApi from '@/services/api/authService'

const TOKEN_KEY = 'cav_access_token'
const USER_KEY = 'cav_authenticated_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem(TOKEN_KEY),
    user: JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'),
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
      sessionStorage.setItem(TOKEN_KEY, this.token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(this.user))
    },
    async logout() {
      try {
        if (this.token) await authApi.logout()
      } finally {
        this.token = null
        this.user = null
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
      }
    },
  },
})