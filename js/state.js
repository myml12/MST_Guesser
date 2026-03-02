/**
 * ゲーム状態の管理
 * @file js/state.js
 */

let S;

/**
 * 初期状態オブジェクトを生成して返す
 * @returns {Object} 初期ゲーム状態
 */
function freshState() {
  return {
    round: 0,
    difficulty: null,
    points: [],
    edges: [],
    mstEdges: [],
    sel: null,
    hover: null,
    scores: [],
    pCosts: [],
    mCosts: [],
    _toast: null,
  };
}
