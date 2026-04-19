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
import {
	registerOrganization,
	requestOrganizationPasswordChange,
	verifyOrganization
} from '@/shared/api/organization'
import { normalizeApiError } from '@/shared/api/errors'

const CODE_LENGTH = 6
const RESEND_TIMEOUT = 120

type VerifyMode =
	| 'verify-email'
	| 'change-password'
	| 'change-password-organization'
	| 'verify-organization'

export function VerifyCodeFormWidget() {
	const searchParams = useSearchParams()
	const router = useRouter()

	const email = searchParams.get('email') || ''
	const rawMode = searchParams.get('mode')
	const mode: VerifyMode =
		rawMode === 'change-password'
			? 'change-password'
			: rawMode === 'change-password-organization'
				? 'change-password-organization'
				: rawMode === 'verify-organization'
					? 'verify-organization'
					: 'verify-email'

	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT)
	const [canResend, setCanResend] = useState(false)

	const isOrganizationPasswordFlow = mode === 'change-password-organization'

	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(
				() => setResendTimer(resendTimer - 1),
				1000
			)
			return () => clearTimeout(timer)
		}
		setCanResend(true)
	}, [resendTimer])

	const handleSubmit = async () => {
		if (isLoading) return

		if (code.length !== CODE_LENGTH) {
			const message = 'Введите полный код'
			setError(message)
			toast.error(message)
			return
		}

		if (!email) {
			const message = 'Не найден email для подтверждения'
			setError(message)
			toast.error(message)
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			if (mode === 'verify-organization' || isOrganizationPasswordFlow) {
				const tokens = await verifyOrganization({
					email,
					verify_code: code
				})
				TokenManager.saveTokens(tokens)
				TokenManager.saveAuthMethod('organization')
				toast.success(
					mode === 'verify-organization'
						? 'Организация подтверждена'
						: 'Пароль сотрудника подтвержден'
				)
				window.location.assign('/admin')
				return
			}

			const tokens = await verifyCode({ email, code })
			TokenManager.saveTokens(tokens)
			TokenManager.saveAuthMethod('password')

			if (mode === 'change-password') {
				toast.success('Пароль успешно подтвержден')
			} else {
				toast.success('Email подтвержден')
			}

			window.location.assign('/profile')
		} catch (err: unknown) {
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
		if (!canResend || isLoading) return

		if (
			(mode === 'verify-email' ||
				mode === 'verify-organization' ||
				isOrganizationPasswordFlow) &&
			!email
		) {
			const message = 'Не найден email для повторной отправки'
			setError(message)
			toast.error(message)
			return
		}

		const pendingPasswordChange =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_password_change')
				: null
		const parsedPasswordChange = pendingPasswordChange
			? JSON.parse(pendingPasswordChange)
			: null
		const pendingOrganizationPasswordChange =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_organization_password_change')
				: null
		const parsedOrganizationPasswordChange =
			pendingOrganizationPasswordChange
				? JSON.parse(pendingOrganizationPasswordChange)
				: null

		const pendingRegisterChange =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_register_change')
				: null
		const parsedRegisterChange = pendingRegisterChange
			? JSON.parse(pendingRegisterChange)
			: null

		const pendingOrganizationRegister =
			typeof window !== 'undefined'
				? sessionStorage.getItem('pending_organization_register')
				: null
		const parsedOrganizationRegister = pendingOrganizationRegister
			? JSON.parse(pendingOrganizationRegister)
			: null

		setCanResend(false)
		setResendTimer(RESEND_TIMEOUT)
		setError(null)

		try {
			if (mode === 'change-password') {
				await changePassword(parsedPasswordChange.newPassword)
				toast.success('Код для смены пароля отправлен повторно')
				return
			}

			if (isOrganizationPasswordFlow) {
				await requestOrganizationPasswordChange(
					parsedOrganizationPasswordChange.newPassword
				)
				toast.success('Код для смены пароля отправлен повторно')
				return
			}

			if (mode === 'verify-organization') {
				await registerOrganization({
					name: parsedOrganizationRegister.name,
					email: parsedOrganizationRegister.email,
					password: parsedOrganizationRegister.password,
					description: parsedOrganizationRegister.description,
					website_link: parsedOrganizationRegister.website_link
				})
				toast.success('Код подтверждения отправлен повторно')
				return
			}

			await register({
				name: parsedRegisterChange.name,
				surname: parsedRegisterChange.surname,
				email: parsedRegisterChange.email,
				password: parsedRegisterChange.password
			})
			toast.success('Код подтверждения отправлен повторно')
		} catch (err: unknown) {
			const apiError = normalizeApiError(err, 'Ошибка отправки кода')
			setError(apiError.message)
			toast.error(apiError.message)
			setCanResend(true)
			setResendTimer(0)
		}
	}

	useEffect(() => {
		if (code.length === CODE_LENGTH) {
			handleSubmit()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [code])

	const title =
		mode === 'change-password'
			? isOrganizationPasswordFlow
				? 'Подтверждение смены пароля сотрудника'
				: 'Подтверждение смены пароля'
			: mode === 'change-password-organization'
				? 'Подтверждение смены пароля сотрудника'
				: mode === 'verify-organization'
					? 'Подтверждение организации'
					: 'Подтверждение'

	const description =
		mode === 'change-password' ||
		mode === 'change-password-organization' ||
		isOrganizationPasswordFlow
			? `Введите код, отправленный на ${email} для подтверждения смены пароля`
			: `Введите код, отправленный на ${email}`

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
						onChange={(val) => setCode(val)}
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
