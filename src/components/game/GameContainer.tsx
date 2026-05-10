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
  { name: 'Fuchsia', hex: '#FF00E0' },
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
          className="rounded-full bg-white/50 backdrop-blur hover:bg-white/80 h-8 w-8 sm:h-9 sm:w-9 shadow-sm border border-white/20"
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
          className="rounded-full bg-white/70 backdrop-blur-md hover:bg-white/90 h-8 sm:h-9 px-2 sm:px-3 shadow-xl border border-white/30 font-black text-[10px] flex gap-2 items-center"
        >
          <span className="uppercase">{lang}</span>
        </Button>
      </div>

      {gameState === 'START' && (
        <div className="flex flex-col items-center justify-center flex-1 w-full space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500 overflow-hidden">
          <div className="relative inline-block text-center scale-90 sm:scale-100">
             <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-[1.5rem] sm:rounded-[2rem] blur-xl opacity-20"></div>
             <div className="relative bg-white/80 backdrop-blur-md p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/50">
               <div className="w-10 h-10 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-bounce">
                 <Zap className="w-6 h-6 sm:w-10 sm:h-10 text-primary fill-current" />
               </div>
               <h1 className="text-2xl sm:text-4xl font-black text-foreground mb-1 tracking-tight leading-none uppercase">
                 {t(lang, 'title')}<br /><span className="text-secondary">{t(lang, 'titleSuffix')}</span>
               </h1>
               <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 sm:mt-2">{t(lang, 'subtitle')}</p>
             </div>
          </div>
          
          <div className="w-full space-y-3 sm:space-y-4 max-w-[280px]">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="w-full h-14 sm:h-20 text-lg sm:text-2xl font-black bg-primary hover:bg-primary/90 text-white rounded-[1.2rem] sm:rounded-[1.5rem] shadow-[0_4px_0_rgb(220,38,38)] sm:shadow-[0_8px_0_rgb(220,38,38)] hover:translate-y-[1px] active:translate-y-[4px] transition-all flex flex-col gap-0 items-center justify-center"
            >
              <span>{t(lang, 'playNow')}</span>
              <span className="text-[8px] sm:text-[9px] font-bold opacity-70 tracking-widest">{t(lang, 'startBlitzing')}</span>
            </Button>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Trophy className="w-4 h-4 mb-1 text-secondary" />
                <span className="text-[8px] uppercase font-black text-muted-foreground">{t(lang, 'leaderboards')}</span>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Zap className="w-4 h-4 mb-1 text-primary" />
                <span className="text-[8px] uppercase font-black text-muted-foreground">{t(lang, 'quickReflex')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && level && (
        <div className={`w-full h-full flex flex-col justify-between py-2 sm:py-4 ${feedback === 'WRONG' ? 'game-shake' : ''}`}>
          <div className="w-full flex justify-between items-center px-1">
             <div className="bg-white/80 backdrop-blur px-2.5 py-1 rounded-full shadow-lg flex items-center gap-2 border border-primary/10">
                <Trophy className="w-3.5 h-3.5 text-secondary" />
                <span className="text-base font-black text-foreground tabular-nums">{score}</span>
             </div>
             <div className="flex-1 max-w-[120px] sm:max-w-[150px] ml-4">
                <div className="relative h-2.5 sm:h-3 w-full bg-white/50 rounded-full border border-white overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-100 ease-linear"
                    style={{ width: `${timer}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-6 min-h-0">
            <div className="text-center">
              <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t(lang, 'matchThis')}</h2>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-full" />
              <div 
                className={`w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.3)] transition-all duration-200 border-4 sm:border-8 border-white relative z-10 ${feedback === 'CORRECT' ? 'scale-110 game-bounce' : ''}`}
                style={{ backgroundColor: level.target.hex }}
              />
              {feedback === 'CORRECT' && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full shadow-lg z-20 animate-bounce">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
              )}
            </div>
            
            <p className="text-xs sm:text-base font-black text-foreground/80 uppercase tracking-[0.2em]">{tColor(lang, level.target.name)}</p>
          </div>

          <div key={level.id} className="w-full flex flex-wrap justify-center gap-2 sm:gap-4 pb-12 sm:pb-20 px-1">
            {level.choices.map((choice, i) => (
              <button
                key={`${choice.name}-${i}`}
                onClick={() => handleChoice(choice)}
                className={`
                  ${level.choices.length > 4 ? 'w-[calc(33.33%-7px)]' : 'w-[calc(50%-7px)]'} 
                  aspect-square rounded-xl sm:rounded-2xl shadow-[0_3px_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none relative overflow-hidden border-2 sm:border-4 border-white/80
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
        <div className="flex flex-col items-center justify-center h-full w-full space-y-3 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 py-2 sm:py-4 overflow-hidden">
          <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border-t-4 sm:border-t-8 border-primary w-full text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full -mr-8 -mt-8 sm:-mr-12 sm:-mt-12" />
            <h2 className="text-lg sm:text-2xl font-black text-foreground mb-1 sm:mb-4 uppercase tracking-tight">{t(lang, 'blitzOver')}</h2>
            <div className="text-5xl sm:text-7xl font-black text-primary mb-1 tracking-tighter tabular-nums">{score}</div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t(lang, 'finalScore')}</p>
          </div>

          <div className="w-full space-y-3 sm:space-y-4 flex flex-col flex-1 min-h-0 justify-between overflow-hidden">
            {fact && (
              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-secondary/20 relative w-full shadow-sm overflow-y-auto no-scrollbar flex-1 max-h-[30dvh]">
                <div className="absolute top-1.5 left-3 bg-secondary text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest flex items-center gap-1 shadow-md z-10">
                  <Info className="w-2.5 h-2.5" />
                  {t(lang, 'colorFact')}
                </div>
                <p className="text-[11px] sm:text-sm font-medium text-foreground/80 leading-relaxed text-center pt-5 sm:pt-8">
                  {fact}
                </p>
              </div>
            )}

            {loadingFact && (
              <div className="animate-pulse flex flex-col items-center space-y-2 w-full py-2 flex-1">
                <div className="h-1.5 bg-muted-foreground/20 rounded-full w-3/4" />
                <div className="h-1.5 bg-muted-foreground/20 rounded-full w-1/2" />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3 w-full shrink-0 pb-10 sm:pb-0">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="h-12 sm:h-16 text-base sm:text-xl font-black bg-primary hover:bg-primary/90 rounded-[1rem] sm:rounded-2xl shadow-[0_3px_0_rgb(220,38,38)] sm:shadow-[0_6px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-none transition-all w-full"
              >
                <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 mr-2" />
                {t(lang, 'retryBlitz')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGameState('START')} 
                size="lg" 
                className="h-10 sm:h-14 text-[9px] sm:text-xs font-black border-2 border-muted rounded-[1rem] sm:rounded-2xl text-muted-foreground hover:bg-muted transition-all w-full uppercase tracking-widest"
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
