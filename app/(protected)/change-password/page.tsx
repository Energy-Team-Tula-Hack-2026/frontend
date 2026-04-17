import { ChangePasswordFormWidget } from '@/widgets/change-password-form'

export const metadata = {
	title: 'Смена пароля',
	description: 'Введите текущий и новый пароль'
}

export default function ChangePasswordPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<ChangePasswordFormWidget />
		</main>
	)
}
