'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot
} from '@/shared/components/ui/input-otp'
import { Spinner } from '@/shared/components/ui/spinner'

import {
	verifyCode,
	TokenManager,
	changePassword,
	register
} from '@/shared/api/auth'
import { normalizeApiError } from '@/shared/api/errors'

const CODE_LENGTH = 6
const RESEND_TIMEOUT = 120

type VerifyMode = 'verify-email' | 'change-password'

export function VerifyCodeFormWidget() {
	console.log('[v0] VerifyCodeFormWidget - Rendering')

	const searchParams = useSearchParams()
	const router = useRouter()

	const email = searchParams.get('email') || ''
	const rawMode = searchParams.get('mode')
	const mode: VerifyMode =
		rawMode === 'change-password' ? 'change-password' : 'verify-email'

	console.log('[v0] VerifyCodeFormWidget - Mode:', mode)
	console.log('[v0] VerifyCodeFormWidget - Email from URL:', email)

	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT)
	const [canResend, setCanResend] = useState(false)

	useEffect(() => {
		console.log('[v0] VerifyCodeFormWidget - Resend timer:', resendTimer)

		if (resendTimer > 0) {
			const timer = setTimeout(
				() => setResendTimer(resendTimer - 1),
				1000
			)
			return () => clearTimeout(timer)
		} else {
			setCanResend(true)
			console.log('[v0] VerifyCodeFormWidget - Resend enabled')
		}
	}, [resendTimer])

	const handleSubmit = async () => {
		if (isLoading) return

		console.log('[v0] VerifyCodeFormWidget - handleSubmit called')
		console.log('[v0] VerifyCodeFormWidget - Code:', code)
		console.log('[v0] VerifyCodeFormWidget - Code length:', code.length)
		console.log('[v0] VerifyCodeFormWidget - Mode:', mode)

		if (code.length !== CODE_LENGTH) {
			console.log('[v0] VerifyCodeFormWidget - Code incomplete')
			setError('Введите полный код')
			return
		}

		if (!email) {
			console.log('[v0] VerifyCodeFormWidget - Email is missing')
			setError('Не найден email для подтверждения')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			console.log('[v0] VerifyCodeFormWidget - Calling verifyCode API')
			const tokens = await verifyCode({ email, code })

			console.log(
				'[v0] VerifyCodeFormWidget - Verification success, saving tokens'
			)
			TokenManager.saveTokens(tokens)
			TokenManager.saveAuthMethod('password')

			if (mode === 'change-password') {
				toast.success('Пароль успешно подтверждён')
				console.log(
					'[v0] VerifyCodeFormWidget - Password change confirmed, redirecting to /profile'
				)
			} else {
				toast.success('Email подтвержден!')
				console.log(
					'[v0] VerifyCodeFormWidget - Email verified, redirecting to /profile'
				)
			}

			router.push('/profile')
		} catch (err: unknown) {
			console.error('[v0] VerifyCodeFormWidget - Verify error:', err)

			const apiError = normalizeApiError(
				err,
				'Неверный код подтверждения'
			)
			setError(apiError.message)

			toast.error(apiError.message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleResend = async () => {
		console.log('[v0] VerifyCodeFormWidget - handleResend called')
		console.log('[v0] VerifyCodeFormWidget - canResend:', canResend)
		console.log('[v0] VerifyCodeFormWidget - mode:', mode)

		if (!canResend || isLoading) return

		if (mode === 'verify-email' && !email) {
			setError('Не найден email для повторной отправки')
			return
		}

		const pendingPasswordChange =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_password_change')
				: null

		const parsedPasswordChange = pendingPasswordChange
			? JSON.parse(pendingPasswordChange)
			: null

		const pendingRegisterChange =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_register_change')
				: null

		const parsedRegisterChange = pendingPasswordChange
			? JSON.parse(pendingRegisterChange as string)
			: null

		setCanResend(false)
		setResendTimer(RESEND_TIMEOUT)
		setError(null)

		try {
			if (mode === 'change-password') {
				console.log(
					'[v0] VerifyCodeFormWidget - Calling requestPasswordChange API'
				)
				await changePassword(parsedPasswordChange.newPassword)
				console.log(
					'[v0] VerifyCodeFormWidget - Password change code resent successfully'
				)
				toast.success('Код для смены пароля отправлен повторно')
			} else {
				console.log(
					'[v0] VerifyCodeFormWidget - Calling resendVerificationCode API'
				)
				const data = {
					name: parsedRegisterChange.name,
					surname: parsedRegisterChange.surname,
					email: parsedRegisterChange.email,
					password: parsedRegisterChange.password
				}
				await register(data)
				console.log(
					'[v0] VerifyCodeFormWidget - Registration code resent successfully'
				)
				toast.success('Код подтверждения отправлен повторно')
			}
		} catch (err: unknown) {
			console.error('[v0] VerifyCodeFormWidget - Resend error:', err)

			const apiError = normalizeApiError(err, 'Ошибка отправки кода')

			setError(apiError.message)
			toast.error(apiError.message)
			setCanResend(true)
			setResendTimer(0)
		}
	}

	useEffect(() => {
		console.log('[v0] VerifyCodeFormWidget - Code changed:', code)

		if (code.length === CODE_LENGTH) {
			console.log(
				'[v0] VerifyCodeFormWidget - Code complete, auto-submitting'
			)
			handleSubmit()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [code])

	const title =
		mode === 'change-password'
			? 'Подтверждение смены пароля'
			: 'Подтверждение'

	const description =
		mode === 'change-password' ? (
			<>
				Введите код, отправленный на{' '}
				<span className="text-foreground font-medium">{email}</span> для
				подтверждения смены пароля
			</>
		) : (
			<>
				Введите код, отправленный на{' '}
				<span className="text-foreground font-medium">{email}</span>
			</>
		)

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="flex flex-col items-center gap-6">
					<InputOTP
						maxLength={CODE_LENGTH}
						value={code}
						onChange={(val) => {
							console.log(
								'[v0] VerifyCodeFormWidget - OTP onChange:',
								val
							)
							setCode(val)
						}}
						disabled={isLoading}
					>
						<InputOTPGroup>
							{Array.from({ length: CODE_LENGTH }).map((_, i) => (
								<InputOTPSlot key={i} index={i} />
							))}
						</InputOTPGroup>
					</InputOTP>

					{error && (
						<div className="text-destructive text-center text-sm">
							{error}
						</div>
					)}

					<Button
						onClick={handleSubmit}
						className="w-full"
						disabled={isLoading || code.length !== CODE_LENGTH}
					>
						{isLoading && <Spinner />}
						Подтвердить
					</Button>

					<div className="text-muted-foreground text-center text-sm">
						Не получили код?{' '}
						{canResend ? (
							<button
								onClick={handleResend}
								className="text-primary hover:underline"
							>
								Отправить повторно
							</button>
						) : (
							<span>
								Повторная отправка через {resendTimer} сек.
							</span>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default VerifyCodeFormWidget
