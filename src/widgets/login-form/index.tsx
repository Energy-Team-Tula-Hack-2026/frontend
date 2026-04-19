'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/components/ui/select'

import { login, getOAuthUrl, TokenManager } from '@/shared/api/auth'
import { loginOrganization } from '@/shared/api/organization'

const loginSchema = z.object({
	email: z.string().email('Введите корректный email'),
	password: z.string().min(1, 'Введите пароль')
})

type LoginFormData = z.infer<typeof loginSchema>
const LOGIN_ERROR_MESSAGE = 'Не удалось войти. Проверьте email и пароль.'

export function LoginFormWidget() {
	const searchParams = useSearchParams()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [accountType, setAccountType] = useState<'user' | 'organization'>(
		'user'
	)

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema)
	})

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true)
		setError(null)

		try {
			const tokens =
				accountType === 'organization'
					? await loginOrganization({
							email: data.email,
							password: data.password
						})
					: await login(data)

			TokenManager.saveTokens(tokens)
			TokenManager.saveAuthMethod(
				accountType === 'organization' ? 'organization' : 'password'
			)

			toast.success('Успешный вход')
			const nextParam = searchParams.get('next')
			const fallbackPath =
				accountType === 'organization' ? '/admin' : '/profile'
			const isSafeNext = Boolean(nextParam?.startsWith('/'))
			const isAllowedForOrganization =
				accountType !== 'organization' ||
				nextParam?.startsWith('/admin') ||
				nextParam?.startsWith('/profile') ||
				nextParam?.startsWith('/change-password')

			window.location.assign(
				isSafeNext && isAllowedForOrganization
					? nextParam!
					: fallbackPath
			)
		} catch {
			setError(LOGIN_ERROR_MESSAGE)
			toast.error(LOGIN_ERROR_MESSAGE)
		} finally {
			setIsLoading(false)
		}
	}

	const handleOAuth = (provider: 'google' | 'yandex') => {
		const url = getOAuthUrl(provider)
		window.location.href = url
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Вход</CardTitle>
				<CardDescription>Войдите в свой аккаунт</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					<div className="space-y-2">
						<p className="text-sm font-medium">Тип аккаунта</p>
						<Select
							value={accountType}
							onValueChange={(value: 'user' | 'organization') =>
								setAccountType(value)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="user">
									Пользователь
								</SelectItem>
								<SelectItem value="organization">
									Организатор
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{accountType === 'user' && (
						<>
							<div className="flex flex-col gap-3">
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => handleOAuth('google')}
								>
									<GoogleIcon className="size-5" />
									Войти через Google
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => handleOAuth('yandex')}
								>
									<YandexIcon className="size-5" />
									Войти через Яндекс
								</Button>
							</div>

							<FieldSeparator>или</FieldSeparator>
						</>
					)}

					<form onSubmit={handleSubmit(onSubmit)}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="example@mail.ru"
									{...register('email')}
									aria-invalid={!!errors.email}
								/>
								{errors.email && (
									<FieldError>
										{errors.email.message}
									</FieldError>
								)}
							</Field>

							<Field>
								<FieldLabel htmlFor="password">
									Пароль
								</FieldLabel>
								<div className="relative">
									<Input
										id="password"
										type={
											showPassword ? 'text' : 'password'
										}
										placeholder="Введите пароль"
										className="pr-10"
										{...register('password')}
										aria-invalid={!!errors.password}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
										onClick={() =>
											setShowPassword((prev) => !prev)
										}
										aria-label={
											showPassword
												? 'Скрыть пароль'
												: 'Показать пароль'
										}
									>
										{showPassword ? (
											<EyeOff className="size-4" />
										) : (
											<Eye className="size-4" />
										)}
									</Button>
								</div>
								{errors.password && (
									<FieldError>
										{errors.password.message}
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
								Войти
							</Button>
						</FieldGroup>
					</form>

					<p className="text-muted-foreground text-center text-sm">
						Нет аккаунта?{' '}
						<Link
							href="/register"
							className="text-primary hover:underline"
						>
							Зарегистрироваться
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	)
}

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="currentColor"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="currentColor"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="currentColor"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
	)
}

function YandexIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.5 15h-2.1v-5.6L9.2 17H7l4-6.5V6h2.5v11z"
			/>
		</svg>
	)
}

export default LoginFormWidget
