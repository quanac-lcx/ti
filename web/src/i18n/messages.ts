const baseMessages = {
  "zh-CN": {
    common: {
      appName: "保存站有题",
      loading: "加载中...",
      loadingPage: "页面加载中",
      save: "保存",
      saving: "保存中...",
      create: "创建",
      creating: "创建中...",
      update: "更新",
      delete: "删除",
      deleting: "删除中...",
      edit: "编辑",
      preview: "预览",
      reset: "重置",
      refresh: "刷新",
      search: "搜索",
      cancel: "取消",
      confirm: "确定",
      submit: "提交",
      back: "返回",
      open: "打开",
      yes: "是",
      no: "否",
      days: "天",
      minutes: "分钟",
      hours: "小时",
      points: "分",
      questions: "题",
      success: "成功",
      error: "失败",
      tip: "提示",
      pleaseConfirm: "请确认",
      notFound: "未找到对应页面。",
      invalidUser: "无效用户。",
      loginFirst: "请先登录。",
      goLogin: "去登录",
      empty: "暂无内容",
      all: "全部"
    },
    locale: {
      label: "语言",
      zhCN: "简体中文",
      enUS: "English",
      jaJP: "日本語",
      origin: "Origin"
    },
    feedback: {
      defaultToastTitle: "提示"
    },
    confirm: {
      ok: "确定",
      cancel: "取消"
    },
    unsaved: {
      title: "确认离开当前编辑？",
      message: "你有尚未保存的修改，离开或刷新页面会丢失这些内容。确定继续吗？",
      leave: "离开",
      stay: "继续编辑",
      answerTitle: "确认离开当前作答？",
      answerMessage: "你正在作答中，离开或刷新可能丢失最新进度。确定继续吗？",
      continueAnswering: "继续作答"
    },
    layout: {
      siteTitleSuffix: "保存站有题",
      nav: {
        problemsets: "题库",
        createProblemset: "新建题目",
        search: "搜索",
        home: "保存站"
      },
      navTitle: {
        problemsets: "题库",
        createProblemset: "新建题目",
        search: "搜索题目",
        home: "前往保存站"
      },
      themeToLight: "切换到浅色模式",
      themeToDark: "切换到深色模式",
      profile: "个人中心",
      settings: "个人设置",
      admin: "管理后台",
      logout: "退出登录",
      loginOrRegister: "登录 / 注册"
    },
    footer: {
      copyright: "2025-2026 保存站有题",
      running: "本站已运行",
      developers: "开发者：Federico2903 & Murasame & quanac-lcx",
      qqGroup: "保存站用户群：1017248143（点击加入）",
      sponsor: "由 雨云 提供支持"
    },
    auth: {
      loginRegister: "登录 / 注册",
      loginSubtitle: "登录 / 注册",
      loginTitle: "登录 / 注册",
      loginTipPrefix: "请使用",
      loginTipSuffix: "登录或注册。未注册的用户将自动完成注册。",
      loginPolicyTip: "点击下方按钮即表示你同意本站及 CP OAuth 的相关协议、条款和政策。",
      userAgreement: "用户协议",
      privacyPolicy: "隐私政策",
      continueWithCpoauth: "使用 CP OAuth 继续",
      adminToken: "Admin Token",
      adminTokenInvalid: "格式有误",
      loginWithAdminToken: "使用 Admin Token 登录",
      loggingIn: "登录中...",
      callbackProcessing: "正在处理 CP OAuth 登录...",
      callbackFailed: "CP OAuth 登录失败",
      callbackTitle: "CP OAuth 登录",
      callbackPending: "请稍候，正在跳转...",
      callbackBack: "返回登录页",
      callbackMissingTicket: "缺少 ticket，无法完成登录。",
      bannedTitle: "出错了",
      bannedSubtitle: "保存站有题 / 错误",
      bannedHeading: "你已被封禁！",
      bannedText: "该账号当前无法继续访问本站。",
      bannedContact: "如需申诉，请联系：i@hiac.me"
    },
    api: {
      backendUnavailable: "后端服务不可用：{url}（请先启动 server）",
      forbidden: "forbidden"
    },
    systemPage: {
      title: "系统页面",
      subtitle: "系统页面",
      loading: "页面加载中...",
      updatedAt: "最后更新：{time}",
      notFoundTitle: "404"
    },
    problemset: {
      types: {
        officialPublic: "官方公开",
        personalFeatured: "个人精选",
        personalPublic: "个人公开",
        personalPrivate: "个人私有",
        other: "其他"
      },
      common: {
        name: "名称",
        description: "测验描述",
        durationMinutes: "测试时间长度（分钟）",
        type: "题目类型",
        config: "题目配置文件",
        livePreview: "实时预览",
        questionNumber: "第 {index} 题",
        materialGroupWithIndex: "材料题 {index}",
        materialQuestionIndex: "材料题第 {index}",
        subQuestion: "小题",
        input: "填空",
        option: "选择",
        analysis: "解析：",
        answerLabel: "答案：{answer}",
        answerPlaceholder: "请输入答案",
        typeLabel: "类型：{type}｜分值：{score}"
      },
      list: {
        title: "题库",
        subtitle: "保存站有题 / 试题列表",
        official: "官方题目",
        featured: "个人精选",
        create: "新建题目",
        empty: "当前分栏下暂无题目"
      },
      search: {
        title: "搜索",
        subtitle: "保存站有题 / 搜索",
        placeholder: "搜索题目 ID、标题、描述或作者用户名",
        back: "返回题库",
        searching: "搜索中...",
        idle: "请输入文本。按下 Enter 键开始搜索。",
        empty: "没有找到匹配的官方公开、个人精选或个人公开题目"
      },
      create: {
        title: "新建题目",
        subtitle: "保存站有题 / 题库 / 新建题目",
        heading: "创建试卷",
        adminIdPlaceholder: "你是管理员，可以自定义。留空会自动分配",
        namePlaceholder: "填写名称",
        descriptionPlaceholder: "例如：共 25 题，含阅读程序、补全代码、选择题与填空题。",
        configSummary: "题目配置格式",
        configPlaceholder: "按上方规则填写。也可以点击下方填入模板熟悉一下格式。输入的内容会实时渲染在下方。",
        previewEmpty: "请输入文本",
        fillTemplate: "填入模板",
        submit: "创建试卷",
        parsedCount: "当前共解析到 {count} 题",
        materialGroupCount: "，其中材料题分组 {count} 组",
        created: "创建成功，试卷 ID 为 {id}",
        ruleTemplate: `:::group title="阅读程序"
[material]
请阅读程序，完成下面小题。

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int x = a + b;
    cout << x << endl;
    return 0;
}
\`\`\`
[/material]

:::question type=option score=2
[stem]
如果输入 \`3 4\`，输出结果是多少？
[/stem]
[options answer=B]
A. 5
B. 7
C. 9
D. 11
[/options]
[analysis]
3+4=7，所以输出结果是 7。
[/analysis]
:::

:::question type=input score=2
[stem]
如果把 \`x = a + b\` 改成 \`x = a * b\`，输入 \`3 4\` 时输出结果是多少？
[/stem]
[input answer=12 placeholder="请直接填写输出结果"]
[/input]
:::
:::

:::question type=option score=2.5
[stem]
题干（支持 Markdown / LaTeX）
[/stem]
[options answer=A,C]
A. 选项A
B. 选项B
C. 选项C
[/options]
[analysis]
我是本题的解析，可以告诉用户这道题的解题思路，或者写一些相关的知识点。解析部分同样支持 Markdown 和 LaTeX，可以写得很丰富哦，也可以不写。用户无法在测试时查看解析。
[/analysis]
:::

:::question type=input score=3
[stem]
填空题题干，支持 Markdown 和 LaTeX。聪明的你应该也已经看到了，本题没有解析。
[/stem]
[input answer=42 placeholder=这是提示语，可以告诉用户填写的格式，也可以不写]
[/input]
:::`,
        rules: {
          item1: "普通题使用 :::question ... :::。",
          item2: "题干使用 [stem]...[/stem]，支持 Markdown / LaTeX / 代码块。",
          item3: "选择题使用 [options answer=A,C]...[/options]，最多 26 个选项。",
          item4: "填空题使用 [input answer=答案 placeholder=\"提示语\"][/input]。",
          item5: "解析使用 [analysis]...[/analysis]，可选。",
          item6: "材料题用 :::group title=\"阅读程序\" 包住一组小题，并用 [material]...[/material] 放共享代码/材料。",
          item7: "一个 :::group 内可以放很多道 :::question，适合阅读程序、补全代码等。",
          item8: "嵌套可能会产生 bug，目前没有专门测试。"
        },
        errors: {
          titleRequired: "请填写名称。",
          descriptionRequired: "请填写测验描述。",
          durationInvalid: "测试时间长度必须为正数。",
          configRequired: "请填写题目配置文件。",
          idInvalid: "ID 必须是正整数。"
        }
      },
      edit: {
        title: "修改题目",
        subtitle: "保存站有题 / 题库 / 修改题目",
        heading: "修改试卷",
        loading: "题目加载中",
        save: "保存修改",
        deleteButton: "删除试卷",
        updated: "修改成功。",
        deleteTitle: "删除试卷",
        deleteMessage: "确认删除当前试卷吗？删除后不可恢复。",
        deleteConfirm: "确认删除",
        idLabel: "唯一标识符（ID）",
        materialSummary: "材料题语法说明",
        materialIntro: "现在支持两种写法：",
        materialItem1: "普通题：:::question ... :::",
        materialItem2: "材料题：:::group title=\"阅读程序\" + [material]...[/material] + 多个 :::question",
        materialNote1: "适合一段长代码下面挂很多小题的场景，例如 CSP 阅读程序、补全代码、程序理解题。",
        materialNote2: "旧的单题写法也会继续兼容，可以和材料题混写。",
        previewEmpty: "这里会实时渲染你输入的题目配置。"
      },
      detail: {
        pageTitleFallback: "题库 {id}",
        sharedMaterial: "共享材料",
        subtitle: "保存站有题 / 试题列表 / 试题详情",
        loading: "试题加载中",
        exam: "限时测试",
        training: "自由练习",
        edit: "修改题目",
        questionCount: "题目数量",
        duration: "测试时间",
        tabs: {
          description: "试题描述",
          question: "查看题目",
          history: "历史答卷"
        },
        inputPreview: "作答输入框预览",
        score: "本题共 {score} 分",
        showAnswer: "显示答案与解析",
        hideAnswer: "隐藏答案与解析",
        yourAnswer: "你的作答：{answer}",
        emptyAnswer: "（空）",
        earned: "得分：{earned} / {score} 分",
        showAnalysis: "显示解析",
        hideAnalysis: "隐藏解析",
        noHistory: "暂无历史提交。",
        submittedAt: "提交于 {time}",
        recentSubmissions: "最近提交记录",
        expand: "展开",
        collapse: "收起",
        questionList: "题目列表",
        conflictMessage: "{id} - {title} 正在进行中，是否删除上次状态并开始新的测试？（你也可以去个人中心恢复上次考试。）",
        forceStart: "覆盖并开始新测试"
      },
      mode: {
        exam: "限时测试",
        training: "自由练习",
        loading: "题目加载中",
        restoredDraft: "已恢复本地自动保存草稿。",
        activeExamConflict: "检测到你有未完成的限时测试，请先到个人中心恢复。",
        submitTitle: "确认交卷",
        submitMessage: "交卷后会保存记录并显示解析，确认继续吗？",
        submitConfirm: "确认交卷",
        submitCancel: "再检查一下",
        localExamScored: "已完成本地判分。登录后可保存历史记录。",
        examSubmitted: "交卷成功，已生成历史答卷。",
        localTrainingScored: "已完成本地判分。登录后可保存练习记录。",
        trainingSaved: "练习记录已保存。",
        guestTitle: "你未登录！",
        guestMessage: "你当前正在以游客模式作答，成绩不会被保存到个人中心，也无法查看做题记录或调用 AI 来获取提示及解析。",
        noticePrefix: "考试开始后倒计时开始，途中可以暂停，你的答案将间隔一定时间自动保存（",
        noticeLink: "此处设置自动保存间隔",
        noticeSuffix: "）。不小心关闭可到个人中心找回考试页面。",
        correct: "回答正确",
        wrong: "回答错误",
        remainingTime: "剩余时间",
        answered: "已作答",
        correctCount: "正确题数",
        score: "得分",
        pause: "暂停",
        submitNow: "交卷",
        submitAndView: "提交并查看结果",
        saveTraining: "保存练习记录"
      }
    },
    profile: {
      title: "个人中心 - {uid}",
      subtitle: "保存站有题 / 用户中心",
      records: "做题记录",
      problemsets: "TA 的题目",
      loading: "加载用户信息中...",
      activeExam: "正在进行中：",
      resumeExam: "继续本场考试",
      loadingRecords: "加载记录中...",
      noSubmissions: "暂无历史答卷。",
      problemsetFallback: "试卷 {id}",
      viewSubmission: "查看历史答卷",
      recordsHidden: "该用户设置了隐私保护，无法查看练习记录。",
      banned: "该用户已被封禁。",
      bio: "TA 的个人简介",
      bioEmpty: "TA 还没有填写简介。",
      modeExam: "限时训练",
      modeTraining: "练习"
    },
    settings: {
      title: "个人设置",
      subtitle: "保存站有题 / 账户设置",
      loading: "设置加载中",
      saved: "设置已保存。",
      noticeTitle: "注意",
      noticePrefix: "修改后记得点击底部“保存设置”。如需修改头像、显示名称、个人简介，请",
      noticeLink: "前往此处",
      noticeSuffix: "，修改后重新登录才会同步。",
      recordsPublic: "做题记录公开可见",
      public: "公开",
      private: "仅自己和管理员可见",
      analysisMode: "Submission 解析展开策略",
      analysisWrongOnly: "仅展开错题解析",
      analysisNone: "不展开任何解析",
      analysisAll: "展开所有解析",
      analysisDesc: "作用于提交记录页（/problemset/:id?submission=:sid）。",
      autosaveTitle: "作答自动保存间隔",
      autosaveDesc: "用于限时测试和自由练习的本地自动保存恢复。",
      coverUrl: "个人资料背景图 URL",
      coverPlaceholder: "留空则使用默认背景",
      coverDesc: "仅支持 http(s) 链接。",
      clearCover: "清空背景图",
      save: "保存设置",
      autosave: {
        "30": "30 秒",
        "60": "60 秒",
        "120": "120 秒",
        "300": "5 分钟",
        "600": "10 分钟",
        off: "不开启"
      }
    },
    admin: {
      subtitle: "保存站有题 / 管理后台",
      menu: "管理菜单",
      noPermission: "权限不足",
      nav: {
        users: "用户管理",
        problemsets: "试卷管理",
        questions: "试题管理",
        oauth: "OAuth 配置",
        systemPages: "系统页面"
      },
      titles: {
        users: "后台管理 / 用户",
        problemsets: "后台管理 / 试卷",
        questions: "后台管理 / 试题",
        oauth: "后台管理 / OAuth",
        systemPages: "后台管理 / 系统页面"
      },
      common: {
        select: "选择",
        actions: "操作",
        selectAll: "全选",
        clearSelection: "取消全选",
        bulkDelete: "批量删除"
      },
      oauth: {
        saved: "OAuth 配置已保存。",
        tokenCreated: "已创建 admin token：{token}",
        tokenDeleted: "admin token 已删除。",
        configAnchor: "CP OAuth 配置",
        tokenAnchor: "Admin Token",
        configHeading: "CP OAuth 配置",
        configHint: "请在 OAuth 平台把回调地址配置为此处填写的 callbackUrl。",
        clientIdPlaceholder: "请输入 Client ID",
        clientSecretPlaceholder: "请输入 Client Secret",
        save: "保存配置",
        creatingToken: "生成中...",
        createToken: "生成 Token",
        tokenHint: "最多保留 2 个 token；长度 32 位，包含大小写字母和数字，校验区分大小写。",
        createdBy: "创建人",
        createdAt: "创建时间",
        noTokens: "暂无 token"
      },
      systemPages: {
        settingsSaved: "System page settings saved.",
        updated: "System page updated.",
        created: "System page created.",
        deleted: "System page deleted.",
        deleteTitle: "Delete system page",
        deleteMessage: "Delete \"{title}\"? Its URL will stop working after removal.",
        siteSettings: "Site Settings",
        customPages: "Custom Pages",
        pageEditor: "Page Editor",
        loginNotice: "Login Page Notice",
        markdownPlaceholder: "Markdown supported",
        path: "Path",
        pageTitle: "Title",
        markdownContent: "Markdown Content",
        saveSettings: "Save Site Settings",
        newPage: "New Page",
        updatedAt: "Updated At",
        empty: "No custom system pages yet.",
        editPage: "Edit System Page",
        createPage: "Create System Page",
        urlSlug: "URL Slug",
        slugPlaceholder: "about-us",
        titlePlaceholder: "About Us",
        slugFallback: "your-page-slug",
        savePage: "Save Page"
      },
      problemsets: {
        selectEditFirst: "请先从试卷列表选择“编辑”。",
        updated: "试卷 {id} 更新成功。",
        deleteTitle: "删除试卷",
        deleteMessage: "确认删除试卷 {id} 及其所有试题吗？",
        deleted: "试卷 {id} 已删除。",
        selectFirst: "请先勾选试卷。",
        bulkDeleteTitle: "批量删除试卷",
        bulkDeleteMessage: "将删除 {count} 个试卷及其题目，此操作不可恢复。",
        bulkDeleteConfirm: "确认删除",
        deleteFailed: "试卷 {id} 删除失败：{reason}",
        bulkDeleted: "批量删除完成：{success}/{total}",
        listAnchor: "试卷列表",
        editAnchor: "编辑试卷",
        createAnchor: "创建试卷",
        listHeading: "试卷列表",
        durationHours: "时长(小时)",
        questionCount: "题目数",
        editHeading: "编辑试卷",
        editHint: "先在试卷列表中点击“编辑”。",
        save: "保存试卷"
      },
      users: {
        selectEditFirst: "请先从用户列表选择一个用户进行编辑。",
        updated: "用户 {uid} 更新成功。",
        selectFirst: "请先勾选要操作的用户。",
        selectedCount: "当前选中：{count} 人",
        continue: "继续执行",
        operationFailed: "用户 {uid} 处理失败：{reason}",
        batchCompleted: "批量操作完成：成功 {success}/{total}。",
        batchPromoteTitle: "批量提权",
        batchPromoteMessage: "将选中用户提升为管理员。",
        batchDemoteTitle: "批量解除管理员",
        batchDemoteMessage: "将移除选中用户的管理员权限。",
        batchBanTitle: "批量封禁",
        batchBanMessage: "将封禁选中用户。",
        batchUnbanTitle: "批量解封",
        batchUnbanMessage: "将解封选中用户。",
        batchDeleteTitle: "批量删除用户",
        batchDeleteMessage: "删除后不可恢复。",
        cannotDemoteSelf: "不能解除当前登录管理员自己的权限。",
        promoted: "{uid} 已提升为管理员。",
        demoted: "{uid} 已解除管理员。",
        cannotBanSelf: "不能封禁当前登录管理员。",
        banned: "{uid} 已封禁。",
        unbanned: "{uid} 已解封。",
        listAnchor: "用户列表",
        editAnchor: "编辑用户",
        listHeading: "用户列表",
        selfHint: "提示：管理员不会封禁/删除/降权自己。",
        username: "显示名称",
        email: "邮箱",
        admin: "管理员",
        bannedLabel: "封禁",
        demote: "解除提权",
        promote: "提权",
        unban: "解封",
        ban: "封禁",
        editHeading: "编辑用户",
        editHint: "先在上面列表点击“编辑”自动带入。",
        editable: "可修改",
        newPassword: "新密码",
        passwordPlaceholder: "留空不改",
        save: "保存修改"
      },
      questions: {
        selectFirst: "请先勾选要删除的题目。",
        bulkDeleteTitle: "批量删除题目",
        bulkDeleteMessage: "确认删除 {count} 道题目吗？",
        bulkDeleteConfirm: "确认删除",
        deleteFailed: "题目 #{id} 删除失败：{reason}",
        bulkDeleted: "批量删除完成：{success}/{total}",
        selectProblemsetFirst: "请先选择试卷。",
        updated: "题目 #{id} 更新成功。",
        created: "题目创建成功。",
        deleteTitle: "删除题目",
        deleteMessage: "确认删除题目 #{id} 吗？",
        deleted: "题目 #{id} 已删除。",
        listAnchor: "题目列表",
        editAnchor: "编辑题目",
        heading: "题目管理",
        refreshProblemsets: "刷新试卷",
        refreshQuestions: "刷新题目",
        stem: "题干",
        score: "分值",
        answer: "答案",
        editTitle: "编辑题目 #{id}",
        createTitle: "新建题目",
        index: "题号",
        indexPlaceholder: "留空自动追加",
        questionType: "题型",
        options: "选项（每行一个，示例 A. 选项A）",
        inputPlaceholder: "输入框提示",
        answerPlaceholder: "选择题示例 A,C",
        deleteCurrent: "删除当前题目"
      }
    },
    parser: {
      blockNotClosed: "第 {line} 行开始的 :::{kind} 没有找到结束标记 :::",
      questionTypeInvalid: "第 {line} 行的题目 type 只支持 option 或 input",
      questionScoreInvalid: "第 {line} 行的题目 score 必须为正数",
      questionStemMissing: "第 {line} 行的题目缺少 [stem]...[/stem]",
      optionSectionMissing: "第 {line} 行的选择题缺少 [options answer=A]...[/options]",
      optionCountInvalid: "第 {line} 行的选择题选项数量必须在 2 到 26 之间",
      optionAnswerMissing: "第 {line} 行的选择题 answer 不能为空，例如 answer=A 或 answer=A,C",
      inputSectionMissing: "第 {line} 行的填空题缺少 [input answer=xxx placeholder=提示]...[/input]",
      inputAnswerMissing: "第 {line} 行的填空题 answer 不能为空",
      groupMaterialMissing: "第 {line} 行的 :::group 缺少 [material]...[/material]",
      groupQuestionMissing: "第 {line} 行的 :::group 下面至少要包含一道 :::question",
      groupNestedUnsupported: "第 {line} 行的 :::group 内暂不支持再嵌套 :::group",
      noQuestionParsed: "没有解析到题目，请检查配置格式。"
    }
  },
  "en-US": {
    common: {
      appName: "Luogu Saver Quiz",
      loading: "Loading...",
      loadingPage: "Page loading",
      save: "Save",
      saving: "Saving...",
      create: "Create",
      creating: "Creating...",
      update: "Update",
      delete: "Delete",
      deleting: "Deleting...",
      edit: "Edit",
      preview: "Preview",
      reset: "Reset",
      refresh: "Refresh",
      search: "Search",
      cancel: "Cancel",
      confirm: "Confirm",
      submit: "Submit",
      back: "Back",
      open: "Open",
      yes: "Yes",
      no: "No",
      days: "days",
      minutes: "minutes",
      hours: "hours",
      points: "pts",
      questions: "questions",
      success: "Success",
      error: "Error",
      tip: "Notice",
      pleaseConfirm: "Please confirm",
      notFound: "The requested page was not found.",
      invalidUser: "Invalid user.",
      loginFirst: "Please log in first.",
      goLogin: "Go to login",
      empty: "No content",
      all: "All"
    },
    locale: {
      label: "Language",
      zhCN: "简体中文",
      enUS: "English",
      jaJP: "日本語",
      origin: "Origin"
    },
    feedback: {
      defaultToastTitle: "Notice"
    },
    confirm: {
      ok: "Confirm",
      cancel: "Cancel"
    },
    unsaved: {
      title: "Leave this editor?",
      message: "You have unsaved changes. Leaving or refreshing this page will discard them. Continue?",
      leave: "Leave",
      stay: "Keep editing",
      answerTitle: "Leave this attempt?",
      answerMessage: "Your latest answers may be lost if you leave or refresh now. Continue?",
      continueAnswering: "Keep answering"
    },
    layout: {
      siteTitleSuffix: "Luogu Saver Quiz",
      nav: {
        problemsets: "Problemsets",
        createProblemset: "Create",
        search: "Search",
        home: "Home"
      },
      navTitle: {
        problemsets: "Problemsets",
        createProblemset: "Create problemset",
        search: "Search problemsets",
        home: "Open luogu.me"
      },
      themeToLight: "Switch to light mode",
      themeToDark: "Switch to dark mode",
      profile: "Profile",
      settings: "Settings",
      admin: "Admin",
      logout: "Log out",
      loginOrRegister: "Log in / Sign up"
    },
    footer: {
      copyright: "2025-2026 Luogu Saver Quiz",
      running: "Site uptime",
      developers: "Developers: Federico2903 & Murasame & quanac-lcx",
      qqGroup: "User group: 1017248143 (click to join)",
      sponsor: "Powered by Rainyun"
    },
    auth: {
      loginRegister: "Log in / Sign up",
      loginSubtitle: "Log in / Sign up",
      loginTitle: "Log in / Sign up",
      loginTipPrefix: "Use",
      loginTipSuffix: "to log in or sign up. New users will be registered automatically.",
      loginPolicyTip: "By continuing, you agree to this site's and CP OAuth's agreements, terms, and policies.",
      userAgreement: "User Agreement",
      privacyPolicy: "Privacy Policy",
      continueWithCpoauth: "Continue with CP OAuth",
      adminToken: "Admin Token",
      adminTokenInvalid: "Invalid format",
      loginWithAdminToken: "Log in with Admin Token",
      loggingIn: "Logging in...",
      callbackProcessing: "Processing CP OAuth sign-in...",
      callbackFailed: "CP OAuth sign-in failed",
      callbackTitle: "CP OAuth Sign-in",
      callbackPending: "Please wait while we redirect you...",
      callbackBack: "Back to login",
      callbackMissingTicket: "Missing ticket. Unable to complete sign-in.",
      bannedTitle: "Something went wrong",
      bannedSubtitle: "Luogu Saver Quiz / Error",
      bannedHeading: "This account has been banned",
      bannedText: "This account can no longer access the site.",
      bannedContact: "For appeals, contact: i@hiac.me"
    },
    api: {
      backendUnavailable: "Backend unavailable: {url} (start the server first)",
      forbidden: "forbidden"
    },
    systemPage: {
      title: "System Page",
      subtitle: "System Page",
      loading: "Loading page...",
      updatedAt: "Last updated: {time}",
      notFoundTitle: "404"
    },
    problemset: {
      types: {
        officialPublic: "Official",
        personalFeatured: "Featured",
        personalPublic: "Public",
        personalPrivate: "Private",
        other: "Other"
      },
      common: {
        name: "Name",
        description: "Description",
        durationMinutes: "Duration (minutes)",
        type: "Visibility",
        config: "Question config",
        livePreview: "Live preview",
        questionNumber: "Question {index}",
        materialGroupWithIndex: "Material set {index}",
        materialQuestionIndex: "Material question {index}",
        subQuestion: "sub-question",
        input: "Input",
        option: "Choice",
        analysis: "Analysis:",
        answerLabel: "Answer: {answer}",
        answerPlaceholder: "Enter your answer",
        typeLabel: "Type: {type} | Score: {score}"
      },
      list: {
        title: "Problemsets",
        subtitle: "Luogu Saver Quiz / Problemsets",
        official: "Official",
        featured: "Featured",
        create: "Create problemset",
        empty: "No problemsets in this tab yet"
      },
      search: {
        title: "Search",
        subtitle: "Luogu Saver Quiz / Search",
        placeholder: "Search by problemset ID, title, description, or author",
        back: "Back to problemsets",
        searching: "Searching...",
        idle: "Type something and press Enter to search.",
        empty: "No matching official, featured, or public problemsets were found"
      },
      create: {
        title: "Create Problemset",
        subtitle: "Luogu Saver Quiz / Problemsets / Create",
        heading: "Create problemset",
        adminIdPlaceholder: "Admins can set a custom ID. Leave blank to auto-assign.",
        namePlaceholder: "Enter a name",
        descriptionPlaceholder: "For example: 25 questions including reading code, fill-in-the-blank, and multiple choice.",
        configSummary: "Config format",
        configPlaceholder: "Follow the rules above. You can also insert the template below to get familiar with the format. The content will render live.",
        previewEmpty: "Enter some config text to preview it here",
        fillTemplate: "Insert template",
        submit: "Create problemset",
        parsedCount: "{count} questions parsed",
        materialGroupCount: ", including {count} material groups",
        created: "Created successfully. Problemset ID: {id}",
        ruleTemplate: `:::group title="Read the program"
[material]
Read the program below and answer the questions.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int x = a + b;
    cout << x << endl;
    return 0;
}
\`\`\`
[/material]

:::question type=option score=2
[stem]
If the input is \`3 4\`, what will be printed?
[/stem]
[options answer=B]
A. 5
B. 7
C. 9
D. 11
[/options]
[analysis]
3+4=7, so the output is 7.
[/analysis]
:::

:::question type=input score=2
[stem]
If \`x = a + b\` is changed to \`x = a * b\`, what will be printed for input \`3 4\`?
[/stem]
[input answer=12 placeholder="Write the exact output"]
[/input]
:::
:::

:::question type=option score=2.5
[stem]
Question stem (Markdown / LaTeX supported)
[/stem]
[options answer=A,C]
A. Option A
B. Option B
C. Option C
[/options]
[analysis]
This is the explanation block. You can describe the solution idea or add related notes here. Markdown and LaTeX are both supported.
[/analysis]
:::

:::question type=input score=3
[stem]
This is an input question stem with Markdown and LaTeX support. This sample intentionally has no explanation.
[/stem]
[input answer=42 placeholder="Optional hint for the expected format"]
[/input]
:::`,
        rules: {
          item1: "Use :::question ... ::: for a normal question.",
          item2: "Use [stem]...[/stem] for the stem. Markdown, LaTeX, and code blocks are supported.",
          item3: "Use [options answer=A,C]...[/options] for multiple choice questions, with up to 26 options.",
          item4: "Use [input answer=answer placeholder=\"hint\"][/input] for input questions.",
          item5: "Use [analysis]...[/analysis] for optional explanations.",
          item6: "Wrap a material group with :::group title=\"Read the program\" and place shared content inside [material]...[/material].",
          item7: "A single :::group can contain many :::question blocks, which works well for reading-code style tasks.",
          item8: "Nested groups may be buggy and are not officially tested yet."
        },
        errors: {
          titleRequired: "Please enter a name.",
          descriptionRequired: "Please enter a description.",
          durationInvalid: "Duration must be a positive number.",
          configRequired: "Please enter the question config.",
          idInvalid: "ID must be a positive integer."
        }
      },
      edit: {
        title: "Edit Problemset",
        subtitle: "Luogu Saver Quiz / Problemsets / Edit",
        heading: "Edit problemset",
        loading: "Loading problemset",
        save: "Save changes",
        deleteButton: "Delete problemset",
        updated: "Updated successfully.",
        deleteTitle: "Delete problemset",
        deleteMessage: "Delete this problemset permanently? This cannot be undone.",
        deleteConfirm: "Delete",
        idLabel: "Unique identifier (ID)",
        materialSummary: "Material question syntax",
        materialIntro: "Two styles are supported now:",
        materialItem1: "Normal question: :::question ... :::",
        materialItem2: "Material question: :::group title=\"Read the program\" + [material]...[/material] + multiple :::question blocks",
        materialNote1: "This works well when many small questions share a long code snippet, such as CSP reading-code tasks.",
        materialNote2: "The old single-question format is still supported and can be mixed with material groups.",
        previewEmpty: "Your config will render here in real time."
      },
      detail: {
        pageTitleFallback: "Problemsets {id}",
        sharedMaterial: "Shared material",
        subtitle: "Luogu Saver Quiz / Problemsets / Detail",
        loading: "Loading problemset",
        exam: "Timed exam",
        training: "Free practice",
        edit: "Edit problemset",
        questionCount: "Questions",
        duration: "Duration",
        tabs: {
          description: "Description",
          question: "Questions",
          history: "History"
        },
        inputPreview: "Input preview",
        score: "Score: {score}",
        showAnswer: "Show answer and analysis",
        hideAnswer: "Hide answer and analysis",
        yourAnswer: "Your answer: {answer}",
        emptyAnswer: "(empty)",
        earned: "Score: {earned} / {score}",
        showAnalysis: "Show analysis",
        hideAnalysis: "Hide analysis",
        noHistory: "No history yet.",
        submittedAt: "Submitted at {time}",
        recentSubmissions: "Recent submissions",
        expand: "Expand",
        collapse: "Collapse",
        questionList: "Question list",
        conflictMessage: "{id} - {title} is already in progress. Start a new timed exam and discard the previous state? You can also resume it from your profile.",
        forceStart: "Discard and start new exam"
      },
      mode: {
        exam: "Timed exam",
        training: "Free practice",
        loading: "Loading questions",
        restoredDraft: "Recovered the local autosave draft.",
        activeExamConflict: "A timed exam is already in progress. Please resume it from your profile first.",
        submitTitle: "Submit now?",
        submitMessage: "Submitting will save the record and reveal the explanations. Continue?",
        submitConfirm: "Submit",
        submitCancel: "Review once more",
        localExamScored: "Scored locally. Sign in to save the submission history.",
        examSubmitted: "Submitted successfully. A history record has been created.",
        localTrainingScored: "Scored locally. Sign in to save the practice record.",
        trainingSaved: "Practice record saved.",
        guestTitle: "You are not signed in",
        guestMessage: "You are answering in guest mode. Scores will not be saved to your profile, and you will not be able to view history or use AI hints and explanations.",
        noticePrefix: "The countdown starts when the exam begins. You can pause during the exam, and your answers will autosave at intervals (",
        noticeLink: "configure autosave interval here",
        noticeSuffix: "). If you close the page accidentally, you can resume it from your profile.",
        correct: "Correct",
        wrong: "Incorrect",
        remainingTime: "Remaining time",
        answered: "Answered",
        correctCount: "Correct",
        score: "Score",
        pause: "Pause",
        submitNow: "Submit",
        submitAndView: "Submit and view result",
        saveTraining: "Save practice record"
      }
    },
    profile: {
      title: "Profile - {uid}",
      subtitle: "Luogu Saver Quiz / Profile",
      records: "Records",
      problemsets: "Problemsets",
      loading: "Loading user profile...",
      activeExam: "Currently active:",
      resumeExam: "Resume this exam",
      loadingRecords: "Loading records...",
      noSubmissions: "No submissions yet.",
      problemsetFallback: "Problemset {id}",
      viewSubmission: "View submission",
      recordsHidden: "This user has hidden their practice records.",
      banned: "This user has been banned.",
      bio: "Bio",
      bioEmpty: "This user has not written a bio yet.",
      modeExam: "Timed exam",
      modeTraining: "Practice"
    },
    settings: {
      title: "Settings",
      subtitle: "Luogu Saver Quiz / Account settings",
      loading: "Loading settings",
      saved: "Settings saved.",
      noticeTitle: "Note",
      noticePrefix: "Remember to click Save Settings below. To change your avatar, display name, or bio, visit ",
      noticeLink: "this page",
      noticeSuffix: " and then sign in again to sync the updates.",
      recordsPublic: "Make practice records public",
      public: "Public",
      private: "Only visible to you and admins",
      analysisMode: "Submission analysis expansion",
      analysisWrongOnly: "Expand explanations for wrong answers only",
      analysisNone: "Do not expand any explanation",
      analysisAll: "Expand all explanations",
      analysisDesc: "Applies to the submission detail page (/problemset/:id?submission=:sid).",
      autosaveTitle: "Autosave interval",
      autosaveDesc: "Used for local autosave recovery in timed exams and free practice.",
      coverUrl: "Profile cover URL",
      coverPlaceholder: "Leave empty to use the default cover",
      coverDesc: "Only http(s) URLs are supported.",
      clearCover: "Clear cover image",
      save: "Save settings",
      autosave: {
        "30": "30 seconds",
        "60": "60 seconds",
        "120": "120 seconds",
        "300": "5 minutes",
        "600": "10 minutes",
        off: "Disabled"
      }
    },
    admin: {
      subtitle: "Luogu Saver Quiz / Admin",
      menu: "Admin menu",
      noPermission: "Insufficient permissions",
      nav: {
        users: "Users",
        problemsets: "Problemsets",
        questions: "Questions",
        oauth: "OAuth",
        systemPages: "System Pages"
      },
      titles: {
        users: "Admin / Users",
        problemsets: "Admin / Problemsets",
        questions: "Admin / Questions",
        oauth: "Admin / OAuth",
        systemPages: "Admin / System Pages"
      },
      common: {
        select: "Select",
        actions: "Actions",
        selectAll: "Select all",
        clearSelection: "Clear selection",
        bulkDelete: "Bulk delete"
      },
      oauth: {
        saved: "OAuth config saved.",
        tokenCreated: "Created admin token: {token}",
        tokenDeleted: "Admin token deleted.",
        configAnchor: "CP OAuth",
        tokenAnchor: "Admin Token",
        configHeading: "CP OAuth Config",
        configHint: "Configure the OAuth platform callback URL to match the callbackUrl entered here.",
        clientIdPlaceholder: "Enter Client ID",
        clientSecretPlaceholder: "Enter Client Secret",
        save: "Save config",
        creatingToken: "Creating...",
        createToken: "Create token",
        tokenHint: "Keep at most 2 tokens. Each token is 32 characters long and case-sensitive.",
        createdBy: "Created by",
        createdAt: "Created at",
        noTokens: "No tokens yet"
      },
      systemPages: {
        settingsSaved: "System page settings saved.",
        updated: "System page updated.",
        created: "System page created.",
        deleted: "System page deleted.",
        deleteTitle: "Delete system page",
        deleteMessage: "Delete \"{title}\"? Its URL will stop working after removal.",
        siteSettings: "Site Settings",
        customPages: "Custom Pages",
        pageEditor: "Page Editor",
        loginNotice: "Login Page Notice",
        markdownPlaceholder: "Markdown supported",
        path: "Path",
        pageTitle: "Title",
        markdownContent: "Markdown Content",
        saveSettings: "Save Site Settings",
        newPage: "New Page",
        updatedAt: "Updated At",
        empty: "No custom system pages yet.",
        editPage: "Edit System Page",
        createPage: "Create System Page",
        urlSlug: "URL Slug",
        slugPlaceholder: "about-us",
        titlePlaceholder: "About Us",
        slugFallback: "your-page-slug",
        savePage: "Save Page"
      },
      problemsets: {
        selectEditFirst: "Choose a problemset from the list before editing.",
        updated: "Problemset {id} updated.",
        deleteTitle: "Delete problemset",
        deleteMessage: "Delete problemset {id} and all of its questions?",
        deleted: "Problemset {id} deleted.",
        selectFirst: "Select at least one problemset first.",
        bulkDeleteTitle: "Bulk delete problemsets",
        bulkDeleteMessage: "Delete {count} problemsets and all of their questions? This cannot be undone.",
        bulkDeleteConfirm: "Delete selected",
        deleteFailed: "Failed to delete problemset {id}: {reason}",
        bulkDeleted: "Bulk delete finished: {success}/{total}",
        listAnchor: "Problemset list",
        editAnchor: "Edit problemset",
        createAnchor: "Create problemset",
        listHeading: "Problemset list",
        durationHours: "Duration (hours)",
        questionCount: "Questions",
        editHeading: "Edit problemset",
        editHint: "Click Edit in the list above to load a problemset here.",
        save: "Save problemset"
      },
      users: {
        selectEditFirst: "Choose a user from the list before editing.",
        updated: "User {uid} updated.",
        selectFirst: "Select at least one user first.",
        selectedCount: "Selected: {count}",
        continue: "Continue",
        operationFailed: "Failed to process user {uid}: {reason}",
        batchCompleted: "Batch completed: {success}/{total} succeeded.",
        batchPromoteTitle: "Promote selected",
        batchPromoteMessage: "Promote the selected users to admins.",
        batchDemoteTitle: "Demote selected",
        batchDemoteMessage: "Remove admin privileges from the selected users.",
        batchBanTitle: "Ban selected",
        batchBanMessage: "Ban the selected users.",
        batchUnbanTitle: "Unban selected",
        batchUnbanMessage: "Unban the selected users.",
        batchDeleteTitle: "Delete selected",
        batchDeleteMessage: "Delete the selected users permanently.",
        cannotDemoteSelf: "You cannot remove admin privileges from the current admin account.",
        promoted: "{uid} is now an admin.",
        demoted: "{uid} is no longer an admin.",
        cannotBanSelf: "You cannot ban the current admin account.",
        banned: "{uid} has been banned.",
        unbanned: "{uid} has been unbanned.",
        listAnchor: "User list",
        editAnchor: "Edit user",
        listHeading: "User list",
        selfHint: "Admins will not ban, delete, or demote themselves.",
        username: "Display name",
        email: "Email",
        admin: "Admin",
        bannedLabel: "Banned",
        demote: "Demote",
        promote: "Promote",
        unban: "Unban",
        ban: "Ban",
        editHeading: "Edit user",
        editHint: "Click Edit in the list above to populate this form.",
        editable: "Editable",
        newPassword: "New password",
        passwordPlaceholder: "Leave empty to keep unchanged",
        save: "Save changes"
      },
      questions: {
        selectFirst: "Select at least one question first.",
        bulkDeleteTitle: "Bulk delete questions",
        bulkDeleteMessage: "Delete {count} questions?",
        bulkDeleteConfirm: "Delete selected",
        deleteFailed: "Failed to delete question #{id}: {reason}",
        bulkDeleted: "Bulk delete finished: {success}/{total}",
        selectProblemsetFirst: "Choose a problemset first.",
        updated: "Question #{id} updated.",
        created: "Question created.",
        deleteTitle: "Delete question",
        deleteMessage: "Delete question #{id}?",
        deleted: "Question #{id} deleted.",
        listAnchor: "Question list",
        editAnchor: "Edit question",
        heading: "Question manager",
        refreshProblemsets: "Refresh problemsets",
        refreshQuestions: "Refresh questions",
        stem: "Stem",
        score: "Score",
        answer: "Answer",
        editTitle: "Edit question #{id}",
        createTitle: "Create question",
        index: "Index",
        indexPlaceholder: "Leave empty to append automatically",
        questionType: "Question type",
        options: "Choices (one per line, e.g. A. Option A)",
        inputPlaceholder: "Input placeholder",
        answerPlaceholder: "For choice questions, e.g. A,C",
        deleteCurrent: "Delete current question"
      }
    },
    parser: {
      blockNotClosed: "The block starting at line {line} with :::{kind} is missing a closing ::: marker",
      questionTypeInvalid: "Question at line {line} only supports type=option or type=input",
      questionScoreInvalid: "Question at line {line} must have a positive score",
      questionStemMissing: "Question at line {line} is missing [stem]...[/stem]",
      optionSectionMissing: "Option question at line {line} is missing [options answer=A]...[/options]",
      optionCountInvalid: "Option question at line {line} must have between 2 and 26 choices",
      optionAnswerMissing: "Option question at line {line} needs a non-empty answer, such as answer=A or answer=A,C",
      inputSectionMissing: "Input question at line {line} is missing [input answer=xxx placeholder=hint]...[/input]",
      inputAnswerMissing: "Input question at line {line} needs a non-empty answer",
      groupMaterialMissing: ":::group at line {line} is missing [material]...[/material]",
      groupQuestionMissing: ":::group at line {line} must contain at least one :::question",
      groupNestedUnsupported: "Nested :::group blocks are not supported inside the :::group at line {line}",
      noQuestionParsed: "No questions were parsed. Please check the config format."
    }
  }
} as const;

