/**
 * オーディオ管理モジュール
 * ZzFXを使った効果音とWeb Audio APIを使ったBGMを管理
 */

import { ZZFX } from 'zzfx';
import { CONFIG } from './config';
import { getMuteState, saveMuteState } from './storage';

// ミュート状態
let isMutedState = false;

// BGM用のWeb Audio API要素
let audioContext: AudioContext | null = null;
let bgmOscillator: OscillatorNode | null = null;
let bgmGain: GainNode | null = null;
let bgmInterval: number | null = null;

// 事前生成された音声バッファのキャッシュ
let cachedSounds: Map<string, AudioBuffer> | null = null;

/**
 * ZzFX効果音パラメータ
 * 各配列はZzFXのパラメータ形式に従う
 */

// プレイヤー発射音（ピューン）
const SOUND_SHOOT = [,,925,.04,.3,.6,1,.3,,6.27,-184,.09,.17];

// 敵撃破音（ヒット）
const SOUND_HIT = [,,1024,.02,.1,.2,1,1.65,,-58,,,,,.1];

// プレイヤー被弾音（ダメージ）
const SOUND_DAMAGE = [,,537,.02,.02,.22,1,1.59,-6.98,,,,,,.5];

// ゲームオーバー音（低い音）
const SOUND_GAME_OVER = [,,925,.04,.23,.44,4,.76,,,-184,,,.14];

// ゲームクリア音（勝利）
const SOUND_GAME_CLEAR = [,,1675,.03,.25,.34,,1.82,,-78,837,.09,.14];

/**
 * 現在のミュート状態を取得
 * @returns 現在のミュート状態
 */
export function isMuted(): boolean {
  return isMutedState;
}

/**
 * ミュート状態をトグル
 * @returns 新しいミュート状態
 */
export function toggleMute(): boolean {
  const newState = !isMutedState;
  isMutedState = newState;
  saveMuteState(newState);
  
  // BGMが再生中なら停止または再開
  if (newState && bgmOscillator) {
    stopBGM();
  }
  
  return newState;
}

/**
 * AudioContextを初期化（必要に応じて作成）
 */
function ensureAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * 音声バッファを事前生成してキャッシュ
 */
function initSoundCache(): void {
  if (cachedSounds) return; // 既にキャッシュ済み
  
  cachedSounds = new Map();
  const ctx = ensureAudioContext();
  
  // 各効果音のサンプルを生成
  const sounds = {
    shoot: SOUND_SHOOT,
    hit: SOUND_HIT,
    damage: SOUND_DAMAGE,
    gameOver: SOUND_GAME_OVER,
    gameClear: SOUND_GAME_CLEAR,
  };
  
  for (const [key, params] of Object.entries(sounds)) {
    try {
      // ZzFXでサンプルデータを生成
      const samples = ZZFX.buildSamples([CONFIG.soundVolume, ...params]);
      
      // AudioBufferを作成
      const buffer = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
      const channelData = buffer.getChannelData(0);
      channelData.set(samples);
      
      cachedSounds.set(key, buffer);
    } catch (error) {
      console.warn(`Failed to cache sound: ${key}`, error);
    }
  }
}

/**
 * キャッシュされた音声バッファを再生
 * @param key - 音声キー
 */
function playCachedSound(key: string): void {
  if (isMutedState) return;
  
  try {
    // 初回呼び出し時にキャッシュを初期化
    if (!cachedSounds) {
      initSoundCache();
    }
    
    const buffer = cachedSounds?.get(key);
    if (!buffer) {
      console.warn(`Sound not found in cache: ${key}`);
      return;
    }
    
    const ctx = ensureAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (error) {
    console.warn(`Failed to play cached sound: ${key}`, error);
  }
}

/**
 * プレイヤー発射音を再生
 */
export function playShoot(): void {
  playCachedSound('shoot');
}

/**
 * 敵撃破音を再生
 */
export function playHit(): void {
  playCachedSound('hit');
}

/**
 * プレイヤー被弾音を再生
 */
export function playDamage(): void {
  playCachedSound('damage');
}

/**
 * ゲームオーバー音を再生
 */
export function playGameOver(): void {
  playCachedSound('gameOver');
}

/**
 * ゲームクリア音を再生
 */
export function playGameClear(): void {
  playCachedSound('gameClear');
}

/**
 * BGMを開始（周波数が時間変化するループトーン）
 * C-E-G-C（ドミソド）の音階パターンをループ
 */
export function startBGM(): void {
  if (isMutedState) return;
  
  try {
    // 既存のBGMを停止
    if (bgmOscillator) {
      stopBGM();
    }
    
    // AudioContextの作成
    const ctx = ensureAudioContext();
    
    // Oscillatorの作成
    bgmOscillator = ctx.createOscillator();
    bgmGain = ctx.createGain();
    
    // 音量を設定（BGMは控えめに）
    bgmGain.gain.value = CONFIG.soundVolume * 0.7;
    
    // Oscillatorを接続
    bgmOscillator.connect(bgmGain);
    bgmGain.connect(ctx.destination);
    
    // 波形を三角波に設定（柔らかい音）
    bgmOscillator.type = 'triangle';
    
    // 初期周波数をC（262Hz）に設定
    bgmOscillator.frequency.value = 262;
    
    // Oscillatorを開始
    bgmOscillator.start();
    
    // 周波数パターン（C-E-G-C: ドミソド）
    const frequencies = [262, 330, 392, 523]; // Hz
    let currentIndex = 0;
    
    // 0.5秒ごとに周波数を変更
    bgmInterval = window.setInterval(() => {
      if (bgmOscillator && !isMutedState) {
        currentIndex = (currentIndex + 1) % frequencies.length;
        bgmOscillator.frequency.value = frequencies[currentIndex];
      }
    }, 500);
    
  } catch (error) {
    console.warn('Failed to start BGM:', error);
  }
}

/**
 * BGMを停止
 */
export function stopBGM(): void {
  try {
    // インターバルをクリア
    if (bgmInterval !== null) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    
    // Oscillatorを停止
    if (bgmOscillator) {
      bgmOscillator.stop();
      bgmOscillator.disconnect();
      bgmOscillator = null;
    }
    
    // Gainノードを切断
    if (bgmGain) {
      bgmGain.disconnect();
      bgmGain = null;
    }
  } catch (error) {
    console.warn('Failed to stop BGM:', error);
  }
}

// モジュール初期化時にミュート状態を読み込む
isMutedState = getMuteState();
