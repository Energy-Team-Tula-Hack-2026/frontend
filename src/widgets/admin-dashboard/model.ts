import type { DaDataAddress, DaDataSuggestion } from 'react-dadata'
import type { QuestCategory, QuestDto } from '@/shared/api/quest'

export const RULE_TYPE_OPTIONS = [
	{ value: 'QUESTS_COMPLETED', label: 'Количество пройденных квестов' },
	{ value: 'TOTAL_SCORE', label: 'Общее количество баллов' },
	{
		value: 'SPECIFIC_QUEST_COMPLETED',
		label: 'Прохождение конкретного квеста'
	},
	{ value: 'POINTS_IN_QUEST', label: 'Баллы в конкретном квесте' }
]

export const TOKEN_DADATA = '7fa5c82ac8fa16d77e74ea5f85254b13bf063e7d'

export type MeResponse = {
	id?: string
	name: string
	surname?: string
	email: string
	role: 'user' | 'admin' | 'organizer'
	avatar_url?: string
}

export type Achievement = {
	id: string
	name: string
	description: string
	image_url: string
	rule_type:
		| 'QUESTS_COMPLETED'
		| 'TOTAL_SCORE'
		| 'SPECIFIC_QUEST_COMPLETED'
		| 'POINTS_IN_QUEST'
	rule_params: Record<string, any>
}

export type QuestPoint = {
	id: string
	name: string
	description: string
	short_description?: string
	score: number
	priority: number
	image_url?: string
	audio_record_url?: string
	latitude?: number
	longitude?: number
	code?: string
}

export type UiQuest = {
	id: string
	title: string
	description: string
	category: string
	categoryId?: string
	cityName?: string | null
	latitude?: number
	longitude?: number
	distance: number
	duration: number
	difficulty: 'easy' | 'medium' | 'hard'
	points: number
	images: string[]
	withGuide: boolean
	rating: number
	reviewsCount: number
	checkpointsCount: number
	pointsData?: QuestPoint[]
	guideData?: {
		description: string
		guide_name: string
		group_link: string
		planned_start: string
		capacity: number
	} | null
}

export type CreateQuestRequest = {
	name: string
	description: string
	category_id: string
	latitude: number
	longitude: number
	city: string
	duration_min: number
	level: 'EASY' | 'MEDIUM' | 'HARD'
}

export type UpdateQuestRequest = CreateQuestRequest

export type CreatePointRequest = {
	name: string
	description: string
	short_description?: string
	priority: number
	audio_record_url?: string
}

export type UpdatePointRequest = {
	name: string
	description: string
	short_description?: string
}

export type CreateAchievementRequest = {
	name: string
	description: string
	image_url: string
	rule_type:
		| 'QUESTS_COMPLETED'
		| 'TOTAL_SCORE'
		| 'SPECIFIC_QUEST_COMPLETED'
		| 'POINTS_IN_QUEST'
	rule_params: Record<string, any>
}

export const questFormInitial = {
	title: '',
	description: '',
	categoryId: '',
	city: '',
	latitude: '',
	longitude: '',
	difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
	duration: '60',
	distance: '3',
	withGuide: false,
	guideDescription: '',
	guideName: '',
	groupLink: '',
	plannedStart: '',
	capacity: '10'
}

export const pointFormInitial = {
	name: '',
	description: '',
	shortDescription: '',
	score: '100',
	priority: '0',
	latitude: '',
	longitude: ''
}

export const achievementFormInitial = {
	name: '',
	description: '',
	image_url: '',
	rule_type: 'QUESTS_COMPLETED' as
		| 'QUESTS_COMPLETED'
		| 'TOTAL_SCORE'
		| 'SPECIFIC_QUEST_COMPLETED'
		| 'POINTS_IN_QUEST',
	rule_params: { threshold: 10, quest_id: '' } as Record<string, any>
}

export interface ValidationErrors {
	[key: string]: string
}

export const validateQuestForm = (form: typeof questFormInitial) => {
	const errors: ValidationErrors = {}
	if (!form.title.trim()) errors.title = 'Название обязательно'
	if (!form.description.trim()) errors.description = 'Описание обязательно'
	if (!form.categoryId) errors.categoryId = 'Выберите категорию'
	if (!form.city.trim()) errors.city = 'Город обязателен'
	if (!form.latitude.trim()) errors.latitude = 'Широта обязательна'
	if (!form.longitude.trim()) errors.longitude = 'Долгота обязательна'
	return errors
}

