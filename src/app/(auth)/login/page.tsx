import { Suspense } from 'react'
import { LoginFormWidget } from '@/widgets/login-form'
import { Spinner } from '@/shared/components/ui/spinner'

export const metadata = {
	title: 'Вход',
	description: 'Войдите в свой аккаунт'
}

export default function LoginPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Suspense
				fallback={
					<div className="flex justify-center">
						<Spinner className="size-8" />
					</div>
				}
			>
				<LoginFormWidget />
			</Suspense>
		</main>
	)
}
