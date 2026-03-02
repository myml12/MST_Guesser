/**
 * MST計算・サイクル検出・ユーティリティ
 * @file js/algorithms.js
 */

/**
 * 2点間のユークリッド距離
 */
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 辺の一意キー（無向辺の重複判定用）
 */
function edgeKey(i, j) {
  return i < j ? i + ',' + j : j + ',' + i;
}

/**
 * 重ならないn個の点をランダム生成（リジェクションサンプリング）
 */
function genPoints(n) {
  for (;;) {
    const pts = [];
    for (let t = 0; t < 3000 && pts.length < n; t++) {
      const x = PAD + Math.random() * (BOARD - 2 * PAD);
      const y = PAD + Math.random() * (BOARD - 2 * PAD);
      if (pts.every(p => dist({ x, y }, p) >= MIN_D)) pts.push({ x, y });
    }
    if (pts.length === n) return pts;
  }
}

/**
 * Kruskal法による最小全域木（MST）計算
 * Union-Find + 辺のコスト昇順ソート
 */
function computeMST(pts) {
  const n = pts.length;
  const es = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      es.push({ i, j, d: dist(pts[i], pts[j]) });
    }
  }
  es.sort((a, b) => a.d - b.d);

  const par = Array.from({ length: n }, (_, i) => i);
  const rnk = new Array(n).fill(0);

  function find(x) {
    return par[x] === x ? x : (par[x] = find(par[x]));
  }

  function union(x, y) {
    let px = find(x);
    let py = find(y);
    if (px === py) return false;
    if (rnk[px] < rnk[py]) [px, py] = [py, px];
    par[py] = px;
    if (rnk[px] === rnk[py]) rnk[px]++;
    return true;
  }

  const tree = [];
  for (const e of es) {
    if (union(e.i, e.j)) {
      tree.push(e);
      if (tree.length === n - 1) break;
    }
  }
  return tree;
}

/**
 * 辺(a,b)を追加するとサイクルになるか判定（DFS）
 */
function wouldCycle(edges, a, b, n) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.i].push(e.j);
    adj[e.j].push(e.i);
  }
  const vis = new Set();
  const stk = [a];
  while (stk.length) {
    const c = stk.pop();
    if (c === b) return true;
    if (vis.has(c)) continue;
    vis.add(c);
    for (const x of adj[c]) stk.push(x);
  }
  return false;
}

/**
 * 辺集合の合計コスト
 */
function totalCost(edges, pts) {
  return edges.reduce((s, e) => s + dist(pts[e.i], pts[e.j]), 0);
}

/**
 * スコアに応じた色を返す
 */
function scoreColor(s) {
  if (s >= 100) return '#f59e0b';
  if (s >= 95) return '#22c55e';
  if (s >= 90) return '#3b82f6';
  if (s >= 80) return '#f97316';
  return '#ef4444';
}
