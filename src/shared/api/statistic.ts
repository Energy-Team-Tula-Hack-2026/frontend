import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2'

export type StatisticMainResponse = {
	active_quests: number
	users: number
	completed_quests: number
	scores_received: number
}

export type UserLeaderboardEntry = {
	name: string
	surname: string
	quests_completed: number
	score: number
	avatar_url: string | null
}

export type LeaderboardResponse = {
	users: UserLeaderboardEntry[]
}

export async function getStatisticMain(): Promise<StatisticMainResponse> {
	try {
		const response = await api.get(`${API_PREFIX}/statistic/main`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось получить статистику')
	}
}

export async function getLeaderBoardStatistic(): Promise<LeaderboardResponse> {
	try {
		const response = await api.get(`${API_PREFIX}/statistic/leaderboard`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось получить статистику')
	}
}
