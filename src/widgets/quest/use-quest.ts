import { useQuery } from '@tanstack/react-query'
import { questService } from './quest-service'

export function useQuest(id: string) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['quest', id],
		queryFn: () => questService.getQuestId(id),
		enabled: !!id,
		retry: false
	})

	return {
		quest: data,
		isLoading,
		error
	}
}
