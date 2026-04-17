'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CompleteProfileFormWidget } from '@/widgets/complete-profile-form'
import { useUser } from '@/shared/hooks/use-user'
import { Spinner } from '@/components/ui/spinner'
import { TokenManager } from '@/shared/api/auth'

export default function CompleteProfilePage() {
	console.log('[v0] CompleteProfilePage - Rendering')

	const router = useRouter()
	const { user, isLoading, isAuthenticated } = useUser()

	const isOAuthAuth = TokenManager.getAuthMethod() === 'oauth'

	const isNewOAuthUser = useMemo(() => {
		if (typeof window === 'undefined') return false
		return localStorage.getItem('oauth_is_new_user') === 'yes'
	}, [])

	console.log('[v0] CompleteProfilePage - State:', {
		hasUser: !!user,
		isLoading,
		isAuthenticated,
		isOAuthAuth,
		isNewOAuthUser
	})

	useEffect(() => {
		console.log('[v0] CompleteProfilePage - useEffect check')

		if (!isLoading && !isAuthenticated) {
			console.log(
				'[v0] CompleteProfilePage - Not authenticated, redirecting to /login'
			)
			router.push('/login')
			return
		}

		if (!isLoading && user && !isOAuthAuth) {
			console.log(
				'[v0] CompleteProfilePage - Non-OAuth user, redirecting to /profile'
			)
			router.push('/profile')
			return
		}

		if (!isLoading && user && isOAuthAuth && !isNewOAuthUser) {
			console.log(
				'[v0] CompleteProfilePage - OAuth user is not new, redirecting to /profile'
			)
			router.push('/profile')
		}
	}, [isLoading, isAuthenticated, isOAuthAuth, isNewOAuthUser, user, router])

	if (isLoading || (isAuthenticated && !user)) {
		console.log('[v0] CompleteProfilePage - Loading...')
		return (
			<main className="flex min-h-screen items-center justify-center p-4">
				<Spinner className="size-8" />
			</main>
		)
	}

	if (!user) {
		console.log('[v0] CompleteProfilePage - No user, showing nothing')
		return null
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<CompleteProfileFormWidget
				initialName={user.name}
				initialSurname={user.surname}
			/>
		</main>
	)
}
