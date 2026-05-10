"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Info, Zap, Volume2, VolumeX } from 'lucide-react';
import { initYandexSDK, showFullscreenAd, submitScoreToLeaderboard, YandexSDK, getLanguage } from '@/lib/yandex-sdk';
import { t, tColor, Language } from '@/lib/i18n';
import { getRandomFact } from '@/lib/facts';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface ColorOption {
  name: string;
  hex: string;
}

interface LevelData {
  target: ColorOption;
  choices: ColorOption[];
  id: number;
}

const COLORS_POOL: ColorOption[] = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Fuchsia', hex: '#FF00A0' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Gold', hex: '#FFD700' },
];

const BG_MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3';
const SFX_CORRECT_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const SFX_WRONG_URL = 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3';
const SFX_START_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const SFX_GAMEOVER_URL = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function GameContainer() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(100);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [fact, setFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [sdk, setSdk] = useState<YandexSDK | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSFX = useCallback((url: string) => {
    if (isMuted) return;
    const sfx = new Audio(url);
    sfx.volume = 0.5;
    sfx.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    initYandexSDK().then(sdkInstance => {
      setSdk(sdkInstance);
      if (sdkInstance) {
        setLang(getLanguage(sdkInstance));
      }
    });
    
    const audio = new Audio(BG_MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const generateLevel = useCallback((currentScore: number) => {
    const correctIdx = Math.floor(Math.random() * COLORS_POOL.length);
    const correctColor = COLORS_POOL[correctIdx];
    
    const numChoices = Math.min(6, 3 + Math.floor(currentScore / 5));
    const wrongChoicesPool = COLORS_POOL.filter(c => c.hex !== correctColor.hex);
    const shuffledWrongPool = shuffle(wrongChoicesPool);
    const selectedWrongOnes = shuffledWrongPool.slice(0, numChoices - 1);
    const finalChoices = shuffle([...selectedWrongOnes, correctColor]);
    
    setLevel({
      target: correctColor,
      choices: finalChoices,
      id: Date.now()
    });
    setTimer(100);
  }, []);

  const endGame = useCallback(async (finalScore: number) => {
    setGameState('GAMEOVER');
    playSFX(SFX_GAMEOVER_URL);
    
    setLoadingFact(true);
    setTimeout(() => {
      setFact(getRandomFact(lang));
      setLoadingFact(false);
    }, 500);

    if (Math.random() > 0.6) {
      await showFullscreenAd(sdk);
    }
    
    if (finalScore > 0) {
      submitScoreToLeaderboard(sdk, 'high_scores', finalScore);
    }
  }, [sdk, lang, playSFX]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (timer <= 0) {
        if (level) {
          endGame(score);
        }
      } else {
        const id = setInterval(() => {
          setTimer((prev) => Math.max(0, prev - 2.5));
        }, 100);
        return () => clearInterval(id);
      }
    }
  }, [gameState, timer, score, level, endGame]);

  const startGame = useCallback(async () => {
    setScore(0);
    setFact(null);
    setFeedback(null);
    generateLevel(0);
    setGameState('PLAYING');
    playSFX(SFX_START_URL);

    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio blocked"));
    }
  }, [generateLevel, playSFX]);

  const handleChoice = useCallback((color: ColorOption) => {
    if (!level) return;
    
    if (color.hex === level.target.hex) {
      const nextScore = score + 1;
      setScore(nextScore);
      setFeedback('CORRECT');
      playSFX(SFX_CORRECT_URL);
      setTimeout(() => setFeedback(null), 200);
      generateLevel(nextScore);
    } else {
      setFeedback('WRONG');
      playSFX(SFX_WRONG_URL);
      setTimeout(() => setFeedback(null), 400);
      setTimer(t => Math.max(0, t - 15));
    }
  }, [level, generateLevel, score, playSFX]);

  const toggleMute = () => setIsMuted(prev => !prev);
  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ru' : 'en');

  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] w-full p-4 max-w-md mx-auto relative overflow-hidden bg-background">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl -z-10" />

      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMute} 
          className="rounded-full bg-white/50 backdrop-blur hover:bg-white/80 h-9 w-9 shadow-sm border border-white/20"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
        </Button>
      </div>

      {/* Language Toggle */}
      <div className="absolute bottom-4 right-4 z-30">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage} 
          className="rounded-full bg-white/70 backdrop-blur-md hover:bg-white/90 h-9 px-3 shadow-xl border border-white/30 font-black text-[10px] flex gap-2 items-center"
        >
          <span className="uppercase">{lang}</span>
        </Button>
      </div>

      {gameState === 'START' && (
        <div className="flex flex-col items-center justify-center flex-1 w-full space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block text-center">
             <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-[1.5rem] sm:rounded-[2rem] blur-xl opacity-20"></div>
             <div className="relative bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/50">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                 <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary fill-current" />
               </div>
               <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-1 tracking-tight leading-none uppercase">
                 {t(lang, 'title')}<br /><span className="text-secondary">{t(lang, 'titleSuffix')}</span>
               </h1>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">{t(lang, 'subtitle')}</p>
             </div>
          </div>
          
          <div className="w-full space-y-4 max-w-[280px]">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-black bg-primary hover:bg-primary/90 text-white rounded-[1.2rem] sm:rounded-[1.5rem] shadow-[0_6px_0_rgb(220,38,38)] sm:shadow-[0_8px_0_rgb(220,38,38)] hover:translate-y-[2px] hover:shadow-[0_4px_0_rgb(220,38,38)] active:translate-y-[6px] active:shadow-[0_2px_0_rgb(220,38,38)] transition-all flex flex-col gap-0 items-center justify-center"
            >
              <span>{t(lang, 'playNow')}</span>
              <span className="text-[9px] font-bold opacity-70 tracking-widest">{t(lang, 'startBlitzing')}</span>
            </Button>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-xl sm:rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-secondary" />
                <span className="text-[9px] uppercase font-black text-muted-foreground">{t(lang, 'leaderboards')}</span>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-xl sm:rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-primary" />
                <span className="text-[9px] uppercase font-black text-muted-foreground">{t(lang, 'quickReflex')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && level && (
        <div className={`w-full h-full flex flex-col justify-between py-4 ${feedback === 'WRONG' ? 'game-shake' : ''}`}>
          <div className="w-full flex justify-between items-center">
             <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border-2 border-primary/10">
                <Trophy className="w-4 h-4 text-secondary" />
                <span className="text-lg font-black text-foreground tabular-nums">{score}</span>
             </div>
             <div className="flex-1 max-w-[150px] ml-4">
                <div className="relative h-3 w-full bg-white/50 rounded-full border-2 border-white overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-100 ease-linear"
                    style={{ width: `${timer}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            <div className="text-center">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t(lang, 'matchThis')}</h2>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-full" />
              <div 
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[2rem] sm:rounded-[3rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] transition-all duration-200 border-6 sm:border-8 border-white relative z-10 ${feedback === 'CORRECT' ? 'scale-110 game-bounce' : ''}`}
                style={{ backgroundColor: level.target.hex }}
              />
              {feedback === 'CORRECT' && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-20 animate-bounce">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
              )}
            </div>
            
            <p className="text-sm sm:text-base font-black text-foreground/80 uppercase tracking-[0.2em]">{tColor(lang, level.target.name)}</p>
          </div>

          <div key={level.id} className="w-full flex flex-wrap justify-center gap-3 sm:gap-4 pb-16 sm:pb-20">
            {level.choices.map((choice, i) => (
              <button
                key={`${choice.name}-${i}`}
                onClick={() => handleChoice(choice)}
                className={`
                  ${level.choices.length > 4 ? 'w-[calc(33.33%-11px)]' : 'w-[calc(50%-11px)]'} 
                  aspect-square rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none relative overflow-hidden border-3 sm:border-4 border-white/80
                `}
                style={{ backgroundColor: choice.hex }}
              >
                <div className="absolute inset-0 bg-white opacity-0 active:opacity-20 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="flex flex-col items-center justify-center h-full w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 py-4 overflow-hidden">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-t-6 sm:border-t-8 border-primary w-full text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-full -mr-10 -mt-10 sm:-mr-12 sm:-mt-12" />
            <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2 sm:mb-4 uppercase tracking-tight">{t(lang, 'blitzOver')}</h2>
            <div className="text-6xl sm:text-7xl font-black text-primary mb-1 sm:mb-2 tracking-tighter tabular-nums">{score}</div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t(lang, 'finalScore')}</p>
          </div>

          <div className="w-full space-y-4 flex flex-col flex-1 min-h-0 justify-between overflow-hidden">
            {fact && (
              <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-secondary/20 relative w-full shadow-sm overflow-y-auto no-scrollbar flex-1">
                <div className="absolute top-2 left-4 bg-secondary text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest flex items-center gap-1.5 shadow-md z-10">
                  <Info className="w-3 h-3" />
                  {t(lang, 'colorFact')}
                </div>
                <p className="text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed text-center pt-6 sm:pt-8">
                  {fact}
                </p>
              </div>
            )}

            {loadingFact && (
              <div className="animate-pulse flex flex-col items-center space-y-2 w-full py-4 flex-1">
                <div className="h-2 bg-muted-foreground/20 rounded-full w-3/4" />
                <div className="h-2 bg-muted-foreground/20 rounded-full w-1/2" />
              </div>
            )}

            <div className="flex flex-col gap-3 w-full shrink-0">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="h-14 sm:h-16 text-lg sm:text-xl font-black bg-primary hover:bg-primary/90 rounded-[1.2rem] sm:rounded-2xl shadow-[0_4px_0_rgb(220,38,38)] sm:shadow-[0_6px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-none transition-all w-full"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                {t(lang, 'retryBlitz')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGameState('START')} 
                size="lg" 
                className="h-12 sm:h-14 text-[10px] sm:text-xs font-black border-2 border-muted rounded-[1.2rem] sm:rounded-2xl text-muted-foreground hover:bg-muted transition-all w-full uppercase tracking-widest"
              >
                {t(lang, 'mainMenu')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
