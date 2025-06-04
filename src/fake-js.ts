import { parse } from '@babel/parser'
import type {
	Directive,
	ExpressionStatement,
	Node,
	Statement,
} from '@babel/types'
import {
	getAllImportNames,
	getCommentText,
	getName,
	hasDefaultExportModifier,
	hasExportModifier,
	isDefaultReExport,
	isExportAllDeclaration,
	isImportDeclaration,
	isReExportStatement,
} from './ast'
import {
	CAPITAL_LETTER_RE,
	EXPORT_DEFAULT_RE,
	EXPORT_RE,
	EXPORT_TYPE_RE,
	IMPORT_EXPORT_NAMES_RE,
	IMPORT_EXPORT_WITH_DEFAULT_RE,
	IMPORT_TYPE_RE,
	TOKENIZE_RE,
	TYPE_WORD_RE,
} from './re'
import { generateRandomString, isNullOrUndefined } from './utils'

async function dtsToFakeJs(dtsContent: string): Promise<string> {
	const parsed = parse(dtsContent, {
		sourceType: 'module',
		plugins: ['typescript'],
	})

	const referencedNames = new Set<string>()
	const exportedNames = new Set<string>()
	const result = []

	for (const name of getAllImportNames(parsed.program.body)) {
		referencedNames.add(name)
	}

	for (const statement of parsed.program.body) {
		if (
			isNullOrUndefined(statement.start) ||
			isNullOrUndefined(statement.end)
		) {
			continue
		}

		const leadingComment = getCommentText(statement.leadingComments)

		let statementText = `${leadingComment ? `${leadingComment}\n` : ''}${dtsContent.substring(statement.start, statement.end)}`

		const name = getName(statement, dtsContent)

		if (name) {
			referencedNames.add(name)
		}

		const isDefaultExport = hasDefaultExportModifier(statement, statementText)
		const isExported = hasExportModifier(statement, statementText)

		if (isDefaultExport) {
			result.push(`export { ${name} as default };`)
			if (isDefaultReExport(statement)) {
				continue
			}
		}

		if (
			isImportDeclaration(statement) ||
			isExportAllDeclaration(statement) ||
			isReExportStatement(statement)
		) {
			result.push(jsifyImportExport(statement, dtsContent))
			continue
		}

		if (isExported) {
			statementText = statementText
				.replace(EXPORT_DEFAULT_RE, '')
				.replace(EXPORT_RE, '')
		}

		const tokens = tokenizeText(statementText, referencedNames)

		const varName = name || generateRandomString()

		result.push(`var ${varName} = [${tokens.join(', ')}];`)

		if (isExported && !isDefaultExport && !exportedNames.has(varName)) {
			result.push(`export { ${varName} };`)
			exportedNames.add(varName)
		}
	}

	return result.join('\n')
}

async function fakeJsToDts(fakeJsContent: string): Promise<string> {
	const parseResult = parse(fakeJsContent, {
		sourceType: 'module',
	})

	const program = parseResult.program
	const resultParts = []

	for (const node of program.body) {
		if (isNullOrUndefined(node.start) || isNullOrUndefined(node.end)) {
			continue
		}

		if (
			isImportDeclaration(node) ||
			isExportAllDeclaration(node) ||
			isReExportStatement(node)
		) {
			resultParts.push(
				// This is important when `splitting` is enabled, as
				// the import paths would be referencing chunk files with .js extensions
				// that need to be removed for proper type declarations
				fakeJsContent
					.substring(node.start, node.end)
					.trim()
					.replace('.js', ''),
			)
			continue
		}

		if (node.type === 'ExpressionStatement') {
			const namespaceDecl = handleNamespace(node)
			if (namespaceDecl) {
				resultParts.push(namespaceDecl)
				continue
			}
		}

		if (node.type === 'VariableDeclaration') {
			for (const declaration of node.declarations) {
				if (declaration.init?.type === 'ArrayExpression') {
					const dtsContent = processTokenArray(declaration.init)
					if (dtsContent) {
						resultParts.push(dtsContent)
					}
				}
			}
		}
	}

	return resultParts.join('\n')
}

function jsifyImportExport(
	node: Directive | Statement,
	source: string,
): string {
	if (isNullOrUndefined(node.start) || isNullOrUndefined(node.end)) {
		return ''
	}

	const text = source.substring(node.start, node.end)

	let result = text
		.replace(IMPORT_TYPE_RE, 'import ')
		.replace(EXPORT_TYPE_RE, 'export ')
		.replace(
			IMPORT_EXPORT_NAMES_RE,
			(_, keyword, names) => `${keyword} {${names.replace(TYPE_WORD_RE, '')}}`,
		)

	result = result.replace(
		IMPORT_EXPORT_WITH_DEFAULT_RE,
		(_, keyword, defaultPart = '', names = '') => {
			const cleanedNames = names.replace(TYPE_WORD_RE, '')
			return `${keyword}${defaultPart}{${cleanedNames}}`
		},
	)

	return result
}

function tokenizeText(text: string, referencedNames: Set<string>): string[] {
	const tokens = []

	let match: RegExpExecArray | null
	while (true) {
		match = TOKENIZE_RE.exec(text)
		if (match === null) break

		const token = match[0]

		if (CAPITAL_LETTER_RE.test(token) || referencedNames.has(token)) {
			tokens.push(token)
		} else {
			const processedToken = token.replace(/\n/g, '\\n').replace(/\t/g, '\\t')
			tokens.push(JSON.stringify(processedToken))
		}
	}

	return tokens
}

function processTokenArray(arrayLiteral: Node): string | null {
	if (arrayLiteral.type !== 'ArrayExpression') {
		return null
	}

	const tokens = []

	for (const element of arrayLiteral.elements) {
		if (
			element?.type === 'StringLiteral' &&
			typeof element.value === 'string'
		) {
			const processedValue = element.value
				.replace(/\\n/g, '\n')
				.replace(/\\t/g, '\t')
				.replace(/\\r/g, '\r')
			tokens.push(processedValue)
		} else if (element?.type === 'Identifier') {
			tokens.push(element.name)
		}
	}

	return tokens.join('')
}

function handleNamespace(stmt: ExpressionStatement): string | null {
	const expr = stmt.expression

	if (
		!expr ||
		expr.type !== 'CallExpression' ||
		expr.callee?.type !== 'Identifier' ||
		expr.callee.name !== '__export' ||
		expr.arguments?.length !== 2 ||
		expr.arguments[0].type !== 'Identifier' ||
		expr.arguments[1].type !== 'ObjectExpression'
	) {
		return null
	}

	const namespaceName = expr.arguments[0].name
	const properties = expr.arguments[1].properties
		.filter((prop) => prop.type === 'ObjectProperty')
		.map((prop) => (prop.key?.type === 'Identifier' ? prop.key.name : null))
		.filter(Boolean)

	if (properties.length === 0) {
		return null
	}

	return `declare namespace ${namespaceName} {\n  export { ${properties.join(', ')} };\n}`
}

export { dtsToFakeJs, fakeJsToDts }
