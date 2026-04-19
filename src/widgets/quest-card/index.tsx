'use client'

import Link from 'next/link'

import type { QuestDto } from '@/shared/api/quest'
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

function getQuestImages(quest: QuestDto): string[] {
	const images = [
		...(quest.images
			?.map((image) => image.image_url)
			.filter((url): url is string => Boolean(url)) ?? []),
		...(quest.points
			?.map((point) => point.image_url)
			.filter((url): url is string => Boolean(url)) ?? [])
	]
	const uniqueImages = Array.from(new Set(images))
	return uniqueImages.length > 0 ? uniqueImages : [PLACEHOLDER_IMAGE]
}

export function QuestCard({ quest }: { quest: QuestDto }) {
	const images = getQuestImages(quest)

	return (
		<Card className="h-full border-amber-100/80 bg-white/80 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/60">
			<div className="relative overflow-hidden rounded-t-xl border-b">
				<Carousel className="w-full">
					<CarouselContent className="ml-0">
						{images.map((imageUrl, index) => (
							<CarouselItem
								key={`${quest.id}-${imageUrl}-${index}`}
								className="pl-0"
							>
								<img
									src={imageUrl}
									alt={`${quest.name} — изображение ${index + 1}`}
									className="h-40 w-full object-cover"
									onError={(event) => {
										event.currentTarget.src =
											PLACEHOLDER_IMAGE
									}}
								/>
							</CarouselItem>
						))}
					</CarouselContent>
					{images.length > 1 && (
						<>
							<CarouselPrevious className="top-1/2 left-3 -translate-y-1/2 border-white/80 bg-white/85" />
							<CarouselNext className="top-1/2 right-3 -translate-y-1/2 border-white/80 bg-white/85" />
						</>
					)}
				</Carousel>
			</div>
			<CardHeader>
				<CardTitle>{quest.name}</CardTitle>
				<CardDescription>{quest.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Уровень</span>
					<span className="font-medium">{quest.level}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Категория</span>
					<span className="font-medium">
						{quest.category?.name ?? 'Без категории'}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Время</span>
					<span className="font-medium">
						{quest.duration_min ?? 0} минут
					</span>
				</div>
				<Link
					href={`/routes/${quest.id}`}
					className="mt-auto inline-flex pt-2"
				>
					<Button variant="outline" size="sm">
						Подробнее
					</Button>
				</Link>
			</CardContent>
		</Card>
	)
}
