'use client'

import useSWR from 'swr'
import { getMe } from '@/shared/api/user'
import { TokenManager } from '@/shared/api/auth'
import { getOrganizationMe } from '@/shared/api/organization'
import type { User } from '@/shared/types'

export function useUser() {
	console.log('[v0] useUser - Hook called')

	const hasToken = TokenManager.isAuthenticated()
	const authMethod = TokenManager.getAuthMethod()

	console.log('[v0] useUser - hasToken:', hasToken)
	console.log('[v0] useUser - authMethod:', authMethod)

	const {
		data: user,
		error,
		isLoading,
		mutate
	} = useSWR<User | null>(
		hasToken ? `current-user:${authMethod ?? 'unknown'}` : null,
		async () => {
			console.log('[v0] useUser - Fetcher called, getting user data')

			try {
				if (authMethod === 'organization') {
					const orgData = await getOrganizationMe()
					const normalizedOrgUser: User = {
						id: orgData.id,
						name: orgData.name,
						surname: '',
						email: orgData.email,
						role: 'organizer',
						avatar_url: orgData.avatar_url,
						description: orgData.description,
						website_link: orgData.website_link,
						statistic: {
							quests_completed: 0,
							score: 0,
							available_for_purchases: 0
						}
					}
					return normalizedOrgUser
				}

				const userData = await getMe()
				console.log(
					'[v0] useUser - User data received:',
					JSON.stringify(userData)
				)
				return userData
			} catch (err) {
				console.error('[v0] useUser - Fetcher error:', err)
				throw err
			}
		},
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
			onError: (err) => {
				console.error('[v0] useUser - SWR Error:', err)
			}
		}
	)

	console.log('[v0] useUser - Current state:', {
		hasToken,
		hasUser: !!user,
		isLoading,
		hasError: !!error,
		userName: user?.name
	})

	return {
		user,
		isLoading,
		isError: !!error,
		isAuthenticated: hasToken,
		authMethod,
		mutate
	}
}
