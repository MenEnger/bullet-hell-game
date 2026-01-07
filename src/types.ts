/**
 * 2次元ベクトル
 * 位置や速度を表現するために使用
 */
export interface Vector2D {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
}

/**
 * ゲームオブジェクトの基底インターフェース
 * プレイヤー、敵、弾丸などすべてのゲーム内オブジェクトが共有する属性
 */
export interface GameObject {
  /** オブジェクトの位置 */
  position: Vector2D;
  /** オブジェクトの速度（移動方向と速さ） */
  velocity: Vector2D;
  /** 衝突判定用の半径 */
  radius: number;
}

/**
 * プレイヤーの状態を表すインターフェース
 */
export interface Player extends GameObject {
  /** 残機数（0になるとゲームオーバー） */
  lives: number;
  /** 最後に射撃した時刻（クールダウン判定用） */
  lastShotTime: number;
}

/**
 * 敵機の状態を表すインターフェース
 */
export interface Enemy extends GameObject {
  /** 最後に射撃した時刻 */
  lastShotTime: number;
  /** 最後に移動先を変更した時刻 */
  targetChangeTime: number;
  /** 現在の移動先座標 */
  targetPosition: Vector2D;
}

/**
 * 弾丸の状態を表すインターフェース
 */
export interface Bullet extends GameObject {
  /** プレイヤーの弾かどうか（false = 敵の弾） */
  isPlayerBullet: boolean;
  /** ホーミング対象の敵機（プレイヤーの弾のみ） */
  targetEnemy?: Enemy;
}

/**
 * ゲームの状態
 * - playing: プレイ中
 * - paused: 一時停止中
 * - gameOver: ゲームオーバー
 * - gameClear: ゲームクリア
 */
export type GameState = 'playing' | 'paused' | 'gameOver' | 'gameClear';

/**
 * ゲーム全体の設定値を定義するインターフェース
 */
export interface GameConfig {
  /** キャンバスの幅（ピクセル） */
  canvasWidth: number;
  /** キャンバスの高さ（ピクセル） */
  canvasHeight: number;
  /** プレイヤーの移動速度（ピクセル/フレーム） */
  playerSpeed: number;
  /** プレイヤーの射撃クールダウン時間（ミリ秒） */
  playerShootCooldown: number;
  /** プレイヤーの弾の速度（ピクセル/フレーム） */
  playerBulletSpeed: number;
  /** プレイヤーの初期残機数 */
  playerLives: number;
  /** 敵機の数 */
  enemyCount: number;
  /** 敵機の移動速度（ピクセル/フレーム） */
  enemySpeed: number;
  /** 敵機の射撃間隔（ミリ秒） */
  enemyShootInterval: number;
  /** 敵の弾の速度（ピクセル/フレーム） */
  enemyBulletSpeed: number;
  /** 敵が弾を撃つ方向の数 */
  enemyBulletDirections: number;
  /** 敵を1機倒したときの獲得スコア */
  scorePerEnemy: number;
  /** サウンドの音量（0.0〜1.0） */
  soundVolume: number;
}