const jaMessages = {
  ...baseMessages["en-US"],
  common: {
    ...baseMessages["en-US"].common,
    loading: "読み込み中...",
    loadingPage: "ページを読み込み中",
    save: "保存",
    saving: "保存中...",
    create: "作成",
    creating: "作成中...",
    update: "更新",
    delete: "削除",
    deleting: "削除中...",
    edit: "編集",
    preview: "プレビュー",
    reset: "リセット",
    refresh: "更新",
    search: "検索",
    cancel: "キャンセル",
    confirm: "確認",
    submit: "送信",
    back: "戻る",
    open: "開く",
    yes: "はい",
    no: "いいえ",
    days: "日",
    minutes: "分",
    hours: "時間",
    points: "点",
    questions: "問",
    success: "成功",
    error: "エラー",
    tip: "通知",
    pleaseConfirm: "確認してください",
    notFound: "該当ページが見つかりません。",
    invalidUser: "無効なユーザーです。",
    loginFirst: "先にログインしてください。",
    goLogin: "ログインへ",
    empty: "内容がありません",
    all: "すべて"
  },
  locale: {
    label: "言語",
    zhCN: "简体中文",
    enUS: "English",
    jaJP: "日本語",
    origin: "Origin"
  },
  feedback: {
    defaultToastTitle: "通知"
  },
  confirm: {
    ok: "確認",
    cancel: "キャンセル"
  },
  unsaved: {
    ...baseMessages["en-US"].unsaved,
    title: "この編集画面を離れますか？",
    message: "未保存の変更があります。このページを離れるか再読み込みすると変更は失われます。続行しますか？",
    leave: "離れる",
    stay: "編集を続ける",
    answerTitle: "この解答画面を離れますか？",
    answerMessage: "このまま離れるか再読み込みすると最新の解答内容が失われる可能性があります。続行しますか？",
    continueAnswering: "解答を続ける"
  },
  layout: {
    ...baseMessages["en-US"].layout,
    nav: {
      ...baseMessages["en-US"].layout.nav,
      problemsets: "問題セット",
      createProblemset: "新規作成",
      search: "検索",
      home: "ホーム"
    },
    navTitle: {
      ...baseMessages["en-US"].layout.navTitle,
      problemsets: "問題セット",
      createProblemset: "問題セットを作成",
      search: "問題セットを検索",
      home: "luogu.me を開く"
    },
    themeToLight: "ライトモードに切り替え",
    themeToDark: "ダークモードに切り替え",
    profile: "プロフィール",
    settings: "設定",
    admin: "管理",
    logout: "ログアウト",
    loginOrRegister: "ログイン / 登録"
  },
  footer: {
    ...baseMessages["en-US"].footer,
    running: "稼働日数",
    developers: "開発者: Federico2903 & Murasame & quanac-lcx",
    qqGroup: "ユーザーグループ: 1017248143（クリックで参加）",
    sponsor: "Rainyun 提供"
  },
  auth: {
    ...baseMessages["en-US"].auth,
    loginRegister: "ログイン / 登録",
    loginSubtitle: "ログイン / 登録",
    loginTitle: "ログイン / 登録",
    loginTipPrefix: "",
    loginTipSuffix: " でログインまたは登録できます。未登録ユーザーは自動で登録されます。",
    loginPolicyTip: "続行すると、このサイトと CP OAuth の規約・ポリシーに同意したものとみなされます。",
    userAgreement: "利用規約",
    privacyPolicy: "プライバシーポリシー",
    continueWithCpoauth: "CP OAuth で続行",
    adminTokenInvalid: "形式が正しくありません",
    loginWithAdminToken: "Admin Token でログイン",
    loggingIn: "ログイン中...",
    callbackProcessing: "CP OAuth ログインを処理中...",
    callbackFailed: "CP OAuth ログインに失敗しました",
    callbackTitle: "CP OAuth ログイン",
    callbackPending: "リダイレクト中です。しばらくお待ちください...",
    callbackBack: "ログインページへ戻る",
    callbackMissingTicket: "ticket がないためログインを完了できません。",
    bannedTitle: "エラーが発生しました",
    bannedHeading: "このアカウントは停止されています",
    bannedText: "このアカウントでは現在サイトにアクセスできません。",
    bannedContact: "異議申し立て先: i@hiac.me"
  },
  systemPage: {
    ...baseMessages["en-US"].systemPage,
    title: "システムページ",
    subtitle: "システムページ",
    loading: "ページを読み込み中...",
    updatedAt: "最終更新: {time}"
  },
  problemset: {
    ...baseMessages["en-US"].problemset,
    types: {
      ...baseMessages["en-US"].problemset.types,
      officialPublic: "公式公開",
      personalFeatured: "個人おすすめ",
      personalPublic: "個人公開",
      personalPrivate: "個人非公開",
      other: "その他"
    },
    common: {
      ...baseMessages["en-US"].problemset.common,
      name: "名前",
      description: "説明",
      durationMinutes: "制限時間（分）",
      type: "種類",
      config: "問題設定",
      livePreview: "ライブプレビュー",
      questionNumber: "第 {index} 問",
      materialGroupWithIndex: "資料問題 {index}",
      materialQuestionIndex: "資料問題 {index}",
      subQuestion: "小問",
      input: "記述",
      option: "選択",
      analysis: "解説:",
      answerLabel: "正答: {answer}",
      answerPlaceholder: "解答を入力してください",
      typeLabel: "種類: {type} | 配点: {score}"
    },
    list: {
      ...baseMessages["en-US"].problemset.list,
      title: "問題セット",
      official: "公式",
      featured: "おすすめ",
      create: "問題セットを作成",
      empty: "このタブには問題セットがありません"
    },
    search: {
      ...baseMessages["en-US"].problemset.search,
      title: "検索",
      placeholder: "問題セット ID、タイトル、説明、作成者で検索",
      back: "問題セットへ戻る",
      searching: "検索中...",
      idle: "文字を入力して Enter で検索してください。",
      empty: "一致する公開問題セットが見つかりませんでした"
    },
    create: {
      ...baseMessages["en-US"].problemset.create,
      title: "問題セット作成",
      heading: "問題セットを作成",
      adminIdPlaceholder: "管理者はカスタム ID を指定できます。空欄なら自動採番されます。",
      namePlaceholder: "名前を入力",
      descriptionPlaceholder: "例: 読解、穴埋め、選択式を含む 25 問構成。",
      configSummary: "設定フォーマット",
      configPlaceholder: "上のルールに従って入力してください。下のテンプレートで形式も確認できます。",
      previewEmpty: "設定テキストを入力するとここにプレビューされます",
      fillTemplate: "テンプレートを挿入",
      submit: "問題セットを作成",
      parsedCount: "{count} 問を解析しました",
      materialGroupCount: "（資料問題グループ {count} 件）",
      created: "作成しました。問題セット ID: {id}",
      errors: {
        ...baseMessages["en-US"].problemset.create.errors,
        titleRequired: "名前を入力してください。",
        descriptionRequired: "説明を入力してください。",
        durationInvalid: "制限時間は正の数である必要があります。",
        configRequired: "問題設定を入力してください。",
        idInvalid: "ID は正の整数である必要があります。"
      }
    },
    edit: {
      ...baseMessages["en-US"].problemset.edit,
      title: "問題セット編集",
      heading: "問題セットを編集",
      loading: "問題セットを読み込み中",
      save: "変更を保存",
      deleteButton: "問題セットを削除",
      updated: "更新しました。"
    },
    detail: {
      ...baseMessages["en-US"].problemset.detail,
      pageTitleFallback: "問題セット {id}",
      sharedMaterial: "共通資料",
      loading: "問題セットを読み込み中",
      exam: "時間制テスト",
      training: "自由練習",
      edit: "編集",
      questionCount: "問題数",
      duration: "制限時間",
      inputPreview: "入力欄プレビュー",
      score: "配点: {score}",
      showAnswer: "答えと解説を表示",
      hideAnswer: "答えと解説を非表示",
      yourAnswer: "あなたの解答: {answer}",
      emptyAnswer: "(空)",
      earned: "得点: {earned} / {score}",
      showAnalysis: "解説を表示",
      hideAnalysis: "解説を非表示",
      noHistory: "履歴がありません。",
      submittedAt: "提出日時: {time}",
      recentSubmissions: "最近の提出",
      expand: "展開",
      collapse: "折りたたむ",
      questionList: "問題一覧",
      forceStart: "破棄して新規開始"
    },
    mode: {
      ...baseMessages["en-US"].problemset.mode,
      exam: "時間制テスト",
      training: "自由練習",
      loading: "問題を読み込み中",
      restoredDraft: "ローカル自動保存の下書きを復元しました。",
      activeExamConflict: "未完了の時間制テストがあります。先にプロフィールから再開してください。",
      submitTitle: "提出しますか？",
      submitMessage: "提出すると記録が保存され、解説が表示されます。続行しますか？",
      submitConfirm: "提出",
      submitCancel: "もう一度確認する",
      localExamScored: "ローカル採点を完了しました。履歴を保存するにはログインしてください。",
      examSubmitted: "提出しました。履歴記録を作成しました。",
      localTrainingScored: "ローカル採点を完了しました。練習記録を保存するにはログインしてください。",
      trainingSaved: "練習記録を保存しました。",
      guestTitle: "ログインしていません",
      guestMessage: "現在はゲストモードで解答中です。成績はプロフィールに保存されず、履歴や AI のヒント・解説も利用できません。",
      noticePrefix: "試験開始後にカウントダウンが始まります。途中で一時停止でき、解答は一定間隔で自動保存されます（",
      noticeLink: "自動保存間隔の設定はこちら",
      noticeSuffix: "）。誤って閉じた場合はプロフィールから再開できます。",
      correct: "正解",
      wrong: "不正解",
      remainingTime: "残り時間",
      answered: "解答済み",
      correctCount: "正解数",
      score: "得点",
      pause: "一時停止",
      submitNow: "提出",
      submitAndView: "提出して結果を見る",
      saveTraining: "練習記録を保存"
    }
  },
  profile: {
    ...baseMessages["en-US"].profile,
    title: "プロフィール - {uid}",
    records: "記録",
    problemsets: "問題セット",
    loading: "プロフィールを読み込み中...",
    activeExam: "進行中:",
    resumeExam: "この試験を再開",
    loadingRecords: "記録を読み込み中...",
    noSubmissions: "提出履歴はありません。",
    viewSubmission: "提出結果を見る",
    recordsHidden: "このユーザーは練習記録を非公開にしています。",
    banned: "このユーザーは停止されています。",
    bio: "自己紹介",
    bioEmpty: "まだ自己紹介がありません。",
    modeExam: "時間制テスト",
    modeTraining: "練習"
  },
  settings: {
    ...baseMessages["en-US"].settings,
    title: "設定",
    loading: "設定を読み込み中",
    saved: "設定を保存しました。",
    noticeTitle: "注意",
    public: "公開",
    private: "自分と管理者のみ",
    clearCover: "カバー画像をクリア",
    save: "設定を保存"
  },
  admin: {
    ...baseMessages["en-US"].admin,
    menu: "管理メニュー",
    noPermission: "権限がありません"
  },
  parser: {
    ...baseMessages["en-US"].parser
  }
} as const;

