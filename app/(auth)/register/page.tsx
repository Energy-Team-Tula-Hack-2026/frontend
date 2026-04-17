import { RegisterFormWidget } from '@/widgets/register-form'

export const metadata = {
	title: 'Регистрация',
	description: 'Создайте новый аккаунт'
}

export default function RegisterPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<RegisterFormWidget />
		</main>
	)
}
