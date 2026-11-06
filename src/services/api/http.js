import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    Accept: 'application/json',
  },
})

let redirectingAfterExpiration = false

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('cav_access_token') || sessionStorage.getItem('cav_access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('cav_access_token')
      sessionStorage.removeItem('cav_authenticated_user')
      localStorage.removeItem('cav_access_token')
      localStorage.removeItem('cav_authenticated_user')
      if (!redirectingAfterExpiration && window.location.pathname !== '/login') {
        redirectingAfterExpiration = true
        const redirect = `${window.location.pathname}${window.location.search}`
        window.location.assign(`/login?sessionExpired=1&redirect=${encodeURIComponent(redirect)}`)
      }
    }

    return Promise.reject(error)
  },
)

export default http
