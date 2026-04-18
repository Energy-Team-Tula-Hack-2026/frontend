'use client'

import { useEffect, useState, useMemo } from 'react'
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { getLeaderBoardStatistic } from '@/shared/api/statistic'
import { normalizeApiError } from '@/shared/api/errors'
import {
	Crown,
	Medal,
	Sparkles,
	Trophy,
	Loader2,
	ChevronLeft,
	ChevronRight
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

type UserLeaderboardEntry = {
	name: string
	surname: string
	quests_completed: number
	score: number
	avatar_url: string | null
}

type LeaderboardResponse = {
	users: UserLeaderboardEntry[]
}

type UiLeaderboardEntry = {
	id: string
	userId: string
	userName: string
	avatar: string | null
	points: number
	completedRoutes: number
	rank: number
}

// Дефолтный URL аватарки
const DEFAULT_AVATAR = '/user.jpg'

// Маппинг периодов для API
const periodMap = {
	week: 'WEAKLY',
	month: 'MONTLY',
	all: 'ALLTIME'
}

export const LeaderBoardWidget = () => {
	const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all')
	const [leaderboardData, setLeaderboardData] = useState<
		UserLeaderboardEntry[]
	>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 10

	useEffect(() => {
		const loadLeaderboard = async () => {
			setIsLoading(true)
			setError(null)
			setCurrentPage(1) // Сбрасываем страницу при смене периода

			try {
				const data = await getLeaderBoardStatistic()
				setLeaderboardData(data.users)
			} catch (error) {
				const apiError = normalizeApiError(
					error,
					'Не удалось загрузить таблицу лидеров'
				)
				setError(apiError.message)
				setLeaderboardData([])
			} finally {
				setIsLoading(false)
			}
		}

		loadLeaderboard()
	}, [period])

	const leaderboardEntries = useMemo<UiLeaderboardEntry[]>(() => {
		const sorted = [...leaderboardData].sort((a, b) => {
			if (b.score !== a.score) {
				return b.score - a.score
			}
			if (b.quests_completed !== a.quests_completed) {
				return b.quests_completed - a.quests_completed
			}
			const lastNameCompare = a.surname.localeCompare(b.surname)
			if (lastNameCompare !== 0) {
				return lastNameCompare
			}
			return a.name.localeCompare(b.name)
		})

		const entriesWithRanks: UiLeaderboardEntry[] = []
		let currentRank = 1
		let previousEntry: UserLeaderboardEntry | null = null
		let previousRank = 1

		for (let i = 0; i < sorted.length; i++) {
			const user = sorted[i]
			const isSameAsPrevious =
				previousEntry &&
				previousEntry.score === user.score &&
				previousEntry.quests_completed === user.quests_completed

			if (!isSameAsPrevious) {
				currentRank = i + 1
				previousRank = currentRank
			} else {
				currentRank = previousRank
			}

			entriesWithRanks.push({
				id: `${user.name}-${user.surname}-${i}`,
				userId: `${user.name}-${user.surname}`,
				userName: `${user.name} ${user.surname}`,
				avatar: user.avatar_url,
				points: user.score,
				completedRoutes: user.quests_completed,
				rank: currentRank
			})

			previousEntry = user
		}

		return entriesWithRanks
	}, [leaderboardData])

	// Пагинация
	const totalPages = Math.ceil(leaderboardEntries.length / itemsPerPage)
	const paginatedEntries = leaderboardEntries.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)

	const topThree = useMemo(() => {
		return leaderboardEntries.slice(0, 3)
	}, [leaderboardEntries])

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return (
					<Crown className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
				)
			case 2:
				return (
					<Medal className="h-6 w-6 text-slate-400 dark:text-slate-300" />
				)
			case 3:
				return (
					<Medal className="h-6 w-6 text-amber-600 dark:text-amber-400" />
				)
			default:
				return null
		}
	}

	const getRankColor = (rank: number) => {
		switch (rank) {
			case 1:
				return 'from-yellow-400 to-orange-500'
			case 2:
				return 'from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600'
			case 3:
				return 'from-amber-500 to-amber-600'
			default:
				return 'from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700'
		}
	}

	const getInitials = (fullName: string) => {
		return fullName.charAt(0).toUpperCase()
	}

	const getAvatarUrl = (avatar: string | null) => {
		return avatar || DEFAULT_AVATAR
	}

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center">
				<Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
				<p className="text-muted-foreground">Загрузка рейтинга...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
				<Trophy className="mx-auto mb-3 h-12 w-12 text-red-500 dark:text-red-400" />
				<h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
					Не удалось загрузить рейтинг
				</h3>
				<p className="text-red-600 dark:text-red-300">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900"
				>
					Попробовать снова
				</button>
			</div>
		)
	}

	if (leaderboardEntries.length === 0) {
		return (
			<div className="border-border bg-card rounded-lg border p-8 text-center">
				<Trophy className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
				<h3 className="text-foreground mb-2 text-lg font-semibold">
					Пока нет участников
				</h3>
				<p className="text-muted-foreground">
					Станьте первым, кто начнет проходить квесты!
				</p>
			</div>
		)
	}

	return (
		<>
			<div className="mb-8 text-center">
				<div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-yellow-200/60 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 dark:border-yellow-900/50 dark:from-yellow-950/50 dark:to-orange-950/50">
					<Trophy className="h-4 w-4 text-orange-600 dark:text-orange-300" />
					<span className="text-sm font-medium text-orange-700 dark:text-orange-200">
						Таблица лидеров
					</span>
				</div>

				<h1 className="text-foreground mb-3 text-4xl font-bold tracking-tight">
					Рейтинг игроков
				</h1>

				<p className="text-muted-foreground">
					Соревнуйтесь с другими путешественниками и зарабатывайте
					награды
				</p>
			</div>

			{/* Tabs для выбора периода */}
			<Tabs
				value={period}
				onValueChange={(v) => setPeriod(v as typeof period)}
				className="mb-6"
			>
				<TabsList className="mx-auto grid w-full max-w-md grid-cols-3">
					<TabsTrigger value="week">Неделя</TabsTrigger>
					<TabsTrigger value="month">Месяц</TabsTrigger>
					<TabsTrigger value="all">Все время</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Топ-3 игрока */}
			{/* Топ-3 игрока - адаптивная версия */}
			{topThree.length > 0 && (
				<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
					{/* Второе место - на мобилке второй, на десктопе слева */}
					{topThree[1] && (
						<div className="order-2 sm:order-1">
							<Card className="border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 text-center dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
								<CardContent className="pt-4 pb-4 sm:pt-6">
									<div className="relative mb-3 inline-block">
										<Avatar className="h-16 w-16 rounded-full border-4 border-slate-300 bg-white shadow-md ring-2 ring-white sm:h-20 sm:w-20 dark:border-slate-600 dark:bg-slate-900 dark:ring-slate-800">
											<AvatarImage
												src={getAvatarUrl(
													topThree[1].avatar
												)}
												alt={topThree[1].userName}
												className="object-cover"
											/>
											<AvatarFallback className="bg-slate-200 text-base font-semibold text-slate-700 sm:text-lg dark:bg-slate-700 dark:text-slate-100">
												{getInitials(
													topThree[1].userName
												)}
											</AvatarFallback>
										</Avatar>

										<div className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white shadow-sm sm:h-8 sm:w-8 sm:text-sm dark:bg-slate-600">
											2
										</div>
									</div>

									<h3 className="text-foreground mb-1 truncate px-2 text-xs font-semibold sm:text-sm">
										{topThree[1].userName}
									</h3>

									<div className="text-muted-foreground mb-2 flex items-center justify-center text-xs sm:text-sm">
										<Sparkles className="mr-1 h-3 w-3" />
										<span>
											{topThree[1].points.toLocaleString()}
										</span>
									</div>

									<Badge
										variant="outline"
										className="border-border bg-background/60 text-foreground text-xs"
									>
										{topThree[1].completedRoutes}{' '}
										{topThree[1].completedRoutes === 1
											? 'квест'
											: 'квестов'}
									</Badge>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Первое место - центральное */}
					{topThree[0] && (
						<div className="order-1 sm:order-2">
							<Card className="border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 text-center shadow-lg dark:border-yellow-800 dark:from-yellow-950/70 dark:to-orange-950/70">
								<CardContent className="pt-4 pb-4 sm:pt-6">
									<Crown className="mx-auto mb-2 h-6 w-6 text-yellow-500 sm:h-8 sm:w-8 dark:text-yellow-400" />

									<div className="relative mb-3 inline-block">
										<Avatar className="h-20 w-20 rounded-full border-4 border-yellow-400 bg-white shadow-lg ring-4 ring-yellow-100 sm:h-24 sm:w-24 dark:border-yellow-500 dark:bg-slate-900 dark:ring-yellow-950/70">
											<AvatarImage
												src={getAvatarUrl(
													topThree[0].avatar
												)}
												alt={topThree[0].userName}
												className="object-cover"
											/>
											<AvatarFallback className="bg-yellow-100 text-lg font-bold text-yellow-700 sm:text-xl dark:bg-yellow-900 dark:text-yellow-200">
												{getInitials(
													topThree[0].userName
												)}
											</AvatarFallback>
										</Avatar>

										<div className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm font-bold text-white shadow-lg sm:h-10 sm:w-10 sm:text-base">
											1
										</div>
									</div>

									<h3 className="text-foreground mb-1 truncate px-2 text-sm font-bold sm:text-base">
										{topThree[0].userName}
									</h3>

									<div className="mb-2 flex items-center justify-center text-sm font-semibold text-orange-600 sm:text-base dark:text-orange-300">
										<Sparkles className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
										<span>
											{topThree[0].points.toLocaleString()}
										</span>
									</div>

									<Badge className="border-yellow-300 bg-yellow-100 text-xs text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200">
										{topThree[0].completedRoutes}{' '}
										{topThree[0].completedRoutes === 1
											? 'квест'
											: 'квестов'}
									</Badge>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Третье место - на мобилке третье, на десктопе справа */}
					{topThree[2] && (
						<div className="order-3 sm:order-3">
							<Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 text-center dark:border-amber-800 dark:from-amber-950/60 dark:to-orange-950/60">
								<CardContent className="pt-4 pb-4 sm:pt-6">
									<div className="relative mb-3 inline-block">
										<Avatar className="h-16 w-16 rounded-full border-4 border-amber-400 bg-white shadow-md ring-2 ring-white sm:h-20 sm:w-20 dark:border-amber-700 dark:bg-slate-900 dark:ring-slate-800">
											<AvatarImage
												src={getAvatarUrl(
													topThree[2].avatar
												)}
												alt={topThree[2].userName}
												className="object-cover"
											/>
											<AvatarFallback className="bg-amber-100 text-base font-semibold text-amber-700 sm:text-lg dark:bg-amber-900 dark:text-amber-200">
												{getInitials(
													topThree[2].userName
												)}
											</AvatarFallback>
										</Avatar>

										<div className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-sm sm:h-8 sm:w-8 sm:text-sm dark:bg-amber-600">
											3
										</div>
									</div>

									<h3 className="text-foreground mb-1 truncate px-2 text-xs font-semibold sm:text-sm">
										{topThree[2].userName}
									</h3>

									<div className="text-muted-foreground mb-2 flex items-center justify-center text-xs sm:text-sm">
										<Sparkles className="mr-1 h-3 w-3" />
										<span>
											{topThree[2].points.toLocaleString()}
										</span>
									</div>

									<Badge
										variant="outline"
										className="border-border bg-background/60 text-foreground text-xs"
									>
										{topThree[2].completedRoutes}{' '}
										{topThree[2].completedRoutes === 1
											? 'квест'
											: 'квестов'}
									</Badge>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			)}

			{/* Полная таблица рейтинга */}
			<Card className="border-border bg-card">
				<CardHeader>
					<CardTitle className="text-foreground">
						Полная таблица рейтинга
					</CardTitle>
					<CardDescription className="text-muted-foreground">
						Топ путешественников региона
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="space-y-2">
						{paginatedEntries.map((entry) => {
							const rankIcon = getRankIcon(entry.rank)

							return (
								<div
									key={entry.id}
									className="bg-muted/50 hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted/70 flex items-center justify-between rounded-lg p-4 transition-colors"
								>
									<div className="flex min-w-0 flex-1 items-center space-x-4">
										<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
											{rankIcon ? (
												rankIcon
											) : (
												<div
													className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} text-sm font-bold text-white`}
												>
													{entry.rank}
												</div>
											)}
										</div>

										<Avatar className="border-border h-11 w-11 flex-shrink-0 rounded-full border bg-white shadow-sm dark:bg-slate-900">
											<AvatarImage
												src={getAvatarUrl(entry.avatar)}
												alt={entry.userName}
												className="object-cover"
											/>
											<AvatarFallback className="bg-slate-200 font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
												{getInitials(entry.userName)}
											</AvatarFallback>
										</Avatar>

										<div className="min-w-0 flex-1">
											<p className="text-foreground truncate font-semibold">
												{entry.userName}
											</p>

											<p className="text-muted-foreground truncate text-sm">
												{entry.completedRoutes}{' '}
												{entry.completedRoutes === 1
													? 'квест'
													: 'квестов'}{' '}
												пройдено
											</p>
										</div>
									</div>

									<div className="ml-4 flex flex-shrink-0 items-center space-x-2">
										<div className="text-foreground text-right">
											<p className="text-lg font-bold">
												{entry.points.toLocaleString()}
											</p>
											<p className="text-muted-foreground text-xs">
												баллов
											</p>
										</div>

										<Sparkles className="h-5 w-5 text-slate-400 dark:text-slate-500" />
									</div>
								</div>
							)
						})}
					</div>

					{/* Пагинация */}
					{totalPages > 1 && (
						<div className="mt-6 flex items-center justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) =>
										Math.max(1, prev - 1)
									)
								}
								disabled={currentPage === 1}
								className="h-8 w-8 p-0"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>

							<div className="flex gap-1">
								{Array.from(
									{ length: totalPages },
									(_, i) => i + 1
								).map((page) => (
									<Button
										key={page}
										variant={
											currentPage === page
												? 'default'
												: 'outline'
										}
										size="sm"
										onClick={() => setCurrentPage(page)}
										className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
									>
										{page}
									</Button>
								))}
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) =>
										Math.min(totalPages, prev + 1)
									)
								}
								disabled={currentPage === totalPages}
								className="h-8 w-8 p-0"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-900 dark:from-blue-950/60 dark:to-purple-950/60">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-3">
						<Trophy className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-300" />

						<div>
							<h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
								Как подняться в рейтинге?
							</h3>

							<ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
								<li>
									• Проходите квесты и зарабатывайте баллы
								</li>
								<li>• Открывайте новые достижения</li>
								<li>• Участвуйте в командных забегах</li>
								<li>• Делитесь успехами в социальных сетях</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
