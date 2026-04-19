// User types
export interface UserAccount {
	account_type: 'google' | 'yandex' | 'github'
	user_id: string
}

export type UserQuestStatus = 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED'

export type UserQuest = {
	id: string
	user_id: string
	quest_id: string
	status: UserQuestStatus
	created_at: string
	updated_at: string
}

export type UserPointStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export type UserPoint = {
	id?: string
	user_id: string
	point_id: string
	status?: UserPointStatus
	is_completed?: boolean
	created_at: string
	updated_at: string
}

export type UserDailyComplete = {
	user_id: string
	point_id: string
	score: number
	completed_at: string
}

export type AchievementDefinition = {
	id: string
	name: string
	description: string
	image_url: string | null
	rule_type:
		| 'QUESTS_COMPLETED'
		| 'TOTAL_SCORE'
		| 'SPECIFIC_QUEST_COMPLETED'
		| 'POINTS_IN_QUEST'
	rule_params: Record<string, unknown>
}

export type UserAchievement = {
	id: string
	user_id: string
	achievement_id: string
	achievement: AchievementDefinition
	created_at: string
	updated_at: string
}

export type User = {
	id?: string
	name: string
	surname: string
	email: string
	role:
		| 'visitor'
		| 'seller_ip'
		| 'seller_org'
		| 'organizer'
		| 'platform_admin'
		| 'user'
		| 'admin'
	avatar_url?: string
	description?: string
	website_link?: string
	is_known_password?: boolean
	statistic: {
		quests_completed: number
		score: number
		available_for_purchases: number
	}
	accounts?: Array<{
		id: string
		account_type: string
		user_id: string
		created_at: string
	}>
	achievements?: UserAchievement[]
	quests?: UserQuest[]
	points?: UserPoint[]
	daily_completes?: UserDailyComplete[]
}

// Auth types
export interface AuthTokens {
	access_token: string
	refresh_token: string
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface RegisterData {
	name: string
	surname: string
	email: string
	password: string
}

export interface VerifyCodeData {
	email: string
	code: string
}

export interface UpdateUserData {
	name?: string
	surname?: string
	avatar_url?: string
}

export interface ChangePasswordData {
	old_password: string
	new_password: string
	code: string
}

// API Response types
export interface ApiError {
	message: string
	status: number
}

export type OAuthProvider = 'google' | 'yandex'

export interface ApiCategory {
	created_at: string
	updated_at: string
	id: string
	name: string
}

export interface ApiPoint {
	created_at: string
	updated_at: string
	id: string
	quest_id: string
	name: string
	description: string
	short_description: string
	code: string
	score: number
	latitude?: number
	longitude?: number
	priority: number
	is_daily?: boolean
	audio_record_url: string | null
	image_url: string | null
}

export interface ApiImage {
	id: string
	quest_id: string
	image_url: string
}

export interface ApiQuestPlanning {
	created_at: string
	updated_at: string
	id: string
	quest_id: string
	description: string
	guide_name: string
	group_link: string
	planned_start: string
	capacity: number
}

export interface ApiFeedback {
	created_at: string
	updated_at: string
	id: string
	user_id: string
	quest_id: string
	score: number
	text: string | null
}

export interface ApiQuest {
	created_at: string
	updated_at: string
	id: string
	name: string
	description: string
	category_id: string | null
	price_rub: number
	length_metres: number | null
	duration_min: number | null
	level: 'EASY' | 'MEDIUM' | 'HARD'
	rating: number | null
	category: ApiCategory | null
	location?: {
		city_id?: string
		city_name?: string
		region_id?: string
		region_name?: string
		latitude?: number
		longitude?: number
	} | null
	points: ApiPoint[]
	images: ApiImage[]
	quest_planning: ApiQuestPlanning | null
	feedbacks: ApiFeedback[]
}

export type ApiCategoryList = ApiCategory[]

export type ApiQuestList = ApiQuest[]

// Chat types
export type ChatMessageType = 'USER' | 'BOT'

export interface ChatMessage {
	id: string
	chat_id: string
	user_id: string
	message: string
	is_deletable: boolean
	type: ChatMessageType
	created_at?: string
}

export interface UserPointChat {
	id: string
	user_point_id: string
	user_id: string
	messages: ChatMessage[]
}

export interface ShopItem {
	id: string
	title: string
	description: string
	price: number
	link?: string
	image_url: string
}

export interface ShopPurchase {
	id: string
	item_id: string
	user_id: string
	amount: number
}
