import axios from 'axios'
import { getToken, clearToken } from './auth'

// Add token to every request automatically
axios.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If token is expired redirect to login
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axios
