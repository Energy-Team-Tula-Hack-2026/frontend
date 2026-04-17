import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared'
import type { ApiPoint, User, UserPoint } from '@/shared'

export const useValidatePoint = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ code }: { code: string; point: ApiPoint }) => {
			const response = await api.post(
				'/api/v2/users/quest/point/validate',
				{
					point_code: code
				}
			)
			return response.data
		},
		onMutate: async ({ point }: { code: string; point: ApiPoint }) => {
			await queryClient.cancelQueries({ queryKey: ['get self'] })

			const previousUser = queryClient.getQueryData<User>(['get self'])

			if (previousUser) {
				const updatedPoints = (previousUser.points || []).map(
					(p: UserPoint) =>
						p.point_id === point.id
							? { ...p, status: 'COMPLETED' as const }
							: p
				)
				const updatedUser: User = {
					...previousUser,
					points: updatedPoints
				}
				queryClient.setQueryData(['get self'], updatedUser)
			}

			return { previousUser }
		},
		onError: (err, variables, context) => {
			if (context?.previousUser) {
				queryClient.setQueryData(['get self'], context.previousUser)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['get self'] })
		}
	})
}
