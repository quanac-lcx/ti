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
  materialGroupIndex: number | null;
  groupQuestionIndex: number | null;
  groupQuestionCount: number | null;
  groupTitle: string;
  sharedMaterial: string;
}

export interface ParsedQuestionGroup {
  materialGroupIndex: number | null;
  title: string;
  material: string;
  questions: ParsedQuestion[];
}

export interface ParseQuestionConfigResult {
  questions: ParsedQuestion[];
  groups: ParsedQuestionGroup[];
  errors: string[];
}

interface ParsedBlock {
  kind: "question" | "group";
  attrs: Record<string, string>;
  body: string;
  line: number;
}

interface QuestionContext {
  materialGroupIndex: number | null;
  groupQuestionIndex: number | null;
  groupQuestionCount: number | null;
  groupTitle: string;
  sharedMaterial: string;
}

function parseInlineAttrs(raw: unknown): Record<string, string> {
  const attrs: Record<string, string> = {};
  const source = String(raw ?? "");
  const pattern = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s]+)/g;
  let match = pattern.exec(source);
  while (match) {
    const key = match[1];
    let value = match[2] ?? "";
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
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

function extractBlocks(source: string, errors: string[], startLine = 1): ParsedBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ParsedBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const current = lines[index].trim();
    if (!current.startsWith(":::question") && !current.startsWith(":::group")) {
      index += 1;
      continue;
    }

    const kind = current.startsWith(":::group") ? "group" : "question";
    const attrsText = current.replace(/^:::(?:question|group)/, "").trim();
    const blockLine = startLine + index;

    let depth = 1;
    let cursor = index + 1;
    while (cursor < lines.length) {
      const nextLine = lines[cursor].trim();
      if (nextLine.startsWith(":::question") || nextLine.startsWith(":::group")) {
        depth += 1;
      } else if (nextLine === ":::") {
        depth -= 1;
        if (depth === 0) break;
      }
      cursor += 1;
    }

    if (depth !== 0) {
      errors.push(`第 ${blockLine} 行开始的 :::${kind} 没有找到结束标记 :::`);
      break;
    }

    blocks.push({
      kind,
      attrs: parseInlineAttrs(attrsText),
      body: lines.slice(index + 1, cursor).join("\n").trim(),
      line: blockLine
    });
    index = cursor + 1;
  }

  return blocks;
}

function parseQuestionBlock(block: ParsedBlock, errors: string[], context: QuestionContext): ParsedQuestion | null {
  const questionType = String(block.attrs.type ?? "").trim().toLowerCase();
  const score = Number(block.attrs.score ?? Number.NaN);
  const stemSection = getSection(block.body, "stem");
  const analysisSection = getSection(block.body, "analysis");

  if (!questionType || (questionType !== "option" && questionType !== "input")) {
    errors.push(`第 ${block.line} 行的题目 type 只支持 option 或 input`);
    return null;
  }
  if (!Number.isFinite(score) || score <= 0) {
    errors.push(`第 ${block.line} 行的题目 score 必须为正数`);
    return null;
  }
  if (!stemSection?.body) {
    errors.push(`第 ${block.line} 行的题目缺少 [stem]...[/stem]`);
    return null;
  }

  if (questionType === "option") {
    const optionSection = getSection(block.body, "options");
    const answer = normalizeOptionAnswer(optionSection?.attrs?.answer ?? "");
    const options = parseOptionLines(optionSection?.body ?? "");
    if (!optionSection) {
      errors.push(`第 ${block.line} 行的选择题缺少 [options answer=A]...[/options]`);
      return null;
    }
    if (options.length < 2 || options.length > 26) {
      errors.push(`第 ${block.line} 行的选择题选项数量必须在 2 到 26 之间`);
      return null;
    }
    if (!answer) {
      errors.push(`第 ${block.line} 行的选择题 answer 不能为空，例如 answer=A 或 answer=A,C`);
      return null;
    }

    return {
      type: "option",
      score,
      stem: stemSection.body,
      options,
      answer,
      inputPlaceholder: "",
      analysis: analysisSection?.body ?? "",
      materialGroupIndex: context.materialGroupIndex,
      groupQuestionIndex: context.groupQuestionIndex,
      groupQuestionCount: context.groupQuestionCount,
      groupTitle: context.groupTitle,
      sharedMaterial: context.sharedMaterial
    };
  }

  const inputSection = getSection(block.body, "input");
  const answer = String(inputSection?.attrs?.answer ?? "").trim();
  if (!inputSection) {
    errors.push(`第 ${block.line} 行的填空题缺少 [input answer=xxx placeholder=提示]...[/input]`);
    return null;
  }
  if (!answer) {
    errors.push(`第 ${block.line} 行的填空题 answer 不能为空`);
    return null;
  }

  return {
    type: "input",
    score,
    stem: stemSection.body,
    options: [],
    answer,
    inputPlaceholder: String(inputSection.attrs?.placeholder ?? inputSection.body ?? "").trim(),
    analysis: analysisSection?.body ?? "",
    materialGroupIndex: context.materialGroupIndex,
    groupQuestionIndex: context.groupQuestionIndex,
    groupQuestionCount: context.groupQuestionCount,
    groupTitle: context.groupTitle,
    sharedMaterial: context.sharedMaterial
  };
}

