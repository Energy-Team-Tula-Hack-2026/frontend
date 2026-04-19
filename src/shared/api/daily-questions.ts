import api from './instance'
import { normalizeApiError } from './errors'

const API_PREFIX = '/api/v2/daily-questions'

export type DailyQuestionDto = {
	id: string
	question: string
	score: number
	answer_options: string[]
}

export type DailyQuestionsByDateDto = {
	date: string
	questions: DailyQuestionDto[]
}

export type DailyAnswerResponseDto = {
	user_id: string
	question_id: string
	answer: string
	is_correct: boolean
	date: string
}

export async function getDailyQuestions(): Promise<DailyQuestionsByDateDto[]> {
	try {
		const response = await api.get(API_PREFIX)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось загрузить ежедневные вопросы'
		)
	}
}

export async function getTodayDailyQuestions(): Promise<DailyQuestionsByDateDto> {
	try {
		const response = await api.get(`${API_PREFIX}/today`)
		return response.data
	} catch (error) {
		throw normalizeApiError(
			error,
			'Не удалось загрузить вопросы на сегодня'
		)
	}
}

export async function answerDailyQuestion(data: {
	question_id: string
	user_answer: string
}): Promise<DailyAnswerResponseDto> {
	try {
		const response = await api.post(`${API_PREFIX}/answer`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось отправить ответ')
	}
}
