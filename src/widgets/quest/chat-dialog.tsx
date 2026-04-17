'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Bot, Send } from 'lucide-react'
import type { ChatMessage } from '@/shared/types'
import { getChatByPointId } from '@/shared/api/chat'

type WsStatus = 'connecting' | 'open' | 'closed' | 'error'

interface ChatDialogProps {
	pointId: string
	pointName: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

// Renders bot message text character-by-character, then shows full markdown
function BotMessage({ text, animate }: { text: string; animate: boolean }) {
	const [displayed, setDisplayed] = useState(animate ? '' : text)
	const [done, setDone] = useState(!animate)

	useEffect(() => {
		if (!animate) {
			setDisplayed(text)
			setDone(true)
			return
		}

		setDisplayed('')
		setDone(false)
		let i = 0
		const interval = setInterval(() => {
			i++
			setDisplayed(text.slice(0, i))
			if (i >= text.length) {
				clearInterval(interval)
				setDone(true)
			}
		}, 15)

		return () => clearInterval(interval)
	}, [text, animate])

	return (
		<div className="prose prose-sm dark:prose-invert max-w-none break-words">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>
				{displayed + (done ? '' : '▋')}
			</ReactMarkdown>
		</div>
	)
}

export function ChatDialog({
	pointId,
	pointName,
	open,
	onOpenChange
}: ChatDialogProps) {
	const [messages, setMessages] = useState<
		(ChatMessage & { animate?: boolean })[]
	>([])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isWaitingBot, setIsWaitingBot] = useState(false)
	const [wsStatus, setWsStatus] = useState<WsStatus>('closed')
	const [error, setError] = useState<string | null>(null)

	const wsRef = useRef<WebSocket | null>(null)
	const messagesEndRef = useRef<HTMLDivElement | null>(null)
	const openRef = useRef(false)
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	)

	const closeWebSocket = () => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
			reconnectTimeoutRef.current = null
		}
		if (wsRef.current) {
			wsRef.current.onclose = null
			wsRef.current.close(1000)
			wsRef.current = null
		}
		setWsStatus('closed')
	}

	const openWebSocket = (pid: string) => {
		closeWebSocket()

		const token = localStorage.getItem('access_token')
		const baseUrl = (
			process.env.NEXT_PUBLIC_API_URL || 'https://api.ryazan-trevel.ru'
		)
			.replace(/^https/, 'wss')
			.replace(/^http/, 'ws')

		const ws = new WebSocket(
			`${baseUrl}/api/v2/chat/ws/${pid}?token=${token}`
		)
		wsRef.current = ws
		setWsStatus('connecting')

		ws.onopen = () => {
			setWsStatus('open')
			setIsLoading(false)
		}

		ws.onmessage = (event) => {
			const text = typeof event.data === 'string' ? event.data.trim() : ''
			setIsWaitingBot(false)
			if (!text) return
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					chat_id: '',
					user_id: '',
					message: text,
					is_deletable: false,
					type: 'BOT',
					animate: true
				}
			])
		}

		ws.onerror = () => {
			setWsStatus('error')
			setError('Ошибка соединения с сервером')
		}

		ws.onclose = (event) => {
			if (event.code === 1000 || !openRef.current) return
			setWsStatus('closed')
			reconnectTimeoutRef.current = setTimeout(() => {
				if (openRef.current) openWebSocket(pid)
			}, 3000)
		}
	}

	useEffect(() => {
		openRef.current = open

		if (!open) {
			closeWebSocket()
			return
		}

		setIsLoading(true)
		setMessages([])
		setError(null)
		setInputValue('')
		setIsWaitingBot(false)

		getChatByPointId(pointId)
			.then((data) => {
				const sorted = [...data.messages].sort((a, b) => {
					if (!a.created_at || !b.created_at) return 0
					return (
						new Date(a.created_at).getTime() -
						new Date(b.created_at).getTime()
					)
				})
				setMessages(sorted.map((m) => ({ ...m, animate: false })))
				openWebSocket(pointId)
			})
			.catch((err) => {
				setError(err?.message || 'Не удалось загрузить чат')
				setIsLoading(false)
			})

		return () => {
			closeWebSocket()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, pointId])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	const sendMessage = () => {
		const text = inputValue.trim()
		if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return

		wsRef.current.send(text)
		setInputValue('')
		setIsWaitingBot(true)
		setMessages((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				chat_id: '',
				user_id: '',
				message: text,
				is_deletable: false,
				type: 'USER',
				animate: false
			}
		])
	}

	const statusLabel: Record<WsStatus, string> = {
		connecting: 'Подключение...',
		open: 'Подключено',
		closed: 'Отключено',
		error: 'Ошибка соединения'
	}

	const statusColor: Record<WsStatus, string> = {
		connecting: 'bg-yellow-400',
		open: 'bg-green-500',
		closed: 'bg-gray-400',
		error: 'bg-red-500'
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 p-0 sm:max-w-lg">
				<div className="flex h-[80vh] flex-col">
					<DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
						<DialogTitle>Чат с AI-гидом — {pointName}</DialogTitle>
						<DialogDescription className="flex items-center gap-2">
							<span
								className={`inline-block size-2 rounded-full ${statusColor[wsStatus]}`}
							/>
							{statusLabel[wsStatus]}
						</DialogDescription>
					</DialogHeader>

					<ScrollArea className="flex-1 overflow-hidden px-4 py-3">
						{isLoading && (
							<div className="flex justify-center py-8">
								<Spinner className="size-6 opacity-40" />
							</div>
						)}

						{error && !isLoading && (
							<div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
								{error}
							</div>
						)}

						{!isLoading && !error && messages.length === 0 && (
							<p className="text-muted-foreground py-8 text-center text-sm">
								Задайте вопрос об этом месте
							</p>
						)}

						<div className="space-y-3">
							{messages.map((msg) => (
								<div
									key={msg.id}
									className={`flex gap-2 ${msg.type === 'USER' ? 'justify-end' : 'justify-start'}`}
								>
									{msg.type === 'BOT' && (
										<div className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full">
											<Bot className="size-4" />
										</div>
									)}
									<div
										className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
											msg.type === 'USER'
												? 'rounded-br-sm bg-blue-600 text-white'
												: 'bg-secondary rounded-bl-sm'
										}`}
									>
										{msg.type === 'BOT' ? (
											<BotMessage
												text={msg.message}
												animate={msg.animate ?? false}
											/>
										) : (
											msg.message
										)}
									</div>
								</div>
							))}
						</div>

						{isWaitingBot && (
							<div className="mt-3 flex items-center gap-2">
								<div className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full">
									<Bot className="size-4" />
								</div>
								<div className="bg-secondary flex gap-1 rounded-2xl rounded-bl-sm px-4 py-3">
									<span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
									<span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
									<span className="size-1.5 animate-bounce rounded-full bg-current" />
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</ScrollArea>

					<div className="flex shrink-0 gap-2 border-t px-4 py-3">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									sendMessage()
								}
							}}
							placeholder="Введите сообщение..."
							disabled={wsStatus !== 'open'}
						/>
						<Button
							size="icon"
							onClick={sendMessage}
							disabled={!inputValue.trim() || wsStatus !== 'open'}
						>
							<Send className="size-4" />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
