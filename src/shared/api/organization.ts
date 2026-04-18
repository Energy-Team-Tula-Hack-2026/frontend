import api from './instance'
import { normalizeApiError } from '@/shared/api/errors'
import type { AuthTokens } from '@/shared/types'

const API_PREFIX = '/api/v2'

export type OrganizationRegisterData = {
	name: string
	email: string
	password: string
	description: string
	website_link: string
}

export type OrganizationVerifyData = {
	email: string
	verify_code: string
}

export type OrganizationLoginData = {
	email: string
	password: string
}

export type OrganizationMe = {
	id: string
	name: string
	email: string
	description: string
	website_link: string
	avatar_url?: string
}

export async function registerOrganization(
	data: OrganizationRegisterData
): Promise<{ status: string; detail: string }> {
	try {
		const response = await api.post(
			`${API_PREFIX}/organizations/create`,
			data
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось зарегистрировать организатора'
		)
	}
}

export async function verifyOrganization(
	data: OrganizationVerifyData
): Promise<AuthTokens> {
	try {
		const response = await api.post(
			`${API_PREFIX}/organizations/verify`,
			data
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось подтвердить почту организатора'
		)
	}
}

export async function loginOrganization(
	data: OrganizationLoginData
): Promise<AuthTokens> {
	try {
		const response = await api.post(
			`${API_PREFIX}/organizations/auth/token/login`,
			data
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось войти в аккаунт организатора'
		)
	}
}

export async function getOrganizationMe(): Promise<OrganizationMe> {
	try {
		const response = await api.get(`${API_PREFIX}/organizations/me`)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось загрузить профиль организатора'
		)
	}
}

export async function updateOrganizationMe(
	data: Partial<
		Pick<
			OrganizationMe,
			'name' | 'description' | 'website_link' | 'avatar_url'
		>
	>
): Promise<OrganizationMe> {
	try {
		const response = await api.patch(`${API_PREFIX}/organizations/me`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось обновить профиль организатора'
		)
	}
}

export async function deleteOrganizationMe(): Promise<void> {
	try {
		await api.delete(`${API_PREFIX}/organizations/me`)
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось удалить аккаунт организатора'
		)
	}
}

export async function requestOrganizationPasswordChange(
	newPassword: string
): Promise<{ status: string; detail: string }> {
	try {
		const response = await api.post(
			`${API_PREFIX}/organizations/me/password`,
			{
				new_password: newPassword
			}
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось запустить смену пароля организатора'
		)
	}
}
