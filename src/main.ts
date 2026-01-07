/**
 * 弾幕ゲームのメインエントリーポイント
 * アプリケーションの初期化とゲームの起動を行う
 */

import { Game } from './game';
import { getHighScores, updateHighScoresDisplay } from './storage';

/**
 * ゲームの初期化処理
 * - Canvasエレメントを取得
 * - ハイスコアを読み込んで表示
 * - ゲームインスタンスを作成して開始
 */
function init() {
  // Canvasエレメントを取得
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // ハイスコアを取得して表示
  const highScores = getHighScores();
  updateHighScoresDisplay(highScores);

  // ゲームを作成して開始
  const game = new Game(canvas);
  game.start();
}

// DOMの読み込み状態に応じて初期化を実行
if (document.readyState === 'loading') {
  // まだ読み込み中の場合はDOMContentLoadedイベントを待つ
  document.addEventListener('DOMContentLoaded', init);
} else {
  // すでに読み込み済みの場合は即座に実行
  init();
}
