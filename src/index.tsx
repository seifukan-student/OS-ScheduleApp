import { Hono } from 'hono'

const app = new Hono()

app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lumina — AI Calendar & WBS</title>
  <meta name="description" content="AI搭載の次世代カレンダー・WBSアプリ" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body {
      background: #0a0a0f;
      color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #root { width: 100vw; height: 100vh; }
    #loading {
      position: fixed; inset: 0;
      background: #0a0a0f;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px;
      transition: opacity 0.3s;
      z-index: 9999;
    }
    .loader-logo {
      width: 52px; height: 52px; border-radius: 15px;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(59,130,246,0.4);
      animation: pulse 1.5s ease-in-out infinite;
    }
    .loader-logo svg { width: 26px; height: 26px; }
    .loader-text { font-size: 18px; font-weight: 700; color: #f5f5f7; letter-spacing: -0.5px; }
    .loader-sub { font-size: 13px; color: #71717a; }
    .loader-bar {
      width: 120px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;
    }
    .loader-bar-fill {
      height: 100%; background: linear-gradient(90deg, #3B82F6, #8B5CF6);
      border-radius: 2px;
      animation: load 1.2s ease-in-out forwards;
    }
    @keyframes pulse { 0%,100% { box-shadow: 0 8px 32px rgba(59,130,246,0.4); } 50% { box-shadow: 0 8px 48px rgba(59,130,246,0.7); } }
    @keyframes load { from { width: 0; } to { width: 100%; } }
  </style>
</head>
<body>
  <div id="loading">
    <div class="loader-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    </div>
    <div class="loader-text">Lumina</div>
    <div class="loader-sub">AI Calendar & WBS</div>
    <div class="loader-bar"><div class="loader-bar-fill"></div></div>
  </div>
  <div id="root"></div>
  <script type="module" src="/app/client.js"></script>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const l = document.getElementById('loading');
        if (l) { l.style.opacity = '0'; setTimeout(() => l.remove(), 300); }
      }, 800);
    });
  </script>
</body>
</html>`)
})

export default app
