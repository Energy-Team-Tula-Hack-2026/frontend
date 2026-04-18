'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useUser } from '@/shared/hooks/use-user'
import { isOrganizer } from '@/shared/lib/roles'

const ALWAYS_ALLOWED_PREFIXES = ['/login', '/register', '/verify', '/callback']

export function RoleAccessGuard() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const { user, isAuthenticated } = useUser()

	useEffect(() => {
		if (!isAuthenticated || !pathname) {
			return
		}

		if (
			isOrganizer(user?.role) &&
			ALWAYS_ALLOWED_PREFIXES.some((prefix) =>
				pathname.startsWith(prefix)
			)
		) {
			// Keep /verify accessible for password-change confirmation flow.
			if (pathname.startsWith('/verify')) {
				const mode = searchParams.get('mode')
				const isPasswordFlow =
					mode === 'change-password' ||
					mode === 'change-password-organization'
				if (isPasswordFlow) {
					return
				}
			}

			router.replace('/admin')
			return
		}

		if (!isOrganizer(user?.role)) {
			return
		}

		if (pathname === '/') {
			router.replace('/admin')
		}
	}, [isAuthenticated, pathname, router, searchParams, user?.role])

	return null
}
