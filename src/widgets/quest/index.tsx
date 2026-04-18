'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
	ArrowLeft,
	Check,
	Clock,
	Headphones,
	Lock,
	MapPin,
	PartyPopper,
	QrCode,
	Route,
	Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

import { useQuest } from './use-quest'
import { useSelf } from './use-self'
import { useValidatePoint } from './use-validate-point'
import { QrScanner } from './qr-scanner'
import { MapView } from './map-view'

import { normalizeApiError } from '@/shared/api/errors'
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

type PointProgressState = {
	completedPointIds: string[]
}

type ScanState = {
	open: boolean
	type: 'success' | 'error'
	message: string
}

function getProgressKey(questId: string, userId?: string) {
	return `quest_progress_${questId}_${userId || 'guest'}`
}

const POINT_SCAN_ERROR_MESSAGE = 'Не удалось отметить точку квеста'

export function Quest() {
	const router = useRouter()
	const params = useParams()
	const id = params?.id as string | undefined
	if (!id) notFound()

	const { quest, isLoading, error } = useQuest(id)
	const { user, isLoadingUser, errorUser } = useSelf()
	const validatePoint = useValidatePoint()

	const [progress, setProgress] = useState<PointProgressState>({
		completedPointIds: []
	})

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualCode, setManualCode] = useState('')
	const [scanState, setScanState] = useState<ScanState>({
		open: false,
		type: 'success',
		message: ''
	})

	const storageUserId = user?.email || 'guest'

	useEffect(() => {
		if (!quest) return
		const key = getProgressKey(quest.id, storageUserId)
		const questPointIds = new Set(quest.points.map((point) => point.id))

		const fromBackendCompleted =
			user?.points
				?.filter(
					(point) =>
						questPointIds.has(point.point_id) &&
						(point.is_completed || point.status === 'COMPLETED')
				)
				.map((point) => point.point_id) ?? []

		let localProgress: PointProgressState = { completedPointIds: [] }

		if (typeof window !== 'undefined') {
			const rawProgress = localStorage.getItem(key)
			if (rawProgress) {
				try {
					localProgress = JSON.parse(rawProgress)
				} catch {
					localProgress = { completedPointIds: [] }
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

	if (isLoading || isLoadingUser) {
		return (
			<div className="flex min-h-[70vh] items-center justify-center">
				<Spinner className="size-8" />
			</div>
		)
	}

	if (error || errorUser || !quest || !user) {
		notFound()
	}

	const totalScore = sortedPoints.reduce((sum, point) => sum + point.score, 0)
	const completedPointIds = progress.completedPointIds.filter((pointId) =>
		sortedPoints.some((point) => point.id === pointId)
	)
	const completedCount = completedPointIds.length
	const progressPercent =
		sortedPoints.length > 0
			? Math.min((completedCount / sortedPoints.length) * 100, 100)
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

	const handleScanCode = async (rawCode: string) => {
		const code = rawCode.trim().toUpperCase()
		setManualCode('')

		if (!code || validatePoint.isPending) {
			return
		}

		if (allPointsCompleted) {
			setScanState({
				open: true,
				type: 'success',
				message: 'Все точки уже пройдены.'
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
			setIsScannerOpen(false)
			setScanState({
				open: true,
				type: 'error',
				message:
					'Неверный QR-код для текущей точки. Соблюдайте порядок точек.'
			})
			return
		}

		try {
			await validatePoint.mutateAsync({ code, point: currentPoint })

			const nextCompletedIds = Array.from(
				new Set([...progress.completedPointIds, currentPoint.id])
			)
			const nextQuestCompletedCount = nextCompletedIds.filter((pointId) =>
				sortedPoints.some((point) => point.id === pointId)
			).length
			saveProgress({ completedPointIds: nextCompletedIds })
			setIsScannerOpen(false)

			const isLastPoint = nextQuestCompletedCount >= sortedPoints.length

			setScanState({
				open: true,
				type: 'success',
				message: isLastPoint
					? 'Поздравляем! Вы прошли все точки квеста.'
					: `Точка "${currentPoint.name}" пройдена. Следующая точка уже доступна.`
			})
			toast.success(
				isLastPoint
					? 'Квест завершён'
					: `Точка "${currentPoint.name}" пройдена`
			)
		} catch (err) {
			const apiError = normalizeApiError(err, POINT_SCAN_ERROR_MESSAGE)
			setIsScannerOpen(false)
			setScanState({
				open: true,
				type: 'error',
				message: apiError.message
			})
			toast.error(apiError.message)
		}
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

			<div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-linear-to-br from-amber-50 via-orange-50 to-emerald-50 p-5 sm:p-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-3xl">
						<Badge className="mb-3 w-fit border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
							<Sparkles className="mr-1 h-3.5 w-3.5" />
							Прохождение квеста
						</Badge>
						<h1 className="text-2xl leading-tight font-semibold sm:text-4xl">
							{quest.name}
						</h1>
						<p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
							{quest.description}
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<Badge variant="outline">
								<MapPin className="mr-1 h-3.5 w-3.5" />
								{quest.location?.city_name ??
									quest.location?.region_name ??
									'Организация'}
							</Badge>
							<Badge variant="outline">
								<Route className="mr-1 h-3.5 w-3.5" />
								Точка организации на карте
							</Badge>
						</div>
					</div>
					<div className="bg-background/80 w-full rounded-xl border p-4 shadow-sm backdrop-blur lg:max-w-sm">
						<div className="mb-2 flex items-center justify-between text-sm">
							<span className="font-medium">Прогресс</span>
							<span className="text-muted-foreground">
								{completedCount} / {sortedPoints.length}
							</span>
						</div>
						<Progress value={progressPercent} className="h-2" />
						{currentPoint && (
							<p className="text-muted-foreground mt-3 text-sm">
								Текущая точка:{' '}
								<span className="text-foreground font-medium">
									{currentPoint.name}
								</span>
							</p>
						)}
						{allPointsCompleted && (
							<p className="mt-3 text-sm font-medium text-green-700 dark:text-green-300">
								Все точки пройдены
							</p>
						)}
					</div>
				</div>
			</div>

			<section className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg">
								Карта маршрута
							</CardTitle>
							<CardDescription>
								На карте отображается организация, где проходит
								квест.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="mx-auto w-full max-w-[860px]">
								<MapView quest={quest} />
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
									!currentPoint ||
									allPointsCompleted ||
									validatePoint.isPending
								}
							>
								<QrCode className="mr-2 h-5 w-5" />
								{validatePoint.isPending
									? 'Проверяем точку...'
									: currentPoint
										? `Сканировать: ${currentPoint.name}`
										: 'Все точки пройдены'}
							</Button>

							{allPointsCompleted && (
								<div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300">
									<div className="flex items-start gap-3">
										<PartyPopper className="mt-0.5 h-5 w-5 shrink-0" />
										<div className="space-y-3">
											<div>
												<p className="font-semibold">
													Поздравляем, квест завершён!
												</p>
												<p className="mt-1 text-sm">
													Все точки пройдены. Ваш
													прогресс можно посмотреть в
													профиле.
												</p>
											</div>
											<Link href="/profile">
												<Button
													variant="outline"
													size="sm"
												>
													Перейти в профиль
												</Button>
											</Link>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="lg:sticky lg:top-20">
						<CardHeader className="pb-3">
							<CardTitle className="text-center text-lg">
								Чекпоинты
							</CardTitle>
						</CardHeader>
						<CardContent className="mx-auto max-h-[62vh] w-full max-w-md space-y-3 overflow-y-auto px-4">
							{sortedPoints.map((point, index) => {
								const completed =
									progress.completedPointIds.includes(
										point.id
									)
								const isCurrent = currentPoint?.id === point.id
								const isLocked = !completed && !isCurrent

								return (
									<div
										key={point.id}
										className={`rounded-xl border p-3 transition-all ${
											completed
												? 'border-green-200 bg-green-50 shadow-sm dark:border-green-900 dark:bg-green-950/20'
												: isCurrent
													? 'border-amber-300 bg-amber-50 shadow-md ring-2 ring-amber-200/70 dark:border-amber-900 dark:bg-amber-950/20 dark:ring-amber-900/50'
													: 'bg-muted/30 opacity-75'
										}`}
									>
										<div className="flex items-start gap-2">
											<div
												className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
													completed
														? 'border-green-500 bg-green-500 text-white'
														: isCurrent
															? 'border-amber-600 bg-amber-600 text-white'
															: 'border-muted-foreground/30 text-muted-foreground'
												}`}
											>
												{completed ? (
													<Check className="h-3.5 w-3.5" />
												) : isLocked ? (
													<Lock className="h-3.5 w-3.5" />
												) : (
													index + 1
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-2">
													<p className="text-sm font-medium">
														{point.name}
													</p>
													<Badge
														variant={
															completed
																? 'default'
																: isCurrent
																	? 'secondary'
																	: 'outline'
														}
													>
														{completed
															? 'Пройдена'
															: isCurrent
																? 'Текущая'
																: 'Закрыта'}
													</Badge>
												</div>
												<p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
													{point.short_description ||
														point.description}
												</p>
												<div className="mt-2 flex flex-wrap items-center gap-2">
													{point.audio_record_url && (
														<div className="bg-background/70 flex w-full items-center gap-2 rounded-lg border p-2">
															<Headphones className="h-4 w-4 shrink-0 text-amber-600" />
															<audio
																controls
																preload="none"
																src={
																	point.audio_record_url
																}
																className="h-8 min-w-0 flex-1"
															/>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</CardContent>
					</Card>
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
								disabled={
									!isScannerOpen || validatePoint.isPending
								}
								className="aspect-square w-full"
							/>
						</div>
						<form
							className="flex gap-2"
							onSubmit={(event) => {
								event.preventDefault()
								handleScanCode(manualCode)
							}}
						>
							<Input
								placeholder={currentPoint?.code || 'Код точки'}
								value={manualCode}
								onChange={(e) => setManualCode(e.target.value)}
								disabled={validatePoint.isPending}
							/>
							<Button
								type="submit"
								disabled={
									validatePoint.isPending ||
									!manualCode.trim()
								}
							>
								{validatePoint.isPending
									? 'Проверяем...'
									: 'Проверить'}
							</Button>
						</form>
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
					{allPointsCompleted && scanState.type === 'success' && (
						<Link href="/profile">
							<Button className="w-full">
								Перейти в профиль
							</Button>
						</Link>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}
