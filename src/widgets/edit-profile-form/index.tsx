'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
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
	FieldGroup,
	FieldSeparator
} from '@/shared/components/ui/field'
import { Spinner } from '@/shared/components/ui/spinner'
import { useRouter } from 'next/navigation'
import { updateUser } from '@/shared/api/user'
import type { User } from '@/shared/types'

const editProfileSchema = z.object({
	name: z
		.string()
		.min(2, 'Имя должно содержать минимум 2 символа')
		.max(15, 'Имя должно быть максимум 15 символов'),
	surname: z
		.string()
		.min(2, 'Фамилия должна содержать минимум 2 символа')
		.max(15, 'Фамилия должна быть максимум 15 символов')
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface EditProfileFormWidgetProps {
	user: User
	onCancel: () => void
	onSuccess: () => void
}

export function EditProfileFormWidget({
	user,
	onCancel,
	onSuccess
}: EditProfileFormWidgetProps) {
	console.log(
		'[v0] EditProfileFormWidget - Rendering with user:',
		JSON.stringify(user)
	)

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const router = useRouter()
	const isKnownPassword = localStorage.getItem('is_known_password') === 'true'
	console.log('is_known_password', isKnownPassword)

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty }
	} = useForm<EditProfileFormData>({
		resolver: zodResolver(editProfileSchema),
		defaultValues: {
			name: user.name,
			surname: user.surname
		}
	})

	const onSubmit = async (data: EditProfileFormData) => {
		console.log('[v0] EditProfileFormWidget - onSubmit called with:', data)
		setIsLoading(true)
		setError(null)

		try {
			console.log('[v0] EditProfileFormWidget - Calling updateUser API')
			await updateUser(data)

			console.log('[v0] EditProfileFormWidget - Update success')
			setSuccess(true)
			toast.success('Профиль обновлён')

			setTimeout(() => {
				console.log('[v0] EditProfileFormWidget - Calling onSuccess')
				onSuccess()
			}, 500)
		} catch (err: unknown) {
			console.error('[v0] EditProfileFormWidget - Update error:', err)
			const errorMessage =
				err instanceof Error ? err.message : 'Ошибка обновления профиля'
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							console.log(
								'[v0] EditProfileFormWidget - Back clicked'
							)
							onCancel()
						}}
					>
						<ArrowLeft className="size-4" />
					</Button>
					<div>
						<CardTitle className="text-xl">
							Редактирование
						</CardTitle>
						<CardDescription>
							Измените данные профиля
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="edit-name">Имя</FieldLabel>
							<Input
								id="edit-name"
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
							<FieldLabel htmlFor="edit-surname">
								Фамилия
							</FieldLabel>
							<Input
								id="edit-surname"
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

						{success && (
							<div className="text-center text-sm text-green-600">
								Профиль обновлён
							</div>
						)}

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => {
									console.log(
										'[v0] EditProfileFormWidget - Cancel clicked'
									)
									onCancel()
								}}
							>
								Отмена
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={isLoading || !isDirty || success}
							>
								{isLoading && <Spinner />}
								Сохранить
							</Button>
						</div>

						<FieldSeparator />

						<div className="text-center">
							{isKnownPassword ? (
								<>
									<p className="text-muted-foreground mb-2 text-sm">
										Для смены пароля потребуется код
										подтверждения на email
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											console.log(
												'[v0] EditProfileFormWidget - Navigate to /change-password'
											)
											router.push('/change-password')
										}}
									>
										Сменить пароль
									</Button>
								</>
							) : (
								<>
									<p className="text-muted-foreground mb-2 text-sm">
										Задайте пароль Вашему аккаунту
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											console.log(
												'[v0] SetPasswordFormWidget - Navigate to /set-password'
											)
											router.push('/set-password')
										}}
									>
										Задать пароль
									</Button>
								</>
							)}
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}

export default EditProfileFormWidget
