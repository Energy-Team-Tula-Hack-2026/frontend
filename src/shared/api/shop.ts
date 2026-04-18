import api from '@/shared/api/instance'
import { normalizeApiError } from '@/shared/api/errors'

const API_PREFIX = '/api/v2/shop'

export type ShopItemDto = {
	id: string
	seller_id: string
	title: string
	description: string
	quantity: number
	price: number
	link: string | null
	image_url: string | null
	images?: ShopItemImageDto[]
}

export type ShopItemImageDto = {
	id: string
	item_id: string
	image_url: string
}

export type ShopItemCreatePayload = {
	title: string
	description: string
	quantity: number
	price: number
	link?: string
	image_url?: string
	image_urls?: string[]
}

export type ShopItemUpdatePayload = Partial<
	Omit<ShopItemCreatePayload, 'image_url'>
> & {
	image_url?: string
	image_urls?: string[]
}

export type ShopCartItemDto = {
	user_id: string
	item_id: string
	quantity: number
	item: ShopItemDto
}

export type ShopCartCreatePayload = {
	item_id: string
	quantity: number
}

export type ShopCartUpdatePayload = {
	quantity: number
}

export type ShopPurchaseDto = {
	id: string
	user_id: string
	item_id: string
	quantity: number
	payment_id: string | null
	confirmation_url: string | null
	amount: number
	purchase_used_bonuses: number
	idempotence_key: string | null
	confirmed: boolean
	is_cancelled: boolean
	confirmed_at: string | null
}

export type ShopCreatePurchasePayload = {
	item_id: string
	quantity: number
	return_url: string
}

export type ShopCreatePurchaseResponse = {
	payment_id: string | null
	payment_url: string | null
}

export type ShopPaymentStatusResponse = {
	payment_id: string
	confirmed: boolean
}

export type ShopWebhookPayload = {
	event: string
	object: {
		id: string
		status: string
	}
}

export type ShopOperationResponse = {
	status: string
	detail: string
}

export async function sendShopPaymentWebhook(
	data: ShopWebhookPayload
): Promise<Record<string, string>> {
	try {
		const response = await api.post(`${API_PREFIX}/payment/webhook`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось отправить webhook')
	}
}

export async function getShopItems(): Promise<ShopItemDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/items`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить товары')
	}
}

export async function createShopItem(
	data: ShopItemCreatePayload
): Promise<ShopItemDto> {
	try {
		const response = await api.post(`${API_PREFIX}/items`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось создать товар')
	}
}

export async function getShopItemById(itemId: string): Promise<ShopItemDto> {
	try {
		const response = await api.get(`${API_PREFIX}/items/${itemId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить товар')
	}
}

export async function updateShopItem(
	itemId: string,
	data: ShopItemUpdatePayload
): Promise<ShopItemDto> {
	try {
		const response = await api.patch(`${API_PREFIX}/items/${itemId}`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось обновить товар')
	}
}

export async function deleteShopItem(
	itemId: string
): Promise<ShopOperationResponse> {
	try {
		const response = await api.delete(`${API_PREFIX}/items/${itemId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось удалить товар')
	}
}

export async function getShopCart(): Promise<ShopCartItemDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/cart`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить корзину')
	}
}

export async function addShopItemToCart(
	data: ShopCartCreatePayload
): Promise<ShopCartItemDto> {
	try {
		const response = await api.post(`${API_PREFIX}/cart`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось добавить товар в корзину')
	}
}

export async function clearShopCart(): Promise<ShopOperationResponse> {
	try {
		const response = await api.delete(`${API_PREFIX}/cart`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось очистить корзину')
	}
}

export async function updateShopCartItem(
	itemId: string,
	data: ShopCartUpdatePayload
): Promise<ShopCartItemDto> {
	try {
		const response = await api.patch(`${API_PREFIX}/cart/${itemId}`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось обновить количество товара')
	}
}

export async function removeShopCartItem(
	itemId: string
): Promise<ShopOperationResponse> {
	try {
		const response = await api.delete(`${API_PREFIX}/cart/${itemId}`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось удалить товар из корзины')
	}
}

export async function getShopPurchases(): Promise<ShopPurchaseDto[]> {
	try {
		const response = await api.get(`${API_PREFIX}/purchases`)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось загрузить историю покупок')
	}
}

export async function createShopPurchase(
	data: ShopCreatePurchasePayload
): Promise<ShopCreatePurchaseResponse> {
	try {
		const response = await api.post(`${API_PREFIX}/purchases`, data)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось создать покупку')
	}
}

export async function getShopPaymentStatus(
	paymentId: string
): Promise<ShopPaymentStatusResponse> {
	try {
		const response = await api.get(
			`${API_PREFIX}/payment/${paymentId}/status`
		)
		return response.data
	} catch (error) {
		throw normalizeApiError(error, 'Не удалось проверить статус платежа')
	}
}
