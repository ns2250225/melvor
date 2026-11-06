// 全局组件类型声明（供模板类型检查使用）
export {};
declare module 'vue' {
  interface GlobalComponents {
    Icon: typeof import('./components/GameIcon.vue')['default'];
    IconText: typeof import('./components/IconText.vue')['default'];
  }
}
