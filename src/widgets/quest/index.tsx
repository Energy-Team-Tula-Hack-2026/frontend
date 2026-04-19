'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
	ArrowLeft,
	Check,
	Clock,
	Headphones,
	MapPin,
	PartyPopper,
	QrCode,
	Route,
	Sparkles,
	Star
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
	const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
	const [manualCode, setManualCode] = useState('')
	const [scannerError, setScannerError] = useState<string | null>(null)
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

	const availablePoints = useMemo(() => {
		return sortedPoints.filter(
			(point) => !progress.completedPointIds.includes(point.id)
		)
	}, [sortedPoints, progress.completedPointIds])

	const selectedPoint = useMemo(() => {
		if (!selectedPointId) return null
		const point = sortedPoints.find((item) => item.id === selectedPointId)
		if (!point || progress.completedPointIds.includes(point.id)) return null
		return point
	}, [selectedPointId, sortedPoints, progress.completedPointIds])

	const allPointsCompleted =
		sortedPoints.length > 0 &&
		sortedPoints.every((point) =>
			progress.completedPointIds.includes(point.id)
		)

	useEffect(() => {
		if (!selectedPointId) return
		const hasSelectedAvailablePoint = availablePoints.some(
			(point) => point.id === selectedPointId
		)
		if (!hasSelectedAvailablePoint) {
			setSelectedPointId(null)
		}
	}, [availablePoints, selectedPointId])

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

	const questRating =
		typeof quest.rating === 'number'
			? quest.rating.toFixed(1)
			: 'Нет рейтинга'
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
		setScannerError(null)

		if (!code || validatePoint.isPending) {
			return
		}

		if (allPointsCompleted) {
			setIsScannerOpen(false)
			setScanState({
				open: true,
				type: 'success',
				message: 'Все точки уже пройдены.'
			})
			return
		}

		const scannedPoint = sortedPoints.find(
			(point) => point.code.trim().toUpperCase() === code
		)

		if (!scannedPoint) {
			setScannerError('QR-код не относится к точкам этого квеста.')
			return
		}

		if (progress.completedPointIds.includes(scannedPoint.id)) {
			setScannerError(
				`Точка "${scannedPoint.name}" уже пройдена. Выберите другой чекпоинт.`
			)
			return
		}

		try {
			await validatePoint.mutateAsync({ code, point: scannedPoint })

			const nextCompletedIds = Array.from(
				new Set([...progress.completedPointIds, scannedPoint.id])
			)
			const nextQuestCompletedCount = nextCompletedIds.filter((pointId) =>
				sortedPoints.some((point) => point.id === pointId)
			).length
			saveProgress({ completedPointIds: nextCompletedIds })
			setSelectedPointId(null)
			setIsScannerOpen(false)

			const isLastPoint = nextQuestCompletedCount >= sortedPoints.length

			setScanState({
				open: true,
				type: 'success',
				message: isLastPoint
					? 'Поздравляем! Вы прошли все точки квеста.'
					: `Точка "${scannedPoint.name}" пройдена. Можно выбрать любой оставшийся чекпоинт.`
			})
			toast.success(
				isLastPoint
					? 'Квест завершён'
					: `Точка "${scannedPoint.name}" пройдена`
			)
		} catch (err) {
			const apiError = normalizeApiError(err, POINT_SCAN_ERROR_MESSAGE)
			setScannerError(apiError.message)
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
					<Badge variant="secondary">
						<Star className="mr-1 h-3 w-3 fill-current" />
						{questRating}
					</Badge>
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
						{selectedPoint && (
							<p className="text-muted-foreground mt-3 text-sm">
								Выбран чекпоинт:{' '}
								<span className="text-foreground font-medium">
									{selectedPoint.name}
								</span>
							</p>
						)}
						{availablePoints.length > 0 && !selectedPoint && (
							<p className="text-muted-foreground mt-3 text-sm">
								Можно проходить чекпоинты в любом порядке.
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
							<CardTitle className="text-lg">Карта</CardTitle>
							<CardDescription>
								На карте отображается организация, где проходит
								квест.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="mx-auto w-full max-w-215">
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
								Выберите любой непройденный чекпоинт или
								сканируйте его QR-код сразу.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button
								className="w-full"
								size="lg"
								onClick={() => {
									setScannerError(null)
									setIsScannerOpen(true)
								}}
								disabled={
									availablePoints.length === 0 ||
									allPointsCompleted ||
									validatePoint.isPending
								}
							>
								<QrCode className="mr-2 h-5 w-5" />
								{validatePoint.isPending
									? 'Проверяем точку...'
									: selectedPoint
										? `Сканировать: ${selectedPoint.name}`
										: availablePoints.length > 0
											? 'Сканировать'
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
								const isSelected =
									selectedPoint?.id === point.id

								return (
									<div
										key={point.id}
										className={`rounded-t-xl rounded-br-xl rounded-bl-4xl border p-3 transition-all ${
											completed
												? 'border-green-200 bg-green-50 shadow-sm dark:border-green-900 dark:bg-green-950/20'
												: isSelected
													? 'border-teal-300 bg-teal-50 shadow-md ring-2 ring-teal-200/70 dark:border-teal-800 dark:bg-teal-950/20 dark:ring-teal-900/50'
													: 'border-amber-300 bg-amber-50/80 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20'
										}`}
									>
										<div className="flex items-start gap-3">
											<div
												className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
													completed
														? 'border-green-500 bg-green-500 text-white'
														: isSelected
															? 'border-teal-600 bg-teal-600 text-white'
															: 'border-amber-700 bg-amber-700 text-white'
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
													<Badge
														variant={
															completed
																? 'default'
																: isSelected
																	? 'secondary'
																	: 'outline'
														}
														className={
															completed
																? 'border-green-600 bg-green-600 text-white'
																: isSelected
																	? 'border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200'
																	: 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
														}
													>
														{completed
															? 'Пройдена'
															: isSelected
																? 'Выбрана'
																: 'Доступна'}
													</Badge>
												</div>
												<p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
													{point.short_description ||
														point.description}
												</p>
												<div className="mt-3 flex flex-wrap items-center gap-2">
													{!completed && (
														<Button
															type="button"
															size="sm"
															variant={
																isSelected
																	? 'default'
																	: 'outline'
															}
															className="w-full"
															onClick={() => {
																setSelectedPointId(
																	point.id
																)
																setScannerError(
																	null
																)
																setIsScannerOpen(
																	true
																)
															}}
														>
															<QrCode className="mr-2 h-4 w-4" />
															{isSelected
																? 'Сканировать выбранный'
																: 'Сканировать чекпоинт'}
														</Button>
													)}
													{point.audio_record_url && (
														<div className="bg-background/70 mx-auto flex w-full max-w-[320px] items-center justify-center gap-2 rounded-lg border p-2">
															<Headphones
																className={`h-4 w-4 shrink-0 ${
																	completed
																		? 'text-green-600'
																		: isSelected
																			? 'text-teal-600'
																			: 'text-amber-700'
																}`}
															/>
															<audio
																controls
																preload="none"
																src={
																	point.audio_record_url
																}
																className="h-8 w-full max-w-65 min-w-0"
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
					if (open) setScannerError(null)
					if (!open) {
						setManualCode('')
						setScannerError(null)
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Сканирование точки</DialogTitle>
						<DialogDescription>
							Сканируйте QR любого непройденного чекпоинта или
							введите код вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-70 overflow-hidden rounded-lg border">
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
								placeholder={selectedPoint?.code || 'Код точки'}
								value={manualCode}
								onChange={(e) => {
									setManualCode(e.target.value)
									if (scannerError) setScannerError(null)
								}}
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
						{scannerError && (
							<div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-200">
								{scannerError}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={scanState.open}
				onOpenChange={(open) =>
					setScanState((prev) => ({ ...prev, open }))
				}
			>
				<DialogContent className="overflow-hidden border-0 p-0 sm:max-w-md">
					<div
						className={`border p-6 ${
							scanState.type === 'success'
								? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/20'
								: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/20'
						}`}
					>
						<DialogHeader className="items-center text-center">
							<div
								className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full border shadow-sm ${
									scanState.type === 'success'
										? allPointsCompleted
											? 'border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300'
											: 'border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300'
										: 'border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
								}`}
							>
								{scanState.type === 'success' ? (
									allPointsCompleted ? (
										<PartyPopper className="h-6 w-6" />
									) : (
										<Check className="h-6 w-6" />
									)
								) : (
									<QrCode className="h-6 w-6" />
								)}
							</div>
							<DialogTitle className="text-xl">
								{scanState.type === 'success'
									? allPointsCompleted
										? 'Квест завершён!'
										: 'Точка пройдена'
									: 'Не удалось отметить точку'}
							</DialogTitle>
							<DialogDescription className="max-w-sm text-center text-sm leading-relaxed">
								{scanState.message}
							</DialogDescription>
						</DialogHeader>

						{scanState.type === 'success' && (
							<div className="mt-5 rounded-xl border border-amber-200/70 bg-white/75 p-4 shadow-sm dark:border-amber-900/50 dark:bg-zinc-950/40">
								<div className="mb-2 flex items-center justify-between text-sm">
									<span className="font-medium">
										Прогресс маршрута
									</span>
									<span className="text-muted-foreground">
										{completedCount} / {sortedPoints.length}
									</span>
								</div>
								<Progress
									value={progressPercent}
									className="h-2"
								/>
								{allPointsCompleted ? (
									<p className="mt-3 text-sm text-green-700 dark:text-green-300">
										Все чекпоинты отмечены. Результат уже
										сохранён в вашем прогрессе.
									</p>
								) : (
									<div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
										<p className="text-muted-foreground">
											Дальше можно выбрать любую
											непройденную точку
										</p>
										<p className="font-semibold text-amber-900 dark:text-amber-200">
											Осталось чекпоинтов:{' '}
											{availablePoints.length}
										</p>
									</div>
								)}
							</div>
						)}

						<div className="mt-5 flex flex-col gap-2 sm:flex-row">
							{allPointsCompleted &&
								scanState.type === 'success' && (
									<Link href="/profile" className="flex-1">
										<Button className="w-full">
											Перейти в профиль
										</Button>
									</Link>
								)}
							<Button
								className="flex-1"
								variant={
									scanState.type === 'success'
										? 'outline'
										: 'default'
								}
								onClick={() =>
									setScanState((prev) => ({
										...prev,
										open: false
									}))
								}
							>
								{scanState.type === 'success'
									? allPointsCompleted
										? 'Остаться здесь'
										: 'Продолжить маршрут'
									: 'Понятно'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
