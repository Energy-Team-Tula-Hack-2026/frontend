'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	ArrowRight,
	BookOpenText,
	Compass,
	Sparkles,
	Trophy
} from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Spinner } from '@/shared/components/ui/spinner'
import { getQuests, type QuestDto } from '@/shared/api/quest'
import { normalizeApiError } from '@/shared/api/errors'

const craftCards = [
	{
		title: 'Гончарное дело',
		description:
			'Изучите основы работы с глиной и пройдите точки-квесты в мастерских региона.',
		level: 'Базовый',
		duration: '45 минут'
	},
	{
		title: 'Резьба по дереву',
		description:
			'Соберите мини-маршрут по ремесленным пространствам и получите баллы за этапы.',
		level: 'Средний',
		duration: '60 минут'
	},
	{
		title: 'Текстиль и вышивка',
		description:
			'История узоров, практические задания и цифровая карточка ваших достижений.',
		level: 'Базовый',
		duration: '35 минут'
	}
]

export default function CraftsPage() {
	const [quests, setQuests] = useState<QuestDto[]>([])
	const [isLoadingQuests, setIsLoadingQuests] = useState(true)
	const [questsError, setQuestsError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		const loadQuests = async () => {
			setIsLoadingQuests(true)
			setQuestsError(null)
			try {
				const data = await getQuests()
				if (!isMounted) return
				setQuests(data)
			} catch (error) {
				if (!isMounted) return
				const apiError = normalizeApiError(
					error,
					'Не удалось загрузить список квестов'
				)
				setQuestsError(apiError.message)
				setQuests([])
			} finally {
				if (isMounted) setIsLoadingQuests(false)
			}
		}

		loadQuests()
		return () => {
			isMounted = false
		}
	}, [])

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
			<section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-8 shadow-sm dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/20" />
				<div className="pointer-events-none absolute -bottom-20 left-4 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/20" />
				<div className="relative max-w-3xl space-y-4">
					<Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
						<BookOpenText className="mr-1 h-3.5 w-3.5" />
						Инфо-раздел по ремёслам
					</Badge>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Культурный калейдоскоп: ремёсла, знания и игровые
						маршруты
					</h1>
					<p className="text-muted-foreground text-base sm:text-lg">
						Здесь собраны краткие обучающие материалы, ссылки на
						квесты и прогресс пользователя по направлениям ремесла.
					</p>
					<div className="flex flex-wrap gap-3">
						<Link href="/">
							<Button className="bg-amber-700 text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500">
								<Compass className="mr-2 h-4 w-4" />К каталогу
								квестов
							</Button>
						</Link>
						<Link href="/leader-board">
							<Button variant="outline">
								<Trophy className="mr-2 h-4 w-4" />
								Рейтинг пользователей
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
				{isLoadingQuests && (
					<Card className="md:col-span-3">
						<CardContent className="flex items-center justify-center gap-2 p-6 text-sm">
							<Spinner className="size-4" />
							<span>Загружаем квесты...</span>
						</CardContent>
					</Card>
				)}
				{questsError && !isLoadingQuests && (
					<Card className="border-destructive/30 md:col-span-3">
						<CardContent className="p-6">
							<p className="text-destructive text-sm">
								{questsError}
							</p>
						</CardContent>
					</Card>
				)}
				{!isLoadingQuests && !questsError && quests.length > 0
					? quests.map((quest) => (
							<Card
								key={quest.id}
								className="border-amber-100/80 bg-white/80 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/60"
							>
								<CardHeader>
									<CardTitle>{quest.name}</CardTitle>
									<CardDescription>
										{quest.description}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Уровень
										</span>
										<span className="font-medium">
											{quest.level}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Время
										</span>
										<span className="font-medium">
											{quest.duration_min ?? 0} минут
										</span>
									</div>
									<Link
										href={`/routes/${quest.id}`}
										className="block"
									>
										<Button
											variant="ghost"
											className="w-full justify-between"
										>
											Подробнее
											<ArrowRight className="h-4 w-4" />
										</Button>
									</Link>
								</CardContent>
							</Card>
						))
					: null}
				{!isLoadingQuests && !questsError && quests.length === 0 && (
					<Card className="md:col-span-3">
						<CardContent className="p-6">
							<p className="text-muted-foreground text-sm">
								Пока нет доступных квестов.
							</p>
						</CardContent>
					</Card>
				)}
				{craftCards.map((card) => (
					<Card
						key={card.title}
						className="border-amber-100/80 bg-white/80 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/60"
					>
						<CardHeader>
							<CardTitle>{card.title}</CardTitle>
							<CardDescription>
								{card.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Уровень
								</span>
								<span className="font-medium">
									{card.level}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Время
								</span>
								<span className="font-medium">
									{card.duration}
								</span>
							</div>
							<Button
								variant="ghost"
								className="w-full justify-between"
							>
								Подробнее
								<ArrowRight className="h-4 w-4" />
							</Button>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="mt-8">
				<Card className="border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20">
					<CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="flex items-center text-sm font-medium text-emerald-700 dark:text-emerald-300">
								<Sparkles className="mr-1.5 h-4 w-4" />
								Следующий шаг развития
							</p>
							<p className="text-muted-foreground mt-1 text-sm">
								На следующем этапе сюда добавим тесты по 16
								кейсам и персональный багаж знаний пользователя.
							</p>
						</div>
						<Link href="/profile">
							<Button variant="outline">Мой прогресс</Button>
						</Link>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
