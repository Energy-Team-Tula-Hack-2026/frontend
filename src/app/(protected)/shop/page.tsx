'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
	Coins,
	ExternalLink,
	Loader2,
	RefreshCw,
	Search,
	ShoppingCart,
	Sparkles,
	Trash2
} from 'lucide-react'
import { toast } from 'sonner'

import { normalizeApiError } from '@/shared/api/errors'
import { useUser } from '@/shared/hooks/use-user'
import {
	addShopItemToCart,
	clearShopCart,
	createShopPurchase,
	getShopCart,
	getShopItemById,
	getShopItems,
	getShopPurchases,
	removeShopCartItem,
	type ShopCartItemDto,
	type ShopItemDto,
	type ShopPurchaseDto,
	updateShopCartItem
} from '@/shared/api/shop'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Slider } from '@/shared/components/ui/slider'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '@/shared/components/ui/tabs'
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious
} from '@/shared/components/ui/carousel'

const PLACEHOLDER_IMAGE = '/placeholder-logo.png'
const BONUSES_PER_RUBLE = 10

function formatPrice(price: number): string {
	return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
}

function getImage(url?: string | null): string {
	return url || PLACEHOLDER_IMAGE
}

function getItemImages(item?: ShopItemDto | null): string[] {
	if (!item) return [PLACEHOLDER_IMAGE]

	const imageUrls = [
		...(item.images?.map((image) => image.image_url).filter(Boolean) ?? []),
		...(item.image_url ? [item.image_url] : [])
	]

	const unique = Array.from(new Set(imageUrls))
	return unique.length > 0 ? unique : [PLACEHOLDER_IMAGE]
}

function isPendingPurchase(purchase: ShopPurchaseDto): boolean {
	return !purchase.confirmed && !purchase.is_cancelled
}

function getMaxUsableBonuses(
	totalPrice: number,
	availableBonuses: number
): number {
	const maxBonusesForPurchase = Math.max(
		0,
		Math.floor((totalPrice - 1) * BONUSES_PER_RUBLE)
	)
	return Math.min(availableBonuses, maxBonusesForPurchase)
}

