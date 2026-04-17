'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	MapPin,
	QrCode,
	Sparkles
} from 'lucide-react'

import { getQuestById, type QuestDto } from '@/shared/api/quest'
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { QrScanner } from '@/widgets/quest/qr-scanner'
import {
	detectCraftKind,
	ENTERPRISE_QR_CODES,
	getCraftOverview
} from '@/shared/lib/craft-marketplace'

function getEntryCodeByQuest(quest: QuestDto): string {
	const kind = detectCraftKind(`${quest.name} ${quest.description}`)
	return (
		ENTERPRISE_QR_CODES.find((item) => item.kind === kind)?.code ??
		'MUSEUM-POTTERY-001'
	)
}

export default function RouteEnterprisePage() {
	const params = useParams()
	const router = useRouter()
	const id = Array.isArray(params.id) ? params.id[0] : params.id

	const [quest, setQuest] = useState<QuestDto | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualCode, setManualCode] = useState('')
	const [startMessage, setStartMessage] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		let isMounted = true

		const load = async () => {
			setIsLoading(true)
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
			} finally {
				if (isMounted) setIsLoading(false)
			}
		}

		load()
		return () => {
			isMounted = false
		}
	}, [id])

	const craftOverview = useMemo(() => {
		if (!quest) return null
		const kind = detectCraftKind(`${quest.name} ${quest.description}`)
		return getCraftOverview(kind)
	}, [quest])

	const expectedCode = useMemo(
		() => (quest ? getEntryCodeByQuest(quest) : ''),
		[quest]
	)

	const handleStartByCode = (rawCode: string) => {
		const code = rawCode.trim().toUpperCase()
		if (!quest) return
		if (code !== expectedCode) {
			setStartMessage('Код входа не совпадает с кодом предприятия.')
			return
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem(`quest_access_${quest.id}`, 'started')
		}

		setStartMessage('Квест разблокирован. Переходим к прохождению...')
		setTimeout(() => {
			router.push(`/quest/${quest.id}`)
		}, 500)
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

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<Button variant="ghost" onClick={() => router.back()}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Назад
			</Button>

			<section className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<Badge className="mb-3 w-fit border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
					Ремесленное предприятие
				</Badge>
				<h1 className="text-3xl font-semibold">
					{craftOverview?.title}
				</h1>
				<p className="text-muted-foreground mt-3 max-w-3xl text-base">
					{craftOverview?.description}
				</p>
				<div className="mt-4 flex flex-wrap gap-4 text-sm">
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<Sparkles className="h-4 w-4" />
						{craftOverview?.level}
					</div>
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<Clock className="h-4 w-4" />
						{craftOverview?.duration}
					</div>
					<div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
						<MapPin className="h-4 w-4" />
						{quest.category?.name ?? 'Ремесленный объект'}
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
										key={point.id}
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
							onClick={() => setIsScannerOpen(true)}
						>
							<QrCode className="mr-2 h-4 w-4" />
							Сканировать QR входа
						</Button>
						<p className="text-muted-foreground rounded-lg border p-2 text-xs">
							Тестовый код для запуска:{' '}
							<span className="font-semibold">
								{expectedCode}
							</span>
						</p>
						{startMessage && (
							<div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
								<CheckCircle2 className="mr-1 inline h-4 w-4" />
								{startMessage}
							</div>
						)}
					</CardContent>
				</Card>
			</section>

			<Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Проверка входного QR-кода</DialogTitle>
						<DialogDescription>
							Сканируйте код с входа предприятия или введите
							вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border">
							<QrScanner
								onScanSuccess={handleStartByCode}
								onError={() => {}}
								disabled={!isScannerOpen}
								className="aspect-square w-full"
							/>
						</div>
						<div className="flex gap-2">
							<Input
								placeholder={expectedCode}
								value={manualCode}
								onChange={(e) => setManualCode(e.target.value)}
							/>
							<Button
								onClick={() => handleStartByCode(manualCode)}
							>
								Проверить
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
