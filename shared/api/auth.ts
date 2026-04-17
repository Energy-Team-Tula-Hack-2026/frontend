import api from './instance'
import type {
	LoginCredentials,
	RegisterData,
	VerifyCodeData,
	AuthTokens,
	OAuthProvider
} from '@/shared/types'

const API_PREFIX = '/api/v2'

export type AuthMethod = 'password' | 'oauth'

// Get OAuth redirect URL
export function getOAuthUrl(
	provider: OAuthProvider,
	redirectUrl?: string
): string {
	const baseUrl =
		process.env.NEXT_PUBLIC_API_URL || 'https://api.energy-team-hack.ru'

	// URL по умолчанию для редиректа после OAuth
	const defaultRedirectUrl =
		process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL ||
		'https://energy-team-hack.ru/callback'

	// Базовый URL с провайдером
	let url = `${baseUrl}${API_PREFIX}/oauth/?service_type=${provider}`

	// Добавляем redirect_url если он передан, иначе используем default
	const finalRedirectUrl = redirectUrl || defaultRedirectUrl
	url += `&frontend_redirect_url=${encodeURIComponent(finalRedirectUrl)}`

	console.log('[v0] getOAuthUrl - Provider:', provider)
	console.log('[v0] getOAuthUrl - Redirect URL:', finalRedirectUrl)
	console.log('[v0] getOAuthUrl - Generated URL:', url)

	return url
}

// Register new user (sends verification code to email)
export async function register(
	data: RegisterData
): Promise<{ message: string }> {
	console.log(
		'[v0] register - Starting registration with data:',
		JSON.stringify(data)
	)
	try {
		const response = await api.post(`${API_PREFIX}/users/create`, data)
		console.log('[v0] register - Success:', JSON.stringify(response.data))
		return response.data
	} catch (error) {
		console.error('[v0] register - Error:', error)
		throw error
	}
}

// Verify email code and get tokens
export async function verifyCode(data: VerifyCodeData): Promise<AuthTokens> {
	console.log('[v0] verifyCode - Verifying code for email:', data.email)
	console.log('[v0] verifyCode - Code:', data.code)

	const newData = {
		email: data.email,
		verify_code: data.code
	}

	try {
		const response = await api.post(`${API_PREFIX}/users/verify`, newData)
		console.log('[v0] verifyCode - Success, tokens received')
		console.log(
			'[v0] verifyCode - access_token:',
			response.data.access_token ? 'EXISTS' : 'NONE'
		)
		console.log(
			'[v0] verifyCode - refresh_token:',
			response.data.refresh_token ? 'EXISTS' : 'NONE'
		)
		return response.data
	} catch (error) {
		console.error('[v0] verifyCode - Error:', error)
		throw error
	}
}

export async function login(
	credentials: LoginCredentials
): Promise<AuthTokens> {
	console.log('[v0] login - Starting login for:', credentials.email)

	const requestBody = {
		email: credentials.email,
		password: credentials.password
	}

	console.log('[v0] login - Sending request body:', requestBody)

	try {
		const response = await api.post(
			`${API_PREFIX}/users/auth/token/login`,
			requestBody,
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)

		console.log('[v0] login - Success!')
		console.log(
			'[v0] login - access_token:',
			response.data.access_token ? 'EXISTS' : 'NONE'
		)
		console.log(
			'[v0] login - refresh_token:',
			response.data.refresh_token ? 'EXISTS' : 'NONE'
		)

		return response.data
	} catch (error) {
		console.error('[v0] login - Error:', error)
		throw error
	}
}

// Set password for OAuth users
export async function setPassword(new_password: string): Promise<void> {
	console.log('[v0] setPassword - Setting password for OAuth user')
	try {
		await api.post(`${API_PREFIX}/oauth/password`, { new_password })
		console.log('[v0] setPassword - Success')
	} catch (error) {
		console.error('[v0] setPassword - Error:', error)
		throw error
	}
}

// Resend verification code
export async function resendVerificationCode(
	email: string
): Promise<{ message: string }> {
	console.log('[v0] resendVerificationCode - Resending code to:', email)
	try {
		const response = await api.post(`${API_PREFIX}/users/resend-code`, {
			email
		})
		console.log(
			'[v0] resendVerificationCode - Success:',
			JSON.stringify(response.data)
		)
		return response.data
	} catch (error) {
		console.error('[v0] resendVerificationCode - Error:', error)
		throw error
	}
}

// Request password change (sends code to email)
export async function requestPasswordChange(): Promise<{ message: string }> {
	console.log('[v0] requestPasswordChange - Requesting password change')
	try {
		const response = await api.post(`${API_PREFIX}/users/me/password`, {})
		console.log(
			'[v0] requestPasswordChange - Success:',
			JSON.stringify(response.data)
		)
		return response.data
	} catch (error) {
		console.error('[v0] requestPasswordChange - Error:', error)
		throw error
	}
}

export async function changePassword(newPassword: string): Promise<void> {
	console.log('[v0] changePassword - Changing password with code')
	try {
		await api.post(`${API_PREFIX}/users/me/password`, {
			new_password: newPassword
		})
		console.log('[v0] changePassword - Success')
	} catch (error) {
		console.error('[v0] changePassword - Error:', error)
		throw error
	}
}

export const TokenManager = {
	saveTokens(tokens: AuthTokens) {
		console.log(
			'[v0] TokenManager.saveTokens - Saving tokens to localStorage'
		)

		if (typeof window !== 'undefined') {
			localStorage.setItem('access_token', tokens.access_token)

			if (tokens.refresh_token) {
				localStorage.setItem('refresh_token', tokens.refresh_token)
			}

			console.log(
				'[v0] TokenManager.saveTokens - Tokens saved successfully'
			)
		}
	},

	saveAuthMethod(method: AuthMethod) {
		console.log(
			'[v0] TokenManager.saveAuthMethod - Saving auth method:',
			method
		)

		if (typeof window !== 'undefined') {
			localStorage.setItem('auth_method', method)
		}
	},

	getAuthMethod(): AuthMethod | null {
		if (typeof window === 'undefined') return null

		const method = localStorage.getItem('auth_method')
		if (method === 'password' || method === 'oauth') {
			return method
		}

		return null
	},

	isOAuthAuth(): boolean {
		return this.getAuthMethod() === 'oauth'
	},

	getAccessToken(): string | null {
		if (typeof window === 'undefined') return null
		const token = localStorage.getItem('access_token')
		console.log(
			'[v0] TokenManager.getAccessToken -',
			token ? 'Token found' : 'No token'
		)
		return token
	},

	getRefreshToken(): string | null {
		if (typeof window === 'undefined') return null
		const token = localStorage.getItem('refresh_token')
		console.log(
			'[v0] TokenManager.getRefreshToken -',
			token ? 'Token found' : 'No token'
		)
		return token
	},

	clearTokens() {
		console.log('[v0] TokenManager.clearTokens - Clearing all tokens')

		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token')
			localStorage.removeItem('refresh_token')
			localStorage.removeItem('auth_method')

			console.log('[v0] TokenManager.clearTokens - Tokens cleared')
		}
	},

	isAuthenticated(): boolean {
		const hasToken = !!this.getAccessToken()
		console.log('[v0] TokenManager.isAuthenticated -', hasToken)
		return hasToken
	}
}
