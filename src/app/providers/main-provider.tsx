import { type PropsWithChildren } from 'react'

import { ThemeProvider } from './theme-provider'
import { TanstackQueryProvider } from './tanstack-query-provider'
import { ToastProvider } from './toast-provider'

export const MainProvider = ({ children }: PropsWithChildren<unknown>) => (
	<TanstackQueryProvider>
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem
			disableTransitionOnChange
		>
			<ToastProvider />
			{children}
		</ThemeProvider>
	</TanstackQueryProvider>
)
