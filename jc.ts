import {
    parseSync,
    type PropertyKey,
    type Program,
    type TSInterfaceDeclaration,
    type TSTypeAliasDeclaration,
    type TSType,
} from "oxc-parser";

/**
 * Generate JSON schema from a TypeScript type or interface
 * @param sourceFile File path (for error messages)
 * @param sourceContent TypeScript source code
 * @param typeName Name of the type or interface to convert
 * @returns JSON schema as a string
 */
export function generateJsonSchema(
    sourceFile: string,
    sourceContent: string,
    typeName: string,
): string {
    // Parse the TypeScript code
    const parseResult = parseSync(sourceFile, sourceContent, {
        sourceType: "module",
        lang: "ts",
    });

    const program = parseResult.program;

    // Find the type/interface definition
    const typeNode = findTypeNode(program, typeName);
    if (!typeNode) {
        throw new Error(`Type or interface "${typeName}" not found`);
    }

    // Convert to JSON schema
    const schema = convertNodeToSchema(typeNode);

    // Return as formatted JSON string
    return JSON.stringify(schema, null, 2);
}

// Find type declaration by name
function findTypeNode(program: Program, typeName: string) {
    for (const node of program.body) {
        if (
            (node.type === "TSTypeAliasDeclaration" ||
                node.type === "TSInterfaceDeclaration") &&
            node.id.name === typeName
        ) {
            return node;
        }

        if (
            (node.type === "ExportNamedDeclaration" ||
                node.type === "ExportDefaultDeclaration") &&
            node.declaration
        ) {
            if (
                (node.declaration?.type === "TSTypeAliasDeclaration" ||
                    node.declaration?.type === "TSInterfaceDeclaration") &&
                node.declaration?.id.name === typeName
            ) {
                return node.declaration;
            }
        }
    }
    return null;
}

// Convert type/interface node to JSON schema
function convertNodeToSchema(
    node: TSTypeAliasDeclaration | TSInterfaceDeclaration,
) {
    const schema: any = { $schema: "http://json-schema.org/draft-07/schema#" };

    if (node.type === "TSTypeAliasDeclaration") {
        Object.assign(schema, convertTypeToSchema(node.typeAnnotation));
    } else if (node.type === "TSInterfaceDeclaration") {
        Object.assign(schema, {
            type: "object",
            properties: {},
            required: [],
        });

        for (const member of node.body.body) {
            if (member.type === "TSPropertySignature") {
                const key = getKeyName(member.key);
                schema.properties[key] = convertTypeToSchema(
                    member.typeAnnotation?.typeAnnotation,
                );

                if (!member.optional) {
                    schema.required.push(key);
                }
            }
        }

        if (schema.required.length === 0) {
            schema.required = undefined;
        }
    }

    return schema;
}

// Convert TypeScript type to JSON schema
function convertTypeToSchema(type: TSType | undefined) {
    if (!type) return {};

    switch (type.type) {
        case "TSStringKeyword":
            return { type: "string" };
        case "TSNumberKeyword":
            return { type: "number" };
        case "TSBooleanKeyword":
            return { type: "boolean" };
        case "TSNullKeyword":
            return { type: "null" };
        case "TSArrayType":
            return {
                type: "array",
                items: convertTypeToSchema(type.elementType),
            };
        case "TSTypeLiteral": {
            const schema: any = {
                type: "object",
                properties: {},
                required: [],
            };

            for (const member of type.members) {
                if (member.type === "TSPropertySignature") {
                    const key = getKeyName(member.key);
                    schema.properties[key] = convertTypeToSchema(
                        member.typeAnnotation?.typeAnnotation,
                    );

                    if (!member.optional) {
                        schema.required.push(key);
                    }
                }
            }

            if (schema.required.length === 0) {
                schema.required = undefined;
            }

            return schema;
        }
        case "TSUnionType": {
            const schemas = type.types.map((t) => convertTypeToSchema(t));
            if (schemas.every((s: any) => s.type === "string" && s.enum)) {
                return {
                    type: "string",
                    enum: schemas.flatMap((s: any) => s.enum),
                };
            }
            return { oneOf: schemas };
        }
        case "TSIntersectionType": {
            return { allOf: type.types.map((t) => convertTypeToSchema(t)) };
        }
        case "TSObjectKeyword":
            return { type: "object" };
        case "TSTypeReference":
            return { type: "object" }; // Simplified handling
        default:
            return {}; // Default to no constraints
    }
}

function getKeyName(key: PropertyKey) {
    if (key.type === "Identifier") {
        return key.name.toString();
    }

    if (key.type === "Literal" && typeof key.value === "string") {
        return key.value;
    }

    return "unknown";
}
