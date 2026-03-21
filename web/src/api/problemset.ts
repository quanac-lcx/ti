export interface ProblemsetSummary {
  id: number;
  title: string;
  description: string;
  questionCount: number;
  durationHours: number;
}

export interface ChoiceOption {
  key: string;
  text: string;
}

export interface ProblemQuestion {
  id: string;
  index: number;
  stem: string;
  options: ChoiceOption[];
  score: number;
  answer: string;
  analysis: string;
}

export interface ProblemsetDetail {
  summary: ProblemsetSummary;
  questions: ProblemQuestion[];
}

export interface ProblemsetApi {
  list(): Promise<ProblemsetSummary[]>;
  detail(problemsetId: number): Promise<ProblemsetDetail>;
}

const mockSummaries: ProblemsetSummary[] = [
  { id: 1001, title: "NOIP 2007 普及组初赛试题", description: "NOIP2007 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1002, title: "NOIP 2007 提高组初赛试题", description: "NOIP2007 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1003, title: "NOIP 2008 普及组初赛试题", description: "NOIP2008 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1004, title: "NOIP 2008 提高组初赛试题", description: "NOIP2008 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1005, title: "NOIP 2009 普及组初赛试题", description: "NOIP2009 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1006, title: "NOIP 2009 提高组初赛试题", description: "NOIP2009 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1007, title: "NOIP 2010 普及组初赛试题", description: "NOIP2010 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1008, title: "NOIP 2010 提高组初赛试题", description: "NOIP2010 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1009, title: "NOIP 2011 普及组初赛试题", description: "NOIP2011 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1010, title: "NOIP 2011 提高组初赛试题", description: "NOIP2011 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1011, title: "NOIP 2012 普及组初赛试题", description: "NOIP2012 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1012, title: "NOIP 2012 提高组初赛试题", description: "NOIP2012 初赛试题（提高组 C++）", questionCount: 28, durationHours: 2 },
  { id: 1013, title: "NOIP 2013 普及组初赛试题", description: "NOIP2013 初赛试题（普及组 C++）", questionCount: 28, durationHours: 2 }
];

function buildQuestions(total: number): ProblemQuestion[] {
  const first: ProblemQuestion = {
    id: "q1",
    index: 1,
    stem: "在以下各项中，（）不是 CPU 的组成部分。",
    options: [
      { key: "A", text: "控制器" },
      { key: "B", text: "运算器" },
      { key: "C", text: "寄存器" },
      { key: "D", text: "主板" },
      { key: "E", text: "算术逻辑单元（ALU）" }
    ],
    score: 1.5,
    answer: "D",
    analysis: "CPU 主要由运算器、控制器、寄存器等组成，主板是计算机系统板卡，不属于 CPU 内部结构。"
  };

  const generated: ProblemQuestion[] = Array.from({ length: total - 1 }, (_, offset) => ({
    id: `q${offset + 2}`,
    index: offset + 2,
    stem: `这是第 ${offset + 2} 题的占位题干（接口演示数据）。`,
    options: [
      { key: "A", text: "选项 A" },
      { key: "B", text: "选项 B" },
      { key: "C", text: "选项 C" },
      { key: "D", text: "选项 D" }
    ],
    score: 1.5,
    answer: "A",
    analysis: "这是演示解析内容。后续接入后端后会返回真实答案与解析。"
  }));

  return [first, ...generated];
}

class MockProblemsetApi implements ProblemsetApi {
  async list(): Promise<ProblemsetSummary[]> {
    return structuredClone(mockSummaries);
  }

  async detail(problemsetId: number): Promise<ProblemsetDetail> {
    const summary = mockSummaries.find((item) => item.id === problemsetId) ?? mockSummaries[0];
    return {
      summary: structuredClone(summary),
      questions: buildQuestions(summary.questionCount)
    };
  }
}

export const problemsetApi: ProblemsetApi = new MockProblemsetApi();

