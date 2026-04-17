// User types
export interface UserAccount {
	account_type: 'google' | 'yandex' | 'github'
	user_id: string
}

export interface User {
	name: string
	surname: string
	email: string
	role: 'user' | 'admin'
	is_verified: boolean
	accounts: UserAccount[]
	scheduled_updatable_field?: string
}

// Auth types
export interface AuthTokens {
	access_token: string
	refresh_token: string
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface RegisterData {
	name: string
	surname: string
	email: string
	password: string
}

export interface VerifyCodeData {
	email: string
	code: string
}

export interface UpdateUserData {
	name?: string
	surname?: string
}

export interface ChangePasswordData {
	old_password: string
	new_password: string
	code: string
}

// API Response types
export interface ApiError {
	message: string
	status: number
}

export type OAuthProvider = 'google' | 'yandex'
