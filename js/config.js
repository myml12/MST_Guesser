/**
 * ゲーム設定定数
 * @file js/config.js
 */

const ROUNDS = 5;
const BOARD = 600;
const PAD = 55;
const MIN_D = 70;
const NODE_R = 10;
/** タップ判定用の半径（viewBox単位）。スマホで約44pxになるよう大きめに設定 */
const HIT_R = 80;

/** 難易度別：点の数 [min, max] */
const DIFFICULTIES = {
  beginner: { name: '初級', min: 5, max: 6 },
  normal:   { name: '中級', min: 7, max: 9 },
  expert:   { name: '上級', min: 9, max: 12 },
};

/** このゲームについてリンク先（GitHubリポジトリ） */
const GITHUB_REPO_URL = 'https://github.com/myml12/MST_Guesser';
