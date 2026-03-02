/**
 * 画面描画：タイトル、プレイ、結果、最終
 * @file js/render.js
 */

/**
 * タイトル画面（難易度選択あり）
 */
function showTitle() {
  const diffHtml = Object.entries(DIFFICULTIES).map(([key, d]) =>
    `<button class="btn diff-btn" data-diff="${key}">${d.name}<br><small>${d.min}〜${d.max}点</small></button>`
  ).join('');

  $app().innerHTML = `
    <div class="screen title-screen">
      <h1>🌲 MST Guesser</h1>
      <p class="subtitle">最小全域木を当てろ！</p>
      <div class="rules">
        <p>ランダムに配置された点を<br><strong>すべてつなげ。</strong></p>
        <p>ただし<strong>ループは禁止。</strong></p>
        <p>できるだけ<strong>短く</strong>つなごう！</p>
      </div>
      <div class="diff-select">
        <p class="diff-label">難易度を選んでね</p>
        <div class="diff-buttons">${diffHtml}</div>
      </div>
      <p style="font-size:0.85rem;color:var(--muted)">全${ROUNDS}問</p>
      <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="about-link">このゲームについて</a>
    </div>`;

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.diff));
  });
}

/**
 * プレイ画面の組み立てとイベント設定
 */
function showPlay() {
  const n = S.points.length;
  const rem = (n - 1) - S.edges.length;

  $app().innerHTML = `
    <div class="screen play-screen">
      <div class="top-bar">
        <span>ラウンド ${S.round} / ${ROUNDS}</span>
        <span id="rem">残り <strong>${rem}</strong> 辺</span>
      </div>
      <div class="board-wrap">
        <svg id="board" viewBox="0 0 ${BOARD} ${BOARD}"></svg>
      </div>
      <div id="hint" class="hint">点をクリックして辺を引こう（繋いだ辺を再選択で削除）</div>
      <div class="buttons">
        <button class="btn" id="b-undo">元に戻す</button>
        <button class="btn" id="b-reset">リセット</button>
        <button class="btn primary" id="b-submit">回答する</button>
      </div>
    </div>`;

  const svg = document.getElementById('board');
  svg.addEventListener('click', onBoardClick);
  svg.addEventListener('mousemove', onBoardMove);
  svg.addEventListener('mouseleave', () => {
    if (S.hover !== null) {
      S.hover = null;
      renderBoard();
    }
  });

  document.getElementById('b-undo').addEventListener('click', undoEdge);
  document.getElementById('b-reset').addEventListener('click', resetEdges);
  document.getElementById('b-submit').addEventListener('click', submitAnswer);

  renderBoard();
}

/**
 * プレイ中のボードSVGを再描画
 */
