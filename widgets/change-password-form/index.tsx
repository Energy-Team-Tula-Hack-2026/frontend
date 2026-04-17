'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

import { changePassword, requestPasswordChange } from '@/shared/api/auth'
import { useUser } from '@/shared/hooks/use-user'
import { normalizeApiError } from '@/shared/api/errors'

const changePasswordSchema = z
	.object({
		newPassword: z
			.string()
			.min(6, 'Новый пароль должен содержать минимум 6 символов'),
		confirmPassword: z.string().min(1, 'Подтвердите новый пароль')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword']
	})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export function ChangePasswordFormWidget() {
	console.log('[v0] ChangePasswordFormWidget - Rendering')

	const router = useRouter()
	const { user, isLoading: isUserLoading, isAuthenticated } = useUser()

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isValid }
	} = useForm<ChangePasswordFormData>({
		resolver: zodResolver(changePasswordSchema),
		mode: 'onChange',
		defaultValues: {
			newPassword: '',
			confirmPassword: ''
		}
	})

	const onSubmit = async (data: ChangePasswordFormData) => {
		console.log('[v0] ChangePasswordFormWidget - onSubmit called')

		if (!user?.email) {
			console.error(
				'[v0] ChangePasswordFormWidget - User email is missing'
			)
			setSubmitError('Не удалось определить email пользователя')
			return
		}

		setIsSubmitting(true)
		setSubmitError(null)

		try {
			console.log(
				'[v0] ChangePasswordFormWidget - Saving pending password change data'
			)

			sessionStorage.setItem(
				'pending_password_change',
				JSON.stringify({
					newPassword: data.newPassword
				})
			)

			console.log(
				'[v0] ChangePasswordFormWidget - Requesting password change code'
			)
			await changePassword(data.newPassword)

			toast.success('Код подтверждения отправлен на email')

			console.log(
				'[v0] ChangePasswordFormWidget - Redirecting to verify page'
			)
			router.push(
				`/verify?mode=change-password&email=${encodeURIComponent(user.email)}`
			)
		} catch (err: unknown) {
			console.error('[v0] ChangePasswordFormWidget - Request error:', err)

			const apiError = normalizeApiError(
				err,
				'Неверно введен текущий пароль'
			)
			setSubmitError(apiError.message)
			toast.error(apiError.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isUserLoading) {
		console.log('[v0] ChangePasswordFormWidget - User loading')
		return <Spinner className="size-8" />
	}

	if (!isAuthenticated || !user) {
		console.log(
			'[v0] ChangePasswordFormWidget - Not authenticated, redirecting to /login'
		)
		router.push('/login')
		return null
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
								'[v0] ChangePasswordFormWidget - Back clicked'
							)
							router.push('/profile')
						}}
					>
						<ArrowLeft className="size-4" />
					</Button>

					<div>
						<CardTitle className="text-xl">Смена пароля</CardTitle>
						<CardDescription>
							Введите текущий и новый пароль
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="new-password">
								Новый пароль
							</FieldLabel>
							<div className="relative">
								<Input
									id="new-password"
									type={showNewPassword ? 'text' : 'password'}
									placeholder="Введите новый пароль"
									className="pr-10"
									{...register('newPassword')}
									aria-invalid={!!errors.newPassword}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
									onClick={() =>
										setShowNewPassword((prev) => !prev)
									}
									aria-label={
										showNewPassword
											? 'Скрыть новый пароль'
											: 'Показать новый пароль'
									}
								>
									{showNewPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</Button>
							</div>
							{errors.newPassword && (
								<FieldError>
									{errors.newPassword.message}
								</FieldError>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="confirm-password">
								Подтвердите новый пароль
							</FieldLabel>
							<div className="relative">
								<Input
									id="confirm-password"
									type={
										showConfirmPassword
											? 'text'
											: 'password'
									}
									placeholder="Повторите новый пароль"
									className="pr-10"
									{...register('confirmPassword')}
									aria-invalid={!!errors.confirmPassword}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
									onClick={() =>
										setShowConfirmPassword((prev) => !prev)
									}
									aria-label={
										showConfirmPassword
											? 'Скрыть подтверждение пароля'
											: 'Показать подтверждение пароля'
									}
								>
									{showConfirmPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</Button>
							</div>
							{errors.confirmPassword && (
								<FieldError>
									{errors.confirmPassword.message}
								</FieldError>
							)}
						</Field>

						{submitError && (
							<div className="text-destructive text-center text-sm">
								{submitError}
							</div>
						)}

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => {
									console.log(
										'[v0] ChangePasswordFormWidget - Cancel clicked'
									)
									router.push('/profile')
								}}
							>
								Отмена
							</Button>

							<Button
								type="submit"
								className="flex-1"
								disabled={isSubmitting || !isValid}
							>
								{isSubmitting && <Spinner />}
								Продолжить
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}

export default ChangePasswordFormWidget
