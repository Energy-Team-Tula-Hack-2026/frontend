'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	MapPin,
	Pencil,
	QrCode,
	Sparkles,
	Star,
	ThumbsUp,
	Trash2,
	User
} from 'lucide-react'
import { toast } from 'sonner'

import {
	getQuestById,
	registerUserQuest,
	type QuestDto,
	type QuestFeedbackDto
} from '@/shared/api/quest'
import { getMe } from '@/shared/api/user'
import { TokenManager } from '@/shared/api/auth'
import { normalizeApiError } from '@/shared/api/errors'
import {
	changeQuestFeedback,
	createQuestFeedback,
	deleteQuestFeedback
} from '@/shared/api/feedback'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
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
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '@/shared/components/ui/avatar'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious
} from '@/shared/components/ui/carousel'
import { QrScanner } from '@/widgets/quest/qr-scanner'
import type { User as UserType, UserQuestStatus } from '@/shared/types'

const DEFAULT_AVATAR = '/user.jpg'
const QUEST_START_ERROR_MESSAGE =
	'Не получилось отсканировать и начать прохождение квеста предприятия'

function getQuestLevelLabel(level: QuestDto['level']): string {
	switch (level) {
		case 'EASY':
			return 'Базовый'
		case 'MEDIUM':
			return 'Средний'
		case 'HARD':
			return 'Продвинутый'
		default:
			return 'Без уровня'
	}
}

function formatDate(dateString: string): string {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date)
}

function renderStars(score: number) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={`h-4 w-4 ${
						star <= score
							? 'fill-yellow-400 text-yellow-400'
							: 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
					}`}
				/>
			))}
		</div>
	)
}

function getQuestStatusInfo(status: UserQuestStatus | null) {
	if (!status) return null

	switch (status) {
		case 'REGISTERED':
			return {
				icon: <CheckCircle2 className="h-4 w-4" />,
				text: 'Вы записаны на квест',
				color: 'text-blue-600 dark:text-blue-400'
			}
		case 'IN_PROGRESS':
			return {
				icon: <Sparkles className="h-4 w-4" />,
				text: 'Квест в процессе',
				color: 'text-green-600 dark:text-green-400'
			}
		case 'COMPLETED':
			return {
				icon: <CheckCircle2 className="h-4 w-4" />,
				text: 'Квест пройден',
				color: 'text-purple-600 dark:text-purple-400'
			}
		default:
			return null
	}
}

