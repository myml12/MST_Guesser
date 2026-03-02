/**
 * イベントハンドラ：ボードのクリック・ホバー
 * @file js/events.js
 */

/**
 * ボード（SVG）上のクリック処理
 */
function onBoardClick(e) {
  if (e.target.classList.contains('node-hit')) {
    handleNode(parseInt(e.target.dataset.i, 10));
  } else {
    if (S.sel !== null) {
      S.sel = null;
      renderBoard();
    }
  }
}

/**
 * ボード上のマウス移動（ホバー時のプレビュー線更新）
 */
function onBoardMove(e) {
  const isNode = e.target.classList.contains('node-hit');
  const next = isNode ? parseInt(e.target.dataset.i, 10) : null;
  if (next !== S.hover) {
    S.hover = next;
    renderBoard();
  }
}
