'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, QrCode, Search, Sparkles, Store } from 'lucide-react'

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

import { getQuests, QuestDto } from '@/shared/api/quest'
import { QrScanner } from '@/widgets/quest/qr-scanner'
import {
	CRAFT_ENTERPRISES,
	CRAFT_PRODUCTS,
	ENTERPRISE_QR_CODES
} from '@/shared/lib/craft-marketplace'

export default function HomePage() {
	const [quests, setQuests] = useState<QuestDto[]>([])
	const [isLoadingQuests, setIsLoadingQuests] = useState(true)
	const [questsError, setQuestsError] = useState<string | null>(null)

	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [manualQrCode, setManualQrCode] = useState('')
	const [scanNotice, setScanNotice] = useState<string | null>(null)

	const [enterpriseSearch, setEnterpriseSearch] = useState('')
	const [enterpriseLevel, setEnterpriseLevel] = useState<string>('all')

	const [productSearch, setProductSearch] = useState('')
	const [productCategory, setProductCategory] = useState<string>('all')
	const [productSeller, setProductSeller] = useState<string>('all')

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
					'Не удалось загрузить ремесленные квесты'
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

	const enterpriseQuestLinks = useMemo(() => {
		const firstThreeQuestIds = quests.slice(0, 3).map((item) => item.id)
		return CRAFT_ENTERPRISES.map((item, index) => ({
			...item,
			questId: firstThreeQuestIds[index] ?? null
		}))
	}, [quests])

	const filteredEnterprises = useMemo(() => {
		return enterpriseQuestLinks.filter((enterprise) => {
			const matchesSearch =
				enterprise.title
					.toLowerCase()
					.includes(enterpriseSearch.toLowerCase()) ||
				enterprise.description
					.toLowerCase()
					.includes(enterpriseSearch.toLowerCase())

			const matchesLevel =
				enterpriseLevel === 'all' ||
				(enterpriseLevel === 'basic' &&
					enterprise.level.toLowerCase() === 'базовый') ||
				(enterpriseLevel === 'medium' &&
					enterprise.level.toLowerCase() === 'средний')

			return matchesSearch && matchesLevel
		})
	}, [enterpriseQuestLinks, enterpriseSearch, enterpriseLevel])

	const filteredProducts = useMemo(() => {
		return CRAFT_PRODUCTS.filter((product) => {
			const matchesSearch =
				product.title
					.toLowerCase()
					.includes(productSearch.toLowerCase()) ||
				product.description
					.toLowerCase()
					.includes(productSearch.toLowerCase())
			const matchesCategory =
				productCategory === 'all' ||
				product.category === productCategory
			const matchesSeller =
				productSeller === 'all' || product.sellerType === productSeller
			return matchesSearch && matchesCategory && matchesSeller
		})
	}, [productSearch, productCategory, productSeller])

	const featuredProducts = useMemo(
		() => filteredProducts.slice(0, 4),
		[filteredProducts]
	)

	const handleQrCode = (rawCode: string) => {
		const normalizedCode = rawCode.trim().toUpperCase()
		const found = ENTERPRISE_QR_CODES.find(
			(item) => item.code === normalizedCode
		)

		if (found) {
			setScanNotice(
				`QR подтвержден: ${found.type === 'museum' ? 'музей' : 'предприятие'} "${found.name}".`
			)
			setIsScannerOpen(false)
			setManualQrCode('')
			return
		}

		setScanNotice('Код не распознан. Проверьте QR и попробуйте еще раз.')
	}

	return (
		<div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
			<section className="grid gap-5">
				<Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
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
						<Button onClick={() => setIsScannerOpen(true)}>
							<QrCode className="mr-2 h-4 w-4" />
							Сканировать QR предприятия
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

			<section className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-semibold">
						Ремесленные предприятия
					</h2>
					<Badge variant="outline">
						{filteredEnterprises.length}
					</Badge>
				</div>

				<Card>
					<CardContent className="grid gap-3 p-4 md:grid-cols-3">
						<div className="relative md:col-span-2">
							<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								value={enterpriseSearch}
								onChange={(e) =>
									setEnterpriseSearch(e.target.value)
								}
								placeholder="Поиск предприятия или ремесла"
								className="pl-9"
							/>
						</div>
						<Select
							value={enterpriseLevel}
							onValueChange={setEnterpriseLevel}
						>
							<SelectTrigger>
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
					</CardContent>
				</Card>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{filteredEnterprises.map((enterprise) => (
						<Card key={enterprise.id}>
							<CardHeader>
								<CardTitle>{enterprise.title}</CardTitle>
								<CardDescription>
									{enterprise.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Уровень
									</span>
									<span className="font-medium">
										{enterprise.level}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Время
									</span>
									<span className="font-medium">
										{enterprise.duration}
									</span>
								</div>
								<Link
									href={
										enterprise.questId
											? `/routes/${enterprise.questId}`
											: '/crafts'
									}
									className="inline-flex pt-2"
								>
									<Button variant="outline" size="sm">
										Подробнее
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>

				{isLoadingQuests && (
					<p className="text-muted-foreground text-sm">
						Загружаем связку с квестами…
					</p>
				)}
				{questsError && (
					<p className="text-destructive text-sm">{questsError}</p>
				)}
			</section>

			<section className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-semibold">
						Ремесленные товары
					</h2>
					<Link href="/shop">
						<Button variant="outline" size="sm">
							Перейти в магазин
						</Button>
					</Link>
				</div>

				<Card>
					<CardContent className="grid gap-3 p-4 md:grid-cols-4">
						<div className="relative md:col-span-2">
							<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
							<Input
								value={productSearch}
								onChange={(e) =>
									setProductSearch(e.target.value)
								}
								placeholder="Поиск товара"
								className="pl-9"
							/>
						</div>
						<Select
							value={productCategory}
							onValueChange={setProductCategory}
						>
							<SelectTrigger>
								<SelectValue placeholder="Категория" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Все категории
								</SelectItem>
								<SelectItem value="Декор">Декор</SelectItem>
								<SelectItem value="Одежда">Одежда</SelectItem>
								<SelectItem value="Сувениры">
									Сувениры
								</SelectItem>
								<SelectItem value="Посуда">Посуда</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={productSeller}
							onValueChange={setProductSeller}
						>
							<SelectTrigger>
								<SelectValue placeholder="Продавец" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Все продавцы
								</SelectItem>
								<SelectItem value="organization">
									Организации
								</SelectItem>
								<SelectItem value="user">
									Пользователи
								</SelectItem>
							</SelectContent>
						</Select>
					</CardContent>
				</Card>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{featuredProducts.map((product) => (
						<Card key={product.id} className="overflow-hidden">
							<img
								src={
									product.images[0] || '/placeholder-logo.png'
								}
								alt={product.title}
								className="h-36 w-full object-cover"
							/>
							<CardContent className="space-y-2 p-4">
								<p className="line-clamp-1 font-semibold">
									{product.title}
								</p>
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
								<Link href={`/shop/${product.id}`}>
									<Button size="sm" className="w-full">
										Открыть товар
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Сканирование QR-кода</DialogTitle>
						<DialogDescription>
							Сканируйте код музея/предприятия или введите его
							вручную.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border">
							<QrScanner
								onScanSuccess={handleQrCode}
								onError={() => {}}
								disabled={!isScannerOpen}
								className="aspect-square w-full"
							/>
						</div>
						<div className="space-y-2">
							<div className="relative">
								<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
								<Input
									value={manualQrCode}
									onChange={(e) =>
										setManualQrCode(e.target.value)
									}
									placeholder="ORG-WOOD-010"
									className="pl-9"
								/>
							</div>
							<Button
								className="w-full"
								onClick={() => handleQrCode(manualQrCode)}
							>
								<MapPin className="mr-2 h-4 w-4" />
								Проверить код
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
