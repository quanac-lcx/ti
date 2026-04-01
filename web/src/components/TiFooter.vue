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

