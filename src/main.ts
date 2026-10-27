import './styles.css';
import { GameApp } from './app';

try {
  const app = new GameApp();
  app.init();
} catch (error) {
  console.error(error);
  const message = document.createElement('div');
  message.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:#171513;color:#f4ead8;font-family:"Microsoft YaHei",sans-serif;text-align:center';
  message.innerHTML =
    '<div><h1 style="font-size:24px">游戏没有成功启动</h1><p style="color:#b8a98f;line-height:1.8">请刷新页面再试一次。如果还不行，打开浏览器控制台看看报错。</p></div>';
  document.body.appendChild(message);
}
