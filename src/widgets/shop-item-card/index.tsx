'use client'

import Link from 'next/link'
import { Loader2, ShoppingCart } from 'lucide-react'

import type { ShopItemDto } from '@/shared/api/shop'
import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious
} from '@/shared/components/ui/carousel'

const PLACEHOLDER_IMAGE = '/placeholder-logo.png'

export function formatShopPrice(price: number): string {
	return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
}

function getImage(url?: string | null): string {
	return url || PLACEHOLDER_IMAGE
}

export function getShopItemImages(item?: ShopItemDto | null): string[] {
	if (!item) return [PLACEHOLDER_IMAGE]

	const imageUrls = [
		...(item.images?.map((image) => image.image_url).filter(Boolean) ?? []),
		...(item.image_url ? [item.image_url] : [])
	]

	const unique = Array.from(new Set(imageUrls))
	return unique.length > 0 ? unique : [PLACEHOLDER_IMAGE]
}

type ShopItemCardProps = {
	item: ShopItemDto
	isBusy?: boolean
	canContinuePayment?: boolean
	detailsHref?: string
	onDetails?: (itemId: string) => void
	onAddToCart?: (item: ShopItemDto) => void | Promise<void>
	onBuy?: (item: ShopItemDto) => void | Promise<void>
}

export function ShopItemCard({
	item,
	isBusy = false,
	canContinuePayment = false,
	detailsHref,
	onDetails,
	onAddToCart,
	onBuy
}: ShopItemCardProps) {
	const isOutOfStock = item.quantity < 1
	const itemImages = getShopItemImages(item)
	const isAddToCartDisabled = isOutOfStock || isBusy || !onAddToCart
	const isBuyDisabled =
		(isOutOfStock && !canContinuePayment) || isBusy || !onBuy

	const detailsButton = (
		<Button
			variant="outline"
			onClick={() => onDetails?.(item.id)}
			disabled={!onDetails && !detailsHref}
		>
			Подробнее
		</Button>
	)

	return (
		<Card className="overflow-hidden">
			<div className="relative overflow-hidden border-b">
				<Carousel className="w-full">
					<CarouselContent className="-ml-0">
						{itemImages.map((imageUrl, index) => (
							<CarouselItem
								key={`${item.id}-${imageUrl}-${index}`}
								className="pl-0"
							>
								<img
									src={getImage(imageUrl)}
									alt={`${item.title} - фото ${index + 1}`}
									className="h-44 w-full object-cover"
									onError={(event) => {
										event.currentTarget.src =
											PLACEHOLDER_IMAGE
									}}
								/>
							</CarouselItem>
						))}
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
						{formatShopPrice(item.price)}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-2">
					{detailsHref ? (
						<Button asChild variant="outline">
							<Link href={detailsHref}>Подробнее</Link>
						</Button>
					) : (
						detailsButton
					)}
					<Button
						onClick={() => void onAddToCart?.(item)}
						disabled={isAddToCartDisabled}
					>
						{isBusy ? (
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
						isOutOfStock && !canContinuePayment
							? 'outline'
							: 'secondary'
					}
					onClick={() => void onBuy?.(item)}
					disabled={isBuyDisabled}
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
}
