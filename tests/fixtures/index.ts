export type Logger = ReturnType<typeof createLogger>

const createLogger = (): { log: (message: string) => void } => {
	return {
		log: (message: string) => {
			console.log(message)
		},
	}
}

export const logger: Logger = createLogger()
