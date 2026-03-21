<script setup lang="ts">
import { computed } from "vue";

const SITE_START_DATE = "2025-01-01";

const siteDays = computed<number>(() => {
  const start = new Date(`${SITE_START_DATE}T00:00:00`);
  const now = new Date();
  const diff = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});
</script>

<template>
  <footer class="footer">
    <div class="ui-grid">
      <div class="column firacode">
        <p>
          <i class="fa fa-copyright"></i>
          <span>2025-2026 洛谷保存站（</span>
          <a href="https://www.luogu.me" target="_blank" rel="noreferrer" class="footer-link">www.luogu.me</a>
          <span>）</span>
        </p>
        <p class="group">
          <a href="https://github.com/laikit-dev/luogu-saver" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fab fa-github"></i>
            <span>GitHub</span>
          </a>
          <a href="https://help.luogu.me" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-book"></i>
            <span>帮助文档</span>
          </a>
          <a href="https://help.luogu.me/docs/update" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-history"></i>
            <span>更新日志</span>
          </a>
        </p>
        <p>
          <i class="fa fa-clock"></i>
          <span>本网站已运行</span>
          <span id="site-days">{{ siteDays }}</span>
          <span>天</span>
        </p>
        <p>
          <a href="https://github.com/laikit-dev/luogu-saver/graphs/contributors" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fas fa-users"></i>
            <span>项目贡献者</span>
          </a>
        </p>
      </div>

      <div class="column right firacode">
        <p>
          <i class="fa fa-code"></i>
          <span>开发者：Federico2903 &amp; Murasame &amp; quanac-lcx</span>
        </p>
        <p class="group">
          <a href="https://help.luogu.me/docs/license/privacy" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-user-shield"></i>
            <span>隐私协议</span>
          </a>
          <a href="https://help.luogu.me/docs/license/disclaimer" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-exclamation-circle"></i>
            <span>免责声明</span>
          </a>
          <a href="https://help.luogu.me/docs/license/deletion" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-trash-alt"></i>
            <span>数据移除政策</span>
          </a>
        </p>
        <p>
          <a href="https://qm.qq.com/q/QVM9YFEb26" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fab fa-qq"></i>
            <span>洛谷保存站用户群：1017248143（点击加入）</span>
          </a>
        </p>
        <p>
          <a href="https://www.rainyun.com/MjUxMDAy_?s=saver" target="_blank" rel="noreferrer" class="footer-link">
            <i class="fa fa-server"></i>
            <span>由 雨云 提供支持</span>
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
  padding: 18px 8px 0;
  border-top: 1px solid #d9d9d9;
  color: #1f1f1f;
}

.ui-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 48px;
}

.column {
  padding: 0;
}

.firacode {
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

.column p {
  margin: 7px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.5;
  font-size: 14px;
}

.column p > i {
  display: inline-block;
  width: 18px;
  text-align: center;
  opacity: 0.9;
  flex-shrink: 0;
}

.group {
  gap: 16px;
}

.footer-link {
  text-decoration: none;
  color: #1f1f1f;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.footer-link:hover {
  color: #1e66f5;
}

.right {
  text-align: right;
}

.right p {
  justify-content: flex-end;
}

#site-days {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

@media (max-width: 860px) {
  .ui-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .right {
    text-align: left;
  }

  .right p {
    justify-content: flex-start;
  }
}
</style>

