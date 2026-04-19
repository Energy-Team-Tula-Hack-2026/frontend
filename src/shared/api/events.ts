import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2'

export type CulturalEventDto = {
	id: string
	title: string
	description: string
	month: number
	day: number
	category: string
	event_type: string
	craft_type: string | null
	icon_url: string | null
	traditions: string | null
	recipes: string | null
	crafts_description: string | null
}

export async function getEvents(month?: number): Promise<CulturalEventDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/events`, {
			params: month ? { month } : undefined
		})
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить календарь событий')
	}
}