export default function RouteEnterprisePage() {
	const params = useParams()
	const router = useRouter()
	const id = Array.isArray(params.id) ? params.id[0] : params.id

	const isAuthenticated = TokenManager.isAuthenticated()

	const [quest, setQuest] = useState<QuestDto | null>(null)
	const [user, setUser] = useState<UserType | null>(null)
	const [isLoadingQuest, setIsLoadingQuest] = useState(true)
	const [isLoadingUser, setIsLoadingUser] = useState(isAuthenticated)
	const [error, setError] = useState<string | null>(null)

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualCode, setManualCode] = useState('')
	const [startMessage, setStartMessage] = useState<string | null>(null)
	const [startMessageVariant, setStartMessageVariant] = useState<
		'info' | 'error'
	>('info')
	const [isStartingQuest, setIsStartingQuest] = useState(false)

	const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [editingFeedback, setEditingFeedback] =
		useState<QuestFeedbackDto | null>(null)
	const [feedbackScore, setFeedbackScore] = useState(5)
	const [feedbackText, setFeedbackText] = useState('')
	const [feedbackHoveredStar, setFeedbackHoveredStar] = useState(0)
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
	const [feedbackError, setFeedbackError] = useState<string | null>(null)

	const reloadData = async () => {
		if (!id) return
		try {
			const [updatedQuest, updatedUser] = await Promise.all([
				getQuestById(id),
				isAuthenticated ? getMe() : Promise.resolve(null)
			])
			setQuest(updatedQuest)
			setUser(updatedUser)
		} catch (err) {
			console.error('Failed to reload route data', err)
			toast.error('Не удалось обновить данные страницы')
		}
	}

	useEffect(() => {
		if (!id) return
		let isMounted = true

		const load = async () => {
			setIsLoadingQuest(true)
			setError(null)
			try {
				const data = await getQuestById(id)
				if (!isMounted) return
				setQuest(data)
			} catch (err) {
				if (!isMounted) return
				const apiError = normalizeApiError(
					err,
					'Не удалось загрузить страницу предприятия'
				)
				setError(apiError.message)
				setQuest(null)
				toast.error(apiError.message)
			} finally {
				if (isMounted) setIsLoadingQuest(false)
			}
		}

		const loadUser = async () => {
			if (!isAuthenticated) {
				if (isMounted) {
					setUser(null)
					setIsLoadingUser(false)
				}
				return
			}
			setIsLoadingUser(true)
			try {
				const me = await getMe()
				if (!isMounted) return
				setUser(me)
			} catch {
				if (!isMounted) return
				setUser(null)
				toast.info('Войдите в аккаунт, чтобы видеть свой прогресс')
			} finally {
				if (isMounted) setIsLoadingUser(false)
			}
		}

		load()
		loadUser()

		return () => {
			isMounted = false
		}
	}, [id, isAuthenticated])

	const isLoading = isLoadingQuest || isLoadingUser

	const currentUserQuest = useMemo(() => {
		if (!id || !user?.quests?.length) return null
		return user.quests.find((item) => item.quest_id === id) ?? null
	}, [id, user])

	const userQuestStatus = useMemo(() => {
		if (!id || !user?.quests?.length) return null
		return currentUserQuest?.status || null
	}, [id, user, currentUserQuest])

	const hasUserQuest = Boolean(currentUserQuest)

	const canLeaveFeedback = hasUserQuest

	const userFeedback = useMemo(() => {
		if (!user?.id || !quest?.feedbacks?.length) return null
		return (
			quest.feedbacks.find((feedback) => feedback.user_id === user.id) ??
			null
		)
	}, [user, quest])

	const questStatusInfo = useMemo(
		() => getQuestStatusInfo(userQuestStatus),
		[userQuestStatus]
	)

	const handleStartByCode = async (rawCode: string) => {
		const code = rawCode.trim().toUpperCase()
		if (!quest) return

		if (hasUserQuest) {
			const message = 'Вы уже проходили этот квест'
			setStartMessageVariant('info')
			setStartMessage(message)
			toast.info(message)
			return
		}

		if (!code || isStartingQuest) {
			return
		}

		setIsStartingQuest(true)
		setStartMessage(null)
		setStartMessageVariant('info')

		try {
			const response = await registerUserQuest(code)

			if (!response.quest_id) {
				throw new Error(QUEST_START_ERROR_MESSAGE)
			}

			setIsScannerOpen(false)
			setManualCode('')
			router.push(`/quest/${response.quest_id}`)
		} catch (err) {
			const apiError = normalizeApiError(err, QUEST_START_ERROR_MESSAGE)
			setStartMessageVariant('error')
			setStartMessage(apiError.message)
			toast.error(apiError.message)
		} finally {
			setIsStartingQuest(false)
		}
	}

	const handleScannerOpenChange = (open: boolean) => {
		if (open && hasUserQuest) {
			const message = 'Вы уже проходили этот квест'
			setStartMessageVariant('info')
			setStartMessage(message)
			toast.info(message)
			return
		}

		setIsScannerOpen(open)
		if (open) {
			setStartMessage(null)
			setStartMessageVariant('info')
		}
	}

	const redirectToLogin = () => {
		const nextUrl =
			typeof window !== 'undefined'
				? `/login?next=${encodeURIComponent(window.location.pathname)}`
				: '/login'
		router.push(nextUrl)
	}

	const handleOpenCreateFeedback = () => {
		if (!isAuthenticated) {
			toast.error('Для оставления отзыва нужно войти в аккаунт')
			redirectToLogin()
			return
		}

		if (!canLeaveFeedback) {
			toast.info('Зарегистрируйтесь на квест, чтобы оставить отзыв')
			return
		}

		setEditingFeedback(null)
		setFeedbackScore(5)
		setFeedbackText('')
		setFeedbackError(null)
		setFeedbackDialogOpen(true)
	}

	const handleOpenEditFeedback = (feedback: QuestFeedbackDto) => {
		setEditingFeedback(feedback)
		setFeedbackScore(feedback.score)
		setFeedbackText(feedback.text || '')
		setFeedbackError(null)
		setFeedbackDialogOpen(true)
	}

	const handleOpenDeleteDialog = (feedback: QuestFeedbackDto) => {
		setEditingFeedback(feedback)
		setDeleteDialogOpen(true)
	}

	const validateFeedback = () => {
		if (!feedbackText.trim()) {
			setFeedbackError('Пожалуйста, напишите текст отзыва')
			return false
		}
		if (feedbackScore === 0) {
			setFeedbackError('Пожалуйста, поставьте оценку')
			return false
		}
		return true
	}

	const handleSubmitFeedback = async () => {
		if (!quest) return
		if (!validateFeedback()) return

		setIsSubmittingFeedback(true)
		try {
			if (editingFeedback) {
				await changeQuestFeedback(
					editingFeedback.id,
					editingFeedback.quest_id,
					{
						score: feedbackScore,
						text: feedbackText.trim()
					}
				)
				toast.success('Отзыв успешно обновлен')
			} else {
				await createQuestFeedback(quest.id, {
					score: feedbackScore,
					text: feedbackText.trim()
				})
				toast.success('Отзыв успешно создан')
			}

			await reloadData()
			setFeedbackDialogOpen(false)
			setEditingFeedback(null)
			setFeedbackError(null)
		} catch (err) {
			const apiError = normalizeApiError(
				err,
				'Не удалось сохранить отзыв'
			)
			setFeedbackError(apiError.message)
			toast.error(apiError.message)
		} finally {
			setIsSubmittingFeedback(false)
		}
	}

	const handleDeleteFeedback = async () => {
		if (!editingFeedback) return
		setIsSubmittingFeedback(true)
		try {
			await deleteQuestFeedback(
				editingFeedback.id,
				editingFeedback.quest_id
			)
			toast.success('Отзыв успешно удален')
			await reloadData()
			setDeleteDialogOpen(false)
			setEditingFeedback(null)
		} catch (err) {
			const apiError = normalizeApiError(err, 'Не удалось удалить отзыв')
			toast.error(apiError.message)
		} finally {
			setIsSubmittingFeedback(false)
		}
	}

	if (isLoading) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="bg-muted h-56 animate-pulse rounded-3xl" />
			</div>
		)
	}

	if (!quest || error) {
		return (
			<div className="mx-auto w-full max-w-5xl px-4 py-12 text-center">
				<p className="text-muted-foreground">
					{error || 'Предприятие не найдено'}
				</p>
				<Link href="/">
					<Button className="mt-4">На главную</Button>
				</Link>
			</div>
		)
	}

	const questImages = Array.from(
		new Set([
			...(quest.images
				?.map((image) => image.image_url)
				.filter((url): url is string => Boolean(url)) ?? []),
			...(quest.points
				?.map((point) => point.image_url)
				.filter((url): url is string => Boolean(url)) ?? [])
		])
	)
	const finalQuestImages =
		questImages.length > 0 ? questImages : ['/placeholder-logo.png']

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<Button variant="ghost" onClick={() => router.back()}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Назад
			</Button>

			<section className="rounded-3xl border border-amber-200/70 bg-linear-to-br from-amber-50 via-orange-50 to-emerald-50 p-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<div className="bg-background mb-5 overflow-hidden rounded-2xl border">
					<Carousel className="w-full">
						<CarouselContent className="ml-0">
							{finalQuestImages.map((imageUrl, index) => (
								<CarouselItem
									key={`${quest.id}-${imageUrl}-${index}`}
									className="pl-0"
								>
									<img
										src={imageUrl}
										alt={`${quest.name} — фото ${index + 1}`}
										className="h-56 w-full object-cover sm:h-72"
									/>
								</CarouselItem>
							))}
						</CarouselContent>
						{finalQuestImages.length > 1 && (
							<CarouselPrevious className="top-1/2 left-4 -translate-y-1/2 border-white/80 bg-white/85" />
						)}
						{finalQuestImages.length > 1 && (
							<CarouselNext className="top-1/2 right-4 -translate-y-1/2 border-white/80 bg-white/85" />
						)}
					</Carousel>
				</div>

				<Badge className="mb-3 w-fit border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
					Ремесленное предприятие
				</Badge>
				<h1 className="text-3xl font-semibold">{quest.name}</h1>
				<p className="text-muted-foreground mt-3 max-w-3xl text-base">
					{quest.description}
				</p>
				<div className="mt-4 flex flex-wrap gap-4 text-sm">
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<Sparkles className="h-4 w-4" />
						{getQuestLevelLabel(quest.level)}
					</div>
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<Clock className="h-4 w-4" />
						{quest.duration_min ?? 0} минут
					</div>
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<MapPin className="h-4 w-4" />
						{quest.category?.name ??
							quest.location?.city ??
							'Ремесленный объект'}
					</div>
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Описание экскурсии и квеста</CardTitle>
						<CardDescription>
							После подтверждения QR-кодом на входе вы сможете
							начать последовательное прохождение точек.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm leading-relaxed">
							{quest.description}
						</p>
						<div className="space-y-3">
							<p className="font-medium">
								Основные точки квеста:
							</p>
							{quest.points
								.slice()
								.sort((a, b) => a.priority - b.priority)
								.map((point, index) => (
									<div
										key={
											point.id ||
											`${point.quest_id}-${point.priority}-${index}`
										}
										className="rounded-lg border p-3"
									>
										<p className="text-sm font-semibold">
											{index + 1}. {point.name}
										</p>
										<p className="text-muted-foreground mt-1 text-sm">
											{point.short_description ||
												point.description}
										</p>
									</div>
								))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Начать квест</CardTitle>
						<CardDescription>
							Сканируйте QR-код входа предприятия, чтобы открыть
							прохождение.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full"
							onClick={() => handleScannerOpenChange(true)}
							disabled={hasUserQuest}
						>
							<QrCode className="mr-2 h-4 w-4" />
							{hasUserQuest
								? 'Квест уже начат'
								: 'Сканировать QR входа'}
						</Button>
						{hasUserQuest && (
							<div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4" />
									<span>Вы уже проходили этот квест</span>
								</div>
								<Link href={`/quest/${quest.id}`}>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
									>
										Перейти к квесту
									</Button>
								</Link>
							</div>
						)}
						{startMessage && (
							<div
								className={`rounded-lg border p-3 text-sm ${
									startMessageVariant === 'error'
										? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
										: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'
								}`}
							>
								{startMessageVariant === 'error' ? (
									<AlertCircle className="mr-1 inline h-4 w-4" />
								) : (
									<CheckCircle2 className="mr-1 inline h-4 w-4" />
								)}
								{startMessage}
							</div>
						)}
					</CardContent>
				</Card>
			</section>

			<section className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-xl font-semibold">Отзывы</h2>
					<Badge variant="outline">
						{quest.feedbacks?.length ?? 0}
					</Badge>
				</div>

				{isAuthenticated && !userFeedback && (
					<Card className="border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
						<CardContent className="p-6 text-center">
							{questStatusInfo && (
								<div className="mb-3 flex items-center justify-center gap-2 text-sm">
									<span className={questStatusInfo.color}>
										{questStatusInfo.icon}
									</span>
									<span className={questStatusInfo.color}>
										{questStatusInfo.text}
									</span>
								</div>
							)}
							{canLeaveFeedback ? (
								<div>
									<p className="text-muted-foreground mb-3">
										Поделитесь впечатлениями о квесте
									</p>
									<Button
										onClick={handleOpenCreateFeedback}
										variant="outline"
										className="border-blue-300 bg-white hover:bg-blue-50 dark:border-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-950"
									>
										<Star className="mr-2 h-4 w-4" />
										Оставить отзыв
									</Button>
								</div>
							) : (
								<p className="text-muted-foreground">
									Зарегистрируйтесь на квест, чтобы оставить
									отзыв
								</p>
							)}
						</CardContent>
					</Card>
				)}

				{!quest.feedbacks?.length ? (
					<Card>
						<CardContent className="py-12 text-center">
							<ThumbsUp className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
							<h3 className="text-foreground mb-2 text-lg font-semibold">
								Пока нет отзывов
							</h3>
							<p className="text-muted-foreground">
								Будьте первым, кто оставит отзыв о квесте
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{quest.feedbacks.map((review, index) => {
							const isOwnReview = Boolean(
								user?.id && user.id === review.user_id
							)
							return (
								<Card
									key={
										review.id ||
										`${review.user_id}-${review.created_at}-${index}`
									}
									className="overflow-hidden"
								>
									<CardContent className="p-6">
										<div className="flex flex-col space-y-3">
											<div className="flex items-start justify-between">
												<div className="flex items-center space-x-3">
													<Avatar className="h-10 w-10">
														<AvatarImage
															src={
																review.user
																	?.avatar_url ||
																DEFAULT_AVATAR
															}
															alt={`${review.user?.name ?? ''} ${review.user?.surname ?? ''}`}
														/>
														<AvatarFallback>
															<User className="h-5 w-5" />
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="flex items-center gap-2">
															<p className="text-foreground font-semibold">
																{review.user
																	? `${review.user.name} ${review.user.surname}`
																	: 'Пользователь'}
															</p>
															{isOwnReview && (
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	Ваш отзыв
																</Badge>
															)}
														</div>
														<div className="mt-1">
															{renderStars(
																review.score
															)}
														</div>
													</div>
												</div>

												<div className="flex items-center gap-1">
													<div className="text-muted-foreground flex items-center space-x-1 text-xs">
														<Calendar className="h-3 w-3" />
														<span>
															{formatDate(
																review.created_at
															)}
														</span>
													</div>
													{isOwnReview && (
														<div className="flex items-center gap-1">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={() =>
																	handleOpenEditFeedback(
																		review
																	)
																}
															>
																<Pencil className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
																onClick={() =>
																	handleOpenDeleteDialog(
																		review
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													)}
												</div>
											</div>

											{review.text && (
												<p className="text-muted-foreground leading-relaxed">
													{review.text}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}
			</section>

			<Dialog open={isScannerOpen} onOpenChange={handleScannerOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Проверка входного QR-кода</DialogTitle>
						<DialogDescription>
							Сканируйте код с входа предприятия или введите
							вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-70 overflow-hidden rounded-lg border">
							<QrScanner
								onScanSuccess={handleStartByCode}
								onError={() => {}}
								disabled={
									!isScannerOpen ||
									hasUserQuest ||
									isStartingQuest
								}
								className="aspect-square w-full"
							/>
						</div>
						<form
							className="flex gap-2"
							onSubmit={(event) => {
								event.preventDefault()
								handleStartByCode(manualCode)
							}}
						>
							<Input
								placeholder="Q-1B98A8"
								value={manualCode}
								onChange={(e) => setManualCode(e.target.value)}
								disabled={hasUserQuest || isStartingQuest}
							/>
							<Button
								type="submit"
								disabled={
									hasUserQuest ||
									isStartingQuest ||
									!manualCode.trim()
								}
							>
								{isStartingQuest ? 'Запускаем...' : 'Проверить'}
							</Button>
						</form>
						{startMessage && (
							<p
								className={`text-sm ${
									startMessageVariant === 'error'
										? 'text-destructive'
										: 'text-muted-foreground'
								}`}
							>
								{startMessage}
							</p>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={feedbackDialogOpen}
				onOpenChange={(open) => {
					setFeedbackDialogOpen(open)
					if (!open) {
						setEditingFeedback(null)
						setFeedbackError(null)
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingFeedback
								? 'Редактировать отзыв'
								: 'Оставить отзыв'}
						</DialogTitle>
						<DialogDescription>
							{editingFeedback
								? `Измените свою оценку или комментарий к квесту "${quest.name}"`
								: `Поделитесь впечатлениями о квесте "${quest.name}"`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						<div className="space-y-3">
							<Label>Ваша оценка</Label>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star, index) => (
									<button
										key={`${index}-${star}`}
										type="button"
										onClick={() => {
											setFeedbackScore(star)
											if (feedbackError)
												setFeedbackError(null)
										}}
										onMouseEnter={() =>
											setFeedbackHoveredStar(star)
										}
										onMouseLeave={() =>
											setFeedbackHoveredStar(0)
										}
										className="focus:outline-none"
									>
										<Star
											className={`h-8 w-8 transition-all ${
												star <=
												(feedbackHoveredStar ||
													feedbackScore)
													? 'fill-yellow-400 text-yellow-400'
													: 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
											}`}
										/>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-3">
							<Label htmlFor="feedback-text">
								Ваш комментарий{' '}
								<span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="feedback-text"
								placeholder="Расскажите, что вам понравилось или что можно улучшить..."
								value={feedbackText}
								onChange={(e) => {
									setFeedbackText(e.target.value)
									if (feedbackError) setFeedbackError(null)
								}}
								rows={4}
								className={`resize-none ${feedbackError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
							/>
							{feedbackError && (
								<div className="flex items-center gap-2 text-sm text-red-500">
									<AlertCircle className="h-4 w-4" />
									<span>{feedbackError}</span>
								</div>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setFeedbackDialogOpen(false)
								setFeedbackError(null)
							}}
							disabled={isSubmittingFeedback}
						>
							Отмена
						</Button>
						<Button
							onClick={handleSubmitFeedback}
							disabled={isSubmittingFeedback}
						>
							{isSubmittingFeedback
								? editingFeedback
									? 'Сохранение...'
									: 'Создание...'
								: editingFeedback
									? 'Сохранить изменения'
									: 'Оставить отзыв'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Удалить отзыв?</DialogTitle>
						<DialogDescription>
							Вы уверены, что хотите удалить свой отзыв? Это
							действие нельзя отменить.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={isSubmittingFeedback}
						>
							Отмена
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteFeedback}
							disabled={isSubmittingFeedback}
						>
							{isSubmittingFeedback ? 'Удаление...' : 'Удалить'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
