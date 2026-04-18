'use client'

import { useState } from 'react'
import { LogOut, Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'

import { TokenManager } from '@/shared/api/auth'
import type { User } from '@/shared/types'
import { EditProfileFormWidget } from '@/widgets/edit-profile-form'

interface ProfileCardWidgetProps {
	user: User
	onUserUpdate?: () => void
}

export function ProfileCardWidget({
	user,
	onUserUpdate
}: ProfileCardWidgetProps) {
	console.log(
		'[v0] ProfileCardWidget - Rendering with user:',
		JSON.stringify(user)
	)

	const [isEditing, setIsEditing] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	const handleLogout = () => {
		console.log('[v0] ProfileCardWidget - handleLogout called')
		setIsLoggingOut(true)

		console.log('[v0] ProfileCardWidget - Clearing tokens')
		TokenManager.clearTokens()

		localStorage.removeItem('oauth_is_new_user')

		console.log('[v0] ProfileCardWidget - Redirecting to /login')
		window.location.assign('/login')
	}

	const getInitials = (name: string, surname: string) => {
		const initials = `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
		console.log('[v0] ProfileCardWidget - getInitials:', initials)
		return initials
	}

	const getProviderName = (type: string) => {
		switch (type) {
			case 'google':
				return 'Google'
			case 'yandex':
				return 'Яндекс'
			case 'github':
				return 'GitHub'
			default:
				return type
		}
	}

	if (isEditing) {
		console.log('[v0] ProfileCardWidget - Showing edit form')
		return (
			<EditProfileFormWidget
				user={user}
				onCancel={() => {
					console.log('[v0] ProfileCardWidget - Edit cancelled')
					setIsEditing(false)
				}}
				onSuccess={() => {
					console.log('[v0] ProfileCardWidget - Edit success')
					setIsEditing(false)
					onUserUpdate?.()
				}}
			/>
		)
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-4">
						<Avatar className="size-16">
							<AvatarFallback className="text-lg">
								{getInitials(user.name, user.surname)}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="text-xl">
								{user.name} {user.surname}
							</CardTitle>
							<CardDescription>{user.email}</CardDescription>
							<Badge variant="secondary" className="mt-1">
								{user.role === 'admin'
									? 'Администратор'
									: 'Пользователь'}
							</Badge>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<div className="flex flex-col gap-4">
					{/* Connected Accounts */}
					{/* {user.accounts && user.accounts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Связанные аккаунты</h4>
                <div className="flex flex-wrap gap-2">
                  {user.accounts.map((account) => (
                    <Badge key={account.user_id} variant="outline">
                      {getProviderName(account.account_type)}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )} */}

					<Separator />

					{/* Actions */}
					<div className="flex flex-col gap-2">
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={() => {
								console.log(
									'[v0] ProfileCardWidget - Edit clicked'
								)
								setIsEditing(true)
							}}
						>
							<Pencil className="size-4" />
							Редактировать профиль
						</Button>
						<Button
							variant="ghost"
							className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start"
							onClick={handleLogout}
							disabled={isLoggingOut}
						>
							<LogOut className="size-4" />
							Выйти
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default ProfileCardWidget
