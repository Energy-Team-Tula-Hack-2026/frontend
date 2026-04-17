import api from './instance'
import { normalizeApiError } from './errors'

const API_PREFIX = '/api/v2'

export type UploadPhotoResponse = {
	url: string
}

function pickUploadedPhotoUrl(payload: unknown): string | null {
	if (!payload || typeof payload !== 'object') return null

	const data = payload as Record<string, unknown>
	const directCandidates = [
		data.url,
		data.image_url,
		data.avatar_url,
		data.file_url,
		data.photo_url
	]

	for (const candidate of directCandidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate
		}
	}

	const nested = data.data
	if (nested && typeof nested === 'object') {
		const nestedData = nested as Record<string, unknown>
		const nestedCandidates = [
			nestedData.url,
			nestedData.image_url,
			nestedData.avatar_url,
			nestedData.file_url,
			nestedData.photo_url
		]

		for (const candidate of nestedCandidates) {
			if (typeof candidate === 'string' && candidate.trim()) {
				return candidate
			}
		}
	}

	return null
}

export async function uploadPhoto(file: File): Promise<UploadPhotoResponse> {
	const formData = new FormData()
	formData.append('file', file)

	try {
		// Browser/axios sets the multipart boundary automatically for FormData.
		const response = await api.post(`${API_PREFIX}/media/photo`, formData)
		const uploadedUrl = pickUploadedPhotoUrl(response.data)

		if (!uploadedUrl) {
			throw new Error('Upload response does not contain photo URL')
		}

		return { url: uploadedUrl }
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить фото')
	}
}
