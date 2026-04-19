'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	Brain,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	MapPin,
	QrCode,
	RotateCcw,
	Search,
	Sparkles,
	Store,
	XCircle
} from 'lucide-react'
import { toast } from 'sonner'

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
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/components/ui/select'

import {
	getQuestCategories,
	getQuests,
	QuestCategory,
	QuestDto,
	registerUserQuest
} from '@/shared/api/quest'
import {
	answerDailyQuestion,
	getDailyQuestions,
	getTodayDailyQuestions,
	type DailyQuestionDto
} from '@/shared/api/daily-questions'
import { useUser } from '@/shared/hooks/use-user'
import { QrScanner } from '@/widgets/quest/qr-scanner'
import { QuestCard } from '@/widgets/quest-card'
import { EventsCalendarEmbed } from '@/widgets/events/events-calendar-embed'

const QUEST_START_ERROR_MESSAGE =
	'Не получилось отсканировать и начать прохождение квеста предприятия'
const DAILY_TEST_PROGRESS_STORAGE_PREFIX = 'daily-test-progress'

type DailyResult = 'correct' | 'wrong'

type DailyTestProgress = {
	date: string
	answers: Record<string, string>
	results: Record<string, DailyResult>
	completed: boolean
}

function getLocalDateIso(): string {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export default function HomePage() {
	const router = useRouter()
	const { user, isLoading: isUserLoading, isAuthenticated } = useUser()
	const [quests, setQuests] = useState<QuestDto[]>([])
	const [questCategories, setQuestCategories] = useState<QuestCategory[]>([])
	const [isLoadingQuests, setIsLoadingQuests] = useState(true)
	const [questsError, setQuestsError] = useState<string | null>(null)

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualQrCode, setManualQrCode] = useState('')
	const [scanNotice, setScanNotice] = useState<string | null>(null)
	const [isStartingQuest, setIsStartingQuest] = useState(false)
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [isDailyTestOpen, setIsDailyTestOpen] = useState(false)
	const [dailyDate, setDailyDate] = useState<string>(getLocalDateIso())
	const [dailyQuestions, setDailyQuestions] = useState<DailyQuestionDto[]>([])
	const [isLoadingDailyQuestions, setIsLoadingDailyQuestions] =
		useState(false)
	const [dailyQuestionsError, setDailyQuestionsError] = useState<
		string | null
	>(null)
	const [dailyAnswers, setDailyAnswers] = useState<Record<string, string>>({})
	const [dailyResults, setDailyResults] = useState<
		Record<string, DailyResult>
	>({})
	const [dailySubmittingQuestionId, setDailySubmittingQuestionId] = useState<
		string | null
	>(null)
	const [isDailyTestCompleted, setIsDailyTestCompleted] = useState(false)

	const [enterpriseSearch, setEnterpriseSearch] = useState('')
	const [enterpriseLevel, setEnterpriseLevel] = useState<string>('all')
	const [enterpriseCategory, setEnterpriseCategory] = useState<string>('all')
	const isDailyUserLoading = isAuthenticated && isUserLoading
	const dailyProgressStorageKey = useMemo(() => {
		const userKey = isAuthenticated
			? user?.id || user?.email || 'loading'
			: 'guest'
		return `${DAILY_TEST_PROGRESS_STORAGE_PREFIX}:${userKey}:${dailyDate}`
	}, [dailyDate, isAuthenticated, user?.email, user?.id])

	const saveDailyTestProgress = (
		answers: Record<string, string>,
		results: Record<string, DailyResult>,
		completed: boolean
	) => {
		if (typeof window === 'undefined') return

		const progress: DailyTestProgress = {
			date: dailyDate,
			answers,
			results,
			completed
		}
		window.localStorage.setItem(
			dailyProgressStorageKey,
			JSON.stringify(progress)
		)
	}

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
					'Не удалось загрузить ремесленные квесты'
				)
				setQuestsError(apiError.message)
				setQuests([])
				setQuestCategories([])
				toast.error(apiError.message)
			} finally {
				if (isMounted) setIsLoadingQuests(false)
			}
		}

		loadQuests()
		return () => {
			isMounted = false
		}
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const rawProgress = window.localStorage.getItem(dailyProgressStorageKey)

		if (!rawProgress) {
			setDailyAnswers({})
			setDailyResults({})
			setIsDailyTestCompleted(false)
			return
		}

		try {
			const progress = JSON.parse(rawProgress) as DailyTestProgress
			const results = progress.results || {}
			const isCompleted =
				progress.completed ||
				(dailyQuestions.length > 0 &&
					dailyQuestions.every((question) => results[question.id]))

			setDailyAnswers(progress.answers || {})
			setDailyResults(results)
			setIsDailyTestCompleted(isCompleted)
		} catch {
			setDailyAnswers({})
			setDailyResults({})
			setIsDailyTestCompleted(false)
		}
	}, [dailyProgressStorageKey, dailyQuestions])

	useEffect(() => {
		let isMounted = true

		const loadDailyQuestions = async () => {
			setIsLoadingDailyQuestions(true)
			setDailyQuestionsError(null)
			try {
				const [todayData, allData] = await Promise.all([
					getTodayDailyQuestions(),
					getDailyQuestions()
				])

				if (!isMounted) return

				const localDate = getLocalDateIso()
				const dateFromAll =
					allData.find((item) => item.date === localDate) ||
					allData.find((item) => item.date === todayData.date)

				setDailyDate(dateFromAll?.date || todayData.date || localDate)
				setDailyQuestions(
					dateFromAll?.questions?.length
						? dateFromAll.questions
						: todayData.questions || []
				)
			} catch (error) {
				if (!isMounted) return
				const apiError = normalizeApiError(
					error,
					'Не удалось загрузить ежедневные вопросы'
				)
				setDailyQuestionsError(apiError.message)
				setDailyQuestions([])
				toast.error(apiError.message)
			} finally {
				if (isMounted) setIsLoadingDailyQuestions(false)
			}
		}

		loadDailyQuestions()
		return () => {
			isMounted = false
		}
	}, [])

	const filteredQuests = useMemo(() => {
		return quests.filter((quest) => {
			const matchesSearch =
				quest.name
					.toLowerCase()
					.includes(enterpriseSearch.toLowerCase()) ||
				quest.description
					.toLowerCase()
					.includes(enterpriseSearch.toLowerCase())

			const matchesLevel =
				enterpriseLevel === 'all' ||
				(enterpriseLevel === 'basic' && quest.level === 'EASY') ||
				(enterpriseLevel === 'medium' && quest.level === 'MEDIUM')

			const matchesCategory =
				enterpriseCategory === 'all' ||
				quest.category?.id === enterpriseCategory ||
				quest.category_id === enterpriseCategory

			return matchesSearch && matchesLevel && matchesCategory
		})
	}, [quests, enterpriseSearch, enterpriseLevel, enterpriseCategory])
	const totalDailyQuestions = dailyQuestions.length
	const checkedDailyQuestionsCount = Object.keys(dailyResults).length
	const passedDailyQuestionsCount = Object.values(dailyResults).filter(
		(value) => value === 'correct'
	).length
	const hasCheckedDailyQuestions = checkedDailyQuestionsCount > 0

	const handleQrCode = async (rawCode: string) => {
		const normalizedCode = rawCode.trim().toUpperCase()

		if (!normalizedCode || isStartingQuest) {
			return
		}

		setIsStartingQuest(true)
		setScanNotice(null)

		try {
			const response = await registerUserQuest(normalizedCode)

			if (!response.quest_id) {
				throw new Error(QUEST_START_ERROR_MESSAGE)
			}

			setIsScannerOpen(false)
			setManualQrCode('')
			router.push(`/quest/${response.quest_id}`)
		} catch (error) {
			const apiError = normalizeApiError(error, QUEST_START_ERROR_MESSAGE)
			setScanNotice(apiError.message)
			toast.error(apiError.message)
		} finally {
			setIsStartingQuest(false)
		}
	}

	const handleScannerOpenChange = (open: boolean) => {
		setIsScannerOpen(open)
		if (open) {
			setScanNotice(null)
		}
	}

	const handleSelectDailyAnswer = (questionId: string, optionId: string) => {
		if (
			isDailyUserLoading ||
			isDailyTestCompleted ||
			dailyResults[questionId] ||
			dailySubmittingQuestionId === questionId
		)
			return
		setDailyAnswers((prev) => ({ ...prev, [questionId]: optionId }))
	}

	const handleCheckDailyAnswer = async (question: DailyQuestionDto) => {
		if (isDailyUserLoading) {
			toast.info('Загружаем профиль для ежедневного теста')
			return
		}

		if (isDailyTestCompleted) {
			toast.info('Ежедневный тест уже пройден')
			return
		}

		const selectedOptionId = dailyAnswers[question.id]

		if (!selectedOptionId) {
			toast.error('Выберите вариант ответа')
			return
		}

		setDailySubmittingQuestionId(question.id)
		try {
			const response = await answerDailyQuestion({
				question_id: question.id,
				user_answer: selectedOptionId
			})
			const nextResults: Record<string, DailyResult> = {
				...dailyResults,
				[question.id]: response.is_correct ? 'correct' : 'wrong'
			}
			const isCompleted =
				dailyQuestions.length > 0 &&
				dailyQuestions.every(
					(dailyQuestion) => nextResults[dailyQuestion.id]
				)

			setDailyResults(nextResults)
			setIsDailyTestCompleted(isCompleted)
			saveDailyTestProgress(dailyAnswers, nextResults, isCompleted)
			if (response.is_correct) {
				toast.success('Ответ засчитан')
			} else {
				toast.info('Ответ не засчитан')
			}
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось отправить ответ'
			)
			toast.error(apiError.message)
		} finally {
			setDailySubmittingQuestionId(null)
		}
	}

	const handleResetDailyTest = () => {
		if (
			isDailyUserLoading ||
			isDailyTestCompleted ||
			hasCheckedDailyQuestions
		) {
			toast.info('Проверенные ответы ежедневного теста нельзя сбросить')
			return
		}

		setDailyAnswers({})
		setDailyResults({})
		toast.info('Ответы ежедневного теста сброшены')
	}

	return (
		<div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
			<section className="grid gap-5">
				<Card className="overflow-hidden border-amber-200/70 bg-linear-to-br from-amber-50 via-orange-50 to-emerald-50 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
					<CardHeader>
						<Badge className="mb-2 w-fit border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
							<Sparkles className="mr-1 h-3.5 w-3.5" />
							Главная платформа ремесел
						</Badge>
						<CardTitle className="text-3xl leading-tight sm:text-4xl">
							Культурный калейдоскоп
						</CardTitle>
						<CardDescription className="max-w-2xl text-base sm:text-lg">
							Находите ремесленные предприятия, проходите квесты
							по точкам и покупайте товары мастеров.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button onClick={() => handleScannerOpenChange(true)}>
							<QrCode className="mr-2 h-4 w-4" />
							Сканировать QR организации
						</Button>
						<Link href="/shop">
							<Button variant="outline">
								<Store className="mr-2 h-4 w-4" />
								Открыть магазин
							</Button>
						</Link>
					</CardContent>
				</Card>
				{scanNotice && (
					<p className="text-muted-foreground text-sm">
						{scanNotice}
					</p>
				)}
			</section>

			<section className="space-y-3">
				<Card>
					<CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
						<div className="flex items-center gap-2">
							<CalendarDays className="h-5 w-5 text-orange-600" />
							<div>
								<p className="font-semibold">
									Календарь событий
								</p>
								<p className="text-muted-foreground text-sm">
									Культурные и ремесленные даты по месяцам
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsCalendarOpen((prev) => !prev)}
						>
							{isCalendarOpen ? (
								<>
									<ChevronUp className="mr-2 h-4 w-4" />
									Скрыть календарь
								</>
							) : (
								<>
									<ChevronDown className="mr-2 h-4 w-4" />
									Показать календарь
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				<EventsCalendarEmbed enabled={isCalendarOpen} />
			</section>

			<section className="space-y-3">
				<Card>
					<CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
						<div className="flex items-center gap-2">
							<Brain className="h-5 w-5 text-indigo-600" />
							<div>
								<p className="font-semibold">
									Ежедневный тест от нейросети
								</p>
								<p className="text-muted-foreground text-sm">
									Дата: {dailyDate}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsDailyTestOpen((prev) => !prev)}
						>
							{isDailyTestOpen ? (
								<>
									<ChevronUp className="mr-2 h-4 w-4" />
									Скрыть тест
								</>
							) : (
								<>
									<ChevronDown className="mr-2 h-4 w-4" />
									{isDailyTestCompleted
										? 'Тест пройден'
										: 'Пройти тест'}
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{isDailyTestOpen && (
					<Card>
						<CardHeader>
							<CardTitle className="text-xl">
								Проверка знаний
							</CardTitle>
							<CardDescription>
								{isDailyTestCompleted
									? 'Ежедневный тест уже пройден. Новый тест будет доступен завтра.'
									: 'Вопрос засчитывается только при правильном ответе.'}
							</CardDescription>
						</CardHeader>
						<CardContent
							className={`space-y-4 ${
								isDailyTestCompleted
									? 'pointer-events-none opacity-60'
									: ''
							}`}
							aria-disabled={isDailyTestCompleted}
						>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">
									Проверено: {checkedDailyQuestionsCount}/
									{totalDailyQuestions}
								</Badge>
								<Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
									Засчитано: {passedDailyQuestionsCount}
								</Badge>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleResetDailyTest}
									disabled={
										isDailyUserLoading ||
										isDailyTestCompleted ||
										hasCheckedDailyQuestions
									}
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									Сбросить
								</Button>
							</div>

							<div className="space-y-3">
								{dailyQuestionsError && (
									<p className="text-destructive text-sm">
										{dailyQuestionsError}
									</p>
								)}
								{isLoadingDailyQuestions && (
									<div className="space-y-2">
										{Array.from({ length: 3 }).map(
											(_, index) => (
												<Skeleton
													key={`daily-question-skeleton-${index}`}
													className="h-22 w-full"
												/>
											)
										)}
									</div>
								)}
								{!isLoadingDailyQuestions &&
									dailyQuestions.length === 0 && (
										<p className="text-muted-foreground text-sm">
											На сегодня вопросов пока нет.
										</p>
									)}
								{dailyQuestions.map((question, index) => {
									const result = dailyResults[question.id]
									return (
										<Card key={question.id}>
											<CardContent className="space-y-3 p-4">
												<p className="font-medium">
													{index + 1}.{' '}
													{question.question}
												</p>
												<div className="grid gap-2">
													{question.answer_options.map(
														(option) => {
															const isSelected =
																dailyAnswers[
																	question.id
																] === option
															return (
																<Button
																	key={option}
																	type="button"
																	variant="outline"
																	className={`justify-start text-left whitespace-normal ${
																		isSelected
																			? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200'
																			: ''
																	}`}
																	disabled={Boolean(
																		isDailyUserLoading ||
																		isDailyTestCompleted ||
																		result ||
																		dailySubmittingQuestionId ===
																			question.id
																	)}
																	onClick={() =>
																		handleSelectDailyAnswer(
																			question.id,
																			option
																		)
																	}
																>
																	{option}
																</Button>
															)
														}
													)}
												</div>

												<div className="flex flex-wrap items-center gap-2">
													<Button
														type="button"
														size="sm"
														disabled={Boolean(
															isDailyUserLoading ||
															isDailyTestCompleted ||
															result ||
															dailySubmittingQuestionId ===
																question.id
														)}
														onClick={() =>
															handleCheckDailyAnswer(
																question
															)
														}
													>
														Проверить
													</Button>
													{result === 'correct' && (
														<span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
															<CheckCircle2 className="h-4 w-4" />
															Ответ засчитан
														</span>
													)}
													{result === 'wrong' && (
														<span className="inline-flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
															<XCircle className="h-4 w-4" />
															Неверно, не
															засчитано
														</span>
													)}
												</div>
											</CardContent>
										</Card>
									)
								})}
							</div>
						</CardContent>
					</Card>
				)}
			</section>

			<section className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-semibold">
						Квесты от ремесленных предприятий
					</h2>
					<Badge variant="outline">{filteredQuests.length}</Badge>
				</div>

				<Card>
					<CardContent className="grid gap-3 p-4 md:grid-cols-5">
						<div className="relative md:col-span-2">
							<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								value={enterpriseSearch}
								onChange={(e) =>
									setEnterpriseSearch(e.target.value)
								}
								placeholder="Поиск квеста, предприятия или ремесла"
								className="pl-9"
							/>
						</div>
						<Select
							value={enterpriseLevel}
							onValueChange={setEnterpriseLevel}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Уровень" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Любой уровень
								</SelectItem>
								<SelectItem value="basic">Базовый</SelectItem>
								<SelectItem value="medium">Средний</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={enterpriseCategory}
							onValueChange={setEnterpriseCategory}
						>
							<SelectTrigger className="w-full md:col-span-2">
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

				<div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3">
					{isLoadingQuests &&
						Array.from({ length: 3 }).map((_, index) => (
							<Card key={`home-quest-skeleton-${index}`}>
								<Skeleton className="h-40 w-full rounded-t-xl rounded-b-none" />
								<CardHeader className="space-y-2">
									<Skeleton className="h-5 w-2/3" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-4/5" />
								</CardHeader>
								<CardContent className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-9 w-24" />
								</CardContent>
							</Card>
						))}
					{filteredQuests.map((quest) => (
						<QuestCard key={quest.id} quest={quest} />
					))}
				</div>

				{questsError && (
					<p className="text-destructive text-sm">{questsError}</p>
				)}
			</section>

			<Dialog open={isScannerOpen} onOpenChange={handleScannerOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Сканирование QR-кода</DialogTitle>
						<DialogDescription>
							Сканируйте код музея/организации или введите его
							вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-70 overflow-hidden rounded-lg border">
							<QrScanner
								onScanSuccess={handleQrCode}
								onError={() => {}}
								disabled={!isScannerOpen || isStartingQuest}
								className="aspect-square w-full"
							/>
						</div>
						<form
							className="space-y-2"
							onSubmit={(event) => {
								event.preventDefault()
								handleQrCode(manualQrCode)
							}}
						>
							<div className="relative">
								<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input
									value={manualQrCode}
									onChange={(e) =>
										setManualQrCode(e.target.value)
									}
									placeholder="Q-1B98A8"
									className="pl-9"
									disabled={isStartingQuest}
								/>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={
									isStartingQuest || !manualQrCode.trim()
								}
							>
								<MapPin className="mr-2 h-4 w-4" />
								{isStartingQuest
									? 'Запускаем квест...'
									: 'Проверить код'}
							</Button>
						</form>
						{scanNotice && (
							<p className="text-destructive text-sm">
								{scanNotice}
							</p>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
