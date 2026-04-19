import api from './instance'
import { normalizeApiError } from './errors'

const API_PREFIX = '/api/v2'

export type AchievementDto = {
	id: string
	name: string
	description: string
	image_url: string | null
	calculation_func_path: string
}

export async function getAchievements(): Promise<AchievementDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/achievements`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить достижения')
	}
}
