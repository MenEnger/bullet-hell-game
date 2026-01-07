/**
 * 弾幕ゲームのメインクラス
 * ゲームのすべてのロジック（プレイヤー、敵、弾丸の管理）を担当
 */

import type { Player, Enemy, Bullet, GameState } from './types';
import { CONFIG } from './config';
import { checkCollision, clamp, distance, getDirectionVector } from './utils';
import { saveHighScore, updateHighScoresDisplay } from './storage';
import * as Audio from './audio';

export class Game {
  /** Canvasエレメント */
  private canvas: HTMLCanvasElement;
  /** 描画コンテキスト */
  private ctx: CanvasRenderingContext2D;
  /** プレイヤーの状態 */
  private player: Player;
  /** 敵機のリスト */
  private enemies: Enemy[] = [];
  /** プレイヤーの弾丸のリスト */
  private playerBullets: Bullet[] = [];
  /** 敵の弾丸のリスト */
  private enemyBullets: Bullet[] = [];
  /** 現在のゲーム状態 */
  private state: GameState = 'playing';
  /** 現在のスコア */
  private score: number = 0;
  /** 現在押されているキーのセット */
  private keys: Set<string> = new Set();
  /** アニメーションフレームID */
  private animationId: number = 0;
  /** ゲーム開始時刻（難易度調整に使用） */
  private gameStartTime: number = 0;

  /**
   * ゲームインスタンスを作成
   * @param canvas - 描画先のCanvasエレメント
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CONFIG.canvasWidth;
    this.canvas.height = CONFIG.canvasHeight;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2d context');
    this.ctx = context;

    this.player = this.createPlayer();
    this.initEnemies();
    this.setupEventListeners();
  }

  /**
   * プレイヤーオブジェクトを作成
   * @returns 初期状態のプレイヤー
   */
  private createPlayer(): Player {
    return {
      position: { x: CONFIG.canvasWidth / 2, y: CONFIG.canvasHeight - 50 },
      velocity: { x: 0, y: 0 },
      radius: 8,
      lives: CONFIG.playerLives,
      lastShotTime: 0,
    };
  }

  /**
   * 敵機を初期化
   * 画面上部に均等に配置する
   */
  private initEnemies(): void {
    this.enemies = [];
    for (let i = 0; i < CONFIG.enemyCount; i++) {
      // 敵を水平方向に均等に配置
      const x = (CONFIG.canvasWidth / (CONFIG.enemyCount + 1)) * (i + 1);
      const y = 100 + Math.random() * 100;

      this.enemies.push({
        position: { x, y },
        velocity: { x: 0, y: 0 },
        radius: 15,
        lastShotTime: 0,
        targetChangeTime: Date.now(),
        targetPosition: { x, y },
      });
    }
  }

