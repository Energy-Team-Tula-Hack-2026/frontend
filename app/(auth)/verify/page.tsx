import { Suspense } from 'react'
import { VerifyCodeFormWidget } from '@/widgets/verify-code-form'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
	title: 'Подтверждение',
	description: 'Введите код подтверждения'
}

export default function VerifyPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Suspense
				fallback={
					<div className="flex justify-center">
						<Spinner className="size-8" />
					</div>
				}
			>
				<VerifyCodeFormWidget />
			</Suspense>
		</main>
	)
}
