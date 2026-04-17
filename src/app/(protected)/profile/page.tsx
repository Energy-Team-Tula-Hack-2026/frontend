'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileCardWidget } from '@/widgets/profile-card'
import { useUser } from '@/shared/hooks/use-user'
import { Spinner } from '@/shared/components/ui/spinner'

export default function ProfilePage() {
	console.log('[v0] ProfilePage - Rendering')

	const router = useRouter()
	const { user, isLoading, isAuthenticated, mutate } = useUser()

	console.log('[v0] ProfilePage - State:', {
		hasUser: !!user,
		isLoading,
		isAuthenticated
	})

	useEffect(() => {
		console.log('[v0] ProfilePage - useEffect check')

		if (!isLoading && !isAuthenticated) {
			console.log('[v0] ProfilePage - No token, redirecting to /login')
			router.push('/login')
		}
	}, [isLoading, isAuthenticated, router])

	if (isLoading || (isAuthenticated && !user)) {
		console.log('[v0] ProfilePage - Loading...')
		return (
			<main className="flex min-h-screen items-center justify-center p-4">
				<Spinner className="size-8" />
			</main>
		)
	}

	if (!user) {
		console.log('[v0] ProfilePage - No user, showing nothing')
		return null
	}

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<ProfileCardWidget
				user={user}
				onUserUpdate={() => {
					console.log('[v0] ProfilePage - User updated, revalidating')
					mutate()
				}}
			/>
		</main>
	)
}
