import axios, { AxiosError } from 'axios'

export class ApiError extends Error {
	status: number | null
	code?: string
	details?: unknown
	isUserError: boolean

	constructor(params: {
		message: string
		status?: number | null
		code?: string
		details?: unknown
		isUserError?: boolean
	}) {
		super(params.message)
		this.name = 'ApiError'
		this.status = params.status ?? null
		this.code = params.code
		this.details = params.details
		this.isUserError = params.isUserError ?? false
	}
}

type BackendErrorPayload = {
	message?: string
	detail?: string | Array<{ msg?: string }>
	error?: string
	errors?: Record<string, string[] | string>
	code?: string
}

function extractBackendMessage(
	data: BackendErrorPayload | unknown
): string | null {
	if (!data || typeof data !== 'object') return null

	const payload = data as BackendErrorPayload

	if (typeof payload.message === 'string' && payload.message.trim()) {
		return payload.message
	}

	if (typeof payload.detail === 'string' && payload.detail.trim()) {
		return payload.detail
	}

	if (Array.isArray(payload.detail)) {
		const messages = payload.detail
			.map((item) => item.msg)
			.filter((message): message is string => Boolean(message?.trim()))

		if (messages.length > 0) {
			return messages.join(', ')
		}
	}

	if (typeof payload.error === 'string' && payload.error.trim()) {
		return payload.error
	}

	if (payload.errors && typeof payload.errors === 'object') {
		const firstEntry = Object.entries(payload.errors)[0]
		if (!firstEntry) return null

		const [, value] = firstEntry

		if (Array.isArray(value) && value.length > 0) {
			return String(value[0])
		}

		if (typeof value === 'string' && value.trim()) {
			return value
		}
	}

	return null
}

export function normalizeApiError(
	error: unknown,
	fallbackMessage = 'Произошла ошибка'
): ApiError {
	if (error instanceof ApiError) {
		return error
	}

	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError<BackendErrorPayload>
		const status = axiosError.response?.status ?? null
		const responseData = axiosError.response?.data

		const backendMessage = extractBackendMessage(responseData)

		if (status && status >= 400 && status < 500) {
			return new ApiError({
				message: backendMessage ?? fallbackMessage,
				status,
				code: responseData?.code,
				details: responseData,
				isUserError: true
			})
		}

		if (status && status >= 500) {
			return new ApiError({
				message: 'Ошибка сервера. Попробуйте позже.',
				status,
				code: responseData?.code,
				details: responseData,
				isUserError: false
			})
		}

		if (axiosError.request) {
			return new ApiError({
				message:
					'Не удалось связаться с сервером. Проверьте интернет-соединение.',
				status: null,
				details: responseData,
				isUserError: false
			})
		}

		return new ApiError({
			message: fallbackMessage,
			status: null,
			details: responseData,
			isUserError: false
		})
	}

	if (error instanceof Error) {
		return new ApiError({
			message: error.message || fallbackMessage,
			status: null,
			details: error,
			isUserError: false
		})
	}

	return new ApiError({
		message: fallbackMessage,
		status: null,
		details: error,
		isUserError: false
	})
}
