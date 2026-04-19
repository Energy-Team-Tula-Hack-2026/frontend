'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	ImagePlus,
	Loader2,
	Pencil,
	Plus,
	Store,
	Trash2,
	Upload,
	X
} from 'lucide-react'
import { toast } from 'sonner'

import { normalizeApiError } from '@/shared/api/errors'
import { uploadPhoto } from '@/shared/api/media'
import {
	createShopItem,
	deleteShopItem,
	getShopItems,
	type ShopItemDto,
	updateShopItem
} from '@/shared/api/shop'
import { useUser } from '@/shared/hooks/use-user'
import { PLATFORM_ROLE } from '@/shared/lib/roles'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
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
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Textarea } from '@/shared/components/ui/textarea'

const PLACEHOLDER_IMAGE = '/placeholder-logo.png'

type ItemFormState = {
	title: string
	description: string
	quantity: number
	price: number
	link: string
}

type ItemFormErrors = Partial<Record<keyof ItemFormState, string>>

const EMPTY_FORM: ItemFormState = {
	title: '',
	description: '',
	quantity: 1,
	price: 0,
	link: ''
}

const SELLER_ROLES: Set<string> = new Set([
	PLATFORM_ROLE.SELLER_IP,
	PLATFORM_ROLE.SELLER_ORG,
	PLATFORM_ROLE.PLATFORM_ADMIN,
	PLATFORM_ROLE.LEGACY_ADMIN
])

function formatPrice(price: number): string {
	return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
}

function getItemImages(item?: ShopItemDto | null): string[] {
	if (!item) return [PLACEHOLDER_IMAGE]

	const imageUrls = [
		...(item.images?.map((image) => image.image_url).filter(Boolean) ?? []),
		...(item.image_url ? [item.image_url] : [])
	]

	const unique = Array.from(new Set(imageUrls))
	return unique.length > 0 ? unique : [PLACEHOLDER_IMAGE]
}

function validateCreateForm(form: ItemFormState): ItemFormErrors {
	const errors: ItemFormErrors = {}

	if (!form.title.trim()) {
		errors.title = 'Введите название товара'
	}

	if (!form.description.trim()) {
		errors.description = 'Введите описание товара'
	}

	if (!Number.isFinite(form.quantity) || form.quantity < 1) {
		errors.quantity = 'Укажите количество больше 0'
	}

	if (!Number.isFinite(form.price) || form.price <= 0) {
		errors.price = 'Укажите цену больше 0'
	}

	if (!form.link.trim()) {
		errors.link = 'Укажите ссылку на товар'
	}

	return errors
}

async function uploadManyPhotos(files: File[]): Promise<string[]> {
	if (!files.length) return []
	const uploaded = await Promise.all(files.map((file) => uploadPhoto(file)))
	return uploaded.map((item) => item.url).filter(Boolean)
}

type FilePickerProps = {
	files: File[]
	onAppend: (files: File[]) => void
	onRemove: (index: number) => void
	label: string
	helper: string
}