  /**
   * イベントリスナーをセットアップ
   * キーボード入力とボタンクリックを処理
   */
  private setupEventListeners(): void {
    // キーが押された時
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    // キーが離された時
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // ポーズボタン
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn?.addEventListener('click', () => this.togglePause());

    // リスタートボタン
    const restartBtn = document.getElementById('restartBtn');
    restartBtn?.addEventListener('click', () => this.restart());

    // 続けるボタン（ポーズ時のみ表示）
    const continueBtn = document.getElementById('continueBtn');
    continueBtn?.addEventListener('click', () => this.togglePause());

    // ミュートボタン
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      // 初期状態のボタンテキストを設定
      muteBtn.textContent = Audio.isMuted() ? 'ミュート解除' : 'ミュート';
      
      // クリックイベント
      muteBtn.addEventListener('click', () => {
        const isMuted = Audio.toggleMute();
        muteBtn.textContent = isMuted ? 'ミュート解除' : 'ミュート';
      });
    }
  }

  /**
   * ポーズ状態をトグル
   * プレイ中ならポーズ、ポーズ中ならプレイ再開
   */
  private togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.showOverlay('ポーズ', 'スコア: ' + this.score, true);
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.hideOverlay();
      this.gameLoop();
    }
  }

  /**
   * ゲームを初期状態に戻して再開
   */
  private restart(): void {
    this.player = this.createPlayer();
    this.initEnemies();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.score = 0;
    this.gameStartTime = Date.now();
    this.updateScore();
    this.state = 'playing';
    this.hideOverlay();
    
    // BGMを再開
    Audio.startBGM();
    
    this.gameLoop();
  }

  /**
   * プレイヤーの状態を更新
   * キーボード入力に基づいて移動と射撃を処理
   */
  private updatePlayer(): void {
    let dx = 0;
    let dy = 0;

    // WASDキーで移動方向を決定
    if (this.keys.has('w')) dy -= 1;
    if (this.keys.has('s')) dy += 1;
    if (this.keys.has('a')) dx -= 1;
    if (this.keys.has('d')) dx += 1;

    // 移動がある場合、ベクトルを正規化して速度を適用
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / length) * CONFIG.playerSpeed;
      dy = (dy / length) * CONFIG.playerSpeed;
    }

    // 画面内に位置を制限しながら移動
    this.player.position.x = clamp(
      this.player.position.x + dx,
      this.player.radius,
      CONFIG.canvasWidth - this.player.radius
    );
    this.player.position.y = clamp(
      this.player.position.y + dy,
      this.player.radius,
      CONFIG.canvasHeight - this.player.radius
    );

    // Mキーで射撃
    if (this.keys.has('m')) {
      this.shootPlayerBullet();
    }
  }

  /**
   * プレイヤーが弾を発射
   * クールダウンをチェックし、最も近い敵を追尾する弾を生成
   */
  private shootPlayerBullet(): void {
    const now = Date.now();
    // クールダウン中なら発射しない
    if (now - this.player.lastShotTime < CONFIG.playerShootCooldown) return;

    // 敵がいなければ発射しない
    const closestEnemy = this.getClosestEnemy();
    if (!closestEnemy) return;

    this.player.lastShotTime = now;

    // ホーミング弾を生成
    this.playerBullets.push({
      position: { x: this.player.position.x, y: this.player.position.y },
      velocity: { x: 0, y: 0 }, // 速度は毎フレーム再計算
      radius: 4,
      isPlayerBullet: true,
      targetEnemy: closestEnemy,
    });

    // 発射音を再生
    Audio.playShoot();
  }

  /**
   * プレイヤーに最も近い敵を取得
   * @returns 最も近い敵、または敵がいない場合はundefined
   */
  private getClosestEnemy(): Enemy | undefined {
    if (this.enemies.length === 0) return undefined;

    return this.enemies.reduce((closest, enemy) => {
      const distToEnemy = distance(this.player.position, enemy.position);
      const distToClosest = distance(this.player.position, closest.position);
      return distToEnemy < distToClosest ? enemy : closest;
    });
  }

  /**
   * 敵機の状態を更新
   * - AI による移動先決定
   * - 移動処理
   * - 弾丸発射（時間経過で発射レートが上昇）
   */
  private updateEnemies(): void {
    const now = Date.now();
    const elapsedTime = now - this.gameStartTime;
    // 10秒経過後は弾丸発射間隔を半分に（難易度上昇）
    const shootInterval = elapsedTime >= 10000
      ? CONFIG.enemyShootInterval / 2
      : CONFIG.enemyShootInterval;

    for (const enemy of this.enemies) {
      // 2秒ごとに移動先を変更
      if (now - enemy.targetChangeTime > 2000) {
        const random = Math.random();
        if (random < 0.5) {
          // 50%の確率でランダムな位置へ
          enemy.targetPosition = {
            x: Math.random() * CONFIG.canvasWidth,
            y: Math.random() * (CONFIG.canvasHeight / 2),
          };
        } else {
          // 50%の確率でプレイヤー付近へ
          enemy.targetPosition = {
            x: this.player.position.x + (Math.random() - 0.5) * 200,
            y: this.player.position.y - 200,
          };
        }
        enemy.targetChangeTime = now;
      }

      // 目標地点への方向ベクトルを計算して移動
      const direction = getDirectionVector(enemy.position, enemy.targetPosition);
      enemy.velocity.x = direction.x * CONFIG.enemySpeed;
      enemy.velocity.y = direction.y * CONFIG.enemySpeed;

      // 画面の上半分に位置を制限
      enemy.position.x = clamp(
        enemy.position.x + enemy.velocity.x,
        enemy.radius,
        CONFIG.canvasWidth - enemy.radius
      );
      enemy.position.y = clamp(
        enemy.position.y + enemy.velocity.y,
        enemy.radius,
        CONFIG.canvasHeight / 2
      );

      // 一定間隔で弾を発射
      if (now - enemy.lastShotTime > shootInterval) {
        this.shootEnemyBullets(enemy);
        enemy.lastShotTime = now;
      }
    }
  }

  /**
   * 敵が全方向に弾を発射
   * @param enemy - 発射する敵機
   */
  private shootEnemyBullets(enemy: Enemy): void {
    const angleStep = (Math.PI * 2) / CONFIG.enemyBulletDirections;

    // 均等な角度で全方向に弾を発射
    for (let i = 0; i < CONFIG.enemyBulletDirections; i++) {
      const angle = angleStep * i;
      const vx = Math.cos(angle) * CONFIG.enemyBulletSpeed;
      const vy = Math.sin(angle) * CONFIG.enemyBulletSpeed;

      this.enemyBullets.push({
        position: { x: enemy.position.x, y: enemy.position.y },
        velocity: { x: vx, y: vy },
        radius: 3,
        isPlayerBullet: false,
      });
    }
  }

  /**
   * すべての弾丸の状態を更新
   * - プレイヤー弾はホーミング（毎フレーム方向を再計算）
   * - 敵弾は直進
   * - 画面外の弾は削除
   */
  private updateBullets(): void {
    // プレイヤー弾の更新（ホーミング処理）
    for (const bullet of this.playerBullets) {
      if (bullet.targetEnemy) {
        // ターゲットへの方向を毎フレーム再計算
        const direction = getDirectionVector(bullet.position, bullet.targetEnemy.position);
        bullet.velocity.x = direction.x * CONFIG.playerBulletSpeed;
        bullet.velocity.y = direction.y * CONFIG.playerBulletSpeed;
      }

      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
    }

    // 敵弾の更新（直進のみ）
    for (const bullet of this.enemyBullets) {
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
    }

    // 画面外に出たプレイヤー弾を削除
    this.playerBullets = this.playerBullets.filter(
      (bullet) =>
        bullet.position.x >= 0 &&
        bullet.position.x <= CONFIG.canvasWidth &&
        bullet.position.y >= 0 &&
        bullet.position.y <= CONFIG.canvasHeight
    );

    // 画面外に出た敵弾を削除（少し余裕を持たせる）
    this.enemyBullets = this.enemyBullets.filter(
      (bullet) =>
        bullet.position.x >= -10 &&
        bullet.position.x <= CONFIG.canvasWidth + 10 &&
        bullet.position.y >= -10 &&
        bullet.position.y <= CONFIG.canvasHeight + 10
    );
  }

  /**
   * すべての衝突判定を処理
   * - プレイヤー弾 vs 敵機
   * - プレイヤー弾 vs 敵弾（相殺）
   * - 敵弾 vs プレイヤー
   * - 敵が全滅したらゲームクリア
   */
  private checkCollisions(): void {
    // プレイヤー弾と敵の衝突判定
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        if (checkCollision(bullet, enemy)) {
          // 弾と敵を削除してスコア加算
          this.playerBullets.splice(i, 1);
          this.enemies.splice(j, 1);
          this.score += CONFIG.scorePerEnemy;
          this.updateScore();
          
          // 着弾音を再生
          Audio.playHit();
          break;
        }
      }
    }

    // プレイヤー弾と敵弾の衝突判定（相殺）
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const playerBullet = this.playerBullets[i];

      for (let j = this.enemyBullets.length - 1; j >= 0; j--) {
        const enemyBullet = this.enemyBullets[j];

        if (checkCollision(playerBullet, enemyBullet)) {
          // 両方の弾を削除
          this.playerBullets.splice(i, 1);
          this.enemyBullets.splice(j, 1);
          break;
        }
      }
    }

    // 敵弾とプレイヤーの衝突判定
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      if (checkCollision(bullet, this.player)) {
        this.enemyBullets.splice(i, 1);
        this.player.lives--;
        
        // 被弾音を再生
        Audio.playDamage();

        // 残機が0になったらゲームオーバー
        if (this.player.lives <= 0) {
          this.gameOver();
        }
      }
    }

    // 敵が全滅したらゲームクリア
    if (this.enemies.length === 0 && this.state === 'playing') {
      this.gameClear();
    }
  }

  /**
   * ゲームオーバー処理
   * スコアを保存してオーバーレイを表示
   */
  private gameOver(): void {
    this.state = 'gameOver';
    
    // BGMを停止してゲームオーバー音を再生
    Audio.stopBGM();
    Audio.playGameOver();
    
    const highScores = saveHighScore(this.score);
    updateHighScoresDisplay(highScores);
    this.showOverlay('ゲームオーバー', 'スコア: ' + this.score, false);
  }

  /**
   * ゲームクリア処理
   * 残機ボーナスを加算してスコアを保存
   */
  private gameClear(): void {
    this.state = 'gameClear';
    
    // BGMを停止してゲームクリア音を再生
    Audio.stopBGM();
    Audio.playGameClear();
    
    const livesBonus = this.player.lives * 100;
    const finalScore = this.score + livesBonus;
    const highScores = saveHighScore(finalScore);
    updateHighScoresDisplay(highScores);
    this.showOverlay('ゲームクリア！', `スコア: ${this.score} + ボーナス: ${livesBonus} = ${finalScore}`, false);
  }

  /**
   * オーバーレイを表示
   * @param title - タイトル文字列
   * @param message - メッセージ文字列
   * @param showContinue - 続けるボタンを表示するか（ポーズ時のtrue）
   */
  private showOverlay(title: string, message: string, showContinue: boolean = false): void {
    const overlay = document.getElementById('gameOverlay');
    const titleEl = document.getElementById('overlayTitle');
    const messageEl = document.getElementById('overlayMessage');
    const continueBtn = document.getElementById('continueBtn');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    // 続けるボタンの表示/非表示
    if (continueBtn) {
      if (showContinue) {
        continueBtn.classList.remove('hidden');
      } else {
        continueBtn.classList.add('hidden');
      }
    }
    
    if (overlay) overlay.classList.remove('hidden');
  }

  /**
   * オーバーレイを非表示
   */
  private hideOverlay(): void {
    const overlay = document.getElementById('gameOverlay');
    const continueBtn = document.getElementById('continueBtn');
    
    // 続けるボタンも確実に非表示にする
    if (continueBtn) {
      continueBtn.classList.add('hidden');
    }
    
    if (overlay) overlay.classList.add('hidden');
  }

  /**
   * スコア表示を更新
   */
  private updateScore(): void {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = this.score.toString();
  }

  /**
   * ゲーム画面を描画
   * すべてのゲームオブジェクトをCanvasに描画
   */
  private render(): void {
    // 背景をクリア
    this.ctx.fillStyle = '#0f1419';
    this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // 残機表示
    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(`残機: ${this.player.lives}`, 10, 25);

    // 経過時間表示
    const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.fillText(`経過時間: ${elapsedSeconds}秒`, 10, 50);

    // プレイヤーを描画（シアン）
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.beginPath();
    this.ctx.arc(this.player.position.x, this.player.position.y, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // 敵機を描画（赤）
    this.ctx.fillStyle = '#ff4444';
    for (const enemy of this.enemies) {
      this.ctx.beginPath();
      this.ctx.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // プレイヤー弾を描画（黄色）
    this.ctx.fillStyle = '#ffff00';
    for (const bullet of this.playerBullets) {
      this.ctx.beginPath();
      this.ctx.arc(bullet.position.x, bullet.position.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 敵弾を描画（オレンジ）
    this.ctx.fillStyle = '#ff8800';
    for (const bullet of this.enemyBullets) {
      this.ctx.beginPath();
      this.ctx.arc(bullet.position.x, bullet.position.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * メインゲームループ
   * 毎フレーム実行され、ゲームの状態を更新して描画
   */
  private gameLoop = (): void => {
    // プレイ中でなければループを停止
    if (this.state !== 'playing') return;

    // 更新処理
    this.updatePlayer();
    this.updateEnemies();
    this.updateBullets();
    this.checkCollisions();

    // 描画処理
    this.render();

    // 次のフレームをリクエスト
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * ゲームを開始
   * ハイスコアを初期化してゲームループを開始
   */
  public start(): void {
    // ハイスコアを初期化（0を保存して既存のスコアを取得）
    updateHighScoresDisplay([0, 0, 0]);
    const highScores = saveHighScore(0);
    updateHighScoresDisplay(highScores);

    // ゲーム開始時刻を記録
    this.gameStartTime = Date.now();
    
    // BGMを開始
    Audio.startBGM();

    // ゲームループを開始
    this.gameLoop();
  }

  /**
   * ゲームを停止
   * アニメーションフレームをキャンセル
   */
  public stop(): void {
    cancelAnimationFrame(this.animationId);
  }
}