function renderBoard() {
  const svg = document.getElementById('board');
  if (!svg) return;

  const n = S.points.length;
  const rem = (n - 1) - S.edges.length;
  let h = '';

  for (const e of S.edges) {
    const p1 = S.points[e.i];
    const p2 = S.points[e.j];
    h += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
      stroke="#374151" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  if (S.sel !== null && S.hover !== null && S.sel !== S.hover) {
    const k = edgeKey(S.sel, S.hover);
    const exists = S.edges.some(e => edgeKey(e.i, e.j) === k);
    const cycle = !exists && wouldCycle(S.edges, S.sel, S.hover, n);
    const blocked = exists || cycle || S.edges.length >= n - 1;
    const p1 = S.points[S.sel];
    const p2 = S.points[S.hover];
    h += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
      stroke="${blocked ? '#fca5a5' : '#94a3b8'}" stroke-width="1.5"
      stroke-dasharray="6 4" stroke-linecap="round"/>`;
  }

  for (let i = 0; i < n; i++) {
    const p = S.points[i];
    const sel = S.sel === i;
    h += `<circle cx="${p.x}" cy="${p.y}" r="${HIT_R}" fill="transparent" class="node-hit" data-i="${i}"/>`;
    h += `<circle cx="${p.x}" cy="${p.y}" r="${sel ? 13 : NODE_R}" fill="${sel ? 'var(--accent)' : 'var(--text)'}" class="node-dot"/>`;
    if (sel) {
      h += `<circle cx="${p.x}" cy="${p.y}" r="19" fill="none" stroke="var(--accent)" stroke-width="2" opacity="0.3" class="node-dot"/>`;
    }
  }

  svg.innerHTML = h;

  const r = document.getElementById('rem');
  if (r) r.innerHTML = `残り <strong>${rem}</strong> 辺`;

  const hint = document.getElementById('hint');
  if (hint) hint.textContent = S.sel !== null ? '2つ目の点をクリック（既存の辺なら削除）' : '点をクリックして辺を引こう（繋いだ辺を再選択で削除）';

  const sub = document.getElementById('b-submit');
  if (sub) sub.disabled = rem !== 0;

  const undoBtn = document.getElementById('b-undo');
  if (undoBtn) undoBtn.disabled = S.edges.length === 0;
}

/**
 * 結果画面（正解との比較、スコア、コスト表示）
 */
function showResult(score, pc, mc) {
  const n = S.points.length;
  const pSet = new Set(S.edges.map(e => edgeKey(e.i, e.j)));
  const mSet = new Set(S.mstEdges.map(e => edgeKey(e.i, e.j)));

  let svgContent = '';

  for (const e of S.edges) {
    if (mSet.has(edgeKey(e.i, e.j))) {
      const p1 = S.points[e.i];
      const p2 = S.points[e.j];
      svgContent += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
        stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  for (const e of S.edges) {
    if (!mSet.has(edgeKey(e.i, e.j))) {
      const p1 = S.points[e.i];
      const p2 = S.points[e.j];
      svgContent += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
        stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>`;
    }
  }
  for (const e of S.mstEdges) {
    if (!pSet.has(edgeKey(e.i, e.j))) {
      const p1 = S.points[e.i];
      const p2 = S.points[e.j];
      svgContent += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
        stroke="var(--green)" stroke-width="2.5" stroke-dasharray="8 5"
        stroke-linecap="round" opacity="0.7"/>`;
    }
  }

  for (let i = 0; i < n; i++) {
    const p = S.points[i];
    svgContent += `<circle cx="${p.x}" cy="${p.y}" r="${NODE_R}" fill="var(--text)"/>`;
  }

  const sc = scoreColor(score);
  const msg = score >= 100 ? '完璧！🎯' : score >= 95 ? 'かなり鋭い！' : score >= 90 ? '良い感覚！' : score >= 80 ? 'まずまず' : 'もう少し！';

  $app().innerHTML = `
    <div class="screen">
      <div class="top-bar">
        <span>ラウンド ${S.round} / ${ROUNDS}</span>
        <span style="color:${sc};font-weight:700">${msg}</span>
      </div>
      <div class="board-wrap">
        <svg viewBox="0 0 ${BOARD} ${BOARD}">${svgContent}</svg>
      </div>
      <div class="result-stats">
        <div class="score-big" style="color:${sc}">${score.toFixed(1)}</div>
        <div class="score-label">スコア</div>
      </div>
      <div class="cost-compare">
        あなたのコスト <strong>${(pc / 10).toFixed(1)}</strong>　／　最小コスト <strong>${(mc / 10).toFixed(1)}</strong>
      </div>
      <div class="legend">
        <span class="legend-item">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--green)" stroke-width="3"/></svg>正解
        </span>
        <span class="legend-item">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--red)" stroke-width="3"/></svg>余計な辺
        </span>
        <span class="legend-item">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--green)" stroke-width="2" stroke-dasharray="4 3"/></svg>見逃した辺
        </span>
      </div>
      <button class="btn primary" id="b-next">${S.round >= ROUNDS ? '結果を見る →' : '次のラウンドへ →'}</button>
    </div>`;

  document.getElementById('b-next').addEventListener('click', goNext);
}

/**
 * 最終結果画面（MST直感指数、ラウンド別スコア）
 */
function showFinal() {
  const avg = S.scores.reduce((a, b) => a + b, 0) / S.scores.length;
  const ac = scoreColor(avg);
  const msg = avg >= 98 ? '天才的直感！🧠' : avg >= 95 ? 'かなり鋭い！' : avg >= 90 ? 'なかなかの腕前' : avg >= 80 ? '伸びしろあり' : '修行が必要…';

  let rows = '';
  for (let i = 0; i < S.scores.length; i++) {
    const s = S.scores[i];
    rows += `
      <div class="round-row">
        <span class="round-num">${i + 1}</span>
        <span class="round-score-text" style="color:${scoreColor(s)}">${s.toFixed(1)}</span>
        <div class="round-bar-bg"><div class="round-bar" data-w="${s}"></div></div>
      </div>`;
  }

  $app().innerHTML = `
    <div class="screen" style="padding-top:2rem">
      <p class="score-label">MST直感指数</p>
      <div class="final-score" style="color:${ac}">${avg.toFixed(1)}</div>
      <p class="final-msg" style="color:${ac}">${msg}</p>
      <div class="round-list" style="margin:0.5rem 0">${rows}</div>
      <div class="buttons">
        <button class="btn" id="b-copy">📋 結果をコピー</button>
        <button class="btn primary" id="b-retry">もう一度遊ぶ</button>
      </div>
      <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="about-link">このゲームについて</a>
    </div>`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.round-bar').forEach(el => {
        el.style.width = el.dataset.w + '%';
        el.style.background = scoreColor(parseFloat(el.dataset.w));
      });
    });
  });

  document.getElementById('b-copy').addEventListener('click', copyResult);
  document.getElementById('b-retry').addEventListener('click', () => {
    S = freshState();
    showTitle();
  });
}
