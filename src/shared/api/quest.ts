import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2'

export type QuestCategory = {
	id: string
	name: string
	created_at: string
	updated_at: string
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
	category_id: string
	price_rub: number
	length_metres: number
	duration_min: number
	level: 'EASY' | 'MEDIUM' | 'HARD'
	category: QuestCategory
	points: QuestPointDto[]
	images: QuestImageDto[]
	quest_planning: QuestPlanningDto | null
	feedbacks: QuestFeedbackDto[]
	created_at: string
	updated_at: string
}

export async function getQuestCategories(): Promise<QuestCategory[]> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/category`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить категории')
	}
}

export async function getQuests(): Promise<QuestDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить квесты')
	}
}

export async function getQuestById(questId: string): Promise<QuestDto> {
	try {
		const response = await api.get(`${API_PREFIX}/quest/${questId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить квест')
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
		throw normalizeApiError(error, 'Не удалось загрузить дневную точку')
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
			'Не удалось отметить точку как посещённую'
		)
	}
}
