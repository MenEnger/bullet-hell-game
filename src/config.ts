import type { GameConfig } from './types';

/**
 * ゲーム全体の設定値
 * このファイルを編集することでゲームバランスを調整できます
 */
export const CONFIG: GameConfig = {
  // キャンバスのサイズ設定
  canvasWidth: 800,  // キャンバスの幅（ピクセル）
  canvasHeight: 600, // キャンバスの高さ（ピクセル）

  // プレイヤー関連の設定
  playerSpeed: 5,              // プレイヤーの移動速度（ピクセル/フレーム）
  playerShootCooldown: 500,    // 射撃のクールダウン時間（ミリ秒）
  playerBulletSpeed: 12,       // プレイヤーの弾の速度（ピクセル/フレーム）
  playerLives: 5,              // プレイヤーの初期残機数

  // 敵関連の設定
  enemyCount: 3,               // 敵機の数
  enemySpeed: 2,               // 敵の移動速度（ピクセル/フレーム）
  enemyShootInterval: 1000,    // 敵の射撃間隔（ミリ秒）※10秒後に半分になる
  enemyBulletSpeed: 4,         // 敵の弾の速度（ピクセル/フレーム）
  enemyBulletDirections: 8,    // 敵が弾を撃つ方向の数（8方向 = 全方位）

  // スコア関連の設定
  scorePerEnemy: 100,          // 敵を1機倒したときの獲得スコア
};
