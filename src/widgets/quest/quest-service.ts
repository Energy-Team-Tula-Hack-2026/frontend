import { api, ApiQuest } from '@/shared'

class QuestService {
	private baseUrl = `/api/v2/quest`

	async getQuestId(id: string): Promise<ApiQuest> {
		try {
			const response = await api.get<ApiQuest>(`${this.baseUrl}/${id}`)
			return response.data
		} catch (error) {
			console.error('Failed to fetch quest', error)
			throw error
		}
	}
}

export const questService = new QuestService()
