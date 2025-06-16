export type Logger = ReturnType<typeof createLogger>

const createLogger = (): { log: (message: string) => void } => {
	return {
		log: (message: string) => {
			console.log(message)
		},
	}
}

/**
 * @description This is a comment
 */
export const logger: Logger = createLogger()

export type AnotherType = Omit<Logger, 'log' | 'outDir'>
