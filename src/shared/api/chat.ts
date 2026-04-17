import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'
import type { UserPointChat } from '@/shared/types'

const API_PREFIX = '/api/v2'

export async function getChatByPointId(
	pointId: string
): Promise<UserPointChat> {
	try {
		const response = await api.get(`${API_PREFIX}/chat/${pointId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить чат')
	}
}
