import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cav_access_token')

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
    }

    return Promise.reject(error)
  },
)

export default http
