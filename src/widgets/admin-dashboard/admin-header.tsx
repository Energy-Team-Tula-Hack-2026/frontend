import { Shield } from 'lucide-react'

type AdminHeaderProps = {
	isOrganizerSession: boolean
}

export function AdminHeader({ isOrganizerSession }: AdminHeaderProps) {
	return (
		<div className="mb-8 flex items-center justify-between">
			<div>
				<div className="mb-2 flex items-center space-x-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
						<Shield className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-foreground text-3xl font-bold">
							{isOrganizerSession
								? 'Дашборд организатора'
								: 'Панель администратора'}
						</h1>
						<p className="text-muted-foreground">
							{isOrganizerSession
								? 'Управление квестами и точками'
								: 'Управление квестами и точками'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
