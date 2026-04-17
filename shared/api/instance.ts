import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || 'https://api.energy-team-hack.ru'

console.log(
	'[v0] API Instance - Creating axios instance with baseURL:',
	API_URL
)

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json'
	},
	withCredentials: true
})

// Request interceptor - add token from localStorage
api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		console.log('[v0] API Request Interceptor - URL:', config.url)
		console.log('[v0] API Request Interceptor - Method:', config.method)

		// Get token from localStorage (client-side only)
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('access_token')
			console.log(
				'[v0] API Request Interceptor - Token from localStorage:',
				token ? 'EXISTS' : 'NONE'
			)

			if (token && config.headers) {
				config.headers.Authorization = `Bearer ${token}`
				console.log(
					'[v0] API Request Interceptor - Added Authorization header'
				)
			}
		}

		console.log(
			'[v0] API Request Interceptor - Final headers:',
			JSON.stringify(config.headers)
		)
		return config
	},
	(error) => {
		console.error('[v0] API Request Interceptor Error:', error)
		return Promise.reject(error)
	}
)

// Response interceptor - handle errors
api.interceptors.response.use(
	(response) => {
		console.log('[v0] API Response - Status:', response.status)
		console.log(
			'[v0] API Response - Data:',
			JSON.stringify(response.data).slice(0, 200)
		)
		return response
	},
	async (error: AxiosError) => {
		console.error(
			'[v0] API Response Error - Status:',
			error.response?.status
		)
		console.error(
			'[v0] API Response Error - Data:',
			JSON.stringify(error.response?.data)
		)
		console.error('[v0] API Response Error - URL:', error.config?.url)

		// If 401, clear tokens and redirect to login
		if (error.response?.status === 401 && typeof window !== 'undefined') {
			console.log(
				'[v0] API Response Error - 401 Unauthorized, clearing tokens'
			)
			localStorage.removeItem('access_token')
			localStorage.removeItem('refresh_token')
			// Don't auto-redirect here, let components handle it
		}

		return Promise.reject(error)
	}
)

export default api
