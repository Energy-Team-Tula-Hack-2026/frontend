import { OAuthCallbackWidget } from '@/widgets/oauth-callback'

export const metadata = {
	title: 'Авторизация',
	description: 'Обработка авторизации через сервис'
}

export default function CallbackPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<OAuthCallbackWidget />
		</main>
	)
}
