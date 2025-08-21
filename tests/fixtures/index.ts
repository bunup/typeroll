import './styles.css'

export namespace telegram {
	class Telegram {
		constructor(
			private readonly a: string,
			private readonly b: number,
		) {}

		public telegram(): string {
			return this.a + this.b.toString()
		}
	}
	export function telegram2() {
		return 'telegram2'
	}
}

export function sum() {
	return 'sum'
}
