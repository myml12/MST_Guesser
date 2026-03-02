/**
 * ゲームロジック：ラウンド進行、回答判定、スコア計算
 * @file js/game.js
 */

/**
 * ゲーム開始（難易度選択→状態リセット→第1ラウンド）
 * @param {string} difficulty - 'beginner' | 'normal' | 'expert'
 */
function startGame(difficulty) {
  S = freshState();
  S.difficulty = difficulty;
  nextRound();
}

/**
 * 次のラウンドへ（点生成、MST計算、プレイ画面表示）
 */
function nextRound() {
  S.round++;
  const d = DIFFICULTIES[S.difficulty];
  const n = d.min + Math.floor(Math.random() * (d.max - d.min + 1));
  S.points = genPoints(n);
  S.edges = [];
  S.mstEdges = computeMST(S.points);
  S.sel = null;
  S.hover = null;
  showPlay();
}

/**
 * ノードクリック時の処理
 * - 選択／辺の追加／辺の削除（既存辺を再選択でトグル）
 */
function handleNode(idx) {
  const n = S.points.length;
  const maxE = n - 1;

  if (S.sel === null) {
    S.sel = idx;
  } else if (S.sel === idx) {
    S.sel = null;
  } else {
    const a = S.sel;
    const b = idx;
    S.sel = null;
    const k = edgeKey(a, b);
    const existingIdx = S.edges.findIndex(e => edgeKey(e.i, e.j) === k);

    if (existingIdx >= 0) {
      // 既存の辺を再選択 → 削除（トグル）
      S.edges.splice(existingIdx, 1);
    } else if (S.edges.length >= maxE) {
      toast('これ以上追加できません');
    } else if (wouldCycle(S.edges, a, b, n)) {
      toast('ループになります！');
    } else {
      S.edges.push({ i: a, j: b });
    }
  }
  renderBoard();
}

/**
 * 直前に追加した辺を1本削除
 */
function undoEdge() {
  if (!S.edges.length) return;
  S.edges.pop();
  S.sel = null;
  renderBoard();
}

/**
 * そのラウンドの辺をすべてリセット
 */
function resetEdges() {
  S.edges = [];
  S.sel = null;
  renderBoard();
}

/**
 * 回答を受理し、スコア計算→結果画面へ
 */
function submitAnswer() {
  const n = S.points.length;
  if (S.edges.length !== n - 1) return;

  const pc = totalCost(S.edges, S.points);
  const mc = totalCost(S.mstEdges, S.points);
  const score = Math.min(100, (mc / pc) * 100);

  S.pCosts.push(pc);
  S.mCosts.push(mc);
  S.scores.push(score);
  showResult(score, pc, mc);
}

/**
 * 次のラウンドへ or 最終画面へ
 */
function goNext() {
  if (S.round >= ROUNDS) showFinal();
  else nextRound();
}

/**
 * 結果テキストをクリップボードにコピー
 */
function copyResult() {
  const avg = S.scores.reduce((a, b) => a + b, 0) / S.scores.length;
  const diffName = DIFFICULTIES[S.difficulty]?.name ?? '';
  let t = `🌲 MST Guesser 🌲\n${diffName}・MST直感指数：${avg.toFixed(1)}\n`;
  for (let i = 0; i < S.scores.length; i++) {
    t += `R${i + 1}: ${S.scores[i].toFixed(1)}  `;
    if ((i + 1) % 5 === 0) t += '\n';
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(t.trim()).then(() => toast('コピーしました！'));
  } else {
    toast('クリップボードを利用できません');
  }
}
