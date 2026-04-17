export type CraftKind = 'pottery' | 'woodcarving' | 'textile' | 'generic'

export type CraftEnterpriseCard = {
	id: string
	title: string
	description: string
	level: string
	duration: string
	kind: CraftKind
}

export type CraftProduct = {
	id: string
	title: string
	description: string
	priceRub: number
	category: 'Декор' | 'Одежда' | 'Сувениры' | 'Посуда'
	sellerName: string
	sellerType: 'user' | 'organization'
	enterpriseName: string
	enterpriseKind: CraftKind
	images: string[]
}

export type CreateCraftProductInput = {
	title: string
	description: string
	priceRub: number
	category: CraftProduct['category']
	enterpriseName: string
	enterpriseKind: CraftKind
	imageUrl?: string
}

type StoredUserCraftProduct = CraftProduct & {
	ownerEmail: string
	createdAt: string
}

export type CraftTestQuestion = {
	id: string
	pointName: string
	question: string
	options: string[]
	correctIndex: number
}

export const CRAFT_ENTERPRISES: CraftEnterpriseCard[] = [
	{
		id: 'pottery',
		title: 'Гончарное дело',
		description:
			'Изучите основы работы с глиной и пройдите точки-квесты в мастерских региона.',
		level: 'Базовый',
		duration: '45 минут',
		kind: 'pottery'
	},
	{
		id: 'woodcarving',
		title: 'Резьба по дереву',
		description:
			'Соберите мини-маршрут по ремесленным пространствам и получите баллы за этапы.',
		level: 'Средний',
		duration: '60 минут',
		kind: 'woodcarving'
	},
	{
		id: 'textile',
		title: 'Текстиль и вышивка',
		description:
			'История узоров, практические задания и цифровая карточка ваших достижений.',
		level: 'Базовый',
		duration: '35 минут',
		kind: 'textile'
	}
]

export const ENTERPRISE_QR_CODES = [
	{
		code: 'MUSEUM-POTTERY-001',
		name: 'Музей керамики «Глиняный круг»',
		type: 'museum' as const,
		kind: 'pottery' as CraftKind
	},
	{
		code: 'ORG-WOOD-010',
		name: 'Мастерская резьбы «Дубрава»',
		type: 'enterprise' as const,
		kind: 'woodcarving' as CraftKind
	},
	{
		code: 'ORG-TEXTILE-021',
		name: 'Текстильная арт-мануфактура «Узор»',
		type: 'enterprise' as const,
		kind: 'textile' as CraftKind
	}
]

export const CRAFT_PRODUCTS: CraftProduct[] = [
	{
		id: 'prd-plate-001',
		title: 'Тарелка ручной лепки',
		description:
			'Керамическая тарелка с обжигом в молочении. Подходит для сервировки и декора.',
		priceRub: 2400,
		category: 'Посуда',
		sellerName: 'Музей керамики «Глиняный круг»',
		sellerType: 'organization',
		enterpriseName: 'Гончарное дело',
		enterpriseKind: 'pottery',
		images: ['/custom.png', '/placeholder-logo.png']
	},
	{
		id: 'prd-mug-002',
		title: 'Кружка «Теплый глинт»',
		description:
			'Кружка из шамотной глины, ручная роспись ангобами, объем 350 мл.',
		priceRub: 1800,
		category: 'Посуда',
		sellerName: 'ИП Кондратьев',
		sellerType: 'user',
		enterpriseName: 'Гончарное дело',
		enterpriseKind: 'pottery',
		images: ['/placeholder-user.jpg', '/custom.png']
	},
	{
		id: 'prd-wood-003',
		title: 'Резная шкатулка',
		description:
			'Шкатулка из дуба с геометрической резьбой и льняной пропиткой.',
		priceRub: 4600,
		category: 'Сувениры',
		sellerName: 'Мастерская резьбы «Дубрава»',
		sellerType: 'organization',
		enterpriseName: 'Резьба по дереву',
		enterpriseKind: 'woodcarving',
		images: ['/placeholder-logo.png', '/placeholder-user.jpg']
	},
	{
		id: 'prd-wood-004',
		title: 'Панно «Лесной знак»',
		description:
			'Настенное панно из липы, выжиг и ручная тонировка натуральными составами.',
		priceRub: 3900,
		category: 'Декор',
		sellerName: 'ИП Мельникова',
		sellerType: 'user',
		enterpriseName: 'Резьба по дереву',
		enterpriseKind: 'woodcarving',
		images: ['/placeholder-user.jpg', '/placeholder-logo.png']
	},
	{
		id: 'prd-textile-005',
		title: 'Вышитый рушник',
		description:
			'Льняной рушник с традиционным орнаментом, ручная вышивка.',
		priceRub: 5200,
		category: 'Одежда',
		sellerName: 'Арт-мануфактура «Узор»',
		sellerType: 'organization',
		enterpriseName: 'Текстиль и вышивка',
		enterpriseKind: 'textile',
		images: ['/placeholder-logo.png', '/placeholder-user.jpg']
	},
	{
		id: 'prd-textile-006',
		title: 'Сумка-шоппер с орнаментом',
		description:
			'Повседневная сумка из плотного хлопка с принтом по мотивам старинных узоров.',
		priceRub: 2700,
		category: 'Одежда',
		sellerName: 'ИП Карпова',
		sellerType: 'user',
		enterpriseName: 'Текстиль и вышивка',
		enterpriseKind: 'textile',
		images: ['/placeholder-user.jpg', '/placeholder-logo.png']
	}
]

