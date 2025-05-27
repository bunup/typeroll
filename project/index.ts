import type { createClient } from './utils'

export type User = {
	name: string
	age: number
}

export type Client = ReturnType<typeof createClient>
