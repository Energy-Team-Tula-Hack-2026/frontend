import api from './instance'
import type { User, UpdateUserData } from '@/shared/types'

const API_PREFIX = '/api/v2'

// Get current user
export async function getMe(): Promise<User> {
	console.log('[v0] getMe - Fetching current user')
	try {
		const response = await api.get(`${API_PREFIX}/users/me`)
		localStorage.setItem(
			'is_known_password',
			response.data.is_known_password
		)
		console.log('[v0] getMe - Success:', JSON.stringify(response.data))
		return response.data
	} catch (error) {
		console.error('[v0] getMe - Error:', error)
		throw error
	}
}

// Update user data (name, surname)
export async function updateUser(data: UpdateUserData): Promise<User> {
	console.log(
		'[v0] updateUser - Updating user with data:',
		JSON.stringify(data)
	)
	try {
		const response = await api.patch(`${API_PREFIX}/users/me`, data)
		console.log('[v0] updateUser - Success:', JSON.stringify(response.data))
		return response.data
	} catch (error) {
		console.error('[v0] updateUser - Error:', error)
		throw error
	}
}

// Complete profile for OAuth users (set name/surname, marks as verified)
export async function completeProfile(data: {
	name: string
	surname: string
}): Promise<User> {
	console.log(
		'[v0] completeProfile - Completing profile with:',
		JSON.stringify(data)
	)
	try {
		const response = await api.patch(`${API_PREFIX}/users/me`, data)
		console.log(
			'[v0] completeProfile - Success:',
			JSON.stringify(response.data)
		)
		return response.data
	} catch (error) {
		console.error('[v0] completeProfile - Error:', error)
		throw error
	}
}

// Delete current user
export async function deleteMe(): Promise<void> {
	console.log('[v0] deleteMe - Deleting current user')
	try {
		await api.delete(`${API_PREFIX}/users/me`)
		console.log('[v0] deleteMe - Success')
	} catch (error) {
		console.error('[v0] deleteMe - Error:', error)
		throw error
	}
}