export const validatePointForm = (form: typeof pointFormInitial) => {
	const errors: ValidationErrors = {}
	if (!form.name.trim()) errors.name = 'Название точки обязательно'
	if (!form.description.trim()) {
		errors.description = 'Описание точки обязательно'
	}
	return errors
}

export const validateAchievementForm = (
	form: typeof achievementFormInitial
) => {
	const errors: ValidationErrors = {}
	if (!form.name.trim()) errors.name = 'Название обязательно'
	if (!form.description.trim()) errors.description = 'Описание обязательно'
	if (!form.rule_params.threshold || form.rule_params.threshold <= 0) {
		errors.threshold = 'Пороговое значение должно быть больше 0'
	}
	if (
		(form.rule_type === 'SPECIFIC_QUEST_COMPLETED' ||
			form.rule_type === 'POINTS_IN_QUEST') &&
		!form.rule_params.quest_id
	) {
		errors.quest_id = 'Выберите квест'
	}
	return errors
}

export function mapQuestToUi(quest: QuestDto): UiQuest {
	const difficultyMap: Record<QuestDto['level'], UiQuest['difficulty']> = {
		EASY: 'easy',
		MEDIUM: 'medium',
		HARD: 'hard'
	}

	const feedbacks = quest.feedbacks ?? []
	const reviewsCount = feedbacks.length

	const rating =
		reviewsCount > 0
			? Number(
					(
						feedbacks.reduce((sum, item) => sum + item.score, 0) /
						reviewsCount
					).toFixed(1)
				)
			: 0

	const totalPoints =
		quest.points?.reduce((sum, point) => sum + (point.score ?? 0), 0) ?? 0
	const images =
		quest.images?.map((item) => item.image_url).filter(Boolean) ?? []
	const checkpointsCount = quest.points?.length ?? 0

	const pointsData =
		quest.points?.map((point) => ({
			id: point.id,
			name: point.name,
			description: point.description,
			short_description: point.short_description,
			score: point.score ?? 0,
			priority: point.priority ?? 0,
			image_url: point.image_url || undefined,
			audio_record_url: point.audio_record_url || undefined,
			latitude: point.latitude,
			longitude: point.longitude,
			code: point.code
		})) ?? []

	const guideData = quest.quest_planning
		? {
				description: quest.quest_planning.description,
				guide_name: quest.quest_planning.guide_name,
				group_link: quest.quest_planning.group_link,
				planned_start: quest.quest_planning.planned_start,
				capacity: quest.quest_planning.capacity
			}
		: null

	return {
		id: quest.id,
		title: quest.name,
		description: quest.description,
		category: quest.category?.name ?? 'Без категории',
		categoryId: quest.category?.id,
		cityName: quest.location?.city,
		latitude: quest.location?.latitude,
		longitude: quest.location?.longitude,
		distance: Number(((quest.length_metres ?? 0) / 1000).toFixed(1)),
		duration: quest.duration_min,
		difficulty: difficultyMap[quest.level] ?? 'easy',
		points: totalPoints,
		images,
		withGuide: Boolean(quest.quest_planning),
		rating,
		reviewsCount,
		checkpointsCount,
		pointsData,
		guideData
	}
}

export function cityToSuggestion(
	cityName?: string
): DaDataSuggestion<DaDataAddress> | undefined {
	if (!cityName) return undefined

	return {
		value: cityName,
		unrestricted_value: cityName,
		data: {
			city: cityName
		} as DaDataAddress
	}
}

export function extractQuestOwnerId(quest: QuestDto): string | null {
	const candidate = quest as QuestDto & {
		organization_id?: string
		owner_id?: string
		created_by?: string
		created_by_id?: string
		organization?: { id?: string }
		owner?: { id?: string }
	}

	return (
		candidate.organization_id ||
		candidate.owner_id ||
		candidate.created_by ||
		candidate.created_by_id ||
		candidate.organization?.id ||
		candidate.owner?.id ||
		null
	)
}

export type { QuestCategory }
