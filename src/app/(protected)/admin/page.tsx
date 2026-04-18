'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	AddressSuggestions,
	type DaDataAddress,
	type DaDataSuggestion
} from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import {
	Shield,
	Plus,
	Pencil,
	Trash2,
	MapPin,
	QrCode,
	Sparkles,
	Loader2,
	X,
	Wand2,
	ChevronDown,
	ChevronUp,
	Trophy,
	Calendar,
	Info,
	AlertCircle,
	Check,
	AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/shared/components/ui/table'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '@/shared/components/ui/tabs'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/shared/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/components/ui/select'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { getMe } from '@/shared/api/user'
import {
	getQuests,
	getQuestCategories,
	type QuestDto,
	type QuestCategory,
	getQuestById
} from '@/shared/api/quest'
import { TokenManager } from '@/shared/api/auth'
import { normalizeApiError } from '@/shared/api/errors'
import api from '@/shared/api/instance'

// Константы
const RULE_TYPE_OPTIONS = [
	{ value: 'QUESTS_COMPLETED', label: 'Количество пройденных квестов' },
	{ value: 'TOTAL_SCORE', label: 'Общее количество баллов' },
	{
		value: 'SPECIFIC_QUEST_COMPLETED',
		label: 'Прохождение конкретного квеста'
	},
	{ value: 'POINTS_IN_QUEST', label: 'Баллы в конкретном квесте' }
]

const TOKEN_DADATA = '7fa5c82ac8fa16d77e74ea5f85254b13bf063e7d'

// Types
type MeResponse = {
	name: string
	surname: string
	email: string
	role: 'user' | 'admin'
	avatar_url?: string
}

type Achievement = {
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

type QuestPoint = {
	id: string
	name: string
	description: string
	short_description?: string
	score: number
	priority: number
	image_url?: string // меняем string | null на string | undefined
	audio_record_url?: string // меняем string | null на string | undefined
	latitude?: number
	longitude?: number
	code?: string
}

type UiQuest = {
	id: string
	title: string
	description: string
	category: string
	categoryId?: string
	cityId?: string
	cityName?: string
	latitude?: number
	longitude?: number
	price: number
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

type CreateQuestRequest = {
	name: string
	description: string
	category_id: string
	latitude: number
	longitude: number
	city: string
	duration_min: number
	level: 'EASY' | 'MEDIUM' | 'HARD'
}

type UpdateQuestRequest = {
	name: string
	description: string
	category_id: string
	latitude: number
	longitude: number
	city: string
	duration_min: number
	level: 'EASY' | 'MEDIUM' | 'HARD'
}

type CreatePointRequest = {
	name: string
	description: string
	short_description?: string
	score: number
	priority: number
	image_url?: string
	audio_record_url?: string
	latitude?: number
	longitude?: number
}

type UpdatePointRequest = {
	name: string
	description: string
	short_description?: string
	score: number
}

type CreateAchievementRequest = {
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

// Начальные значения форм
const questFormInitial = {
	title: '',
	description: '',
	categoryId: '',
	cityId: '',
	latitude: '',
	longitude: '',
	difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
	duration: '60',
	distance: '3',
	price: '400',
	withGuide: false,
	guideDescription: '',
	guideName: '',
	groupLink: '',
	plannedStart: '',
	capacity: '10'
}

const pointFormInitial = {
	name: '',
	description: '',
	shortDescription: '',
	score: '100',
	priority: '0',
	latitude: '',
	longitude: ''
}

const achievementFormInitial = {
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

// Валидация форм
interface ValidationErrors {
	[key: string]: string
}

const validateQuestForm = (form: typeof questFormInitial) => {
	const errors: ValidationErrors = {}
	if (!form.title.trim()) errors.title = 'Название обязательно'
	if (!form.description.trim()) errors.description = 'Описание обязательно'
	if (!form.categoryId) errors.categoryId = 'Выберите категорию'
	if (!form.cityId.trim()) errors.cityId = 'City ID обязателен'
	if (!form.latitude.trim()) errors.latitude = 'Latitude обязательна'
	if (!form.longitude.trim()) errors.longitude = 'Longitude обязательна'
	return errors
}

const validatePointForm = (form: typeof pointFormInitial) => {
	const errors: ValidationErrors = {}
	if (!form.name.trim()) errors.name = 'Название точки обязательно'
	if (!form.description.trim())
		errors.description = 'Описание точки обязательно'
	return errors
}

const validateAchievementForm = (form: typeof achievementFormInitial) => {
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

function mapQuestToUi(quest: QuestDto): UiQuest {
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
			image_url: point.image_url || undefined, // null -> undefined
			audio_record_url: point.audio_record_url || undefined, // null -> undefined
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
		cityId: quest.location?.city_id,
		cityName: quest.location?.city_name,
		latitude: quest.location?.latitude,
		longitude: quest.location?.longitude,
		price: quest.price_rub ?? 0,
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

export default function AdminPage() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthorized, setIsAuthorized] = useState(false)
	const [activeTab, setActiveTab] = useState('quests')

	// Quest states
	const [quests, setQuests] = useState<UiQuest[]>([])
	const [isLoadingQuests, setIsLoadingQuests] = useState(true)
	const [categories, setCategories] = useState<QuestCategory[]>([])
	const [cityDefaultQuery, setCityDefaultQuery] = useState('')
	const dadataUid = useId()
	const [isCreateQuestDialogOpen, setIsCreateQuestDialogOpen] =
		useState(false)
	const [isEditQuestDialogOpen, setIsEditQuestDialogOpen] = useState(false)
	const [isCreatingQuest, setIsCreatingQuest] = useState(false)
	const [isUpdatingQuest, setIsUpdatingQuest] = useState(false)
	const [editingQuest, setEditingQuest] = useState<UiQuest | null>(null)
	const [selectedQuest, setSelectedQuest] = useState<UiQuest | null>(null)
	const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false)
	const [expandedPoints, setExpandedPoints] = useState<string[]>([])

	// Achievement states
	const [achievements, setAchievements] = useState<Achievement[]>([])
	const [isLoadingAchievements, setIsLoadingAchievements] = useState(true)
	const [isCreateAchievementDialogOpen, setIsCreateAchievementDialogOpen] =
		useState(false)
	const [isCreatingAchievement, setIsCreatingAchievement] = useState(false)
	const [editingAchievement, setEditingAchievement] =
		useState<Achievement | null>(null)
	const [deleteAchievementDialogOpen, setDeleteAchievementDialogOpen] =
		useState(false)
	const [achievementToDelete, setAchievementToDelete] =
		useState<Achievement | null>(null)
	const [deletePointDialogOpen, setDeletePointDialogOpen] = useState(false)
	const [pointToDelete, setPointToDelete] = useState<QuestPoint | null>(null)

	// Quest form state
	const [questForm, setQuestForm] = useState({ ...questFormInitial })
	const [questFormErrors, setQuestFormErrors] = useState<ValidationErrors>({})
	const [questImageFiles, setQuestImageFiles] = useState<File[]>([])
	const [existingImages, setExistingImages] = useState<string[]>([])
	const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
	const [isGeneratingQuestDescription, setIsGeneratingQuestDescription] =
		useState(false)

	// Point form state
	const [pointForm, setPointForm] = useState({ ...pointFormInitial })
	const [pointFormErrors, setPointFormErrors] = useState<ValidationErrors>({})
	const [pointImageFile, setPointImageFile] = useState<File | null>(null)
	const [pointAudioFile, setPointAudioFile] = useState<File | null>(null)
	const [pointImagePreview, setPointImagePreview] = useState('')
	const [pointAudioPreview, setPointAudioPreview] = useState('')
	const [isGeneratingPointDescription, setIsGeneratingPointDescription] =
		useState(false)
	const [editingPoint, setEditingPoint] = useState<QuestPoint | null>(null)
	const [isSubmittingPoint, setIsSubmittingPoint] = useState(false)
	const [isEditPointDialogOpen, setIsEditPointDialogOpen] = useState(false)

	// Achievement form state
	const [achievementForm, setAchievementForm] = useState({
		...achievementFormInitial
	})
	const [achievementFormErrors, setAchievementFormErrors] =
		useState<ValidationErrors>({})
	const [achievementImageFile, setAchievementImageFile] =
		useState<File | null>(null)
	const [achievementImagePreview, setAchievementImagePreview] = useState('')

	// Check admin access
	useEffect(() => {
		const checkAdminAccess = async () => {
			const isAuthenticated = TokenManager.isAuthenticated()

			if (!isAuthenticated) {
				toast.error('Необходимо войти в аккаунт')
				router.push('/login?next=/admin')
				return
			}

			try {
				const user = (await getMe()) as MeResponse

				if (user.role === 'admin') {
					setIsAuthorized(true)
					await Promise.all([
						loadQuests(),
						loadCategories(),
						loadAchievements()
					])
				} else {
					toast.error(
						'У вас нет прав доступа к панели администратора'
					)
					router.push('/profile')
				}
			} catch (error) {
				const apiError = normalizeApiError(
					error,
					'Ошибка проверки прав доступа'
				)
				toast.error(apiError.message)
				router.push('/profile')
			} finally {
				setIsLoading(false)
			}
		}

		checkAdminAccess()
	}, [router])

	// Load data
	const loadQuests = async () => {
		setIsLoadingQuests(true)
		try {
			const data = await getQuests()
			setQuests(data.map(mapQuestToUi))
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось загрузить квесты'
			)
			toast.error(apiError.message)
		} finally {
			setIsLoadingQuests(false)
		}
	}

	const loadCategories = async () => {
		try {
			const data = await getQuestCategories()
			setCategories(data)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось загрузить категории'
			)
			toast.error(apiError.message)
		}
	}

	const loadAchievements = async () => {
		setIsLoadingAchievements(true)
		try {
			const response = await api.get('/api/v2/achievements/')
			setAchievements(response.data)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось загрузить достижения'
			)
			toast.error(apiError.message)
		} finally {
			setIsLoadingAchievements(false)
		}
	}

	// File upload
	const uploadFile = async (
		file: File,
		type: 'photo' | 'audio'
	): Promise<string> => {
		const formData = new FormData()
		formData.append('file', file)

		try {
			const response = await api.post(`/api/v2/media/${type}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			})
			return response.data.url
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				`Не удалось загрузить ${type === 'photo' ? 'изображение' : 'аудио'}`
			)
			toast.error(apiError.message)
			throw error
		}
	}

	// AI Description Generation for Quest
	const generateQuestDescriptionWithAI = async (
		currentDescription: string
	) => {
		if (!currentDescription.trim()) {
			toast.error('Введите описание для улучшения')
			return
		}

		setIsGeneratingQuestDescription(true)
		try {
			const response = await api.post('/api/v2/yagpt/upgrade', {
				description: currentDescription
			})
			const improvedDescription = response.data.description
			setQuestForm({ ...questForm, description: improvedDescription })
			if (questFormErrors.description) {
				setQuestFormErrors({ ...questFormErrors, description: '' })
			}
			toast.success('Описание улучшено с помощью AI!')
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось улучшить описание'
			)
			toast.error(apiError.message)
		} finally {
			setIsGeneratingQuestDescription(false)
		}
	}

	// AI Description Generation for Point
	const generatePointDescriptionWithAI = async (
		currentDescription: string
	) => {
		if (!currentDescription.trim()) {
			toast.error('Введите описание для улучшения')
			return
		}

		setIsGeneratingPointDescription(true)
		try {
			const response = await api.post('/api/v2/yagpt/upgrade', {
				description: currentDescription
			})
			const improvedDescription = response.data.description
			setPointForm({ ...pointForm, description: improvedDescription })
			if (pointFormErrors.description) {
				setPointFormErrors({ ...pointFormErrors, description: '' })
			}
			toast.success('Описание улучшено с помощью AI!')
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось улучшить описание'
			)
			toast.error(apiError.message)
		} finally {
			setIsGeneratingPointDescription(false)
		}
	}

	// Quest CRUD
	const handleCreateQuest = async () => {
		const errors = validateQuestForm(questForm)
		if (Object.keys(errors).length > 0) {
			setQuestFormErrors(errors)
			toast.error('Пожалуйста, исправьте ошибки в форме')
			return
		}

		setIsCreatingQuest(true)
		try {
			const createData: CreateQuestRequest = {
				name: questForm.title,
				description: questForm.description,
				category_id: questForm.categoryId,
				latitude: Number(questForm.latitude || 0),
				longitude: Number(questForm.longitude || 0),
				city: questForm.cityId,
				duration_min: Number(questForm.duration),
				level: questForm.difficulty
			}

			const response = await api.post('/api/v2/quest/', createData)
			const createdQuestId: string | undefined = response.data?.id

			if (createdQuestId) {
				for (const file of questImageFiles) {
					const url = await uploadFile(file, 'photo')
					await api.post(`/api/v2/quest/${createdQuestId}/image`, {
						image_url: url
					})
				}
			}
			toast.success('Маршрут успешно создан!')
			setIsCreateQuestDialogOpen(false)
			resetQuestForm()
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось создать маршрут'
			)
			toast.error(apiError.message)
		} finally {
			setIsCreatingQuest(false)
		}
	}

	const handleEditQuest = (quest: UiQuest) => {
		setEditingQuest(quest)
		setCityDefaultQuery(quest.cityName || '')

		setQuestForm({
			title: quest.title,
			description: quest.description,
			categoryId: quest.categoryId || '',
			cityId: quest.cityId || '',
			latitude: quest.latitude != null ? String(quest.latitude) : '',
			longitude: quest.longitude != null ? String(quest.longitude) : '',
			difficulty:
				quest.difficulty === 'easy'
					? 'EASY'
					: quest.difficulty === 'medium'
						? 'MEDIUM'
						: 'HARD',
			duration: quest.duration.toString(),
			distance: '0',
			price: '0',
			withGuide: false,
			guideDescription: '',
			guideName: '',
			groupLink: '',
			plannedStart: '',
			capacity: '10'
		})
		setQuestFormErrors({})
		setExistingImages(quest.images)
		setImagesToDelete([])
		setQuestImageFiles([])
		setIsEditQuestDialogOpen(true)
	}

	const handleUpdateQuest = async () => {
		if (!editingQuest) return

		const errors = validateQuestForm(questForm)
		if (Object.keys(errors).length > 0) {
			setQuestFormErrors(errors)
			toast.error('Пожалуйста, исправьте ошибки в форме')
			return
		}

		setIsUpdatingQuest(true)
		try {
			for (const imageUrl of imagesToDelete) {
				const questData = await getQuestById(editingQuest.id)
				const image = questData.images?.find(
					(img) => img.image_url === imageUrl
				)
				if (image) {
					await api.delete(
						`/api/v2/quest/${editingQuest.id}/image/${image.id}`
					)
				}
			}

			for (const file of questImageFiles) {
				const url = await uploadFile(file, 'photo')
				await api.post(`/api/v2/quest/${editingQuest.id}/image`, {
					image_url: url
				})
			}

			const updateData: UpdateQuestRequest = {
				name: questForm.title,
				description: questForm.description,
				category_id: questForm.categoryId,
				latitude: Number(questForm.latitude || 0),
				longitude: Number(questForm.longitude || 0),
				city: questForm.cityId,
				duration_min: Number(questForm.duration),
				level: questForm.difficulty
			}

			await api.patch(`/api/v2/quest/${editingQuest.id}`, updateData)
			toast.success('Маршрут успешно обновлен!')
			setIsEditQuestDialogOpen(false)
			resetQuestForm()
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось обновить маршрут'
			)
			toast.error(apiError.message)
		} finally {
			setIsUpdatingQuest(false)
		}
	}

	const handleDeleteQuest = async (id: string) => {
		if (
			!confirm(
				'Вы уверены, что хотите удалить этот маршрут? Это действие нельзя отменить.'
			)
		)
			return

		try {
			await api.delete(`/api/v2/quest/${id}`)
			toast.success('Маршрут удален')
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось удалить маршрут'
			)
			toast.error(apiError.message)
		}
	}

	// Point CRUD
	const handleCreatePoint = async () => {
		if (!selectedQuest) return

		const errors = validatePointForm(pointForm)
		if (Object.keys(errors).length > 0) {
			setPointFormErrors(errors)
			toast.error('Пожалуйста, исправьте ошибки в форме')
			return
		}

		setIsSubmittingPoint(true)
		try {
			const pointData: CreatePointRequest = {
				name: pointForm.name,
				description: pointForm.description,
				short_description: pointForm.shortDescription || undefined,
				score: Number(pointForm.score),
				priority: Number(pointForm.priority),
				latitude: pointForm.latitude
					? Number(pointForm.latitude)
					: undefined,
				longitude: pointForm.longitude
					? Number(pointForm.longitude)
					: undefined
			}

			const createPointResponse = await api.post(
				`/api/v2/quest/${selectedQuest.id}/point`,
				[pointData]
			)

			const createdPointId: string | undefined =
				createPointResponse.data?.[0]?.id

			if (createdPointId && pointImageFile) {
				const imageUrl = await uploadFile(pointImageFile, 'photo')
				await api.put(`/api/v2/quest/point/${createdPointId}/image`, {
					image_url: imageUrl
				})
			}

			if (createdPointId && pointAudioFile) {
				const audioUrl = await uploadFile(pointAudioFile, 'audio')
				await api.put(`/api/v2/quest/point/${createdPointId}/audio`, {
					audio_record_url: audioUrl
				})
			}
			toast.success('Точка маршрута успешно добавлена!')
			resetPointForm()
			await loadQuests()
			setIsPointsDialogOpen(false)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось создать точку'
			)
			toast.error(apiError.message)
		} finally {
			setIsSubmittingPoint(false)
		}
	}

	const handleEditPoint = (point: QuestPoint) => {
		setEditingPoint(point)
		setPointForm({
			name: point.name,
			description: point.description,
			shortDescription: point.short_description || '',
			score: point.score.toString(),
			priority: point.priority.toString(),
			latitude: point.latitude?.toString() || '',
			longitude: point.longitude?.toString() || ''
		})
		setPointFormErrors({})
		setPointImageFile(null)
		setPointAudioFile(null)
		setPointImagePreview(point.image_url || '') // используем image_url
		setPointAudioPreview(point.audio_record_url || '') // используем audio_record_url
		setIsEditPointDialogOpen(true)
	}

	const handleUpdatePoint = async () => {
		if (!selectedQuest || !editingPoint) return

		const errors = validatePointForm(pointForm)
		if (Object.keys(errors).length > 0) {
			setPointFormErrors(errors)
			toast.error('Пожалуйста, исправьте ошибки в форме')
			return
		}

		setIsSubmittingPoint(true)
		try {
			// Загружаем новые файлы если есть
			let newImageUrl = editingPoint.image_url
			let newAudioUrl = editingPoint.audio_record_url

			if (pointImageFile) {
				newImageUrl = await uploadFile(pointImageFile, 'photo')
				// Обновляем изображение
				await api.put(`/api/v2/quest/point/${editingPoint.id}/image`, {
					image_url: newImageUrl
				})
			}

			if (pointAudioFile) {
				newAudioUrl = await uploadFile(pointAudioFile, 'audio')
				// Обновляем аудио
				await api.put(`/api/v2/quest/point/${editingPoint.id}/audio`, {
					audio_record_url: newAudioUrl
				})
			}

			const updateData: UpdatePointRequest = {
				name: pointForm.name,
				description: pointForm.description,
				short_description: pointForm.shortDescription || undefined,
				score: Number(pointForm.score)
			}

			await api.patch(
				`/api/v2/quest/${selectedQuest.id}/point/${editingPoint.id}`,
				updateData
			)
			toast.success('Точка успешно обновлена!')
			setIsEditPointDialogOpen(false)
			resetPointForm()
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось обновить точку'
			)
			toast.error(apiError.message)
		} finally {
			setIsSubmittingPoint(false)
		}
	}

	const handleDeletePoint = async () => {
		if (!selectedQuest || !pointToDelete) return

		try {
			await api.delete(
				`/api/v2/quest/${selectedQuest.id}/point/${pointToDelete.id}`
			)
			toast.success('Точка удалена')
			await loadQuests()
			setDeletePointDialogOpen(false)
			setPointToDelete(null)

			if (expandedPoints.includes(pointToDelete.id)) {
				setExpandedPoints((prev) =>
					prev.filter((id) => id !== pointToDelete.id)
				)
			}
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось удалить точку'
			)
			toast.error(apiError.message)
		}
	}

	const handleDeletePointImage = async () => {
		if (!editingPoint) return
		try {
			await api.delete(`/api/v2/quest/point/${editingPoint.id}/image`)
			setEditingPoint({
				...editingPoint,
				image_url: undefined
			})
			setPointImageFile(null)
			setPointImagePreview('')
			toast.success('Изображение точки удалено')
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось удалить изображение точки'
			)
			toast.error(apiError.message)
		}
	}

	const handleDeletePointAudio = async () => {
		if (!editingPoint) return
		try {
			await api.delete(`/api/v2/quest/point/${editingPoint.id}/audio`)
			setEditingPoint({
				...editingPoint,
				audio_record_url: undefined
			})
			setPointAudioFile(null)
			setPointAudioPreview('')
			toast.success('Аудио точки удалено')
			await loadQuests()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось удалить аудио точки'
			)
			toast.error(apiError.message)
		}
	}

	const openDeletePointDialog = (point: QuestPoint) => {
		setPointToDelete(point)
		setDeletePointDialogOpen(true)
	}

	// Achievement CRUD
	const handleCreateAchievement = async () => {
		const errors = validateAchievementForm(achievementForm)
		if (Object.keys(errors).length > 0) {
			setAchievementFormErrors(errors)
			toast.error('Пожалуйста, исправьте ошибки в форме')
			return
		}

		setIsCreatingAchievement(true)
		try {
			let imageUrl = achievementForm.image_url
			if (achievementImageFile) {
				imageUrl = await uploadFile(achievementImageFile, 'photo')
			}

			const createData: CreateAchievementRequest = {
				name: achievementForm.name,
				description: achievementForm.description,
				image_url: imageUrl,
				rule_type: achievementForm.rule_type,
				rule_params: achievementForm.rule_params
			}

			if (editingAchievement) {
				await api.patch(
					`/api/v2/achievements/${editingAchievement.id}`,
					createData
				)
				toast.success('Достижение обновлено')
			} else {
				await api.post('/api/v2/achievements/', createData)
				toast.success('Достижение создано')
			}

			setIsCreateAchievementDialogOpen(false)
			resetAchievementForm()
			await loadAchievements()
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось сохранить достижение'
			)
			toast.error(apiError.message)
		} finally {
			setIsCreatingAchievement(false)
		}
	}

	const handleDeleteAchievement = async () => {
		if (!achievementToDelete) return

		try {
			await api.delete(`/api/v2/achievements/${achievementToDelete.id}`)
			toast.success('Достижение удалено')
			await loadAchievements()
			setDeleteAchievementDialogOpen(false)
			setAchievementToDelete(null)
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось удалить достижение'
			)
			toast.error(apiError.message)
		}
	}

	const handleEditAchievement = (achievement: Achievement) => {
		setEditingAchievement(achievement)
		setAchievementForm({
			name: achievement.name,
			description: achievement.description,
			image_url: achievement.image_url,
			rule_type: achievement.rule_type,
			rule_params: achievement.rule_params
		})
		setAchievementFormErrors({})
		if (achievement.image_url)
			setAchievementImagePreview(achievement.image_url)
		setIsCreateAchievementDialogOpen(true)
	}

	const openDeleteAchievementDialog = (achievement: Achievement) => {
		setAchievementToDelete(achievement)
		setDeleteAchievementDialogOpen(true)
	}

	// Reset functions
	const resetQuestForm = () => {
		setQuestForm({ ...questFormInitial })
		setQuestFormErrors({})
		setQuestImageFiles([])
		setExistingImages([])
		setImagesToDelete([])
		setEditingQuest(null)
		setCityDefaultQuery('')
	}

	const resetPointForm = () => {
		setPointForm({ ...pointFormInitial })
		setPointFormErrors({})
		setPointImageFile(null)
		setPointAudioFile(null)
		setPointImagePreview('')
		setPointAudioPreview('')
		setEditingPoint(null)
	}

	const resetAchievementForm = () => {
		setAchievementForm({ ...achievementFormInitial })
		setAchievementFormErrors({})
		setAchievementImageFile(null)
		setAchievementImagePreview('')
		setEditingAchievement(null)
	}

	const togglePointExpand = (pointId: string) => {
		setExpandedPoints((prev) =>
			prev.includes(pointId)
				? prev.filter((id) => id !== pointId)
				: [...prev, pointId]
		)
	}

	// Синхронизация selectedQuest с актуальными данными
	useEffect(() => {
		if (selectedQuest && isPointsDialogOpen) {
			const updatedQuest = quests.find((q) => q.id === selectedQuest.id)
			if (
				updatedQuest &&
				JSON.stringify(updatedQuest.pointsData) !==
					JSON.stringify(selectedQuest.pointsData)
			) {
				setSelectedQuest(updatedQuest)
			}
		}
	}, [quests, selectedQuest, isPointsDialogOpen])

	// Функция для рендера поля с ошибкой
	const renderField = (
		label: string,
		field: string,
		children: React.ReactNode,
		error?: string
	) => (
		<div className="grid gap-2">
			<Label className="flex items-center gap-1">
				{label}
				{error && (
					<span className="text-xs text-red-500">(обязательно)</span>
				)}
			</Label>
			{children}
			{error && (
				<div className="flex items-center gap-1 text-sm text-red-500">
					<AlertCircle className="h-4 w-4" />
					<span>{error}</span>
				</div>
			)}
		</div>
	)

	const handleCitySuggestionChange = (
		suggestion?: DaDataSuggestion<DaDataAddress>
	) => {
		const suggestedCityName =
			suggestion?.data?.city || suggestion?.value || ''
		setCityDefaultQuery(suggestedCityName)
		setQuestForm((prev) => ({
			...prev,
			cityId: suggestedCityName
		}))
		if (suggestedCityName && questFormErrors.cityId) {
			setQuestFormErrors((prev) => ({ ...prev, cityId: '' }))
		}
	}
	const stats = {
		totalQuests: quests.length,
		totalPoints: quests.reduce((sum, q) => sum + q.checkpointsCount, 0),
		avgRating: quests.length
			? (
					quests.reduce((sum, q) => sum + q.rating, 0) / quests.length
				).toFixed(1)
			: '0',
		totalAchievements: achievements.length
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
					<p className="text-muted-foreground">
						Проверка прав доступа...
					</p>
				</div>
			</div>
		)
	}

	if (!isAuthorized) return null

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<div className="mb-2 flex items-center space-x-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
							<Shield className="h-6 w-6 text-white" />
						</div>
						<div>
							<h1 className="text-foreground text-3xl font-bold">
								Панель администратора
							</h1>
							<p className="text-muted-foreground">
								Управление квестами, точками и достижениями
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground mb-1 text-sm">
									Всего маршрутов
								</p>
								<p className="text-foreground text-2xl font-bold">
									{stats.totalQuests}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
								<MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground mb-1 text-sm">
									Контрольных точек
								</p>
								<p className="text-foreground text-2xl font-bold">
									{stats.totalPoints}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
								<QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground mb-1 text-sm">
									Средний рейтинг
								</p>
								<p className="text-foreground text-2xl font-bold">
									{stats.avgRating}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
								<Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground mb-1 text-sm">
									Достижений
								</p>
								<p className="text-foreground text-2xl font-bold">
									{stats.totalAchievements}
								</p>
							</div>
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
								<Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="mb-6 grid w-full grid-cols-2">
					<TabsTrigger value="quests">
						<MapPin className="mr-2 h-4 w-4" />
						Квесты
					</TabsTrigger>
					<TabsTrigger value="achievements">
						<Trophy className="mr-2 h-4 w-4" />
						Достижения
					</TabsTrigger>
				</TabsList>

				{/* Quests Tab */}
				<TabsContent value="quests" className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-foreground text-xl font-semibold">
							Управление маршрутами
						</h2>
						<Dialog
							open={isCreateQuestDialogOpen}
							onOpenChange={(open) => {
								setIsCreateQuestDialogOpen(open)
								if (!open) resetQuestForm()
							}}
						>
							<DialogTrigger asChild>
								<Button className="bg-gradient-to-r from-blue-500 to-purple-600">
									<Plus className="mr-2 h-4 w-4" />
									Создать маршрут
								</Button>
							</DialogTrigger>
							<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
								<DialogHeader>
									<DialogTitle>
										Создание нового маршрута
									</DialogTitle>
									<DialogDescription>
										Заполните информацию о маршруте
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									{renderField(
										'Название *',
										'title',
										<Input
											value={questForm.title}
											onChange={(e) => {
												setQuestForm({
													...questForm,
													title: e.target.value
												})
												if (questFormErrors.title)
													setQuestFormErrors({
														...questFormErrors,
														title: ''
													})
											}}
										/>,
										questFormErrors.title
									)}

									<div className="grid gap-2">
										<div className="flex items-center justify-between">
											<Label>Описание *</Label>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													generateQuestDescriptionWithAI(
														questForm.description
													)
												}
												disabled={
													isGeneratingQuestDescription
												}
											>
												<Wand2 className="mr-1 h-4 w-4" />
												{isGeneratingQuestDescription
													? 'Генерация...'
													: 'Улучшить AI'}
											</Button>
										</div>
										<Textarea
											rows={3}
											value={questForm.description}
											onChange={(e) => {
												setQuestForm({
													...questForm,
													description: e.target.value
												})
												if (questFormErrors.description)
													setQuestFormErrors({
														...questFormErrors,
														description: ''
													})
											}}
										/>
										{questFormErrors.description && (
											<div className="flex items-center gap-1 text-sm text-red-500">
												<AlertCircle className="h-4 w-4" />
												<span>
													{
														questFormErrors.description
													}
												</span>
											</div>
										)}
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="grid gap-2">
											<Label>Категория *</Label>
											<Select
												value={questForm.categoryId}
												onValueChange={(v) => {
													setQuestForm({
														...questForm,
														categoryId: v
													})
													if (
														questFormErrors.categoryId
													)
														setQuestFormErrors({
															...questFormErrors,
															categoryId: ''
														})
												}}
											>
												<SelectTrigger
													className={
														questFormErrors.categoryId
															? 'border-red-500'
															: ''
													}
												>
													<SelectValue placeholder="Выберите" />
												</SelectTrigger>
												<SelectContent>
													{categories.map((c) => (
														<SelectItem
															key={c.id}
															value={c.id}
														>
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{questFormErrors.categoryId && (
												<div className="flex items-center gap-1 text-sm text-red-500">
													<AlertCircle className="h-4 w-4" />
													<span>
														{
															questFormErrors.categoryId
														}
													</span>
												</div>
											)}
										</div>
										<div className="grid gap-2">
											<Label>Сложность</Label>
											<Select
												value={questForm.difficulty}
												onValueChange={(v: any) =>
													setQuestForm({
														...questForm,
														difficulty: v
													})
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="EASY">
														Легко
													</SelectItem>
													<SelectItem value="MEDIUM">
														Средне
													</SelectItem>
													<SelectItem value="HARD">
														Сложно
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="grid gap-2">
											<Label>Длительность (мин)</Label>
											<Input
												type="number"
												value={questForm.duration}
												onChange={(e) =>
													setQuestForm({
														...questForm,
														duration: e.target.value
													})
												}
											/>
										</div>
										<div className="grid gap-2">
											<Label>Город</Label>
											<AddressSuggestions
												key={`create-${cityDefaultQuery}`}
												uid={`${dadataUid}-create`}
												token={TOKEN_DADATA}
												defaultQuery={cityDefaultQuery}
												onChange={
													handleCitySuggestionChange
												}
												filterFromBound="city"
												filterToBound="city"
												filterRestrictValue
												minChars={1}
												selectOnBlur
												containerClassName="dadata-city-container"
												suggestionsClassName="dadata-city-suggestions"
												suggestionClassName="dadata-city-suggestion"
												currentSuggestionClassName="dadata-city-suggestion-current"
												highlightClassName="dadata-city-highlight"
												inputProps={{
													className:
														'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
													placeholder:
														'Начните вводить город'
												}}
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="grid gap-2">
											<Label>Latitude</Label>
											<Input
												type="number"
												step="any"
												value={questForm.latitude}
												onChange={(e) =>
													setQuestForm({
														...questForm,
														latitude: e.target.value
													})
												}
											/>
										</div>
										<div className="grid gap-2">
											<Label>Longitude</Label>
											<Input
												type="number"
												step="any"
												value={questForm.longitude}
												onChange={(e) =>
													setQuestForm({
														...questForm,
														longitude:
															e.target.value
													})
												}
											/>
										</div>
									</div>

									<div className="grid gap-2">
										<Label>Изображения</Label>
										<Input
											type="file"
											accept="image/*"
											multiple
											onChange={(e) => {
												const files = Array.from(
													e.target.files || []
												)
												setQuestImageFiles([
													...questImageFiles,
													...files
												])
											}}
										/>
										{questImageFiles.length > 0 && (
											<div className="mt-2 grid grid-cols-3 gap-2">
												{questImageFiles.map((f, i) => (
													<div
														key={i}
														className="relative"
													>
														<img
															src={URL.createObjectURL(
																f
															)}
															className="h-24 w-full rounded object-cover"
														/>
														<button
															onClick={() =>
																setQuestImageFiles(
																	questImageFiles.filter(
																		(
																			_,
																			idx
																		) =>
																			idx !==
																			i
																	)
																)
															}
															className="absolute top-1 right-1 rounded-full bg-red-500 p-1"
														>
															<X className="h-3 w-3 text-white" />
														</button>
													</div>
												))}
											</div>
										)}
									</div>

									{questForm.withGuide && (
										<div className="space-y-4 border-l-2 border-blue-200 pl-6 dark:border-blue-800">
											{renderField(
												'Описание экскурсии *',
												'guideDescription',
												<Textarea
													placeholder="Что будет на экскурсии? Какие места посетите?"
													rows={3}
													value={
														questForm.guideDescription
													}
													onChange={(e) => {
														setQuestForm({
															...questForm,
															guideDescription:
																e.target.value
														})
														if (
															questFormErrors.guideDescription
														)
															setQuestFormErrors({
																...questFormErrors,
																guideDescription:
																	''
															})
													}}
												/>,
												questFormErrors.guideDescription
											)}

											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												{renderField(
													'Имя гида *',
													'guideName',
													<Input
														placeholder="Имя и фамилия гида"
														value={
															questForm.guideName
														}
														onChange={(e) => {
															setQuestForm({
																...questForm,
																guideName:
																	e.target
																		.value
															})
															if (
																questFormErrors.guideName
															)
																setQuestFormErrors(
																	{
																		...questFormErrors,
																		guideName:
																			''
																	}
																)
														}}
													/>,
													questFormErrors.guideName
												)}

												<div className="grid gap-2">
													<Label>
														Вместимость группы
													</Label>
													<Input
														type="number"
														placeholder="Максимум участников"
														value={
															questForm.capacity
														}
														onChange={(e) =>
															setQuestForm({
																...questForm,
																capacity:
																	e.target
																		.value
															})
														}
													/>
												</div>
											</div>

											{renderField(
												'Ссылка на группу (Telegram/WhatsApp) *',
												'groupLink',
												<Input
													placeholder="https://t.me/..."
													value={questForm.groupLink}
													onChange={(e) => {
														setQuestForm({
															...questForm,
															groupLink:
																e.target.value
														})
														if (
															questFormErrors.groupLink
														)
															setQuestFormErrors({
																...questFormErrors,
																groupLink: ''
															})
													}}
												/>,
												questFormErrors.groupLink
											)}

											{renderField(
												'Дата и время начала *',
												'plannedStart',
												<Input
													type="datetime-local"
													value={
														questForm.plannedStart
													}
													onChange={(e) => {
														setQuestForm({
															...questForm,
															plannedStart:
																e.target.value
														})
														if (
															questFormErrors.plannedStart
														)
															setQuestFormErrors({
																...questFormErrors,
																plannedStart: ''
															})
													}}
													className="w-full"
												/>,
												questFormErrors.plannedStart
											)}
											<p className="text-muted-foreground -mt-2 text-xs">
												Формат: ГГГГ-ММ-ДДTЧЧ:ММ
												(например: 2024-12-31T15:30)
											</p>
										</div>
									)}
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() =>
											setIsCreateQuestDialogOpen(false)
										}
									>
										Отмена
									</Button>
									<Button
										onClick={handleCreateQuest}
										disabled={isCreatingQuest}
									>
										{isCreatingQuest ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : null}
										{isCreatingQuest
											? 'Создание...'
											: 'Создать'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					{/* Dialog для редактирования квеста */}
					<Dialog
						open={isEditQuestDialogOpen}
						onOpenChange={(open) => {
							setIsEditQuestDialogOpen(open)
							if (!open) resetQuestForm()
						}}
					>
						<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
							<DialogHeader>
								<DialogTitle>
									Редактирование маршрута
								</DialogTitle>
								<DialogDescription>
									Измените информацию о маршруте
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								{renderField(
									'Название *',
									'title',
									<Input
										value={questForm.title}
										onChange={(e) => {
											setQuestForm({
												...questForm,
												title: e.target.value
											})
											if (questFormErrors.title)
												setQuestFormErrors({
													...questFormErrors,
													title: ''
												})
										}}
									/>,
									questFormErrors.title
								)}

								<div className="grid gap-2">
									<div className="flex items-center justify-between">
										<Label>Описание *</Label>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												generateQuestDescriptionWithAI(
													questForm.description
												)
											}
											disabled={
												isGeneratingQuestDescription
											}
										>
											<Wand2 className="mr-1 h-4 w-4" />
											{isGeneratingQuestDescription
												? 'Генерация...'
												: 'Улучшить AI'}
										</Button>
									</div>
									<Textarea
										rows={3}
										value={questForm.description}
										onChange={(e) => {
											setQuestForm({
												...questForm,
												description: e.target.value
											})
											if (questFormErrors.description)
												setQuestFormErrors({
													...questFormErrors,
													description: ''
												})
										}}
									/>
									{questFormErrors.description && (
										<div className="flex items-center gap-1 text-sm text-red-500">
											<AlertCircle className="h-4 w-4" />
											<span>
												{questFormErrors.description}
											</span>
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="grid gap-2">
										<Label>Категория *</Label>
										<Select
											value={questForm.categoryId}
											onValueChange={(v) => {
												setQuestForm({
													...questForm,
													categoryId: v
												})
												if (questFormErrors.categoryId)
													setQuestFormErrors({
														...questFormErrors,
														categoryId: ''
													})
											}}
										>
											<SelectTrigger
												className={
													questFormErrors.categoryId
														? 'border-red-500'
														: ''
												}
											>
												<SelectValue placeholder="Выберите" />
											</SelectTrigger>
											<SelectContent>
												{categories.map((c) => (
													<SelectItem
														key={c.id}
														value={c.id}
													>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{questFormErrors.categoryId && (
											<div className="flex items-center gap-1 text-sm text-red-500">
												<AlertCircle className="h-4 w-4" />
												<span>
													{questFormErrors.categoryId}
												</span>
											</div>
										)}
									</div>
									<div className="grid gap-2">
										<Label>Сложность</Label>
										<Select
											value={questForm.difficulty}
											onValueChange={(v: any) =>
												setQuestForm({
													...questForm,
													difficulty: v
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="EASY">
													Легко
												</SelectItem>
												<SelectItem value="MEDIUM">
													Средне
												</SelectItem>
												<SelectItem value="HARD">
													Сложно
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="grid gap-2">
										<Label>Длительность (мин)</Label>
										<Input
											type="number"
											value={questForm.duration}
											onChange={(e) =>
												setQuestForm({
													...questForm,
													duration: e.target.value
												})
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label>Город</Label>
										<AddressSuggestions
											key={`edit-${cityDefaultQuery}`}
											uid={`${dadataUid}-edit`}
											token={TOKEN_DADATA}
											defaultQuery={cityDefaultQuery}
											onChange={
												handleCitySuggestionChange
											}
											filterFromBound="city"
											filterToBound="city"
											filterRestrictValue
											minChars={1}
											selectOnBlur
											containerClassName="dadata-city-container"
											suggestionsClassName="dadata-city-suggestions"
											suggestionClassName="dadata-city-suggestion"
											currentSuggestionClassName="dadata-city-suggestion-current"
											highlightClassName="dadata-city-highlight"
											inputProps={{
												className:
													'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
												placeholder:
													'Начните вводить город'
											}}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="grid gap-2">
										<Label>Latitude</Label>
										<Input
											type="number"
											step="any"
											value={questForm.latitude}
											onChange={(e) =>
												setQuestForm({
													...questForm,
													latitude: e.target.value
												})
											}
										/>
									</div>
									<div className="grid gap-2">
										<Label>Longitude</Label>
										<Input
											type="number"
											step="any"
											value={questForm.longitude}
											onChange={(e) =>
												setQuestForm({
													...questForm,
													longitude: e.target.value
												})
											}
										/>
									</div>
								</div>

								{existingImages.length > 0 && (
									<div className="grid gap-2">
										<Label>Текущие изображения</Label>
										<div className="grid grid-cols-3 gap-2">
											{existingImages.map((img, i) => (
												<div
													key={i}
													className="relative"
												>
													<img
														src={img}
														className="h-24 w-full rounded object-cover"
													/>
													{!imagesToDelete.includes(
														img
													) && (
														<button
															onClick={() =>
																setImagesToDelete(
																	[
																		...imagesToDelete,
																		img
																	]
																)
															}
															className="absolute top-1 right-1 rounded-full bg-red-500 p-1 hover:bg-red-600"
														>
															<X className="h-3 w-3 text-white" />
														</button>
													)}
													{imagesToDelete.includes(
														img
													) && (
														<div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
															<span className="text-xs text-white">
																Будет удалено
															</span>
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								<div className="grid gap-2">
									<Label>Добавить новые изображения</Label>
									<Input
										type="file"
										accept="image/*"
										multiple
										onChange={(e) => {
											const files = Array.from(
												e.target.files || []
											)
											setQuestImageFiles([
												...questImageFiles,
												...files
											])
										}}
									/>
									{questImageFiles.length > 0 && (
										<div className="mt-2 grid grid-cols-3 gap-2">
											{questImageFiles.map((f, i) => (
												<div
													key={i}
													className="relative"
												>
													<img
														src={URL.createObjectURL(
															f
														)}
														className="h-24 w-full rounded object-cover"
													/>
													<button
														onClick={() =>
															setQuestImageFiles(
																questImageFiles.filter(
																	(_, idx) =>
																		idx !==
																		i
																)
															)
														}
														className="absolute top-1 right-1 rounded-full bg-red-500 p-1"
													>
														<X className="h-3 w-3 text-white" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{questForm.withGuide && (
									<div className="space-y-4 border-l-2 border-blue-200 pl-6 dark:border-blue-800">
										{renderField(
											'Описание экскурсии *',
											'guideDescription',
											<Textarea
												placeholder="Что будет на экскурсии? Какие места посетите?"
												rows={3}
												value={
													questForm.guideDescription
												}
												onChange={(e) => {
													setQuestForm({
														...questForm,
														guideDescription:
															e.target.value
													})
													if (
														questFormErrors.guideDescription
													)
														setQuestFormErrors({
															...questFormErrors,
															guideDescription: ''
														})
												}}
											/>,
											questFormErrors.guideDescription
										)}

										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											{renderField(
												'Имя гида *',
												'guideName',
												<Input
													placeholder="Имя и фамилия гида"
													value={questForm.guideName}
													onChange={(e) => {
														setQuestForm({
															...questForm,
															guideName:
																e.target.value
														})
														if (
															questFormErrors.guideName
														)
															setQuestFormErrors({
																...questFormErrors,
																guideName: ''
															})
													}}
												/>,
												questFormErrors.guideName
											)}

											<div className="grid gap-2">
												<Label>
													Вместимость группы
												</Label>
												<Input
													type="number"
													placeholder="Максимум участников"
													value={questForm.capacity}
													onChange={(e) =>
														setQuestForm({
															...questForm,
															capacity:
																e.target.value
														})
													}
												/>
											</div>
										</div>

										{renderField(
											'Ссылка на группу (Telegram/WhatsApp) *',
											'groupLink',
											<Input
												placeholder="https://t.me/..."
												value={questForm.groupLink}
												onChange={(e) => {
													setQuestForm({
														...questForm,
														groupLink:
															e.target.value
													})
													if (
														questFormErrors.groupLink
													)
														setQuestFormErrors({
															...questFormErrors,
															groupLink: ''
														})
												}}
											/>,
											questFormErrors.groupLink
										)}

										{renderField(
											'Дата и время начала *',
											'plannedStart',
											<Input
												type="datetime-local"
												value={questForm.plannedStart}
												onChange={(e) => {
													setQuestForm({
														...questForm,
														plannedStart:
															e.target.value
													})
													if (
														questFormErrors.plannedStart
													)
														setQuestFormErrors({
															...questFormErrors,
															plannedStart: ''
														})
												}}
												className="w-full"
											/>,
											questFormErrors.plannedStart
										)}
										<p className="text-muted-foreground -mt-2 text-xs">
											Формат: ГГГГ-ММ-ДДTЧЧ:ММ (например:
											2024-12-31T15:30)
										</p>
									</div>
								)}
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() =>
										setIsEditQuestDialogOpen(false)
									}
								>
									Отмена
								</Button>
								<Button
									onClick={handleUpdateQuest}
									disabled={isUpdatingQuest}
								>
									{isUpdatingQuest ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									{isUpdatingQuest
										? 'Сохранение...'
										: 'Сохранить изменения'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Таблица квестов */}
					<Card>
						<CardContent className="overflow-x-auto p-0">
							{isLoadingQuests ? (
								<div className="flex justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin" />
								</div>
							) : quests.length === 0 ? (
								<div className="text-muted-foreground py-12 text-center">
									Нет маршрутов
								</div>
							) : (
								<div className="min-w-[800px]">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-[250px]">
													Название
												</TableHead>
												<TableHead>Категория</TableHead>
												<TableHead>Сложность</TableHead>
												<TableHead>Точек</TableHead>
												<TableHead>Цена</TableHead>
												<TableHead>Рейтинг</TableHead>
												<TableHead className="text-right">
													Действия
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{quests.map((quest) => (
												<TableRow key={quest.id}>
													<TableCell className="font-medium">
														<div className="flex items-center space-x-3">
															<img
																src={
																	quest
																		.images[0]
																}
																className="h-10 w-10 flex-shrink-0 rounded object-cover"
															/>
															<span className="break-words">
																{quest.title}
															</span>
														</div>
													</TableCell>
													<TableCell>
														{quest.category}
													</TableCell>
													<TableCell>
														<Badge
															variant="outline"
															className={
																quest.difficulty ===
																'easy'
																	? 'bg-green-50 text-green-700'
																	: quest.difficulty ===
																		  'medium'
																		? 'bg-yellow-50 text-yellow-700'
																		: 'bg-red-50 text-red-700'
															}
														>
															{quest.difficulty ===
															'easy'
																? 'Легко'
																: quest.difficulty ===
																	  'medium'
																	? 'Средне'
																	: 'Сложно'}
														</Badge>
													</TableCell>
													<TableCell>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																setSelectedQuest(
																	quest
																)
																setIsPointsDialogOpen(
																	true
																)
															}}
														>
															{
																quest.checkpointsCount
															}{' '}
															точек
														</Button>
													</TableCell>
													<TableCell>
														{quest.price} ₽
													</TableCell>
													<TableCell>
														{quest.rating} (
														{quest.reviewsCount})
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end space-x-1">
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	handleEditQuest(
																		quest
																	)
																}
															>
																<Pencil className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	handleDeleteQuest(
																		quest.id
																	)
																}
															>
																<Trash2 className="h-4 w-4 text-red-500" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Achievements Tab - компактная версия */}
				<TabsContent value="achievements" className="space-y-6">
					<div className="flex items-center justify-between">
						<h2 className="text-foreground text-xl font-semibold">
							Управление достижениями
						</h2>
						<Dialog
							open={isCreateAchievementDialogOpen}
							onOpenChange={(open) => {
								setIsCreateAchievementDialogOpen(open)
								if (!open) resetAchievementForm()
							}}
						>
							<DialogTrigger asChild>
								<Button className="bg-gradient-to-r from-blue-500 to-purple-600">
									<Plus className="mr-2 h-4 w-4" />
									Создать достижение
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>
										{editingAchievement
											? 'Редактировать'
											: 'Создать'}{' '}
										достижение
									</DialogTitle>
									<DialogDescription>
										{editingAchievement
											? 'Измените информацию о достижении'
											: 'Заполните информацию о новом достижении'}
									</DialogDescription>
								</DialogHeader>
								<div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4">
									{renderField(
										'Название *',
										'name',
										<Input
											value={achievementForm.name}
											onChange={(e) => {
												setAchievementForm({
													...achievementForm,
													name: e.target.value
												})
												if (achievementFormErrors.name)
													setAchievementFormErrors({
														...achievementFormErrors,
														name: ''
													})
											}}
											placeholder="Например: Исследователь"
										/>,
										achievementFormErrors.name
									)}

									{renderField(
										'Описание *',
										'description',
										<Textarea
											rows={2}
											value={achievementForm.description}
											onChange={(e) => {
												setAchievementForm({
													...achievementForm,
													description: e.target.value
												})
												if (
													achievementFormErrors.description
												)
													setAchievementFormErrors({
														...achievementFormErrors,
														description: ''
													})
											}}
											placeholder="Описание достижения"
										/>,
										achievementFormErrors.description
									)}

									<div className="grid gap-2">
										<Label>Тип правила *</Label>
										<Select
											value={achievementForm.rule_type}
											onValueChange={(v: any) => {
												const newParams: Record<
													string,
													any
												> = { threshold: 10 }
												if (
													v ===
														'SPECIFIC_QUEST_COMPLETED' ||
													v === 'POINTS_IN_QUEST'
												) {
													newParams.quest_id = ''
												}
												setAchievementForm({
													...achievementForm,
													rule_type: v,
													rule_params: newParams
												})
											}}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{RULE_TYPE_OPTIONS.map(
													(option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									</div>

									<div className="grid gap-2">
										{achievementForm.rule_type ===
										'SPECIFIC_QUEST_COMPLETED' ? (
											<>
												<Label>Выберите квест *</Label>
												<Select
													value={
														achievementForm
															.rule_params
															.quest_id || ''
													}
													onValueChange={(v) => {
														setAchievementForm({
															...achievementForm,
															rule_params: {
																...achievementForm.rule_params,
																quest_id: v
															}
														})
														if (
															achievementFormErrors.quest_id
														)
															setAchievementFormErrors(
																{
																	...achievementFormErrors,
																	quest_id: ''
																}
															)
													}}
												>
													<SelectTrigger
														className={
															achievementFormErrors.quest_id
																? 'border-red-500'
																: ''
														}
													>
														<SelectValue placeholder="Выберите квест" />
													</SelectTrigger>
													<SelectContent>
														{quests.map((q) => (
															<SelectItem
																key={q.id}
																value={q.id}
															>
																{q.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</>
										) : achievementForm.rule_type ===
										  'POINTS_IN_QUEST' ? (
											<>
												<Label>Выберите квест *</Label>
												<Select
													value={
														achievementForm
															.rule_params
															.quest_id || ''
													}
													onValueChange={(v) => {
														setAchievementForm({
															...achievementForm,
															rule_params: {
																...achievementForm.rule_params,
																quest_id: v
															}
														})
														if (
															achievementFormErrors.quest_id
														)
															setAchievementFormErrors(
																{
																	...achievementFormErrors,
																	quest_id: ''
																}
															)
													}}
												>
													<SelectTrigger
														className={
															achievementFormErrors.quest_id
																? 'border-red-500'
																: ''
														}
													>
														<SelectValue placeholder="Выберите квест" />
													</SelectTrigger>
													<SelectContent>
														{quests.map((q) => (
															<SelectItem
																key={q.id}
																value={q.id}
															>
																{q.title}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<div className="mt-2 grid gap-2">
													<Label>
														Количество баллов *
													</Label>
													<Input
														type="number"
														placeholder="Например: 1000"
														value={
															achievementForm
																.rule_params
																.threshold
														}
														onChange={(e) => {
															setAchievementForm({
																...achievementForm,
																rule_params: {
																	...achievementForm.rule_params,
																	threshold:
																		Number(
																			e
																				.target
																				.value
																		)
																}
															})
															if (
																achievementFormErrors.threshold
															)
																setAchievementFormErrors(
																	{
																		...achievementFormErrors,
																		threshold:
																			''
																	}
																)
														}}
													/>
												</div>
											</>
										) : (
											<>
												<Label>
													Пороговое значение *
												</Label>
												<Input
													type="number"
													placeholder="Например: 10"
													value={
														achievementForm
															.rule_params
															.threshold
													}
													onChange={(e) => {
														setAchievementForm({
															...achievementForm,
															rule_params: {
																...achievementForm.rule_params,
																threshold:
																	Number(
																		e.target
																			.value
																	)
															}
														})
														if (
															achievementFormErrors.threshold
														)
															setAchievementFormErrors(
																{
																	...achievementFormErrors,
																	threshold:
																		''
																}
															)
													}}
												/>
											</>
										)}
										{achievementFormErrors.threshold && (
											<div className="flex items-center gap-1 text-sm text-red-500">
												<AlertCircle className="h-4 w-4" />
												<span>
													{
														achievementFormErrors.threshold
													}
												</span>
											</div>
										)}
										{achievementFormErrors.quest_id && (
											<div className="flex items-center gap-1 text-sm text-red-500">
												<AlertCircle className="h-4 w-4" />
												<span>
													{
														achievementFormErrors.quest_id
													}
												</span>
											</div>
										)}
									</div>

									<div className="grid gap-2">
										<Label>Изображение</Label>
										<Input
											type="file"
											accept="image/*"
											onChange={(e) => {
												const file = e.target.files?.[0]
												if (file) {
													setAchievementImageFile(
														file
													)
													setAchievementImagePreview(
														URL.createObjectURL(
															file
														)
													)
												}
											}}
										/>
										{achievementImagePreview && (
											<div className="relative mt-2 h-24 w-24">
												<img
													src={
														achievementImagePreview
													}
													className="h-full w-full rounded-lg object-cover"
												/>
												<button
													onClick={() => {
														setAchievementImageFile(
															null
														)
														setAchievementImagePreview(
															''
														)
														setAchievementForm({
															...achievementForm,
															image_url: ''
														})
													}}
													className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 hover:bg-red-600"
												>
													<X className="h-3 w-3 text-white" />
												</button>
											</div>
										)}
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() =>
											setIsCreateAchievementDialogOpen(
												false
											)
										}
									>
										Отмена
									</Button>
									<Button
										onClick={handleCreateAchievement}
										disabled={isCreatingAchievement}
									>
										{isCreatingAchievement ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : null}
										{isCreatingAchievement
											? 'Сохранение...'
											: 'Сохранить'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					{/* Компактная сетка достижений */}
					<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
						{isLoadingAchievements ? (
							<div className="col-span-4 flex justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-purple-600" />
							</div>
						) : achievements.length === 0 ? (
							<div className="col-span-4 py-8 text-center">
								<Trophy className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
								<p className="text-muted-foreground text-sm">
									Нет достижений
								</p>
							</div>
						) : (
							achievements.map((ach) => {
								let ruleText = ''
								if (
									ach.rule_type === 'SPECIFIC_QUEST_COMPLETED'
								) {
									const questName = quests.find(
										(q) => q.id === ach.rule_params.quest_id
									)?.title
									ruleText = `Квест: ${questName || '?'}`
								} else if (
									ach.rule_type === 'POINTS_IN_QUEST'
								) {
									const questName = quests.find(
										(q) => q.id === ach.rule_params.quest_id
									)?.title
									ruleText = `${ach.rule_params.threshold} баллов в "${questName || '?'}"`
								} else if (
									ach.rule_type === 'QUESTS_COMPLETED'
								) {
									ruleText = `${ach.rule_params.threshold} квестов`
								} else if (ach.rule_type === 'TOTAL_SCORE') {
									ruleText = `${ach.rule_params.threshold} баллов`
								}

								return (
									<Card
										key={ach.id}
										className="overflow-hidden transition-all hover:shadow-md"
									>
										<CardContent className="p-3">
											<div className="flex items-start gap-2">
												{/* Иконка/изображение */}
												{ach.image_url ? (
													<img
														src={ach.image_url}
														alt={ach.name}
														className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
													/>
												) : (
													<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
														<Trophy className="h-5 w-5 text-white" />
													</div>
												)}

												{/* Контент */}
												<div className="min-w-0 flex-1">
													<h3 className="truncate text-sm font-semibold">
														{ach.name}
													</h3>
													<p className="text-muted-foreground line-clamp-1 text-xs">
														{ach.description}
													</p>
													<p className="mt-0.5 truncate text-xs text-green-600">
														{ruleText}
													</p>
												</div>

												{/* Кнопки действий - компактные */}
												<div className="flex flex-shrink-0 items-center gap-0.5">
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
														onClick={() =>
															handleEditAchievement(
																ach
															)
														}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
														onClick={() =>
															openDeleteAchievementDialog(
																ach
															)
														}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})
						)}
					</div>
				</TabsContent>
			</Tabs>

			{/* Points Management Dialog */}
			<Dialog
				open={isPointsDialogOpen}
				onOpenChange={(open) => {
					setIsPointsDialogOpen(open)
					if (!open) resetPointForm()
				}}
			>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Управление точками маршрута</DialogTitle>
						<DialogDescription>
							Маршрут:{' '}
							<span className="font-semibold">
								{selectedQuest?.title}
							</span>
						</DialogDescription>
					</DialogHeader>

					<Tabs defaultValue="points" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="points">
								Список точек
							</TabsTrigger>
							<TabsTrigger value="add">
								Добавить точку
							</TabsTrigger>
						</TabsList>

						<TabsContent value="points" className="mt-4 space-y-4">
							{selectedQuest?.pointsData?.length === 0 ? (
								<div className="text-muted-foreground py-8 text-center">
									Нет точек
								</div>
							) : (
								selectedQuest?.pointsData?.map((point) => (
									<Card
										key={point.id}
										className="overflow-hidden"
									>
										<CardHeader
											className="cursor-pointer"
											onClick={() =>
												togglePointExpand(point.id)
											}
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex items-center space-x-3">
													<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
														{point.priority}
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-base break-words">
															{point.name}
														</CardTitle>
														<CardDescription className="line-clamp-1 text-xs break-words">
															{point.short_description ||
																point.description.substring(
																	0,
																	80
																)}
														</CardDescription>
													</div>
												</div>
												<div className="flex flex-shrink-0 items-center space-x-2">
													<Badge
														variant="outline"
														className="text-xs"
													>
														+{point.score}
													</Badge>
													{expandedPoints.includes(
														point.id
													) ? (
														<ChevronUp className="h-4 w-4" />
													) : (
														<ChevronDown className="h-4 w-4" />
													)}
												</div>
											</div>
										</CardHeader>
										{expandedPoints.includes(point.id) && (
											<CardContent className="space-y-3 border-t pt-3">
												<div>
													<Label className="text-xs">
														Описание
													</Label>
													<p className="text-muted-foreground mt-1 text-sm">
														{point.description}
													</p>
												</div>
												{point.short_description && (
													<div>
														<Label className="text-xs">
															Краткое описание
														</Label>
														<p className="text-muted-foreground mt-1 text-sm">
															{
																point.short_description
															}
														</p>
													</div>
												)}
												<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
													{point.image_url && (
														<div>
															<Label className="text-xs">
																Изображение
															</Label>
															<img
																src={
																	point.image_url
																}
																className="mt-1 h-28 w-full rounded object-cover"
															/>
														</div>
													)}
													{point.audio_record_url && (
														<div>
															<Label className="text-xs">
																Аудио
															</Label>
															<audio
																controls
																className="mt-1 h-8 w-full"
															>
																<source
																	src={
																		point.audio_record_url
																	}
																/>
															</audio>
														</div>
													)}
												</div>
												{point.latitude &&
													point.longitude && (
														<div>
															<Label className="text-xs">
																Координаты
															</Label>
															<p className="text-muted-foreground text-xs">
																{point.latitude}
																,{' '}
																{
																	point.longitude
																}
															</p>
														</div>
													)}
												<div className="flex justify-end space-x-2 pt-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															handleEditPoint(
																point
															)
														}
													>
														<Pencil className="mr-1 h-3 w-3" />{' '}
														Редактировать
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() =>
															openDeletePointDialog(
																point
															)
														}
													>
														<Trash2 className="mr-1 h-3 w-3" />{' '}
														Удалить
													</Button>
												</div>
											</CardContent>
										)}
									</Card>
								))
							)}
						</TabsContent>

						<TabsContent value="add" className="mt-4 space-y-4">
							<div className="grid gap-4">
								{renderField(
									'Название точки *',
									'name',
									<Input
										value={pointForm.name}
										onChange={(e) => {
											setPointForm({
												...pointForm,
												name: e.target.value
											})
											if (pointFormErrors.name)
												setPointFormErrors({
													...pointFormErrors,
													name: ''
												})
										}}
									/>,
									pointFormErrors.name
								)}

								<div className="grid gap-2">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<Label>Описание *</Label>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												generatePointDescriptionWithAI(
													pointForm.description
												)
											}
											disabled={
												isGeneratingPointDescription
											}
										>
											<Wand2 className="mr-1 h-3 w-3" />
											{isGeneratingPointDescription
												? 'Генерация...'
												: 'Улучшить AI'}
										</Button>
									</div>
									<Textarea
										rows={3}
										value={pointForm.description}
										onChange={(e) => {
											setPointForm({
												...pointForm,
												description: e.target.value
											})
											if (pointFormErrors.description)
												setPointFormErrors({
													...pointFormErrors,
													description: ''
												})
										}}
									/>
									{pointFormErrors.description && (
										<div className="flex items-center gap-1 text-sm text-red-500">
											<AlertCircle className="h-3 w-3" />
											<span>
												{pointFormErrors.description}
											</span>
										</div>
									)}
								</div>

								<div className="grid gap-2">
									<Label>Краткое описание</Label>
									<Textarea
										rows={2}
										value={pointForm.shortDescription}
										onChange={(e) =>
											setPointForm({
												...pointForm,
												shortDescription: e.target.value
											})
										}
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="grid gap-1">
										<Label className="text-xs">Баллы</Label>
										<Input
											type="number"
											value={pointForm.score}
											onChange={(e) =>
												setPointForm({
													...pointForm,
													score: e.target.value
												})
											}
										/>
									</div>
									<div className="grid gap-1">
										<Label className="text-xs">
											Порядок
										</Label>
										<Input
											type="number"
											value={pointForm.priority}
											onChange={(e) =>
												setPointForm({
													...pointForm,
													priority: e.target.value
												})
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="grid gap-1">
										<Label className="text-xs">
											Широта
										</Label>
										<Input
											placeholder="54.6295"
											value={pointForm.latitude}
											onChange={(e) =>
												setPointForm({
													...pointForm,
													latitude: e.target.value
												})
											}
										/>
									</div>
									<div className="grid gap-1">
										<Label className="text-xs">
											Долгота
										</Label>
										<Input
											placeholder="39.7421"
											value={pointForm.longitude}
											onChange={(e) =>
												setPointForm({
													...pointForm,
													longitude: e.target.value
												})
											}
										/>
									</div>
								</div>

								<div className="grid gap-1">
									<Label className="text-xs">
										Изображение
									</Label>
									<Input
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files?.[0]
											if (file) {
												setPointImageFile(file)
												setPointImagePreview(
													URL.createObjectURL(file)
												)
											}
										}}
									/>
									{pointImagePreview && (
										<img
											src={pointImagePreview}
											className="h-24 w-full rounded object-cover"
										/>
									)}
								</div>

								<div className="grid gap-1">
									<Label className="text-xs">Аудио</Label>
									<Input
										type="file"
										accept="audio/*"
										onChange={(e) => {
											const file = e.target.files?.[0]
											if (file) {
												setPointAudioFile(file)
												setPointAudioPreview(
													URL.createObjectURL(file)
												)
											}
										}}
									/>
									{pointAudioPreview && (
										<audio
											controls
											className="mt-1 h-8 w-full"
										>
											<source src={pointAudioPreview} />
										</audio>
									)}
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={resetPointForm}
								>
									Очистить
								</Button>
								<Button
									onClick={handleCreatePoint}
									disabled={
										isSubmittingPoint ||
										!pointForm.name ||
										!pointForm.description
									}
								>
									{isSubmittingPoint ? (
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
									) : null}
									{isSubmittingPoint
										? 'Добавление...'
										: 'Добавить точку'}
								</Button>
							</DialogFooter>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>

			{/* Edit Point Dialog */}
			<Dialog
				open={isEditPointDialogOpen}
				onOpenChange={setIsEditPointDialogOpen}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Редактирование точки</DialogTitle>
						<DialogDescription>
							Измените информацию о точке маршрута
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{renderField(
							'Название точки *',
							'name',
							<Input
								value={pointForm.name}
								onChange={(e) => {
									setPointForm({
										...pointForm,
										name: e.target.value
									})
									if (pointFormErrors.name)
										setPointFormErrors({
											...pointFormErrors,
											name: ''
										})
								}}
							/>,
							pointFormErrors.name
						)}

						<div className="grid gap-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<Label>Описание *</Label>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										generatePointDescriptionWithAI(
											pointForm.description
										)
									}
									disabled={isGeneratingPointDescription}
								>
									<Wand2 className="mr-1 h-3 w-3" />
									{isGeneratingPointDescription
										? 'Генерация...'
										: 'Улучшить AI'}
								</Button>
							</div>
							<Textarea
								rows={3}
								value={pointForm.description}
								onChange={(e) => {
									setPointForm({
										...pointForm,
										description: e.target.value
									})
									if (pointFormErrors.description)
										setPointFormErrors({
											...pointFormErrors,
											description: ''
										})
								}}
							/>
							{pointFormErrors.description && (
								<div className="flex items-center gap-1 text-sm text-red-500">
									<AlertCircle className="h-3 w-3" />
									<span>{pointFormErrors.description}</span>
								</div>
							)}
						</div>

						<div className="grid gap-2">
							<Label>Краткое описание</Label>
							<Textarea
								rows={2}
								value={pointForm.shortDescription}
								onChange={(e) =>
									setPointForm({
										...pointForm,
										shortDescription: e.target.value
									})
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-1">
								<Label className="text-xs">Баллы</Label>
								<Input
									type="number"
									value={pointForm.score}
									onChange={(e) =>
										setPointForm({
											...pointForm,
											score: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-1">
								<Label className="text-xs">Порядок</Label>
								<Input
									type="number"
									value={pointForm.priority}
									onChange={(e) =>
										setPointForm({
											...pointForm,
											priority: e.target.value
										})
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-1">
								<Label className="text-xs">Широта</Label>
								<Input
									placeholder="54.6295"
									value={pointForm.latitude}
									onChange={(e) =>
										setPointForm({
											...pointForm,
											latitude: e.target.value
										})
									}
								/>
							</div>
							<div className="grid gap-1">
								<Label className="text-xs">Долгота</Label>
								<Input
									placeholder="39.7421"
									value={pointForm.longitude}
									onChange={(e) =>
										setPointForm({
											...pointForm,
											longitude: e.target.value
										})
									}
								/>
							</div>
						</div>

						<div className="grid gap-1">
							<Label className="text-xs">
								Текущее изображение
							</Label>
							{editingPoint?.image_url && (
								<div className="space-y-2">
									<img
										src={editingPoint.image_url}
										className="h-32 w-full rounded object-cover"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleDeletePointImage}
									>
										<Trash2 className="mr-1 h-3 w-3" />
										Удалить изображение
									</Button>
								</div>
							)}
						</div>

						<div className="grid gap-1">
							<Label className="text-xs">
								Заменить изображение
							</Label>
							<Input
								type="file"
								accept="image/*"
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) {
										setPointImageFile(file)
										setPointImagePreview(
											URL.createObjectURL(file)
										)
									}
								}}
							/>
							{pointImagePreview && (
								<img
									src={pointImagePreview}
									className="mt-1 h-24 w-full rounded object-cover"
								/>
							)}
						</div>

						<div className="grid gap-1">
							<Label className="text-xs">Текущее аудио</Label>
							{editingPoint?.audio_record_url && (
								<div className="space-y-2">
									<audio controls className="h-8 w-full">
										<source
											src={editingPoint.audio_record_url}
										/>
									</audio>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleDeletePointAudio}
									>
										<Trash2 className="mr-1 h-3 w-3" />
										Удалить аудио
									</Button>
								</div>
							)}
						</div>

						<div className="grid gap-1">
							<Label className="text-xs">Заменить аудио</Label>
							<Input
								type="file"
								accept="audio/*"
								onChange={(e) => {
									const file = e.target.files?.[0]
									if (file) {
										setPointAudioFile(file)
										setPointAudioPreview(
											URL.createObjectURL(file)
										)
									}
								}}
							/>
							{pointAudioPreview && (
								<audio controls className="mt-1 h-8 w-full">
									<source src={pointAudioPreview} />
								</audio>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditPointDialogOpen(false)}
						>
							Отмена
						</Button>
						<Button
							onClick={handleUpdatePoint}
							disabled={isSubmittingPoint}
						>
							{isSubmittingPoint ? (
								<Loader2 className="mr-1 h-3 w-3 animate-spin" />
							) : null}
							{isSubmittingPoint
								? 'Сохранение...'
								: 'Сохранить изменения'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Point Confirmation Dialog */}
			<Dialog
				open={deletePointDialogOpen}
				onOpenChange={setDeletePointDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							Удаление точки
						</DialogTitle>
						<DialogDescription>
							Вы уверены, что хотите удалить точку "
							{pointToDelete?.name}"? Это действие нельзя
							отменить.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setDeletePointDialogOpen(false)}
						>
							Отмена
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeletePoint}
						>
							Удалить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Achievement Confirmation Dialog */}
			<Dialog
				open={deleteAchievementDialogOpen}
				onOpenChange={setDeleteAchievementDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							Удаление достижения
						</DialogTitle>
						<DialogDescription>
							Вы уверены, что хотите удалить достижение "
							{achievementToDelete?.name}"? Это действие нельзя
							отменить.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() =>
								setDeleteAchievementDialogOpen(false)
							}
						>
							Отмена
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAchievement}
						>
							Удалить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
