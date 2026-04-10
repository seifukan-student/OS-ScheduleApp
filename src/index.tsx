// Cloudflare Worker: serve inline HTML with bundled React app
// The client JS is imported as raw text at build time

// @ts-ignore
import clientJs from '../dist/app/client.js?raw'

const html = (js: string) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OS Calendar App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { background: #0a0a0f; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    #root { width: 100vw; height: 100vh; }
    #loading { position: fixed; inset: 0; background: #0a0a0f; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; z-index: 9999; transition: opacity 0.4s ease; }
    .loader-logo { width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(59,130,246,0.4); animation: pulse 1.5s ease-in-out infinite; }
    .loader-text { font-size: 18px; font-weight: 700; color: #f5f5f7; }
    .loader-sub { font-size: 13px; color: #71717a; }
    .loader-bar { width: 120px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
    .loader-fill { height: 100%; background: linear-gradient(90deg, #3B82F6, #8B5CF6); animation: load 1s ease-in-out forwards; }
    @keyframes pulse { 0%,100%{box-shadow:0 8px 32px rgba(59,130,246,0.4)}50%{box-shadow:0 8px 48px rgba(59,130,246,0.7)} }
    @keyframes load { from{width:0}to{width:100%} }
  </style>
</head>
<body>
  <div id="loading">
    <div class="loader-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="26" height="26">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    </div>
    <div class="loader-text">OS Calendar App</div>
    <div class="loader-sub">カレンダー & WBS</div>
    <div class="loader-bar"><div class="loader-fill"></div></div>
  </div>
  <div id="root"></div>
  <script>${js}</script>
  <script>
    (function() {
      var tries = 0;
      function hide() {
        var root = document.getElementById('root');
        var loading = document.getElementById('loading');
        if (!loading) return;
        if (root && root.children.length > 0) {
          loading.style.opacity = '0';
          setTimeout(function() { loading && loading.remove(); }, 400);
        } else if (tries++ < 20) {
          setTimeout(hide, 150);
        }
      }
      setTimeout(hide, 300);
    })();
  </script>
</body>
</html>`

import { Hono } from 'hono'

const app = new Hono()

app.get('*', (c) => {
  return c.html(html(clientJs))
})

export default app
