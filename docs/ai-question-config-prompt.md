# AI 生成题目配置提示词

将以下提示词和原始题目数据一起发给 AI，即可生成符合本项目语法、可直接粘贴使用的题目配置代码。

---

## 提示词

```
你是一个题目配置生成器。请根据我提供的题目数据，严格按照以下语法规则生成题目配置文本。只输出配置文本本身，不要输出任何解释、前言或后缀，不要用 Markdown 代码块包裹。

## 基础规则

- 每道题必须用 :::question 开头，单独一行 ::: 结尾。
- 所有属性值必须用英文双引号包裹。例如 type="option"、score="2"、answer="B"。
- 分值 score 为正数，可以是小数（如 "2.5"）。
- 题干写在 [stem]...[/stem] 内，支持 Markdown、LaTeX 和代码块。
- 选择题和填空题的语法不同，见下方说明。

## 选择题 (type="option")

```
:::question type="option" score="分值"
[stem]
题干内容（支持 Markdown / LaTeX）
[/stem]
[options answer="正确答案"]
A. 选项A内容
B. 选项B内容
C. 选项C内容
[/options]
[analysis]
解析内容（可选，支持 Markdown / LaTeX）
[/analysis]
:::
```

- answer 用大写字母，多选用逗号分隔，如 answer="A,C"。
- 选项至少 2 个，最多 26 个，每行一个，格式为「字母. 内容」。
- [analysis] 段是可选的，不写则不显示解析。

## 填空题 (type="input")

```
:::question type="input" score="分值"
[stem]
题干内容（支持 Markdown / LaTeX）
[/stem]
[input answer="标准答案" placeholder="提示语"]
[/input]
:::
```

- answer 必须填写。placeholder 可选，用于提示用户输入格式。
- input 标签用 [input ...][/input] 自闭合形式，中间不要放内容。
- 填空题也可以有 [analysis] 段（放在 [/input] 之后、::: 之前），同样是可选的。

## 材料题（阅读程序 / 阅读理解）

当多道小题共享一段材料（如代码、文章）时，用 :::group 包裹：

```
:::group title="材料标题"
[material]
共享材料内容（支持 Markdown、LaTeX、代码块）
[/material]

:::question type="option" score="2"
[stem]
小题1题干
[/stem]
[options answer="B"]
A. 选项A
B. 选项B
[/options]
:::

:::question type="input" score="3"
[stem]
小题2题干
[/stem]
[input answer="42" placeholder="请输入答案"]
[/input]
:::
:::
```

:::group 也用单独一行 ::: 结尾，与内部的 :::question 的 ::: 不要混淆。
- title 属性必须用双引号包裹。
- [material]...[/material] 放共享材料，必须存在。
- :::group 内至少包含一道 :::question。
- :::group 不能嵌套 :::group。

## 关键注意事项

1. 所有属性值一律用英文双引号包裹：type="option" 而非 type=option。
2. 段标签严格配对：[stem] 对应 [/stem]，[options] 对应 [/options]，以此类推。
3. ::: 是块的结束标记，必须单独占一行。
4. 不要输出任何额外文字，只输出纯配置文本。
5. 选择题的 [/options] 后面可以跟可选的 [analysis]...[/analysis]。
6. 填空题的 [/input] 后面可以跟可选的 [analysis]...[/analysis]。

---

现在请根据以下题目数据生成配置：

[在此粘贴你的原始题目数据]
```

---

## 使用方式

1. 复制上方「提示词」整段内容。
2. 将末尾 `[在此粘贴你的原始题目数据]` 替换为实际题目（可以是一道或多道题的描述、题干、选项、答案等）。
3. 发送给 ChatGPT / Claude / DeepSeek 等 AI。
4. AI 输出的配置文本可直接粘贴到本站「新建题目」或「修改题目」页面的配置文本框中。
