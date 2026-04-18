'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	Award,
	Camera,
	ExternalLink,
	Globe,
	LogOut,
	Pencil,
	Route
} from 'lucide-react'
import { toast } from 'sonner'

import { useUser } from '@/shared/hooks/use-user'
import { getQuests, type QuestDto } from '@/shared/api/quest'
import { normalizeApiError } from '@/shared/api/errors'
import { uploadPhoto } from '@/shared/api/media'
import { deleteMe, updateUser } from '@/shared/api/user'
import {
	deleteOrganizationMe,
	updateOrganizationMe
} from '@/shared/api/organization'
import { TokenManager } from '@/shared/api/auth'
import { getRoleLabel } from '@/shared/lib/roles'

import { Spinner } from '@/shared/components/ui/spinner'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '@/shared/components/ui/avatar'
import { EditProfileFormWidget } from '@/widgets'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'

export default function ProfilePage() {
	const router = useRouter()
	const { user, isLoading, isAuthenticated, mutate } = useUser()

	const [quests, setQuests] = useState<QuestDto[]>([])
	const [questsError, setQuestsError] = useState<string | null>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
	const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
	const [isSavingOrganization, setIsSavingOrganization] = useState(false)
	const [isDeletingAccount, setIsDeletingAccount] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [organizationForm, setOrganizationForm] = useState({
		name: '',
		description: '',
		website_link: ''
	})
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push('/login')
		}
	}, [isLoading, isAuthenticated, router])

	useEffect(() => {
		if (!user) return
		setAvatarUrl(user.avatar_url)
		if (user.role === 'organizer') {
			setOrganizationForm({
				name: user.name || '',
				description: user.description || '',
				website_link: user.website_link || ''
			})
		}
	}, [user])

	useEffect(() => {
		if (!user || user.role === 'organizer') return
		let cancelled = false
		const load = async () => {
			try {
				const data = await getQuests()
				if (cancelled) return
				setQuests(data)
			} catch (err) {
				if (cancelled) return
				const apiError = normalizeApiError(
					err,
					'Не удалось загрузить квесты'
				)
				setQuestsError(apiError.message)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [user])

	const completedQuestIds =
		user?.quests
			?.filter((quest) => quest.status === 'COMPLETED')
			.map((q) => q.quest_id) || []
	const activeQuestIds =
		user?.quests
			?.filter((quest) => quest.status !== 'COMPLETED')
			.map((quest) => quest.quest_id) || []

	const completedQuests = quests.filter((quest) =>
		completedQuestIds.includes(quest.id)
	)
	const activeQuests = quests.filter((quest) =>
		activeQuestIds.includes(quest.id)
	)

	const totalEarnedPoints = useMemo(() => {
		if (!user) return 0
		const pointsMap = new Map(
			quests
				.flatMap((quest) => quest.points)
				.map((point) => [point.id, point.score])
		)
		const pointsScore =
			user.points
				?.filter((point) => point.status === 'COMPLETED')
				.reduce(
					(sum, point) => sum + (pointsMap.get(point.point_id) || 0),
					0
				) || 0
		const dailyScore =
			user.daily_completes?.reduce((sum, item) => sum + item.score, 0) ||
			0
		return pointsScore + dailyScore
	}, [quests, user])

	const getInitials = (name: string, surname?: string) => {
		const safeSurname = surname || name
		return `${name.charAt(0)}${safeSurname.charAt(0)}`.toUpperCase()
	}

	const handleAvatarChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file || !user) return

		if (!file.type.startsWith('image/')) {
			toast.error('Можно загрузить только изображение')
			event.target.value = ''
			return
		}

		setIsUploadingAvatar(true)
		try {
			const { url: uploadedAvatarUrl } = await uploadPhoto(file)
			if (!uploadedAvatarUrl) {
				throw new Error('Upload response does not contain avatar URL')
			}

			setAvatarUrl(uploadedAvatarUrl)

			if (user.role === 'organizer') {
				await updateOrganizationMe({
					name: organizationForm.name || user.name,
					description: organizationForm.description,
					website_link: organizationForm.website_link,
					avatar_url: uploadedAvatarUrl
				})
			} else {
				await updateUser({
					name: user.name,
					surname: user.surname,
					avatar_url: uploadedAvatarUrl
				})
			}

			await mutate()
			toast.success('Аватар обновлен')
		} catch (err) {
			const apiError = normalizeApiError(
				err,
				'Не удалось обновить аватар'
			)
			toast.error(apiError.message)
		} finally {
			setIsUploadingAvatar(false)
			event.target.value = ''
		}
	}

	const handleOrganizationSave = async () => {
		if (!organizationForm.name.trim()) {
			toast.error('Введите название организации')
			return
		}
		setIsSavingOrganization(true)
		try {
			await updateOrganizationMe({
				name: organizationForm.name.trim(),
				description: organizationForm.description.trim(),
				website_link: organizationForm.website_link.trim(),
				avatar_url: avatarUrl
			})
			await mutate()
			toast.success('Профиль организации обновлен')
		} catch (err) {
			const apiError = normalizeApiError(
				err,
				'Не удалось обновить профиль организации'
			)
			toast.error(apiError.message)
		} finally {
			setIsSavingOrganization(false)
		}
	}

	const handleDeleteAccount = async () => {
		setIsDeletingAccount(true)
		try {
			if (user?.role === 'organizer') {
				await deleteOrganizationMe()
			} else {
				await deleteMe()
			}
			TokenManager.clearTokens()
			await mutate(null, false)
			toast.success('Аккаунт удален')
			setIsDeleteDialogOpen(false)
			window.location.assign('/login')
		} catch (err) {
			const apiError = normalizeApiError(
				err,
				'Не удалось удалить аккаунт'
			)
			toast.error(apiError.message)
		} finally {
			setIsDeletingAccount(false)
		}
	}

	const normalizedWebsiteLink = useMemo(() => {
		const raw = organizationForm.website_link?.trim()
		if (!raw) return ''
		if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
		return `https://${raw}`
	}, [organizationForm.website_link])

	if (isLoading || (isAuthenticated && !user)) {
		return (
			<main className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
				<Spinner className="size-8" />
			</main>
		)
	}

	if (!user) return null

	if (user.role !== 'organizer' && isEditing) {
		return (
			<main className="mx-auto flex w-full max-w-7xl justify-center px-4 py-8 sm:px-6 lg:px-8">
				<EditProfileFormWidget
					user={user}
					onCancel={() => setIsEditing(false)}
					onSuccess={async () => {
						setIsEditing(false)
						await mutate()
					}}
				/>
			</main>
		)
	}

	if (user.role === 'organizer') {
		return (
			<main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
				<section className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 px-6 py-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-4">
							<div className="relative">
								<button
									type="button"
									onClick={() =>
										fileInputRef.current?.click()
									}
									disabled={isUploadingAvatar}
									className="group relative block rounded-full"
								>
									<Avatar className="h-16 w-16 border-2 border-white/70 shadow-sm">
										<AvatarImage
											src={
												avatarUrl ||
												user.avatar_url ||
												'/user.jpg'
											}
											alt={user.name}
											className="object-cover"
										/>
										<AvatarFallback>
											{getInitials(user.name)}
										</AvatarFallback>
									</Avatar>
									<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
										<Camera className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
									</div>
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleAvatarChange}
								/>
							</div>
							<div>
								<h1 className="text-2xl font-semibold sm:text-3xl">
									{user.name}
								</h1>
								<p className="text-muted-foreground mt-1">
									{user.email}
								</p>
								<Badge className="mt-2" variant="secondary">
									{getRoleLabel(user.role)}
								</Badge>
							</div>
						</div>
						<Button
							variant="ghost"
							onClick={() => {
								TokenManager.clearTokens()
								mutate(null, false)
								window.location.assign('/login')
							}}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Выйти
						</Button>
					</div>
				</section>

				<Card>
					<CardHeader>
						<CardTitle>Профиль организации</CardTitle>
						<CardDescription>
							Редактирование данных, сайта и управление аккаунтом.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="border-border/60 bg-muted/30 rounded-xl border p-4">
							<div className="mb-2 flex items-center gap-2">
								<Globe className="h-4 w-4 text-blue-600" />
								<p className="text-sm font-medium">
									Публичный сайт
								</p>
							</div>
							{normalizedWebsiteLink ? (
								<a
									href={normalizedWebsiteLink}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-blue-600 underline-offset-4 hover:underline"
								>
									{normalizedWebsiteLink}
								</a>
							) : (
								<p className="text-muted-foreground text-sm">
									Добавьте ссылку на сайт организации
								</p>
							)}
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Название</p>
							<Input
								value={organizationForm.name}
								onChange={(e) =>
									setOrganizationForm((prev) => ({
										...prev,
										name: e.target.value
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Описание</p>
							<Textarea
								rows={4}
								value={organizationForm.description}
								onChange={(e) =>
									setOrganizationForm((prev) => ({
										...prev,
										description: e.target.value
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium">Сайт</p>
							<div className="flex gap-2">
								<Input
									value={organizationForm.website_link}
									onChange={(e) =>
										setOrganizationForm((prev) => ({
											...prev,
											website_link: e.target.value
										}))
									}
									placeholder="https://example.com"
								/>
								<Button
									type="button"
									variant="outline"
									disabled={!normalizedWebsiteLink}
									onClick={() =>
										window.open(
											normalizedWebsiteLink,
											'_blank',
											'noopener,noreferrer'
										)
									}
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Открыть
								</Button>
							</div>
						</div>
						<div className="flex flex-wrap gap-2 pt-2">
							<Button
								onClick={handleOrganizationSave}
								disabled={isSavingOrganization}
							>
								{isSavingOrganization
									? 'Сохранение...'
									: 'Сохранить'}
							</Button>
							<Button
								variant="outline"
								onClick={() => router.push('/change-password')}
							>
								Сменить пароль
							</Button>
							<Button
								variant="destructive"
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								Удалить аккаунт
							</Button>
						</div>
					</CardContent>
				</Card>

				<Dialog
					open={isDeleteDialogOpen}
					onOpenChange={setIsDeleteDialogOpen}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Удалить аккаунт?</DialogTitle>
							<DialogDescription>
								Вы уверены, что хотите удалить аккаунт
								организации? Это действие нельзя отменить.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								onClick={() => setIsDeleteDialogOpen(false)}
								disabled={isDeletingAccount}
							>
								Отмена
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteAccount}
								disabled={isDeletingAccount}
							>
								{isDeletingAccount ? 'Удаление...' : 'Удалить'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</main>
		)
	}

	return (
		<main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<section className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 px-6 py-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<div className="relative">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploadingAvatar}
								className="group relative block rounded-full"
							>
								<Avatar className="h-16 w-16 border-2 border-white/70 shadow-sm">
									<AvatarImage
										src={
											avatarUrl ||
											user.avatar_url ||
											'/user.jpg'
										}
										alt={`${user.name} ${user.surname}`}
										className="object-cover"
									/>
									<AvatarFallback>
										{getInitials(user.name, user.surname)}
									</AvatarFallback>
								</Avatar>
								<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
									<Camera className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
								</div>
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarChange}
							/>
						</div>
						<div>
							<h1 className="text-2xl font-semibold sm:text-3xl">
								{user.name} {user.surname}
							</h1>
							<p className="text-muted-foreground mt-1">
								{user.email}
							</p>
							<Badge className="mt-2" variant="secondary">
								{getRoleLabel(user.role)}
							</Badge>
						</div>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setIsEditing(true)}
						>
							<Pencil className="mr-2 h-4 w-4" />
							Редактировать профиль
						</Button>
						<Button
							variant="outline"
							onClick={() => router.push('/change-password')}
						>
							Сменить пароль
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								TokenManager.clearTokens()
								localStorage.removeItem('oauth_is_new_user')
								mutate(null, false)
								window.location.assign('/login')
							}}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Выйти
						</Button>
						<Button
							variant="destructive"
							onClick={() => setIsDeleteDialogOpen(true)}
						>
							Удалить аккаунт
						</Button>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-sm">
							Всего баллов
						</p>
						<p className="mt-1 text-2xl font-semibold">
							{totalEarnedPoints}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-sm">
							Активных квестов
						</p>
						<p className="mt-1 text-2xl font-semibold">
							{activeQuests.length}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-sm">
							Завершенных
						</p>
						<p className="mt-1 text-2xl font-semibold">
							{completedQuests.length}
						</p>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Route className="h-4 w-4" />
							Текущие квесты
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{activeQuests.length === 0 && (
							<p className="text-muted-foreground text-sm">
								Сейчас нет активных квестов.
							</p>
						)}
						{activeQuests.map((quest) => (
							<Link
								key={quest.id}
								href={`/quest/${quest.id}`}
								className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
							>
								<p className="font-medium">{quest.name}</p>
								<p className="text-muted-foreground mt-1 text-sm">
									{quest.description}
								</p>
							</Link>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Award className="h-4 w-4" />
							История завершенных квестов
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{questsError && (
							<p className="text-destructive text-sm">
								{questsError}
							</p>
						)}
						{completedQuests.length === 0 && (
							<p className="text-muted-foreground text-sm">
								Пока нет завершенных квестов.
							</p>
						)}
						{completedQuests.map((quest) => (
							<Link
								key={quest.id}
								href={`/quest/${quest.id}`}
								className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
							>
								<p className="font-medium">{quest.name}</p>
								<p className="text-muted-foreground mt-1 text-sm">
									{quest.description}
								</p>
							</Link>
						))}
					</CardContent>
				</Card>
			</section>

			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Удалить аккаунт?</DialogTitle>
						<DialogDescription>
							Вы уверены, что хотите удалить аккаунт? Это действие
							нельзя отменить.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isDeletingAccount}
						>
							Отмена
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={isDeletingAccount}
						>
							{isDeletingAccount ? 'Удаление...' : 'Удалить'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
