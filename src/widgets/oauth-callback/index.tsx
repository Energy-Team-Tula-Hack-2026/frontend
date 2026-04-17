'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Spinner } from '@/shared/components/ui/spinner'
import { Button } from '@/shared/components/ui/button'

import { TokenManager } from '@/shared/api/auth'

export function OAuthCallbackWidget() {
	console.log('[v0] OAuthCallbackWidget - Rendering')

	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(true)

	useEffect(() => {
		const processOAuth = async () => {
			console.log('[v0] OAuthCallbackWidget - Processing OAuth callback')

			try {
				console.log('[v0] OAuthCallbackWidget - Reading cookies')
				const cookies = document.cookie
				console.log('[v0] OAuthCallbackWidget - All cookies:', cookies)

				const cookieMap: Record<string, string> = {}

				cookies.split(';').forEach((cookie) => {
					const [name, ...rest] = cookie.trim().split('=')
					if (name && rest.length > 0) {
						cookieMap[name] = rest.join('=')
					}
				})

				console.log(
					'[v0] OAuthCallbackWidget - Parsed cookies:',
					Object.keys(cookieMap)
				)

				const accessToken = cookieMap['access_token']
				const refreshToken = cookieMap['refresh_token']
				const isNewUser = cookieMap['is_new_user']

				console.log(
					'[v0] OAuthCallbackWidget - access_token:',
					accessToken ? 'FOUND' : 'NOT FOUND'
				)
				console.log(
					'[v0] OAuthCallbackWidget - refresh_token:',
					refreshToken ? 'FOUND' : 'NOT FOUND'
				)
				console.log(
					'[v0] OAuthCallbackWidget - is_new_user:',
					isNewUser ?? 'NOT FOUND'
				)

				if (!accessToken) {
					console.error(
						'[v0] OAuthCallbackWidget - No access_token in cookies'
					)
					setError('Не удалось получить токен авторизации')
					setIsProcessing(false)
					return
				}

				if (isNewUser !== 'yes' && isNewUser !== 'no') {
					console.error(
						'[v0] OAuthCallbackWidget - Invalid or missing is_new_user flag'
					)
					setError('Не удалось определить статус пользователя')
					setIsProcessing(false)
					return
				}

				console.log(
					'[v0] OAuthCallbackWidget - Saving tokens to localStorage'
				)
				TokenManager.saveTokens({
					access_token: accessToken,
					refresh_token: refreshToken
				})

				TokenManager.saveAuthMethod('oauth')

				if (typeof window !== 'undefined') {
					localStorage.setItem('oauth_is_new_user', isNewUser)
				}

				if (isNewUser === 'yes') {
					console.log(
						'[v0] OAuthCallbackWidget - New OAuth user, redirecting to /complete-profile'
					)
					router.push('/complete-profile')
				} else {
					console.log(
						'[v0] OAuthCallbackWidget - Existing OAuth user, redirecting to /profile'
					)
					router.push('/profile')
				}
			} catch (err) {
				console.error('[v0] OAuthCallbackWidget - Error:', err)
				setError('Ошибка обработки авторизации')
				setIsProcessing(false)
			}
		}

		processOAuth()
	}, [router])

	if (error) {
		console.log('[v0] OAuthCallbackWidget - Showing error:', error)

		return (
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-destructive text-2xl">
						Ошибка
					</CardTitle>
					<CardDescription>{error}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => {
							console.log(
								'[v0] OAuthCallbackWidget - Redirecting to /login'
							)
							router.push('/login')
						}}
					>
						Вернуться к входу
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Авторизация</CardTitle>
				<CardDescription>
					Обрабатываем вход через сервис...
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-center py-8">
					{isProcessing && <Spinner className="size-8" />}
				</div>
			</CardContent>
		</Card>
	)
}

export default OAuthCallbackWidget
