import SetPasswordFormWidget from '@/widgets/set-password-form'

export const metadata = {
	title: 'Задать пароль',
	description: 'Введите свой пароль'
}

export default function SetPasswordPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<SetPasswordFormWidget />
		</main>
	)
}
