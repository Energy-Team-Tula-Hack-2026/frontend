import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2'

export type FeedBackQuestCreate = {
	score: number
	text?: string
}

export type FeedBackQuestCreateResponse = {
	id: string
	user_id: string
	quest_id: string
	score: number
	text: string
}

export async function createQuestFeedback(
	quest_id: string,
	data: FeedBackQuestCreate
): Promise<FeedBackQuestCreateResponse> {
	try {
		const response = await api.post(
			`${API_PREFIX}/quest/feedback/${quest_id}`,
			data
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось создать отзыв')
	}
}

export async function changeQuestFeedback(
	feedback_id: string,
	data: FeedBackQuestCreate
): Promise<FeedBackQuestCreateResponse> {
	try {
		const response = await api.patch(
			`${API_PREFIX}/quest/feedback/${feedback_id}`,
			data
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось изменить отзыв')
	}
}

export async function deleteQuestFeedback(feedback_id: string): Promise<void> {
	try {
		await api.delete(`${API_PREFIX}/quest/feedback/${feedback_id}`)
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось удалить отзыв')
	}
}
