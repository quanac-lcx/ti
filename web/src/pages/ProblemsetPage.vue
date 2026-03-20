<script setup>
import TiLayout from "../layouts/TiLayout.vue";

const problems = [
  { id: 1001, title: "NOIP 2007 普及组初赛试题" },
  { id: 1002, title: "NOIP 2007 提高组初赛试题" },
  { id: 1003, title: "NOIP 2008 普及组初赛试题" },
  { id: 1004, title: "NOIP 2008 提高组初赛试题" },
  { id: 1005, title: "NOIP 2009 普及组初赛试题" },
  { id: 1006, title: "NOIP 2009 提高组初赛试题" },
  { id: 1007, title: "NOIP 2010 普及组初赛试题" },
  { id: 1008, title: "NOIP 2010 提高组初赛试题" },
  { id: 1009, title: "NOIP 2011 普及组初赛试题" },
  { id: 1010, title: "NOIP 2011 提高组初赛试题" },
  { id: 1011, title: "NOIP 2012 普及组初赛试题" },
  { id: 1012, title: "NOIP 2012 提高组初赛试题" },
  { id: 1013, title: "NOIP 2013 普及组初赛试题" }
];
</script>

<template>
  <TiLayout title="题库" subtitle="洛谷有题 / 试题列表">
    <div class="list">
      <a v-for="p in problems" :key="p.id" class="row" href="#">
        <div class="id">{{ p.id }}</div>
        <div class="title">{{ p.title }}</div>
      </a>
    </div>
  </TiLayout>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 116px 1fr;
  align-items: center;
  gap: 8px;
  min-height: 66px;
  padding: 0 26px;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid #ededed;
  transition: background-color 140ms ease;
}

.row:first-child {
  border-top: none;
}

.row:hover {
  background: #fafcff;
}

.row:hover .title {
  color: #0d58d9;
}

.id {
  color: #1c1c1c;
  font-size: 39px;
  transform: scale(0.46);
  transform-origin: left center;
  margin-left: -3px;
  font-weight: 700;
}

.title {
  color: #0c67f3;
  font-size: 40px;
  transform: scale(0.46);
  transform-origin: left center;
  margin-left: -16px;
  font-weight: 500;
}

@media (max-width: 860px) {
  .row {
    grid-template-columns: 78px 1fr;
    min-height: 52px;
    padding: 0 14px;
  }

  .id,
  .title {
    transform: none;
    margin-left: 0;
    font-size: 16px;
  }
}
</style>
