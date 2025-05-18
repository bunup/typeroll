import type { OxcError, Severity } from "oxc-transform";
import pc from "picocolors";
import { UNDERSTANDING_ISOLATED_DECLARATIONS_URL } from "./constants";
import { getShortFilePath } from "./utils";

export type IsolatedDeclarationError = {
    error: OxcError;
    file: string;
    content: string;
};

export function logIsolatedDeclErrors(
    errors: IsolatedDeclarationError[],
    warnInsteadOfError: boolean,
): void {
    let hasSeverityError = false;
    for (const error of errors) {
        if (error.error.severity === "Error") {
            hasSeverityError = true;
        }

        logSingle(error, warnInsteadOfError ?? false);
    }

    if (hasSeverityError && !warnInsteadOfError) {
        console.log(
            `\n\n${pc.cyan("Learn more:")} ${pc.underline(
                UNDERSTANDING_ISOLATED_DECLARATIONS_URL,
            )}\n\n`,
        );
        process.exit(1);
    }
}

export function logSingle(
    error: IsolatedDeclarationError,
    warnInsteadOfError: boolean,
): void {
    const label = error.error.labels[0];
    const position = label
        ? calculateDtsErrorLineAndColumn(error.content, label.start)
        : "";

    const shortPath = getShortFilePath(error.file);
    const errorMessage = `${shortPath}${position}: ${formatDtsErrorMessage(error.error.message)}`;

    const { color, prefix } = getSeverityFormatting(
        error.error.severity,
        warnInsteadOfError,
    );

    const formattedMessage = `${color(prefix)} ${errorMessage}`;

    const codeFrame = label
        ? getCodeFrame(error.content, label.start, label.end)
        : error.error.codeframe
          ? error.error.codeframe
          : "";

    const helpMessage = error.error.helpMessage
        ? `\n${pc.cyan("Help:")} ${error.error.helpMessage}`
        : "";

    console[warnInsteadOfError ? "warn" : "error"](
        `\n${formattedMessage}${helpMessage}\n\n${pc.gray(codeFrame)}`,
    );
}

function getSeverityFormatting(
    severity: Severity,
    warnInsteadOfError: boolean,
): {
    color: (text: string) => string;
    prefix: string;
} {
    const errorColor = warnInsteadOfError ? pc.yellow : pc.red;
    const errorPrefix = warnInsteadOfError ? "WARNING" : "ERROR";

    switch (severity) {
        case "Error":
            return {
                color: errorColor,
                prefix: errorPrefix,
            };
        case "Warning":
            return { color: pc.yellow, prefix: "WARNING" };
        case "Advice":
            return { color: pc.blue, prefix: "ADVICE" };
        default:
            return {
                color: errorColor,
                prefix: errorPrefix,
            };
    }
}

function formatDtsErrorMessage(errorMessage: string): string {
    return errorMessage
        .replace(" with --isolatedDeclarations", "")
        .replace(" with --isolatedDeclaration", "");
}

function calculateDtsErrorLineAndColumn(
    sourceText: string,
    labelStart: number,
): string {
    if (labelStart === undefined) return "";

    const lines = sourceText.slice(0, labelStart).split("\n");
    const lineNumber = lines.length;
    const columnStart = lines[lines.length - 1].length + 1;

    return ` (${lineNumber}:${columnStart})`;
}

function getCodeFrame(sourceText: string, start: number, end: number): string {
    const lines = sourceText.split("\n");
    const errorLine = sourceText.slice(0, start).split("\n").length;
    const lineContent = lines[errorLine - 1];

    const startCol = start - sourceText.slice(0, start).lastIndexOf("\n") - 1;
    const endCol = end
        ? Math.min(
              end - sourceText.slice(0, start).lastIndexOf("\n") - 1,
              lineContent.length,
          )
        : startCol + 1;

    const arrowLine =
        " ".repeat(startCol) +
        pc.red(pc.dim("⎯".repeat(Math.max(1, endCol - startCol))));

    return `${lineContent}\n${arrowLine}`;
}
