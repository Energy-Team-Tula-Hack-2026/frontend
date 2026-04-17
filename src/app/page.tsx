import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { ThemeToggle } from '@/shared/components/theme-toggle'

export default function HomePage() {
	return (
		<main className="bg-background text-foreground min-h-screen">
			<section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16">
				<div className="max-w-2xl space-y-4">
					<div className="text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-sm">
						Добро пожаловать
					</div>

					<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
						Главная страница проекта
					</h1>

					<p className="text-muted-foreground text-base sm:text-lg">
						Здесь можно разместить краткое описание платформы,
						полезные действия и быстрый переход к профилю
						пользователя.
					</p>

					<div className="flex flex-wrap gap-3 pt-2">
						<Button asChild size="lg">
							<Link href="/profile">Открыть профиль</Link>
						</Button>

						<Button asChild variant="outline" size="lg">
							<Link href="/login">Войти</Link>
						</Button>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle>Профиль</CardTitle>
							<CardDescription>
								Быстрый доступ к данным пользователя и
								настройкам аккаунта.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								asChild
								variant="secondary"
								className="w-full"
							>
								<Link href="/profile">Перейти</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle>Тема</CardTitle>
							<CardDescription>
								Поддерживается светлая и тёмная тема интерфейса.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex justify-start">
								<ThemeToggle />
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle>Заготовка</CardTitle>
							<CardDescription>
								Этот блок можно позже заменить на статистику,
								новости или виджеты.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground text-sm">
								Шаблон уже готов для дальнейшего наполнения.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	)
}
