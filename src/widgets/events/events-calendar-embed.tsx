'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CircleAlert, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { getEvents, type CulturalEventDto } from '@/shared/api/events'
import { normalizeApiError } from '@/shared/api/errors'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

const MONTHS = [
	'Январь',
	'Февраль',
	'Март',
	'Апрель',
	'Май',
	'Июнь',
	'Июль',
	'Август',
	'Сентябрь',
	'Октябрь',
	'Ноябрь',
	'Декабрь'
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

type CalendarCell = {
	day: number
	events: CulturalEventDto[]
}

type Props = {
	enabled: boolean
}

export function EventsCalendarEmbed({ enabled }: Props) {
	const today = new Date()
	const [events, setEvents] = useState<CulturalEventDto[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
	const [selectedDay, setSelectedDay] = useState<number | null>(null)

	const loadEvents = async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await getEvents()
			setEvents(data)
		} catch (err) {
			const apiError = normalizeApiError(
				err,
				'Не удалось загрузить события'
			)
			setError(apiError.message)
			toast.error(apiError.message)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (!enabled || events.length > 0 || isLoading) return
		void loadEvents()
	}, [enabled, events.length, isLoading])

	const monthEvents = useMemo(
		() =>
			events
				.filter((event) => event.month === selectedMonth)
				.sort((a, b) => a.day - b.day),
		[events, selectedMonth]
	)

	const eventsByDay = useMemo(() => {
		const map = new Map<number, CulturalEventDto[]>()
		for (const event of monthEvents) {
			const dayEvents = map.get(event.day) ?? []
			dayEvents.push(event)
			map.set(event.day, dayEvents)
		}
		return map
	}, [monthEvents])

	const visibleSelectedDay =
		selectedDay !== null && eventsByDay.has(selectedDay)
			? selectedDay
			: null

	const selectedDayEvents =
		visibleSelectedDay === null
			? []
			: (eventsByDay.get(visibleSelectedDay) ?? [])

	const nearestEvent = useMemo(() => {
		if (events.length === 0) return null
		const now = new Date()

		const getNextDate = (event: CulturalEventDto) => {
			const currentYear = now.getFullYear()
			let candidate = new Date(currentYear, event.month - 1, event.day)
			if (candidate < now) {
				candidate = new Date(
					currentYear + 1,
					event.month - 1,
					event.day
				)
			}
			return candidate
		}

		return [...events].sort(
			(a, b) => getNextDate(a).getTime() - getNextDate(b).getTime()
		)[0]
	}, [events])

	const calendarCells = useMemo<CalendarCell[]>(() => {
		const year = today.getFullYear()
		const firstDate = new Date(year, selectedMonth - 1, 1)
		const daysInMonth = new Date(year, selectedMonth, 0).getDate()
		const firstWeekday = (firstDate.getDay() + 6) % 7

		const cells: CalendarCell[] = []
		for (let i = 0; i < firstWeekday; i += 1) {
			cells.push({ day: 0, events: [] })
		}
		for (let day = 1; day <= daysInMonth; day += 1) {
			cells.push({ day, events: eventsByDay.get(day) ?? [] })
		}
		while (cells.length % 7 !== 0) {
			cells.push({ day: 0, events: [] })
		}
		return cells
	}, [eventsByDay, selectedMonth, today])

	if (!enabled) return null

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-72 w-full" />
			</div>
		)
	}

	if (error) {
		return (
			<Card className="border-red-200/70 dark:border-red-900/40">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
						<CircleAlert className="h-4 w-4" />
						Ошибка загрузки календаря
					</CardTitle>
					<CardDescription>{error}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" onClick={() => void loadEvents()}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Повторить
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarDays className="h-4 w-4 text-orange-600" />
						Календарь событий
					</CardTitle>
					<CardDescription>
						Выберите месяц и день для просмотра событий
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
						{MONTHS.map((name, index) => {
							const monthNumber = index + 1
							const count = events.filter(
								(event) => event.month === monthNumber
							).length
							return (
								<Button
									key={monthNumber}
									variant={
										selectedMonth === monthNumber
											? 'default'
											: 'outline'
									}
									className="h-auto justify-between py-2"
									onClick={() =>
										setSelectedMonth(monthNumber)
									}
								>
									<span>{name}</span>
									<Badge variant="secondary" className="ml-2">
										{count}
									</Badge>
								</Button>
							)
						})}
					</div>

					<div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
						<div className="space-y-2">
							<div className="text-muted-foreground grid grid-cols-7 gap-1.5 text-center text-xs font-medium">
								{WEEKDAYS.map((weekday) => (
									<div key={weekday}>{weekday}</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-1.5 sm:gap-2">
								{calendarCells.map((cell, index) => {
									if (cell.day === 0) {
										return (
											<div
												key={`empty-${index}`}
												className="bg-muted/40 h-14 rounded-lg sm:h-16"
											/>
										)
									}

									const isSelected =
										cell.day === visibleSelectedDay
									const isToday =
										selectedMonth ===
											today.getMonth() + 1 &&
										cell.day === today.getDate()
									const hasEvents = cell.events.length > 0

									return (
										<button
											key={cell.day}
											type="button"
											onClick={() => {
												if (!hasEvents) return
												setSelectedDay(cell.day)
											}}
											className={[
												'flex h-14 flex-col rounded-lg border p-1.5 text-left transition sm:h-16',
												hasEvents
													? 'border-orange-300/70 bg-orange-50/50 dark:border-orange-800/70 dark:bg-orange-950/20'
													: 'border-border bg-background hover:bg-muted/60',
												isToday
													? 'border-blue-500 bg-blue-100/90 shadow-[0_0_0_2px_rgba(59,130,246,0.25)] dark:border-blue-400 dark:bg-blue-900/35'
													: '',
												isSelected
													? 'ring-2 ring-orange-500/70'
													: ''
											].join(' ')}
										>
											<span
												className={[
													'text-xs font-semibold sm:text-sm',
													isToday
														? 'text-blue-900 dark:text-blue-100'
														: ''
												].join(' ')}
											>
												{cell.day}
											</span>
											{isToday ? (
												<Badge
													variant="secondary"
													className="mt-0.5 w-fit px-1.5 py-0 text-[9px]"
												>
													Сегодня
												</Badge>
											) : null}
											{hasEvents ? (
												<Badge
													variant="secondary"
													className="mt-auto w-fit px-1.5 py-0 text-[10px]"
												>
													+{cell.events.length}
												</Badge>
											) : null}
										</button>
									)
								})}
							</div>
						</div>

						<div className="space-y-3">
							<div className="rounded-lg border border-blue-200/70 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
								<p className="text-muted-foreground text-xs tracking-wide uppercase">
									Ближайшее мероприятие
								</p>
								{nearestEvent ? (
									<>
										<p className="mt-1 font-semibold">
											{nearestEvent.title}
										</p>
										<p className="text-muted-foreground text-sm">
											{nearestEvent.day}{' '}
											{MONTHS[nearestEvent.month - 1]}
										</p>
									</>
								) : (
									<p className="text-muted-foreground mt-1 text-sm">
										Событий пока нет
									</p>
								)}
							</div>

							{visibleSelectedDay === null ? (
								<p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
									Выберите день на календаре, чтобы посмотреть
									события.
								</p>
							) : (
								<>
									<p className="font-semibold">
										{visibleSelectedDay}{' '}
										{MONTHS[selectedMonth - 1]}
									</p>
									{selectedDayEvents.length === 0 ? (
										<p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
											На выбранный день событий нет.
										</p>
									) : (
										selectedDayEvents.map((event) => (
											<div
												key={event.id}
												className="rounded-lg border p-3"
											>
												<p className="font-medium">
													{event.title}
												</p>
												<p className="text-muted-foreground mt-1 text-sm">
													{event.description}
												</p>
											</div>
										))
									)}
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