function FilePicker({
	files,
	onAppend,
	onRemove,
	label,
	helper
}: FilePickerProps) {
	return (
		<div className="space-y-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/40">
			<div className="flex items-center justify-between gap-2">
				<Label className="text-sm font-semibold">{label}</Label>
				<span className="text-muted-foreground text-xs">{helper}</span>
			</div>

			<label className="group border-muted-foreground/20 hover:border-primary/50 bg-background/80 hover:bg-muted/35 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-9 transition-colors">
				<Upload className="text-muted-foreground group-hover:text-primary mb-2 h-5 w-5" />
				<p className="text-sm font-medium">
					Выбрать изображения с компьютера
				</p>
				<p className="text-muted-foreground mt-1 text-xs">
					Можно выбрать несколько файлов сразу
				</p>
				<input
					type="file"
					accept="image/*"
					multiple
					className="hidden"
					onChange={(event) => {
						const nextFiles = Array.from(event.target.files || [])
						onAppend(nextFiles)
						event.currentTarget.value = ''
					}}
				/>
			</label>

			{files.length > 0 && (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
					{files.map((file, index) => (
						<div
							key={`${file.name}-${index}`}
							className="group relative overflow-hidden rounded-lg border bg-white dark:bg-zinc-900"
						>
							<img
								src={URL.createObjectURL(file)}
								alt={file.name}
								className="h-24 w-full object-cover"
							/>
							<button
								type="button"
								onClick={() => onRemove(index)}
								className="absolute top-1 right-1 rounded-full bg-red-500/90 p-1 text-white opacity-80 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default function SellerPage() {
	const { user, isLoading: isUserLoading } = useUser()
	const canManage = SELLER_ROLES.has(user?.role ?? '')

	const [items, setItems] = useState<ShopItemDto[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const [createForm, setCreateForm] = useState<ItemFormState>(EMPTY_FORM)
	const [createFormErrors, setCreateFormErrors] = useState<ItemFormErrors>({})
	const [createImageFiles, setCreateImageFiles] = useState<File[]>([])
	const [editingItem, setEditingItem] = useState<ShopItemDto | null>(null)
	const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_FORM)
	const [editImageFiles, setEditImageFiles] = useState<File[]>([])
	const [editExistingImageUrls, setEditExistingImageUrls] = useState<
		string[]
	>([])

	const myItems = useMemo(() => {
		if (!user?.id) return []
		return items.filter((item) => item.seller_id === user.id)
	}, [items, user?.id])

	const resetEditState = () => {
		setEditingItem(null)
		setEditForm(EMPTY_FORM)
		setEditImageFiles([])
		setEditExistingImageUrls([])
	}

	const loadItems = async () => {
		setIsLoading(true)
		try {
			setItems(await getShopItems())
		} catch (error) {
			const apiError = normalizeApiError(
				error,
				'Не удалось загрузить товары'
			)
			toast.error(apiError.message)
		} finally {
			setIsLoading(false)
		}
	}

	const updateCreateForm = <TField extends keyof ItemFormState>(
		field: TField,
		value: ItemFormState[TField]
	) => {
		setCreateForm((prev) => ({
			...prev,
			[field]: value
		}))
		setCreateFormErrors((prev) => {
			if (!prev[field]) return prev

			const { [field]: _removedError, ...nextErrors } = prev
			return nextErrors
		})
	}

	useEffect(() => {
		void loadItems()
	}, [])

	if (isUserLoading) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<Skeleton className="h-16 w-full" />
			</div>
		)
	}

	if (!canManage) {
		return (
			<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
				<Card>
					<CardContent className="p-6">
						<p className="text-muted-foreground text-sm">
							Доступ к странице продавца есть только у ролей
							продавца.
						</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			<section className="rounded-3xl border border-amber-200/70 bg-linear-to-br from-amber-50 via-orange-50 to-emerald-50 p-8 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<Badge className="mb-3 w-fit bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
					<Store className="mr-1 h-3.5 w-3.5" />
					Кабинет продавца
				</Badge>
				<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
					Управление товарами
				</h1>
				<p className="text-muted-foreground mt-2 max-w-2xl text-base">
					Удобно создавайте товары, загружайте изображения с
					компьютера и контролируйте остатки.
				</p>
			</section>

			<Card className="overflow-hidden border-amber-100/80 shadow-sm dark:border-zinc-700/60">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Новый товар
					</CardTitle>
					<CardDescription>
						Можно загрузить любое количество изображений. Для
						карточки товара используется первое изображение.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 p-6 sm:p-8">
					<div className="space-y-1">
						<p className="text-sm font-semibold">
							Основная информация
						</p>
						<p className="text-muted-foreground text-xs">
							Заполните базовые поля карточки товара.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label htmlFor="create-title">Название</Label>
							<Input
								id="create-title"
								className="mt-1 h-11"
								aria-invalid={Boolean(createFormErrors.title)}
								value={createForm.title}
								onChange={(event) =>
									updateCreateForm(
										'title',
										event.target.value
									)
								}
							/>
							{createFormErrors.title && (
								<p className="text-destructive mt-1 text-xs">
									{createFormErrors.title}
								</p>
							)}
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="create-description">Описание</Label>
							<Textarea
								id="create-description"
								className="mt-1 min-h-24"
								rows={3}
								aria-invalid={Boolean(
									createFormErrors.description
								)}
								value={createForm.description}
								onChange={(event) =>
									updateCreateForm(
										'description',
										event.target.value
									)
								}
							/>
							{createFormErrors.description && (
								<p className="text-destructive mt-1 text-xs">
									{createFormErrors.description}
								</p>
							)}
						</div>
						<div>
							<Label htmlFor="create-quantity">Количество</Label>
							<Input
								id="create-quantity"
								className="mt-1 h-11"
								type="number"
								min={1}
								aria-invalid={Boolean(
									createFormErrors.quantity
								)}
								value={createForm.quantity}
								onChange={(event) =>
									updateCreateForm(
										'quantity',
										Number(event.target.value)
									)
								}
							/>
							{createFormErrors.quantity && (
								<p className="text-destructive mt-1 text-xs">
									{createFormErrors.quantity}
								</p>
							)}
						</div>
						<div>
							<Label htmlFor="create-price">Цена</Label>
							<Input
								id="create-price"
								className="mt-1 h-11"
								type="number"
								min={0}
								aria-invalid={Boolean(createFormErrors.price)}
								value={createForm.price}
								onChange={(event) =>
									updateCreateForm(
										'price',
										Number(event.target.value)
									)
								}
							/>
							{createFormErrors.price && (
								<p className="text-destructive mt-1 text-xs">
									{createFormErrors.price}
								</p>
							)}
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="create-link">Ссылка на товар</Label>
							<Input
								id="create-link"
								className="mt-1 h-11"
								aria-invalid={Boolean(createFormErrors.link)}
								value={createForm.link}
								onChange={(event) =>
									updateCreateForm('link', event.target.value)
								}
							/>
							{createFormErrors.link && (
								<p className="text-destructive mt-1 text-xs">
									{createFormErrors.link}
								</p>
							)}
						</div>
					</div>

					<FilePicker
						files={createImageFiles}
						onAppend={(files) =>
							setCreateImageFiles((prev) => [...prev, ...files])
						}
						onRemove={(index) =>
							setCreateImageFiles((prev) =>
								prev.filter((_, idx) => idx !== index)
							)
						}
						label="Изображения товара"
						helper={`${createImageFiles.length} выбрано`}
					/>

					<div className="flex items-center justify-end border-t pt-4">
						<Button
							size="lg"
							disabled={isCreating}
							onClick={async () => {
								const errors = validateCreateForm(createForm)
								setCreateFormErrors(errors)

								if (Object.keys(errors).length > 0) {
									toast.error(
										'Заполните обязательные поля товара'
									)
									return
								}

								setIsCreating(true)
								try {
									const uploadedUrls =
										await uploadManyPhotos(createImageFiles)
									await createShopItem({
										title: createForm.title.trim(),
										description:
											createForm.description.trim(),
										quantity: Number(createForm.quantity),
										price: Number(createForm.price),
										link:
											createForm.link.trim() || undefined,
										image_url: uploadedUrls[0] || undefined,
										image_urls:
											uploadedUrls.length > 0
												? uploadedUrls
												: undefined
									})

									toast.success('Товар создан')
									setCreateForm(EMPTY_FORM)
									setCreateFormErrors({})
									setCreateImageFiles([])
									await loadItems()
								} catch (error) {
									const apiError = normalizeApiError(
										error,
										'Не удалось создать товар'
									)
									toast.error(apiError.message)
								} finally {
									setIsCreating(false)
								}
							}}
						>
							{isCreating ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ImagePlus className="mr-2 h-4 w-4" />
							)}
							Создать товар
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Мои товары ({myItems.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							{Array.from({ length: 4 }).map((_, index) => (
								<Skeleton
									key={`seller-item-${index}`}
									className="h-28 w-full"
								/>
							))}
						</div>
					)}
					{!isLoading && myItems.length === 0 && (
						<p className="text-muted-foreground text-sm">
							У вас пока нет созданных товаров.
						</p>
					)}
					{!isLoading && myItems.length > 0 && (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							{myItems.map((item) => (
								<div
									key={item.id}
									className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row"
								>
									<img
										src={getItemImages(item)[0]}
										alt={item.title}
										className="h-20 w-full rounded-lg object-cover sm:w-28"
										onError={(event) => {
											event.currentTarget.src =
												PLACEHOLDER_IMAGE
										}}
									/>
									<div className="flex flex-1 flex-col">
										<p className="line-clamp-1 font-semibold">
											{item.title}
										</p>
										<p className="text-muted-foreground line-clamp-2 text-sm">
											{item.description}
										</p>
										<p className="mt-1 text-sm">
											{formatPrice(item.price)} • Остаток:{' '}
											{item.quantity}
										</p>
										<div className="mt-2 flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setEditingItem(item)
													setEditForm({
														title: item.title,
														description:
															item.description,
														quantity: item.quantity,
														price: item.price,
														link: item.link || ''
													})
													setEditImageFiles([])
													setEditExistingImageUrls(
														getItemImages(
															item
														).filter(
															(url) =>
																url !==
																PLACEHOLDER_IMAGE
														)
													)
												}}
											>
												<Pencil className="mr-2 h-3.5 w-3.5" />
												Изменить
											</Button>
											<Button
												variant="destructive"
												size="sm"
												disabled={
													deletingId === item.id
												}
												onClick={async () => {
													setDeletingId(item.id)
													try {
														await deleteShopItem(
															item.id
														)
														toast.success(
															'Товар удален'
														)
														await loadItems()
													} catch (error) {
														const apiError =
															normalizeApiError(
																error,
																'Не удалось удалить товар'
															)
														toast.error(
															apiError.message
														)
													} finally {
														setDeletingId(null)
													}
												}}
											>
												{deletingId === item.id ? (
													<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
												) : (
													<Trash2 className="mr-2 h-3.5 w-3.5" />
												)}
												Удалить
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={Boolean(editingItem)}
				onOpenChange={(open) => !open && resetEditState()}
			>
				<DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Редактирование товара</DialogTitle>
						<DialogDescription>
							Можно загрузить новые изображения с компьютера.
							Будет использовано первое загруженное изображение.
						</DialogDescription>
					</DialogHeader>
					<div className="flex-1 space-y-6 overflow-y-auto pr-1">
						<div className="rounded-xl border border-amber-100/80 bg-amber-50/40 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/40">
							<p className="text-sm font-semibold">
								Основная информация
							</p>
							<p className="text-muted-foreground mt-1 text-xs">
								Обновите поля и затем сохраните изменения.
							</p>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<Label htmlFor="edit-title">Название</Label>
								<Input
									id="edit-title"
									className="mt-1 h-11"
									value={editForm.title}
									onChange={(event) =>
										setEditForm((prev) => ({
											...prev,
											title: event.target.value
										}))
									}
								/>
							</div>
							<div className="sm:col-span-2">
								<Label htmlFor="edit-description">
									Описание
								</Label>
								<Textarea
									id="edit-description"
									className="mt-1 min-h-24"
									rows={3}
									value={editForm.description}
									onChange={(event) =>
										setEditForm((prev) => ({
											...prev,
											description: event.target.value
										}))
									}
								/>
							</div>
							<div>
								<Label htmlFor="edit-quantity">
									Количество
								</Label>
								<Input
									id="edit-quantity"
									className="mt-1 h-11"
									type="number"
									min={1}
									value={editForm.quantity}
									onChange={(event) =>
										setEditForm((prev) => ({
											...prev,
											quantity: Number(event.target.value)
										}))
									}
								/>
							</div>
							<div>
								<Label htmlFor="edit-price">Цена</Label>
								<Input
									id="edit-price"
									className="mt-1 h-11"
									type="number"
									min={0}
									value={editForm.price}
									onChange={(event) =>
										setEditForm((prev) => ({
											...prev,
											price: Number(event.target.value)
										}))
									}
								/>
							</div>
							<div className="sm:col-span-2">
								<Label htmlFor="edit-link">
									Ссылка на товар
								</Label>
								<Input
									id="edit-link"
									className="mt-1 h-11"
									value={editForm.link}
									onChange={(event) =>
										setEditForm((prev) => ({
											...prev,
											link: event.target.value
										}))
									}
								/>
							</div>
						</div>

						<div className="rounded-xl border border-amber-100/80 bg-amber-50/40 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/40">
							<Label className="text-sm">
								Текущие изображения
							</Label>
							{editExistingImageUrls.length === 0 ? (
								<p className="text-muted-foreground mt-2 text-xs">
									Прикрепленных фото нет
								</p>
							) : (
								<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
									{editExistingImageUrls.map(
										(imageUrl, index) => (
											<div
												key={`existing-${index}-${imageUrl}`}
												className="group relative overflow-hidden rounded-lg border bg-white dark:bg-zinc-900"
											>
												<img
													src={imageUrl}
													alt={`existing-${index + 1}`}
													className="h-24 w-full object-cover"
													onError={(event) => {
														event.currentTarget.src =
															PLACEHOLDER_IMAGE
													}}
												/>
												<button
													type="button"
													onClick={() =>
														setEditExistingImageUrls(
															(prev) =>
																prev.filter(
																	(_, idx) =>
																		idx !==
																		index
																)
														)
													}
													className="absolute top-1 right-1 rounded-full bg-red-500/90 p-1 text-white opacity-80 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
										)
									)}
								</div>
							)}
						</div>

						<FilePicker
							files={editImageFiles}
							onAppend={(files) =>
								setEditImageFiles((prev) => [...prev, ...files])
							}
							onRemove={(index) =>
								setEditImageFiles((prev) =>
									prev.filter((_, idx) => idx !== index)
								)
							}
							label="Новые изображения"
							helper={`${editImageFiles.length} выбрано`}
						/>
					</div>
					<DialogFooter className="border-t pt-4">
						<Button variant="outline" onClick={resetEditState}>
							Отмена
						</Button>
						<Button
							size="lg"
							disabled={isSaving}
							onClick={async () => {
								if (!editingItem) return
								setIsSaving(true)
								try {
									const uploadedUrls =
										await uploadManyPhotos(editImageFiles)

									await updateShopItem(editingItem.id, {
										title: editForm.title.trim(),
										description:
											editForm.description.trim(),
										quantity: Number(editForm.quantity),
										price: Number(editForm.price),
										link: editForm.link.trim() || undefined,
										image_urls: [
											...editExistingImageUrls,
											...uploadedUrls
										]
									})

									toast.success('Товар обновлен')
									resetEditState()
									await loadItems()
								} catch (error) {
									const apiError = normalizeApiError(
										error,
										'Не удалось обновить товар'
									)
									toast.error(apiError.message)
								} finally {
									setIsSaving(false)
								}
							}}
						>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Сохранить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
