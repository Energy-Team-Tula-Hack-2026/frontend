import { type PropsWithChildren } from 'react'

import { ThemeProvider } from './theme-provider'
import { TanstackQueryProvider } from './tanstack-query-provider'

export function MainProvider({ children }: PropsWithChildren<unknown>) {
	return (
		<TanstackQueryProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				enableSystem
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</TanstackQueryProvider>
	)
}
