import { beforeEach, describe, expect, test } from 'bun:test'
import { cleanProjectDir, createProject, runGenerateDts } from './utils'

describe('Bundle functionality', () => {
	beforeEach(() => {
		cleanProjectDir()
	})

	describe('Imports and re-exports', () => {
		test('should handle basic imports', async () => {
			createProject({
				'src/types.ts': `
					export interface User {
						id: number
						name: string
					}
					
					export type UserRole = 'admin' | 'user' | 'guest'
				`,
				'src/index.ts': `
					import { User, UserRole } from './types'
					
					export function getUser(id: number): User | null {
						return null
					}
					
					export function hasRole(user: User, role: UserRole): boolean {
						return true
					}
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "interface User {
			  	id: number;
			  	name: string;
			  }
			  type UserRole = "admin" | "user" | "guest";
			  declare function getUser(id: number): User | null;
			  declare function hasRole(user: User, role: UserRole): boolean;
			  export { hasRole, getUser };
			  "
			`)
		})

		test('should handle re-exports', async () => {
			createProject({
				'src/types.ts': `
					export interface User {
						id: number
						name: string
					}
					
					export type UserRole = 'admin' | 'user'
					
					export class UserValidator {
						validate(user: User): boolean {
							return true
						}
					}
				`,
				'src/index.ts': `
					export { User, type UserRole, UserValidator } from './types'
					
					export function createUser(name: string): User {
						return { id: Date.now(), name }
					}
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "interface User2 {
			  	id: number;
			  	name: string;
			  }
			  type UserRole = "admin" | "user";
			  declare class UserValidator {
			  	validate(user: User2): boolean;
			  }
			  declare function createUser(name: string): User;
			  export { createUser, UserValidator, UserRole, User2 as User };
			  "
			`)
		})

		test('should handle export all from another file', async () => {
			createProject({
				'src/utils.ts': `
					export function test(): string {
						return 'test'
					}
					
					export const test2 = 'test2'
				`,
				'src/index.ts': `
					export * from './utils'
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare function test(): string;
			  declare const test2 = "test2";
			  export { test2, test };
			  "
			`)
		})

		test('should handle export all', async () => {
			createProject({
				'src/types.ts': `
					export interface User {
						id: number
						name: string
					}
					
					export type UserRole = 'admin' | 'user'
					
					export enum UserStatus {
						Active,
						Inactive
					}
				`,
				'src/index.ts': `
					export * from './types'
					
					export function createUser(name: string): User {
						return { id: Date.now(), name }
					}
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "interface User2 {
			  	id: number;
			  	name: string;
			  }
			  type UserRole = "admin" | "user";
			  declare enum UserStatus {
			  	Active = 0,
			  	Inactive = 1
			  }
			  declare function createUser(name: string): User;
			  export { createUser, UserStatus, UserRole, User2 as User };
			  "
			`)
		})

		test('should handle import all and export all', async () => {
			createProject({
				'src/utils.ts': `
					export function test(): string {
						return 'test'
					}
					
					export const test2 = 'test2'
				`,
				'src/index.ts': `
					import * as utils from './utils'
					export { utils }
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare namespace exports_utils {
			  	export { test2, test };
			  }
			  declare function test(): string;
			  declare const test2 = "test2";
			  export { exports_utils as utils };
			  "
			`)
		})

		test('should handle function import with ReturnType utility type', async () => {
			createProject({
				'src/api.ts': `
					export function fetchUser(): { id: number; name: string; email: string } {
						return { id: 1, name: 'John', email: 'john@example.com' }
					}
					
					export async function fetchData(): Promise<{ data: string; timestamp: number }> {
						return { data: 'test', timestamp: Date.now() }
					}
				`,
				'src/index.ts': `
					import { fetchUser, fetchData } from './api'
					
					export type User = ReturnType<typeof fetchUser>
					export type ApiResponse = ReturnType<typeof fetchData>
					export type UserEmail = User['email']
					
					export function processUser(user: User): UserEmail {
						return user.email
					}
					
					export function createUser(): User {
						return fetchUser()
					}
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare function fetchUser(): {
			  	id: number
			  	name: string
			  	email: string
			  };
			  declare function fetchData(): Promise<{
			  	data: string
			  	timestamp: number
			  }>;
			  type User = ReturnType<typeof fetchUser>;
			  type ApiResponse = ReturnType<typeof fetchData>;
			  type UserEmail = User["email"];
			  declare function processUser(user: User): UserEmail;
			  declare function createUser(): User;
			  export { processUser, createUser, UserEmail, User, ApiResponse };
			  "
			`)
		})
	})

	describe('Complex bundling scenarios', () => {
		test('should handle import all and export all as default', async () => {
			createProject({
				'src/utils.ts': `
					export function test(): string {
						return 'test'
					}
					
					export const test2 = 'test2'
				`,
				'src/index.ts': `
					import * as utils from './utils'
					export default utils
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare namespace exports_utils {
			  	export { test2, test };
			  }
			  declare function test(): string;
			  declare const test2 = "test2";
			  export { exports_utils as default };
			  "
			`)
		})

		test('should handle importing and re-exporting functions with namespace preservation', async () => {
			createProject({
				'src/math.ts': `
					export function calculate(a: number, b: number): number {
						return a + b
					}
					
					export const PI = 3.14159
				`,
				'src/string.ts': `
					export function calculate(text: string): string {
						return text.toUpperCase()
					}
					
					export const EMPTY = ''
				`,
				'src/index.ts': `
					import * as str from './string'
					export type CalculateReturnType = ReturnType<typeof str.calculate>
					export * from './string'
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare namespace exports_string {
			  	export { calculate, EMPTY };
			  }
			  declare function calculate(text: string): string;
			  declare const EMPTY = "";
			  type CalculateReturnType = ReturnType<typeof exports_string.calculate>;
			  export { calculate, EMPTY, CalculateReturnType };
			  "
			`)
		})

		test('should handle renaming exports using as keyword', async () => {
			createProject({
				'src/utils.ts': `
					export function process(data: string): string {
						return data.trim()
					}
					
					export function validate(input: string): boolean {
						return input.length > 0
					}
					
					export const CONFIG = { debug: true }
				`,
				'src/index.ts': `
					export { 
						process as processString, 
						validate as validateInput,
						CONFIG as AppConfig 
					} from './utils'
					
					export function newFunction(): string {
						return 'new'
					}
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare function process(data: string): string;
			  declare function validate(input: string): boolean;
			  declare const CONFIG: {
			  	debug: boolean
			  };
			  declare function newFunction(): string;
			  export { validate as validateInput, process as processString, newFunction, CONFIG as AppConfig };
			  "
			`)
		})

		test('should handle exporting as default using as keyword', async () => {
			createProject({
				'src/logger.ts': `
					export class Logger {
						log(message: string): void {
							console.log(message)
						}
						
						error(message: string): void {
							console.error(message)
						}
					}
					
					export const LOG_LEVELS = {
						INFO: 'info',
						ERROR: 'error',
						DEBUG: 'debug'
					} as const
				`,
				'src/config.ts': `
					export interface AppConfig {
						apiUrl: string
						timeout: number
					}
					
					export const defaultConfig: AppConfig = {
						apiUrl: 'https://api.example.com',
						timeout: 5000
					}
				`,
				'src/index.ts': `
					export { Logger as default, LOG_LEVELS } from './logger'
					export { AppConfig, defaultConfig as config } from './config'
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "declare class Logger {
			  	log(message: string): void;
			  	error(message: string): void;
			  }
			  declare const LOG_LEVELS: {
			  	readonly INFO: "info"
			  	readonly ERROR: "error"
			  	readonly DEBUG: "debug"
			  };
			  interface AppConfig {
			  	apiUrl: string;
			  	timeout: number;
			  }
			  declare const defaultConfig: AppConfig;
			  export { Logger as default, defaultConfig as config, LOG_LEVELS, AppConfig };
			  "
			`)
		})

		test('should handle nested dependencies', async () => {
			createProject({
				'src/types/user.ts': `
					export interface User {
						id: number
						name: string
					}
				`,
				'src/types/index.ts': `
					export { User } from './user'
					export type UserRole = 'admin' | 'user'
				`,
				'src/services/user.ts': `
					import { User, UserRole } from '../types'
					
					export class UserService {
						getUser(id: number): User | null {
							return null
						}
						
						hasRole(user: User, role: UserRole): boolean {
							return true
						}
					}
				`,
				'src/index.ts': `
					export * from './types'
					export * from './services/user'
				`,
			})

			const result = await runGenerateDts('src/index.ts')

			expect(result.errors).toHaveLength(0)
			expect(result.dts).toMatchInlineSnapshot(`
			  "interface User {
			  	id: number;
			  	name: string;
			  }
			  type UserRole = "admin" | "user";
			  declare class UserService {
			  	getUser(id: number): User | null;
			  	hasRole(user: User, role: UserRole): boolean;
			  }
			  export { UserService, UserRole, User };
			  "
			`)
		})
	})
})
