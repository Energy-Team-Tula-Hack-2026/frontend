import { getMe } from '@/shared'
import { useQuery } from '@tanstack/react-query'

export const useSelf = () => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['get self'],
		queryFn: () => getMe(),
		gcTime: 0
	})

	return {
		user: data,
		isLoadingUser: isLoading,
		errorUser: error
	}
}
