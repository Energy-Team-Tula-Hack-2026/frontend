'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Clock, MapPin, QrCode, Trophy } from 'lucide-react'

import { useQuest } from './use-quest'
import { useSelf } from './use-self'
import { QrScanner } from './qr-scanner'
import { MapView } from './map-view'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Progress } from '@/shared/components/ui/progress'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { Spinner } from '@/shared/components/ui/spinner'
import {
	CraftTestQuestion,
	detectCraftKind,
	getCraftTestQuestions,
	getProductsByCraftKind
} from '@/shared/lib/craft-marketplace'

type PointProgressState = {
	completedPointIds: string[]
}

type QuestTestState = {
	isCompleted: boolean
	lastScore: number
	totalQuestions: number
	history: Array<{ date: string; score: number; total: number }>
}

type ScanState = {
	open: boolean
	type: 'success' | 'error'
	message: string
}

function getProgressKey(questId: string, userId?: string) {
	return `quest_progress_${questId}_${userId || 'guest'}`
}

function getTestKey(questId: string, userId?: string) {
	return `quest_test_${questId}_${userId || 'guest'}`
}

export function Quest() {
	const router = useRouter()
	const params = useParams()
	const id = params?.id as string | undefined
	if (!id) notFound()

	const { quest, isLoading, error } = useQuest(id)
	const { user, isLoadingUser, errorUser } = useSelf()

	const [progress, setProgress] = useState<PointProgressState>({
		completedPointIds: []
	})
	const [testState, setTestState] = useState<QuestTestState>({
		isCompleted: false,
		lastScore: 0,
		totalQuestions: 0,
		history: []
	})

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualCode, setManualCode] = useState('')
	const [scanState, setScanState] = useState<ScanState>({
		open: false,
		type: 'success',
		message: ''
	})
	const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
	const [selectedAnswers, setSelectedAnswers] = useState<
		Record<string, number>
	>({})

	const hasLocalAccess = useMemo(() => {
		if (typeof window === 'undefined') return false
		return localStorage.getItem(`quest_access_${id}`) === 'started'
	}, [id])

	const storageUserId = user?.email || 'guest'

	useEffect(() => {
		if (!quest) return
		const key = getProgressKey(quest.id, storageUserId)
		const testKey = getTestKey(quest.id, storageUserId)

		const fromBackendCompleted =
			user?.points
				?.filter((point) => point.status === 'COMPLETED')
				.map((point) => point.point_id) ?? []

		let localProgress: PointProgressState = { completedPointIds: [] }
		let localTestState: QuestTestState = {
			isCompleted: false,
			lastScore: 0,
			totalQuestions: 0,
			history: []
		}

		if (typeof window !== 'undefined') {
			const rawProgress = localStorage.getItem(key)
			if (rawProgress) {
				try {
					localProgress = JSON.parse(rawProgress)
				} catch {
					localProgress = { completedPointIds: [] }
				}
			}

			const rawTest = localStorage.getItem(testKey)
			if (rawTest) {
				try {
					localTestState = JSON.parse(rawTest)
				} catch {
					localTestState = {
						isCompleted: false,
						lastScore: 0,
						totalQuestions: 0,
						history: []
					}
				}
			}
		}

		const merged = Array.from(
			new Set([
				...localProgress.completedPointIds,
				...fromBackendCompleted
			])
		)
		setProgress({ completedPointIds: merged })
		setTestState(localTestState)
	}, [quest, storageUserId, user?.points])

	const sortedPoints = useMemo(() => {
		if (!quest?.points) return []
		return [...quest.points].sort((a, b) => a.priority - b.priority)
	}, [quest?.points])

	const currentPoint = useMemo(() => {
		return sortedPoints.find(
			(point) => !progress.completedPointIds.includes(point.id)
		)
	}, [sortedPoints, progress.completedPointIds])

	const allPointsCompleted =
		sortedPoints.length > 0 &&
		sortedPoints.every((point) =>
			progress.completedPointIds.includes(point.id)
		)

	const testQuestions = useMemo<CraftTestQuestion[]>(() => {
		if (!quest) return []
		const kind = detectCraftKind(`${quest.name} ${quest.description}`)
		return getCraftTestQuestions(
			kind,
			sortedPoints.map((point) => point.name)
		)
	}, [quest, sortedPoints])

	const adsProducts = useMemo(() => {
		if (!quest) return []
		const kind = detectCraftKind(`${quest.name} ${quest.description}`)
		return getProductsByCraftKind(kind).slice(0, 3)
	}, [quest])

	if (isLoading || isLoadingUser) {
		return (
			<div className="flex min-h-[70vh] items-center justify-center">
				<Spinner className="size-8" />
			</div>
		)
	}

	if (error || errorUser || !quest || (!user && !hasLocalAccess)) {
		notFound()
	}

	const totalScore = sortedPoints.reduce((sum, point) => sum + point.score, 0)
	const completedCount = progress.completedPointIds.length
	const progressPercent =
		sortedPoints.length > 0
			? (completedCount / sortedPoints.length) * 100
			: 0

	const saveProgress = (next: PointProgressState) => {
		setProgress(next)
		if (typeof window !== 'undefined') {
			localStorage.setItem(
				getProgressKey(quest.id, storageUserId),
				JSON.stringify(next)
			)
		}
	}

	const saveTestState = (next: QuestTestState) => {
		setTestState(next)
		if (typeof window !== 'undefined') {
			localStorage.setItem(
				getTestKey(quest.id, storageUserId),
				JSON.stringify(next)
			)
		}
	}

	const handleScanCode = (rawCode: string) => {
		const code = rawCode.trim()
		setManualCode('')
		setIsScannerOpen(false)

		if (testState.isCompleted) {
			setScanState({
				open: true,
				type: 'error',
				message: 'Тест уже завершен. Повторное сканирование отключено.'
			})
			return
		}

		if (!currentPoint) {
			setScanState({
				open: true,
				type: 'error',
				message: 'Все точки уже пройдены.'
			})
			return
		}

		if (currentPoint.code !== code) {
			setScanState({
				open: true,
				type: 'error',
				message:
					'Неверный QR-код для текущей точки. Соблюдайте порядок точек.'
			})
			return
		}

		const nextProgress: PointProgressState = {
			completedPointIds: [...progress.completedPointIds, currentPoint.id]
		}
		saveProgress(nextProgress)

		setScanState({
			open: true,
			type: 'success',
			message: `Точка "${currentPoint.name}" пройдена. +${currentPoint.score} баллов.`
		})
	}

	const handleSubmitTest = () => {
		const answeredCount = Object.keys(selectedAnswers).length
		if (answeredCount !== testQuestions.length) {
			setScanState({
				open: true,
				type: 'error',
				message: 'Ответьте на все вопросы теста.'
			})
			return
		}

		const score = testQuestions.reduce((acc, question) => {
			return (
				acc +
				(selectedAnswers[question.id] === question.correctIndex ? 1 : 0)
			)
		}, 0)

		const passedPointIds = sortedPoints
			.map((point, index) => {
				const relatedQuestion = testQuestions[index]
				if (!relatedQuestion) return null
				const isCorrect =
					selectedAnswers[relatedQuestion.id] ===
					relatedQuestion.correctIndex
				return isCorrect ? point.id : null
			})
			.filter((value): value is string => Boolean(value))

		saveProgress({ completedPointIds: passedPointIds })

		const nextState: QuestTestState = {
			isCompleted: true,
			lastScore: score,
			totalQuestions: testQuestions.length,
			history: [
				...testState.history,
				{
					date: new Date().toISOString(),
					score,
					total: testQuestions.length
				}
			]
		}

		saveTestState(nextState)
		setIsTestDialogOpen(false)
		setScanState({
			open: true,
			type: 'success',
			message: `Тест завершен: ${score}/${testQuestions.length}. Засчитано точек: ${passedPointIds.length}/${sortedPoints.length}.`
		})
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Назад
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">
						<Clock className="mr-1 h-3 w-3" />
						{quest.duration_min} мин
					</Badge>
					<Badge variant="secondary">
						{quest.points.length} точек
					</Badge>
					<Badge variant="secondary">{totalScore} баллов</Badge>
				</div>
			</div>

			<div className="bg-card rounded-2xl border p-4 sm:p-5">
				<h1 className="text-2xl font-semibold">{quest.name}</h1>
				<p className="text-muted-foreground mt-2 text-sm sm:text-base">
					{quest.description}
				</p>
				<div className="mt-4 max-w-md">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span>Прогресс маршрута</span>
						<span className="text-muted-foreground">
							{completedCount} / {sortedPoints.length}
						</span>
					</div>
					<Progress value={progressPercent} className="h-2" />
				</div>
			</div>

			<section className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg">
								Карта маршрута
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="mx-auto w-full max-w-[860px] overflow-hidden rounded-xl border">
								<MapView
									quest={quest}
									points={sortedPoints}
									currentPoint={currentPoint}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Сканирование точек
							</CardTitle>
							<CardDescription>
								Сканируйте QR-коды последовательно по маршруту.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button
								className="w-full"
								size="lg"
								onClick={() => setIsScannerOpen(true)}
								disabled={
									!currentPoint || testState.isCompleted
								}
							>
								<QrCode className="mr-2 h-5 w-5" />
								{testState.isCompleted
									? 'Прохождение закрыто'
									: currentPoint
										? `Сканировать: ${currentPoint.name}`
										: 'Все точки пройдены'}
							</Button>

							{allPointsCompleted && !testState.isCompleted && (
								<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
									<p className="text-sm font-medium">
										Маршрут завершен, откройте тест
									</p>
									<Button
										className="mt-3"
										variant="secondary"
										onClick={() =>
											setIsTestDialogOpen(true)
										}
									>
										Открыть тест
									</Button>
								</div>
							)}

							{testState.isCompleted && (
								<div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/20">
									Тест завершен: {testState.lastScore}/
									{testState.totalQuestions}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="lg:sticky lg:top-20">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg">Чекпоинты</CardTitle>
							<CardDescription>
								Текущая точка подсвечена.
							</CardDescription>
						</CardHeader>
						<CardContent className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
							{sortedPoints.map((point, index) => {
								const completed =
									progress.completedPointIds.includes(
										point.id
									)
								const isCurrent = currentPoint?.id === point.id

								return (
									<div
										key={point.id}
										className={`rounded-lg border p-3 ${
											completed
												? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
												: isCurrent
													? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
													: 'bg-background'
										}`}
									>
										<div className="flex items-start gap-2">
											<div
												className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
													completed
														? 'border-green-500 bg-green-500 text-white'
														: isCurrent
															? 'border-amber-600 bg-amber-600 text-white'
															: 'text-muted-foreground'
												}`}
											>
												{completed ? (
													<Check className="h-3.5 w-3.5" />
												) : (
													index + 1
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-2">
													<p className="text-sm font-medium">
														{point.name}
													</p>
													<Badge variant="secondary">
														+{point.score}
													</Badge>
												</div>
												<p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
													{point.short_description ||
														point.description}
												</p>
												<div className="text-muted-foreground mt-2 flex items-center text-xs">
													<MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
													{point.latitude},{' '}
													{point.longitude}
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg">
								История теста
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{testState.history.length === 0 && (
								<p className="text-muted-foreground text-sm">
									История пока пуста.
								</p>
							)}
							{testState.history.map((item, index) => (
								<div
									key={`${item.date}-${index}`}
									className="rounded-md border p-2 text-xs"
								>
									{new Date(item.date).toLocaleString(
										'ru-RU'
									)}{' '}
									- {item.score}/{item.total}
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<Trophy className="h-5 w-5" />
					<h2 className="text-xl font-semibold">
						Товары организации
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{adsProducts.map((product) => (
						<Card key={product.id} className="overflow-hidden">
							<img
								src={
									product.images[0] || '/placeholder-logo.png'
								}
								alt={product.title}
								className="h-36 w-full object-cover"
							/>
							<CardContent className="space-y-2 p-4">
								<p className="font-semibold">{product.title}</p>
								<p className="text-muted-foreground line-clamp-2 text-sm">
									{product.description}
								</p>
								<div className="flex items-center justify-between">
									<Badge variant="secondary">
										{product.category}
									</Badge>
									<span className="font-semibold">
										{product.priceRub} ₽
									</span>
								</div>
								<Button
									variant="outline"
									className="w-full"
									onClick={() =>
										router.push(`/shop/${product.id}`)
									}
								>
									Открыть товар
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Dialog
				open={isScannerOpen}
				onOpenChange={(open) => {
					setIsScannerOpen(open)
					if (!open) setManualCode('')
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Сканирование точки</DialogTitle>
						<DialogDescription>
							Сканируйте QR текущей точки или введите код вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border">
							<QrScanner
								onScanSuccess={handleScanCode}
								onError={() => {}}
								disabled={!isScannerOpen}
								className="aspect-square w-full"
							/>
						</div>
						<div className="flex gap-2">
							<Input
								placeholder={currentPoint?.code || 'Код точки'}
								value={manualCode}
								onChange={(e) => setManualCode(e.target.value)}
							/>
							<Button onClick={() => handleScanCode(manualCode)}>
								Проверить
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={scanState.open}
				onOpenChange={(open) =>
					setScanState((prev) => ({ ...prev, open }))
				}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{scanState.type === 'success' ? 'Готово' : 'Ошибка'}
						</DialogTitle>
						<DialogDescription>
							{scanState.message}
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>

			<Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
				<DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Тест по экскурсии</DialogTitle>
						<DialogDescription>
							После отправки тест блокируется, повторно пройти его
							нельзя.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						{testQuestions.map((question, qIndex) => (
							<div
								key={question.id}
								className="rounded-lg border p-4"
							>
								<p className="mb-3 font-medium">
									{qIndex + 1}. {question.question}
								</p>
								<div className="space-y-2">
									{question.options.map((option, index) => (
										<button
											key={`${question.id}-${index}`}
											type="button"
											className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
												selectedAnswers[question.id] ===
												index
													? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
													: 'hover:bg-muted/60'
											}`}
											onClick={() =>
												setSelectedAnswers((prev) => ({
													...prev,
													[question.id]: index
												}))
											}
										>
											{option}
										</button>
									))}
								</div>
							</div>
						))}
						<Button className="w-full" onClick={handleSubmitTest}>
							Завершить тест
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
