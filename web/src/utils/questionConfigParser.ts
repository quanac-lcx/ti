export interface ParsedOption {
    key: string;
    text: string;
}

export interface ParsedQuestion {
    type: "option" | "input";
    score: number;
    stem: string;
    options: ParsedOption[];
    answer: string;
    inputPlaceholder: string;
    analysis: string;
}

export interface ParseQuestionConfigResult {
    questions: ParsedQuestion[];
    errors: string[];
}

function parseInlineAttrs(raw: unknown): Record<string, string> {
    const attrs: Record<string, string> = {};
    const source = String(raw ?? "");
    const pattern = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+)/g;
    let match = pattern.exec(source);
    while (match) {
        const key = match[1];
        let value = match[2] ?? "";
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        attrs[key] = value;
        match = pattern.exec(source);
    }
    return attrs;
}

function getSection(rawBlock: string, sectionName: string) {
    const regex = new RegExp(`\\[${sectionName}([^\\]]*)\\]([\\s\\S]*?)\\[\\/${sectionName}\\]`, "i");
    const matched = regex.exec(rawBlock);
    if (!matched) return null;
    return {
        attrs: parseInlineAttrs(matched[1] ?? ""),
        body: String(matched[2] ?? "").trim()
    };
}

function parseOptionLines(optionsText: unknown): ParsedOption[] {
    const lines = String(optionsText ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const options: ParsedOption[] = [];
    for (const line of lines) {
        const letterMatch = /^([A-Za-z])[\.\)]\s*(.+)$/.exec(line);
        if (letterMatch) {
            options.push({ key: letterMatch[1].toUpperCase(), text: letterMatch[2].trim() });
            continue;
        }
        const numberMatch = /^(\d+)[\.\)]\s*(.+)$/.exec(line);
        if (numberMatch) {
            const index = Number(numberMatch[1]) - 1;
            if (index >= 0 && index < 26) {
                options.push({ key: String.fromCharCode(65 + index), text: numberMatch[2].trim() });
            }
        }
    }

    return options.filter((item, index, arr) => arr.findIndex((it) => it.key === item.key) === index);
}

function normalizeOptionAnswer(answerRaw: unknown): string {
    const letters = String(answerRaw ?? "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    const normalized = Array.from(new Set(letters)).filter((item) => /^[A-Z]$/.test(item));
    return normalized.join(",");
}

export function parseQuestionConfig(configRaw: unknown): ParseQuestionConfigResult {
    const source = String(configRaw ?? "").replace(/\r\n/g, "\n");
    const blockRegex = /:::question([^\n]*)\n([\s\S]*?)\n:::/g;
    const parsed: ParsedQuestion[] = [];
    const errors: string[] = [];
    let matched = blockRegex.exec(source);

    while (matched) {
        const headerAttrs = parseInlineAttrs(matched[1] ?? "");
        const blockBody = String(matched[2] ?? "");
        const questionType = String(headerAttrs.type ?? "").trim().toLowerCase();
        const score = Number(headerAttrs.score ?? Number.NaN);
        const stemSection = getSection(blockBody, "stem");
        const analysisSection = getSection(blockBody, "analysis");

        if (!questionType || (questionType !== "option" && questionType !== "input")) {
            errors.push("题型 type 只支持 option 或 input");
            matched = blockRegex.exec(source);
            continue;
        }
        if (!Number.isFinite(score) || score <= 0) {
            errors.push("score 必须为正数");
            matched = blockRegex.exec(source);
            continue;
        }
        if (!stemSection?.body) {
            errors.push("每个题目都必须提供 [stem]...[/stem]");
            matched = blockRegex.exec(source);
            continue;
        }

        if (questionType === "option") {
            const optionSection = getSection(blockBody, "options");
            const answer = normalizeOptionAnswer(optionSection?.attrs?.answer ?? "");
            const options = parseOptionLines(optionSection?.body ?? "");
            if (!optionSection) {
                errors.push("选择题需要 [options answer=A]...[/options]");
                matched = blockRegex.exec(source);
                continue;
            }
            if (options.length < 2 || options.length > 26) {
                errors.push("选择题选项数量必须在 2~26");
                matched = blockRegex.exec(source);
                continue;
            }
            if (!answer) {
                errors.push("选择题答案不能为空，例如 answer=A 或 answer=A,C");
                matched = blockRegex.exec(source);
                continue;
            }

            parsed.push({
                type: "option",
                score,
                stem: stemSection.body,
                options,
                answer,
                inputPlaceholder: "",
                analysis: analysisSection?.body ?? ""
            });
        } else {
            const inputSection = getSection(blockBody, "input");
            const answer = String(inputSection?.attrs?.answer ?? "").trim();
            if (!inputSection) {
                errors.push("填空题需要 [input answer=xxx placeholder=可选的提示]...[/input]");
                matched = blockRegex.exec(source);
                continue;
            }
            if (!answer) {
                errors.push("填空题 answer 不能为空");
                matched = blockRegex.exec(source);
                continue;
            }

            parsed.push({
                type: "input",
                score,
                stem: stemSection.body,
                options: [],
                answer,
                inputPlaceholder: String(inputSection.attrs?.placeholder ?? inputSection.body ?? "").trim(),
                analysis: analysisSection?.body ?? ""
            });
        }

        matched = blockRegex.exec(source);
    }

    if (parsed.length === 0 && errors.length === 0) {
        errors.push("错误的格式。");
    }

    return { questions: parsed, errors };
}
