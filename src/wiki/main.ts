// 游戏百科入口（wiki.html）
import { createApp } from 'vue';
import WikiApp from './WikiApp.vue';
import GameIcon from '@/components/GameIcon.vue';
import IconText from '@/components/IconText.vue';
import '@/assets/main.css';
import '@/content';

const app = createApp(WikiApp);
app.component('Icon', GameIcon);
app.component('IconText', IconText);
app.mount('#wiki');