export default function ShopPage() {
	const { user, mutate: mutateUser } = useUser()
	const [items, setItems] = useState<ShopItemDto[]>([])
	const [cart, setCart] = useState<ShopCartItemDto[]>([])
	const [purchases, setPurchases] = useState<ShopPurchaseDto[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [busyItemId, setBusyItemId] = useState<string | null>(null)
	const [busyCartId, setBusyCartId] = useState<string | null>(null)
	const [isClearingCart, setIsClearingCart] = useState(false)

	const [search, setSearch] = useState('')
	const [activeItem, setActiveItem] = useState<ShopItemDto | null>(null)
	const [isDetailsOpen, setIsDetailsOpen] = useState(false)
	const [isDetailsLoading, setIsDetailsLoading] = useState(false)
	const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)
	const [buyItem, setBuyItem] = useState<ShopItemDto | null>(null)
	const [buyQuantity, setBuyQuantity] = useState(1)
	const [buyUsedBonuses, setBuyUsedBonuses] = useState(0)

	const availableBonuses = user?.statistic?.available_for_purchases ?? 0

	const filteredItems = useMemo(
		() =>
			items.filter((item) =>
				`${item.title} ${item.description}`
					.toLowerCase()
					.includes(search.toLowerCase())
			),
		[items, search]
	)

	const cartTotal = useMemo(
		() =>
			cart.reduce(
				(sum, line) => sum + line.item.price * line.quantity,
				0
			),
		[cart]
	)

	const buyTotal = buyItem ? buyItem.price * Math.max(1, buyQuantity) : 0
	const maxUsableBonuses = getMaxUsableBonuses(buyTotal, availableBonuses)
	const normalizedBuyUsedBonuses = Math.min(
		maxUsableBonuses,
		Math.max(0, buyUsedBonuses)
	)
	const bonusDiscount = normalizedBuyUsedBonuses / BONUSES_PER_RUBLE
	const buyPaymentAmount = Math.max(1, buyTotal - bonusDiscount)

	const pendingPurchaseByItemId = useMemo(() => {
		const map = new Map<string, ShopPurchaseDto>()
		for (const purchase of purchases) {
			if (!isPendingPurchase(purchase)) continue
			if (!purchase.confirmation_url) continue
			map.set(purchase.item_id, purchase)
		}
		return map
	}, [purchases])

	const loadAll = async () => {
		setIsLoading(true)
		try {
			const [itemsData, cartData, purchasesData] = await Promise.all([
				getShopItems(),
				getShopCart(),
				getShopPurchases()
			])
			setItems(itemsData)
			setCart(cartData)
			setPurchases(purchasesData)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось загрузить магазин'
			)
			toast.error(apiError.message)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void loadAll()
	}, [])

	useEffect(() => {
		setBuyUsedBonuses((prev) =>
			Math.min(getMaxUsableBonuses(buyTotal, availableBonuses), prev)
		)
	}, [availableBonuses, buyTotal])

	const handleBuy = async (
		itemId: string,
		quantity: number,
		usedBonuses = 0
	) => {
		const pendingPurchase = pendingPurchaseByItemId.get(itemId)
		if (pendingPurchase?.confirmation_url) {
			window.location.href = pendingPurchase.confirmation_url
			return
		}

		const sourceItem =
			items.find((item) => item.id === itemId) ||
			cart.find((line) => line.item_id === itemId)?.item

		if (
			!sourceItem ||
			sourceItem.quantity < quantity ||
			sourceItem.quantity < 1
		) {
			toast.info('Товара нет в наличии')
			return
		}

		setBusyItemId(itemId)
		try {
			const returnUrl =
				typeof window !== 'undefined'
					? `${window.location.origin}/shop`
					: ''
			const result = await createShopPurchase({
				item_id: itemId,
				quantity,
				used_bonuses: usedBonuses,
				return_url: returnUrl
			})

			if (result.payment_url) {
				window.location.href = result.payment_url
				return
			}

			toast.success('Покупка оформлена')
			await mutateUser()
			await loadAll()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось оформить покупку'
			)
			toast.error(apiError.message)
		} finally {
			setBusyItemId(null)
		}
	}

	const openDetails = async (itemId: string) => {
		setIsDetailsOpen(true)
		setIsDetailsLoading(true)
		setActiveItem(null)
		try {
			const item = await getShopItemById(itemId)
			setActiveItem(item)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось открыть товар'
			)
			toast.error(apiError.message)
			setIsDetailsOpen(false)
		} finally {
			setIsDetailsLoading(false)
		}
	}

	const openBuyDialog = (item: ShopItemDto) => {
		setBuyItem(item)
		setBuyQuantity(1)
		setBuyUsedBonuses(0)
		setIsBuyDialogOpen(true)
	}

	const confirmBuyWithSelectedQuantity = async () => {
		if (!buyItem) return
		const max = Math.max(1, buyItem.quantity)
		const normalizedQuantity = Math.min(
			max,
			Math.max(1, Number.isFinite(buyQuantity) ? buyQuantity : 1)
		)
		const total = buyItem.price * normalizedQuantity
		const normalizedUsedBonuses = Math.min(
			getMaxUsableBonuses(total, availableBonuses),
			Math.max(0, buyUsedBonuses)
		)
		setIsBuyDialogOpen(false)
		await handleBuy(buyItem.id, normalizedQuantity, normalizedUsedBonuses)
	}

	return (
		<div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8 dark:border-emerald-900/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-cyan-950/20">
				<div className="relative">
					<Badge className="mb-3 w-fit bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
						<Sparkles className="mr-1 h-3.5 w-3.5" />
						Магазин ремесел
					</Badge>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Маркет товаров местных мастеров
					</h1>
					<p className="text-muted-foreground mt-2 max-w-3xl text-base sm:text-lg">
						Покупайте товары, управляйте корзиной и завершайте
						оплату в один клик.
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<Link href="/crafts">
							<Button variant="outline">К ремеслам</Button>
						</Link>
						<Link href="/seller">
							<Button variant="outline">Страница продавца</Button>
						</Link>
					</div>
				</div>
			</section>

			<Tabs defaultValue="catalog" className="space-y-4">
				<TabsList className="grid w-full grid-cols-3 gap-2">
					<TabsTrigger value="catalog">Каталог</TabsTrigger>
					<TabsTrigger value="cart">
						Корзина ({cart.length})
					</TabsTrigger>
					<TabsTrigger value="purchases">Покупки</TabsTrigger>
				</TabsList>

				<TabsContent value="catalog" className="space-y-4">
					<Card>
						<CardContent className="p-4">
							<div className="relative">
								<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input
									value={search}
									onChange={(event) =>
										setSearch(event.target.value)
									}
									placeholder="Поиск товаров"
									className="pl-9"
								/>
							</div>
						</CardContent>
					</Card>

					{isLoading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{Array.from({ length: 6 }).map((_, index) => (
								<Card key={`shop-skeleton-${index}`}>
									<Skeleton className="h-44 w-full rounded-b-none" />
									<CardHeader>
										<Skeleton className="h-5 w-2/3" />
										<Skeleton className="h-4 w-full" />
									</CardHeader>
								</Card>
							))}
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{filteredItems.map((item) => {
								const isOutOfStock = item.quantity < 1
								const canContinuePayment = Boolean(
									pendingPurchaseByItemId.get(item.id)
										?.confirmation_url
								)
								const itemImages = getItemImages(item)
								return (
									<Card
										key={item.id}
										className="overflow-hidden"
									>
										<div className="relative overflow-hidden border-b">
											<Carousel className="w-full">
												<CarouselContent className="-ml-0">
													{itemImages.map(
														(imageUrl, index) => (
															<CarouselItem
																key={`${item.id}-${imageUrl}-${index}`}
																className="pl-0"
															>
																<img
																	src={getImage(
																		imageUrl
																	)}
																	alt={`${item.title} - фото ${index + 1}`}
																	className="h-44 w-full object-cover"
																	onError={(
																		event
																	) => {
																		event.currentTarget.src =
																			PLACEHOLDER_IMAGE
																	}}
																/>
															</CarouselItem>
														)
													)}
												</CarouselContent>
												{itemImages.length > 1 && (
													<>
														<CarouselPrevious className="top-1/2 left-3 -translate-y-1/2 border-white/80 bg-white/85" />
														<CarouselNext className="top-1/2 right-3 -translate-y-1/2 border-white/80 bg-white/85" />
													</>
												)}
											</Carousel>
										</div>
										<CardHeader>
											<CardTitle className="line-clamp-1 text-lg">
												{item.title}
											</CardTitle>
											<CardDescription className="line-clamp-2">
												{item.description}
											</CardDescription>
										</CardHeader>
										<CardContent className="space-y-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													В наличии: {item.quantity}
												</span>
												<span className="font-semibold">
													{formatPrice(item.price)}
												</span>
											</div>
											<div className="grid grid-cols-2 gap-2">
												<Button
													variant="outline"
													onClick={() =>
														void openDetails(
															item.id
														)
													}
												>
													Подробнее
												</Button>
												<Button
													onClick={async () => {
														setBusyItemId(item.id)
														try {
															await addShopItemToCart(
																{
																	item_id:
																		item.id,
																	quantity: 1
																}
															)
															toast.success(
																'Товар добавлен в корзину'
															)
															setCart(
																await getShopCart()
															)
														} catch (error) {
															const apiError =
																normalizeApiError(
																	error,
																	'Не удалось добавить в корзину'
																)
															toast.error(
																apiError.message
															)
														} finally {
															setBusyItemId(null)
														}
													}}
													disabled={
														isOutOfStock ||
														busyItemId === item.id
													}
												>
													{busyItemId === item.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<ShoppingCart className="mr-2 h-4 w-4" />
													)}
													В корзину
												</Button>
											</div>
											<Button
												className="w-full"
												variant={
													isOutOfStock &&
													!canContinuePayment
														? 'outline'
														: 'secondary'
												}
												onClick={() =>
													canContinuePayment
														? void handleBuy(
																item.id,
																1
															)
														: openBuyDialog(item)
												}
												disabled={
													(isOutOfStock &&
														!canContinuePayment) ||
													busyItemId === item.id
												}
											>
												{canContinuePayment
													? 'Закончить оплату'
													: isOutOfStock
														? 'Нет в наличии'
														: 'Купить сейчас'}
											</Button>
										</CardContent>
									</Card>
								)
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="cart" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Корзина</CardTitle>
							<CardDescription>
								Сумма: {formatPrice(cartTotal)}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{cart.length === 0 && (
								<p className="text-muted-foreground text-sm">
									Корзина пока пуста.
								</p>
							)}
							{cart.map((line) => {
								const pendingPurchase =
									pendingPurchaseByItemId.get(line.item_id)
								const canContinuePayment = Boolean(
									pendingPurchase?.confirmation_url
								)
								const stock = line.item.quantity
								const canIncrease =
									stock > 0 && line.quantity < stock
								const isOutOfStock = stock < 1
								const exceedsStock = line.quantity > stock
								const canBuy =
									canContinuePayment ||
									(!isOutOfStock && !exceedsStock)

								return (
									<div
										key={line.item_id}
										className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="font-medium">
												{line.item.title}
											</p>
											<p className="text-muted-foreground text-sm">
												{formatPrice(line.item.price)} x{' '}
												{line.quantity}
											</p>
											{isOutOfStock &&
												!canContinuePayment && (
													<p className="text-sm text-red-600">
														Товара нет в наличии
													</p>
												)}
											{!isOutOfStock && exceedsStock && (
												<p className="text-sm text-amber-600">
													Доступно только {stock} шт.
												</p>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={async () => {
													setBusyCartId(line.item_id)
													try {
														await updateShopCartItem(
															line.item_id,
															{
																quantity:
																	Math.max(
																		1,
																		line.quantity -
																			1
																	)
															}
														)
														setCart(
															await getShopCart()
														)
													} catch (error) {
														const apiError =
															normalizeApiError(
																error,
																'Не удалось изменить количество'
															)
														toast.error(
															apiError.message
														)
													} finally {
														setBusyCartId(null)
													}
												}}
												disabled={
													busyCartId === line.item_id
												}
											>
												-
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={async () => {
													setBusyCartId(line.item_id)
													try {
														await updateShopCartItem(
															line.item_id,
															{
																quantity:
																	Math.min(
																		line.quantity +
																			1,
																		Math.max(
																			1,
																			stock
																		)
																	)
															}
														)
														setCart(
															await getShopCart()
														)
													} catch (error) {
														const apiError =
															normalizeApiError(
																error,
																'Не удалось изменить количество'
															)
														toast.error(
															apiError.message
														)
													} finally {
														setBusyCartId(null)
													}
												}}
												disabled={
													busyCartId ===
														line.item_id ||
													!canIncrease
												}
											>
												+
											</Button>
											<Button
												size="sm"
												variant={
													canBuy
														? 'default'
														: 'outline'
												}
												onClick={() =>
													void handleBuy(
														line.item_id,
														line.quantity
													)
												}
												disabled={
													!canBuy ||
													busyItemId === line.item_id
												}
											>
												{canBuy
													? canContinuePayment
														? 'Закончить оплату'
														: 'Оплатить'
													: 'Нет в наличии'}
											</Button>
											<Button
												variant="destructive"
												size="icon"
												onClick={async () => {
													setBusyCartId(line.item_id)
													try {
														await removeShopCartItem(
															line.item_id
														)
														setCart(
															await getShopCart()
														)
													} catch (error) {
														const apiError =
															normalizeApiError(
																error,
																'Не удалось удалить из корзины'
															)
														toast.error(
															apiError.message
														)
													} finally {
														setBusyCartId(null)
													}
												}}
												disabled={
													busyCartId === line.item_id
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								)
							})}
							<Button
								variant="outline"
								onClick={async () => {
									setIsClearingCart(true)
									try {
										await clearShopCart()
										setCart([])
										toast.success('Корзина очищена')
									} catch (error) {
										const apiError = normalizeApiError(
											error,
											'Не удалось очистить корзину'
										)
										toast.error(apiError.message)
									} finally {
										setIsClearingCart(false)
									}
								}}
								disabled={cart.length === 0 || isClearingCart}
							>
								{isClearingCart ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Очистить корзину
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="purchases" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>История покупок</CardTitle>
							<CardDescription>
								Текущие и завершенные покупки пользователя.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{purchases.length === 0 && (
								<p className="text-muted-foreground text-sm">
									Покупок пока нет.
								</p>
							)}
							{purchases.map((purchase) => (
								<div
									key={purchase.id}
									className="rounded-lg border p-3 text-sm"
								>
									<div className="flex items-center justify-between">
										<p className="font-medium">
											Покупка #{purchase.id.slice(0, 8)}
										</p>
										<Badge
											variant={
												purchase.confirmed
													? 'default'
													: 'outline'
											}
										>
											{purchase.is_cancelled
												? 'Отменена'
												: purchase.confirmed
													? 'Куплен'
													: 'Ожидает оплаты'}
										</Badge>
									</div>
									<p className="text-muted-foreground mt-1">
										Сумма: {formatPrice(purchase.amount)}
									</p>
									{isPendingPurchase(purchase) &&
										purchase.confirmation_url && (
											<Button
												className="mt-2"
												size="sm"
												variant="outline"
												onClick={() => {
													window.location.href =
														purchase.confirmation_url as string
												}}
											>
												Закончить оплату
											</Button>
										)}
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Товар</DialogTitle>
						<DialogDescription>
							Детальная карточка товара.
						</DialogDescription>
					</DialogHeader>
					{isDetailsLoading ? (
						<Skeleton className="h-56 w-full" />
					) : activeItem ? (
						<div className="grid gap-4 md:grid-cols-[240px_1fr]">
							<div className="relative overflow-hidden rounded-lg border">
								<Carousel className="w-full">
									<CarouselContent className="-ml-0">
										{getItemImages(activeItem).map(
											(imageUrl, index) => (
												<CarouselItem
													key={`${activeItem.id}-${imageUrl}-${index}`}
													className="pl-0"
												>
													<img
														src={getImage(imageUrl)}
														alt={`${activeItem.title} - фото ${index + 1}`}
														className="h-52 w-full object-cover md:h-full"
														onError={(event) => {
															event.currentTarget.src =
																PLACEHOLDER_IMAGE
														}}
													/>
												</CarouselItem>
											)
										)}
									</CarouselContent>
									{getItemImages(activeItem).length > 1 && (
										<>
											<CarouselPrevious className="top-1/2 left-3 -translate-y-1/2 border-white/80 bg-white/85" />
											<CarouselNext className="top-1/2 right-3 -translate-y-1/2 border-white/80 bg-white/85" />
										</>
									)}
								</Carousel>
							</div>
							<div className="space-y-2">
								<p className="text-xl font-semibold">
									{activeItem.title}
								</p>
								<p className="text-muted-foreground text-sm">
									{activeItem.description}
								</p>
								<p className="text-sm">
									В наличии: {activeItem.quantity}
								</p>
								<p className="text-lg font-semibold">
									{formatPrice(activeItem.price)}
								</p>
								<div className="flex flex-wrap gap-2">
									{(() => {
										const canContinuePayment = Boolean(
											pendingPurchaseByItemId.get(
												activeItem.id
											)?.confirmation_url
										)
										const isOutOfStock =
											activeItem.quantity < 1
										return (
											<Button
												variant={
													isOutOfStock &&
													!canContinuePayment
														? 'outline'
														: 'default'
												}
												disabled={
													isOutOfStock &&
													!canContinuePayment
												}
												onClick={() =>
													canContinuePayment
														? void handleBuy(
																activeItem.id,
																1
															)
														: openBuyDialog(
																activeItem
															)
												}
											>
												{canContinuePayment
													? 'Закончить оплату'
													: isOutOfStock
														? 'Нет в наличии'
														: 'Купить'}
											</Button>
										)
									})()}
									{activeItem.link ? (
										<a
											href={activeItem.link}
											target="_blank"
											rel="noreferrer"
										>
											<Button variant="outline">
												<ExternalLink className="mr-2 h-4 w-4" />
												Перейти на сайт продавца
											</Button>
										</a>
									) : null}
									<Button
										variant="outline"
										onClick={() => setIsDetailsOpen(false)}
									>
										Закрыть
									</Button>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Оформление покупки</DialogTitle>
						<DialogDescription>
							Выберите количество и сколько бонусов использовать.
						</DialogDescription>
					</DialogHeader>
					{buyItem ? (
						<div className="space-y-4">
							<div className="rounded-xl border border-amber-200/80 bg-amber-50 p-4 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
								<div className="flex items-start gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100">
										<Coins className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold">
											Курс бонусов: 10 бонусов = 1 ₽
										</p>
										<p className="mt-1 text-xs text-amber-800/80 dark:text-amber-100/75">
											Бонусами можно оплатить часть
											покупки, но минимум 1 ₽ останется к
											оплате.
										</p>
									</div>
								</div>
							</div>

							<div>
								<p className="font-medium">{buyItem.title}</p>
								<p className="text-muted-foreground text-sm">
									В наличии: {buyItem.quantity}
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="buy-quantity">Количество</Label>
								<Input
									id="buy-quantity"
									type="number"
									min={1}
									max={Math.max(1, buyItem.quantity)}
									value={buyQuantity}
									onChange={(event) => {
										const max = Math.max(
											1,
											buyItem.quantity
										)
										const next = Number(event.target.value)
										setBuyQuantity(
											Math.max(
												1,
												Math.min(
													max,
													Number.isFinite(next)
														? next
														: 1
												)
											)
										)
									}}
								/>
							</div>

							<div className="rounded-lg border p-3 text-sm">
								<div className="flex items-center justify-between gap-3">
									<span className="text-muted-foreground">
										Стоимость
									</span>
									<span className="font-semibold">
										{formatPrice(buyTotal)}
									</span>
								</div>
								<div className="mt-2 flex items-center justify-between gap-3">
									<span className="text-muted-foreground">
										Бонусами
									</span>
									<span className="font-semibold">
										-{normalizedBuyUsedBonuses}
									</span>
								</div>
								<div className="mt-2 flex items-center justify-between gap-3 border-t pt-2">
									<span className="text-muted-foreground">
										К оплате
									</span>
									<span className="font-semibold">
										{formatPrice(buyPaymentAmount)}
									</span>
								</div>
							</div>

							<div className="space-y-3 rounded-lg border p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium">
											Оплата бонусами
										</p>
										<p className="text-muted-foreground text-xs">
											Доступно: {availableBonuses}
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={maxUsableBonuses === 0}
										onClick={() =>
											setBuyUsedBonuses(maxUsableBonuses)
										}
									>
										<Coins className="mr-2 h-4 w-4" />
										Оплатить бонусами
									</Button>
								</div>
								<Slider
									value={[normalizedBuyUsedBonuses]}
									min={0}
									max={Math.max(1, maxUsableBonuses)}
									step={1}
									disabled={maxUsableBonuses === 0}
									onValueChange={(value) =>
										setBuyUsedBonuses(value[0] ?? 0)
									}
								/>
								<div className="text-muted-foreground flex items-center justify-between text-xs">
									<span>0</span>
									<span>{maxUsableBonuses}</span>
								</div>
							</div>

							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsBuyDialogOpen(false)}
								>
									Отмена
								</Button>
								<Button
									onClick={() =>
										void confirmBuyWithSelectedQuantity()
									}
								>
									Перейти к оплате
								</Button>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	)
}
