import pc from 'picocolors'

class Logger {
	private static instance: Logger
	private constructor() {}

	public static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger()
		}
		return Logger.instance
	}

	public info(message: string): void {
		console.log()
		console.info(pc.blue(message))
		console.log()
	}

	public warn(message: string): void {
		console.warn(pc.yellow(`WARNING: ${message}`))
	}

	public debug(message: string): void {
		console.debug(pc.dim(`DEBUG: ${message}`))
	}

	public error(message: string): void {
		console.error(pc.red(`ERROR: ${message}`))
	}
}

export const logger: Logger = Logger.getInstance()

export function handleBunBuildLogs(
	logs: Array<BuildMessage | ResolveMessage>,
	entry: string,
): void {
	for (const log of logs) {
		if (log.level === 'error') {
			if (log.message.includes('Multiple exports with the same name')) {
				logger.info(
					`Found multiple exports with the same name in ${pc.underline(entry)}.

You cannot have a type export and a value export with the same name in the same file.

For example, this is not allowed:
export const User = { name: 'John' }
export type User = typeof User

Solutions:
- Rename the type export to a different name
- Move the type export to a different file (e.g., types.ts)`,
				)

				throw new Error(
					`Failed to generate declaration file for ${entry}. See above for more details.`,
				)
			}

			throw new Error(
				`Failed to generate declaration file for ${entry}. See above for more details.`,
			)
		}

		if (log.level === 'warning') {
			logger.warn(log.message)
		}

		if (log.level === 'info') {
			logger.info(log.message)
		}
	}
}