function buildOriginMessages(source: unknown, path: string[] = []): unknown {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return `(${path.join(".")})`;
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, buildOriginMessages(value, [...path, key])])
  );
}

type BaseLocaleMessages = typeof baseMessages["zh-CN"];
type MessageLocale = "zh-CN" | "en-US" | "ja-JP" | "origin";

const localeSystemLabels = {
  "zh-CN": "跟随系统",
  "en-US": "Follow system",
  "ja-JP": "システムに従う",
  origin: "Follow system"
} as const satisfies Record<MessageLocale, string>;

const themeLabels = {
  "zh-CN": {
    label: "主题",
    system: "跟随系统",
    light: "浅色",
    dark: "深色"
  },
  "en-US": {
    label: "Theme",
    system: "Follow system",
    light: "Light",
    dark: "Dark"
  },
  "ja-JP": {
    label: "テーマ",
    system: "システムに従う",
    light: "ライト",
    dark: "ダーク"
  },
  origin: {
    label: "Theme",
    system: "Follow system",
    light: "Light",
    dark: "Dark"
  }
} as const satisfies Record<
  MessageLocale,
  {
    label: string;
    system: string;
    light: string;
    dark: string;
  }
>;

function withPreferenceMessages(locale: MessageLocale, source: BaseLocaleMessages) {
  return {
    ...source,
    layout: {
      ...source.layout,
      themeLabel: themeLabels[locale].label,
      themeLight: themeLabels[locale].light,
      themeDark: themeLabels[locale].dark
    }
  };
}

export const messages = {
  "zh-CN": withPreferenceMessages("zh-CN", baseMessages["zh-CN"]),
  "en-US": withPreferenceMessages("en-US", baseMessages["en-US"]),
  "ja-JP": withPreferenceMessages("ja-JP", jaMessages),
  origin: withPreferenceMessages("origin", buildOriginMessages(baseMessages["zh-CN"]) as typeof baseMessages["zh-CN"])
} as const;

export type MessageSchema = typeof messages;
export type AppLocale = keyof MessageSchema;