function parseGroupBlock(block: ParsedBlock, errors: string[], materialGroupIndex: number): ParsedQuestionGroup | null {
  const groupLines = block.body.split("\n");
  let firstNestedIndex = groupLines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith(":::question") || trimmed.startsWith(":::group");
  });
  if (firstNestedIndex < 0) firstNestedIndex = groupLines.length;

  const preamble = groupLines.slice(0, firstNestedIndex).join("\n").trim();
  const nestedSource = groupLines.slice(firstNestedIndex).join("\n").trim();

  const title = String(block.attrs.title ?? getSection(preamble, "title")?.body ?? "").trim();
  const materialSection =
    getSection(preamble, "material") ??
    getSection(preamble, "shared") ??
    getSection(preamble, "passage");

  if (!materialSection?.body) {
    errors.push(`第 ${block.line} 行的 :::group 缺少 [material]...[/material]`);
    return null;
  }
  if (!nestedSource) {
    errors.push(`第 ${block.line} 行的 :::group 下面至少要包含一道 :::question`);
    return null;
  }

  const nestedBlocks = extractBlocks(nestedSource, errors, block.line + firstNestedIndex + 1);
  const questionBlocks = nestedBlocks.filter((item) => item.kind === "question");
  if (questionBlocks.length === 0) {
    errors.push(`第 ${block.line} 行的 :::group 下面至少要包含一道 :::question`);
    return null;
  }
  if (nestedBlocks.some((item) => item.kind !== "question")) {
    errors.push(`第 ${block.line} 行的 :::group 内暂不支持再嵌套 :::group`);
    return null;
  }

  const questions: ParsedQuestion[] = [];
  for (let index = 0; index < questionBlocks.length; index += 1) {
    const parsed = parseQuestionBlock(questionBlocks[index], errors, {
      materialGroupIndex,
      groupQuestionIndex: index + 1,
      groupQuestionCount: questionBlocks.length,
      groupTitle: title,
      sharedMaterial: materialSection.body
    });
    if (parsed) questions.push(parsed);
  }

  if (questions.length === 0) return null;

  return {
    materialGroupIndex,
    title,
    material: materialSection.body,
    questions
  };
}

export function parseQuestionConfig(configRaw: unknown): ParseQuestionConfigResult {
  const source = String(configRaw ?? "").replace(/\r\n/g, "\n");
  const errors: string[] = [];
  const rootBlocks = extractBlocks(source, errors);
  const questions: ParsedQuestion[] = [];
  const groups: ParsedQuestionGroup[] = [];
  let materialGroupIndex = 0;

  for (const block of rootBlocks) {
    if (block.kind === "question") {
      const parsed = parseQuestionBlock(block, errors, {
        materialGroupIndex: null,
        groupQuestionIndex: null,
        groupQuestionCount: null,
        groupTitle: "",
        sharedMaterial: ""
      });
      if (parsed) {
        questions.push(parsed);
        groups.push({
          materialGroupIndex: null,
          title: "",
          material: "",
          questions: [parsed]
        });
      }
      continue;
    }

    materialGroupIndex += 1;
    const group = parseGroupBlock(block, errors, materialGroupIndex);
    if (!group) continue;
    groups.push(group);
    questions.push(...group.questions);
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push("没有解析到题目，请检查配置格式。");
  }

  return { questions, groups, errors };
}
