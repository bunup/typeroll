import { describe, expect, test } from 'bun:test'
import { createProject, runGenerateDts } from './utils'

describe('DTS Misc', () => {
	test('should generate dts for typescript file with module declarations containing special characters', async () => {
		createProject({
			'src/index.ts': `
              declare module '@bun' {
                interface Env {
                  NODE_ENV: 'development' | 'production'
                }
              }
            
              type User = {
                name: string
                age: number
              }

              export const user: User = {
                name: 'John',
                age: 30
              }
			`,
		})

		const files = await runGenerateDts(['src/index.ts'])

		expect(files[0].dts).toMatchInlineSnapshot(`
		  "declare module "@bun" {
		  	interface Env {
		  		NODE_ENV: "development" | "production";
		  	}
		  }
		  type User = {
		  	name: string
		  	age: number
		  };
		  declare const user: User;
		  export { user };
		  "
		`)
	})
})
