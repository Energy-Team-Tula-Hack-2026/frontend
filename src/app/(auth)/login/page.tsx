import { LoginFormWidget } from '@/widgets/login-form'

export const metadata = {
	title: 'Вход',
	description: 'Войдите в свой аккаунт'
}

export default function LoginPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<LoginFormWidget />
		</main>
	)
}
