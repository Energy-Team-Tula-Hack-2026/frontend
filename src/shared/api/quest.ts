import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2'

export type QuestCategory = {
	id: string
	name: string
	created_at?: string
	updated_at?: string
}
export type QuestPointDto = {
	id: string
	quest_id: string
	name: string
	description: string
	short_description: string
	code: string
	score: number
	latitude: number
	longitude: number
	priority: number
	audio_record_url: string | null
	image_url: string | null
	created_at: string
	updated_at: string
}

export type QuestImageDto = {
	id: string
	quest_id: string
	image_url: string
}

export type QuestPlanningDto = {
	id: string
	quest_id: string
	description: string
	guide_name: string
	group_link: string
	planned_start: string
	capacity: number
	created_at: string
	updated_at: string
}

export type QuestFeedbackDto = {
	id: string
	user_id: string
	quest_id: string
	score: number
	text: string | null
	created_at: string
	updated_at: string
	user?: {
		id: string
		name: string
		surname: string
		avatar_url: string | null
	}
}

export type QuestDto = {
	id: string
	name: string
	description: string
	code?: string
	category_id?: string
	price_rub?: number
	length_metres?: number
	duration_min: number
	level: 'EASY' | 'MEDIUM' | 'HARD'
	rating?: number | null
	category?: QuestCategory | null
	location?: {
		city?: string | null
		latitude?: number
		longitude?: number
	} | null
	points: QuestPointDto[]
	images: QuestImageDto[]
	quest_planning: QuestPlanningDto | null
	feedbacks: QuestFeedbackDto[]
	created_at?: string
	updated_at?: string
}

export async function getQuestCategories(): Promise<QuestCategory[]> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/category`)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєР°С‚РµРіРѕСЂРёРё'
		)
	}
}

export async function getQuests(): Promise<QuestDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/`)
		console.log('Quests response:', response.data)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєРІРµСЃС‚С‹'
		)
	}
}

export async function getQuestById(questId: string): Promise<QuestDto> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/${questId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєРІРµСЃС‚'
		)
	}
}

export type RegisterUserQuestResponse = {
	quest_id: string
	message?: string
}

export async function registerUserQuest(
	questCode: string
): Promise<RegisterUserQuestResponse> {
	try {
		const response = await api.post(`${API_PREFIX}/users/quest/`, {
			quest_code: questCode
		})
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не получилось отсканировать и начать прохождение квеста предприятия'
		)
	}
}

export type DailyPointDto = {
	id: string
	quest_id: string
	name: string
	description: string
	short_description: string
	code: string
	score: number
	longitude: number
	latitude: number
	priority: number
	audio_record_url: string | null
	image_url: string | null
}

export async function getDailyPoint(): Promise<DailyPointDto> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/point/daily`)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґРЅРµРІРЅСѓСЋ С‚РѕС‡РєСѓ'
		)
	}
}

export async function validateDailyPoint(
	pointCode: string
): Promise<{ status: string; detail: string }> {
	try {
		const response = await api.post(
			`${API_PREFIX}/quest/point/daily/validate`,
			null,
			{
				params: { point_code: pointCode }
			}
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµС‚РёС‚СЊ С‚РѕС‡РєСѓ РєР°Рє РїРѕСЃРµС‰С‘РЅРЅСѓСЋ'
		)
	}
}
