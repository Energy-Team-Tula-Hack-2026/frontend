import { type PropsWithChildren } from 'react'

import { ThemeProvider } from './theme-provider'
import { TanstackQueryProvider } from './tanstack-query-provider'

export const MainProvider = ({ children }: PropsWithChildren<unknown>) => (
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