export const COUPONS = [
	{
		id: 'coupon-5',
		title: 'Купон -5%',
		discountPercent: 5,
		pricePoints: 120
	},
	{
		id: 'coupon-10',
		title: 'Купон -10%',
		discountPercent: 10,
		pricePoints: 220
	}
]

const USER_PRODUCTS_KEY = 'craft_user_products_v1'

function readStoredUserProducts(): StoredUserCraftProduct[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = localStorage.getItem(USER_PRODUCTS_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? (parsed as StoredUserCraftProduct[]) : []
	} catch {
		return []
	}
}

function writeStoredUserProducts(items: StoredUserCraftProduct[]) {
	if (typeof window === 'undefined') return
	localStorage.setItem(USER_PRODUCTS_KEY, JSON.stringify(items))
}

export function getUserCraftProducts(ownerEmail?: string): CraftProduct[] {
	const stored = readStoredUserProducts()
	if (!ownerEmail) {
		return stored.map(
			({ ownerEmail: _ownerEmail, createdAt: _createdAt, ...product }) =>
				product
		)
	}
	return stored
		.filter((entry) => entry.ownerEmail === ownerEmail)
		.map(
			({ ownerEmail: _ownerEmail, createdAt: _createdAt, ...product }) =>
				product
		)
}

export function getAllCraftProducts(): CraftProduct[] {
	return [...getUserCraftProducts(), ...CRAFT_PRODUCTS]
}

export function createUserCraftProduct(
	ownerEmail: string,
	sellerName: string,
	input: CreateCraftProductInput
): CraftProduct {
	const product: CraftProduct = {
		id: `usr-prd-${Date.now()}`,
		title: input.title.trim(),
		description: input.description.trim(),
		priceRub: Number(input.priceRub),
		category: input.category,
		sellerName: sellerName.trim(),
		sellerType: 'user',
		enterpriseName: input.enterpriseName.trim(),
		enterpriseKind: input.enterpriseKind,
		images: [
			input.imageUrl?.trim() || '/placeholder-user.jpg',
			'/placeholder-logo.png'
		]
	}

	const stored = readStoredUserProducts()
	const next: StoredUserCraftProduct[] = [
		{
			...product,
			ownerEmail,
			createdAt: new Date().toISOString()
		},
		...stored
	]
	writeStoredUserProducts(next)
	return product
}

export function detectCraftKind(value: string): CraftKind {
	const source = value.toLowerCase()
	if (source.includes('гонч') || source.includes('глин')) return 'pottery'
	if (source.includes('резьб') || source.includes('дерев'))
		return 'woodcarving'
	if (source.includes('текстил') || source.includes('вышив')) return 'textile'
	return 'generic'
}

export function getCraftOverview(kind: CraftKind): CraftEnterpriseCard {
	return (
		CRAFT_ENTERPRISES.find((item) => item.kind === kind) ?? {
			id: 'generic',
			title: 'Ремесленное предприятие',
			description:
				'Культурный маршрут с ремесленными точками, экскурсионной частью и заданиями.',
			level: 'Базовый',
			duration: '50 минут',
			kind: 'generic'
		}
	)
}

export function getProductsByCraftKind(kind: CraftKind): CraftProduct[] {
	return CRAFT_PRODUCTS.filter((item) => item.enterpriseKind === kind)
}

export function getCraftTestQuestions(
	kind: CraftKind,
	pointNames: string[]
): CraftTestQuestion[] {
	const templates: Record<
		Exclude<CraftKind, 'generic'>,
		{ question: string; options: string[]; correctIndex: number }
	> = {
		pottery: {
			question: 'Какой материал является основой гончарного ремесла?',
			options: ['Глина', 'Песок', 'Известняк', 'Мрамор'],
			correctIndex: 0
		},
		woodcarving: {
			question: 'Что важно учитывать при резьбе по дереву?',
			options: [
				'Направление волокон древесины',
				'Только цвет лака',
				'Размер кисти',
				'Температуру воды'
			],
			correctIndex: 0
		},
		textile: {
			question: 'Что является базой для традиционной вышивки?',
			options: [
				'Ткань и орнамент',
				'Керамика',
				'Деревянная заготовка',
				'Глина'
			],
			correctIndex: 0
		}
	}

	const template =
		kind === 'generic'
			? templates.pottery
			: templates[kind as 'pottery' | 'woodcarving' | 'textile']

	return pointNames.map((pointName, index) => ({
		id: `test-${kind}-${index + 1}`,
		pointName,
		question: `${pointName}: ${template.question}`,
		options: template.options,
		correctIndex: template.correctIndex
	}))
}
