'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpenText, Compass, Sparkles, Trophy } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
	getQuestCategories,
	getQuests,
	type QuestCategory,
	type QuestDto
} from '@/shared/api/quest'
import { normalizeApiError } from '@/shared/api/errors'
import { QuestCard } from '@/widgets/quest-card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/components/ui/select'

export default function CraftsPage() {
	const [quests, setQuests] = useState<QuestDto[]>([])
	const [questCategories, setQuestCategories] = useState<QuestCategory[]>([])
	const [selectedCategoryId, setSelectedCategoryId] = useState('all')
	const [isLoadingQuests, setIsLoadingQuests] = useState(true)
	const [questsError, setQuestsError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		const loadQuests = async () => {
			setIsLoadingQuests(true)
			setQuestsError(null)
			try {
				const [questsData, categoriesData] = await Promise.all([
					getQuests(),
					getQuestCategories()
				])
				if (!isMounted) return
				setQuests(questsData)
				setQuestCategories(categoriesData)
			} catch (error) {
				if (!isMounted) return
				const apiError = normalizeApiError(
					error,
					'Не удалось загрузить список квестов'
				)
				setQuestsError(apiError.message)
				setQuests([])
				setQuestCategories([])
			} finally {
				if (isMounted) setIsLoadingQuests(false)
			}
		}

		loadQuests()
		return () => {
			isMounted = false
		}
	}, [])

	const filteredQuests = useMemo(() => {
		if (selectedCategoryId === 'all') return quests
		return quests.filter(
			(quest) =>
				quest.category?.id === selectedCategoryId ||
				quest.category_id === selectedCategoryId
		)
	}, [quests, selectedCategoryId])

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

			<section className="mt-8 space-y-4">
				<Card>
					<CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_260px]">
						<div>
							<p className="text-muted-foreground text-sm">
								Фильтр квестов по категории
							</p>
						</div>
						<Select
							value={selectedCategoryId}
							onValueChange={setSelectedCategoryId}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Категория" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Все категории
								</SelectItem>
								{questCategories.map((category) => (
									<SelectItem
										key={category.id}
										value={category.id}
									>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</CardContent>
				</Card>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{isLoadingQuests &&
						Array.from({ length: 3 }).map((_, index) => (
							<Card
								key={`quest-skeleton-${index}`}
								className="md:col-span-1"
							>
								<Skeleton className="h-44 w-full rounded-t-xl rounded-b-none" />
								<CardHeader className="space-y-2">
									<Skeleton className="h-5 w-2/3" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-4/5" />
								</CardHeader>
								<CardContent className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-9 w-full" />
								</CardContent>
							</Card>
						))}
					{questsError && !isLoadingQuests && (
						<Card className="border-destructive/30 md:col-span-3">
							<CardContent className="p-6">
								<p className="text-destructive text-sm">
									{questsError}
								</p>
							</CardContent>
						</Card>
					)}
					{!isLoadingQuests &&
					!questsError &&
					filteredQuests.length > 0
						? filteredQuests.map((quest) => (
								<QuestCard key={quest.id} quest={quest} />
							))
						: null}
					{!isLoadingQuests &&
						!questsError &&
						filteredQuests.length === 0 && (
							<Card className="md:col-span-3">
								<CardContent className="p-6">
									<p className="text-muted-foreground text-sm">
										Пока нет доступных квестов.
									</p>
								</CardContent>
							</Card>
						)}
				</div>
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
