/**
 * エントリポイント・ユーティリティ
 * @file js/main.js
 */

function $(s) {
  return document.querySelector(s);
}

function $app() {
  return document.getElementById('app');
}

/**
 * トーストメッセージを一時表示
 */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(S._toast);
  S._toast = setTimeout(() => t.classList.remove('show'), 1400);
}

// 初期化
S = freshState();
showTitle();
