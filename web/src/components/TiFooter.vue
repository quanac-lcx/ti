<script setup>
import { computed } from "vue";

const SITE_START_DATE = "2025-01-01";

const siteDays = computed(() => {
  const start = new Date(`${SITE_START_DATE}T00:00:00`);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});
</script>

<template>
  <footer class="footer">
    <div class="ui grid">
      <div class="eight wide column firacode">
        <p>
          <i class="fa fa-copyright"></i> 2025-2026 洛谷保存站 (<a href="https://www.luogu.me" target="_blank" class="footer-link">www.luogu.me</a>)
        </p>
        <p>
          <a href="https://github.com/laikit-dev/luogu-saver" target="_blank" class="footer-link" style="margin-right: 15px;">
            <i class="fab fa-github"></i> GitHub
          </a>
          <a href="https://help.luogu.me" target="_blank" class="footer-link">
            <i class="fa fa-book"></i> 帮助文档
          </a>
          <a href="https://help.luogu.me/docs/update" target="_blank" class="footer-link">
            <i class="fa fa-history"></i> 更新日志
          </a>
        </p>
        <p>
          <i class="fa fa-clock"></i> 本网站已运行 <span id="site-days">{{ siteDays }}</span> 天
        </p>
        <p>
          <a href="https://github.com/laikit-dev/luogu-saver/graphs/contributors" target="_blank" class="footer-link">
            <i class="fas fa-users"></i> 项目贡献者
          </a>
        </p>
      </div>
      <div class="right floated six wide column firacode">
        <p>
          <i class="fa fa-code"></i> 开发者：Federico2903 &amp; Murasame &amp; quanac-lcx
        </p>
        <p>
          <a href="https://help.luogu.me/docs/license/privacy" class="footer-link" style="margin-right: 15px;">
            <i class="fa fa-user-shield"></i> 隐私协议
          </a>
          <a href="https://help.luogu.me/docs/license/disclaimer" class="footer-link" style="margin-right: 15px;">
            <i class="fa fa-exclamation-circle"></i> 免责声明
          </a>
          <a href="https://help.luogu.me/docs/license/deletion" class="footer-link">
            <i class="fa fa-trash-alt"></i> 数据移除政策
          </a>
        </p>

        <p>
          <a href="https://qm.qq.com/q/QVM9YFEb26" target="_blank" class="footer-link" style="margin-right: 15px;">
          <i class="fab fa-qq"></i>&nbsp;洛谷保存站用户群：1017248143（点击加入）
          </a>
        </p>
        <p>
          <a href="https://www.rainyun.com/MjUxMDAy_?s=saver" target="_blank" class="footer-link" style="margin-right: 15px;">
          <i class="fa fa-server"></i>&nbsp;由 雨云 提供支持
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin: 18px auto 0;
  max-width: 1040px;
  padding: 18px 6px 0;
  border-top: 1px solid #d9d9d9;
  color: #1f1f1f;
}

.ui.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 48px;
  margin: 0;
}

.column {
  padding: 0;
}

.firacode {
  font-family: "Fira Code", monospace;
}

.column p {
  margin: 7px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.5;
  font-size: 14px;
}

.column i {
  display: inline-block;
  width: 20px;
  text-align: center;
  opacity: 0.9;
  flex-shrink: 0;
}

.footer-link {
  text-decoration: none;
  color: #1f1f1f;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #337ab7;
  text-decoration-line: underline;
  text-decoration-color: #000;
  text-underline-position: under;
}

.right.floated {
  text-align: right;
}

.right.floated p {
  justify-content: flex-end;
}

#site-days {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

@media (max-width: 860px) {
  .ui.grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .right.floated {
    text-align: left;
    float: none !important;
  }
  
  .right.floated p {
    justify-content: flex-start;
  }
}
</style>
