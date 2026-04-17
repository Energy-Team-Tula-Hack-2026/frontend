'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import {
	Field,
	FieldLabel,
	FieldError,
	FieldGroup
} from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'

import { completeProfile } from '@/shared/api/user'

const completeProfileSchema = z.object({
	name: z
		.string()
		.min(2, 'Имя должно содержать минимум 2 символа')
		.max(15, 'Имя должно быть максимум 15 символов'),
	surname: z
		.string()
		.min(2, 'Фамилия должна содержать минимум 2 символа')
		.max(15, 'Фамилия должна быть максимум 15 символов')
})

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>

interface CompleteProfileFormWidgetProps {
	initialName?: string
	initialSurname?: string
}

export function CompleteProfileFormWidget({
	initialName = '',
	initialSurname = ''
}: CompleteProfileFormWidgetProps) {
	console.log('[v0] CompleteProfileFormWidget - Rendering')
	console.log('[v0] CompleteProfileFormWidget - Initial values:', {
		initialName,
		initialSurname
	})

	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<CompleteProfileFormData>({
		resolver: zodResolver(completeProfileSchema),
		defaultValues: {
			name: initialName,
			surname: initialSurname
		}
	})

	const onSubmit = async (data: CompleteProfileFormData) => {
		console.log(
			'[v0] CompleteProfileFormWidget - onSubmit called with:',
			data
		)
		setIsLoading(true)
		setError(null)

		try {
			console.log(
				'[v0] CompleteProfileFormWidget - Calling completeProfile API'
			)
			await completeProfile(data)

			console.log(
				'[v0] CompleteProfileFormWidget - Success, redirecting to /profile'
			)
			toast.success('Профиль заполнен!')
			router.push('/profile')
		} catch (err: unknown) {
			console.error('[v0] CompleteProfileFormWidget - Error:', err)

			const errorMessage =
				err instanceof Error ? err.message : 'Ошибка заполнения профиля'
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Заполните профиль</CardTitle>
				<CardDescription>
					Укажите ваше имя и фамилию для завершения регистрации
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="name">Имя</FieldLabel>
							<Input
								id="name"
								type="text"
								placeholder="Иван"
								{...register('name')}
								aria-invalid={!!errors.name}
							/>
							{errors.name && (
								<FieldError>{errors.name.message}</FieldError>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="surname">Фамилия</FieldLabel>
							<Input
								id="surname"
								type="text"
								placeholder="Иванов"
								{...register('surname')}
								aria-invalid={!!errors.surname}
							/>
							{errors.surname && (
								<FieldError>
									{errors.surname.message}
								</FieldError>
							)}
						</Field>

						{error && (
							<div className="text-destructive text-center text-sm">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading && <Spinner />}
							Завершить регистрацию
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}

export default CompleteProfileFormWidget
