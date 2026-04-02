"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Trophy, RotateCcw, Info, Zap, Volume2, VolumeX, Languages } from 'lucide-react';
import { initYandexSDK, showFullscreenAd, submitScoreToLeaderboard, YandexSDK, getLanguage } from '@/lib/yandex-sdk';
import { aiCreatedColorFact } from '@/ai/flows/ai-created-color-fact-flow';
import { t, tColor, Language } from '@/lib/i18n';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

const COLORS_POOL = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Fuchsia', hex: '#FF00FF' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Gold', hex: '#FFD700' },
];

const BG_MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3';

export default function GameContainer() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(100);
  const [targetColor, setTargetColor] = useState(COLORS_POOL[0]);
  const [choices, setChoices] = useState(COLORS_POOL.slice(0, 3));
  const [fact, setFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [sdk, setSdk] = useState<YandexSDK | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    initYandexSDK().then(sdkInstance => {
      setSdk(sdkInstance);
      if (sdkInstance) {
        setLang(getLanguage(sdkInstance));
      }
    });
    
    const audio = new Audio(BG_MUSIC_URL);
    audio.loop = true;
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
    
    // Level 1 starts with 3 choices. Every 5 points we increase complexity up to 6 choices.
    const numChoices = Math.min(6, 3 + Math.floor(currentScore / 5));
    const wrongChoicesPool = COLORS_POOL.filter(c => c.hex !== correctColor.hex);
    const shuffledPool = [...wrongChoicesPool].sort(() => Math.random() - 0.5);
    const selectedWrongOnes = shuffledPool.slice(0, numChoices - 1);
    const finalChoices = [...selectedWrongOnes, correctColor].sort(() => Math.random() - 0.5);
    
    setTargetColor(correctColor);
    setChoices(finalChoices);
    setTimer(100);
  }, []);

  const endGame = useCallback(async (finalScore: number, finalColorName: string) => {
    setGameState('GAMEOVER');
    
    setLoadingFact(true);
    try {
      const result = await aiCreatedColorFact({ colorName: finalColorName, lang });
      setFact(result.fact);
    } catch (e) {
      setFact(t(lang, 'factFallback'));
    } finally {
      setLoadingFact(false);
    }

    if (Math.random() > 0.6) {
      await showFullscreenAd(sdk);
    }
    
    if (finalScore > 0) {
      submitScoreToLeaderboard(sdk, 'high_scores', finalScore);
    }
  }, [sdk, lang]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (timer <= 0) {
        endGame(score, targetColor.name);
      } else {
        const id = setInterval(() => {
          setTimer((prev) => Math.max(0, prev - 2.5));
        }, 100);
        return () => clearInterval(id);
      }
    }
  }, [gameState, timer, score, targetColor.name, endGame]);

  const startGame = useCallback(async () => {
    setScore(0);
    setGameState('PLAYING');
    setFact(null);
    setFeedback(null);
    generateLevel(0);

    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio playback blocked by browser"));
    }
  }, [generateLevel]);

  const handleChoice = useCallback((color: typeof targetColor) => {
    if (color.hex === targetColor.hex) {
      const nextScore = score + 1;
      setScore(nextScore);
      setFeedback('CORRECT');
      setTimeout(() => setFeedback(null), 200);
      generateLevel(nextScore);
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback(null), 400);
      setTimer(t => Math.max(0, t - 15));
    }
  }, [targetColor.hex, generateLevel, score]);

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
          className="rounded-full bg-white/50 backdrop-blur hover:bg-white/80 h-10 w-10 shadow-sm border border-white/20"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
        </Button>
      </div>

      {/* Language Toggle - Moved to Bottom-Right */}
      <div className="absolute bottom-4 right-4 z-30">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage} 
          className="rounded-full bg-white/70 backdrop-blur-md hover:bg-white/90 h-10 px-4 shadow-xl border border-white/30 font-black text-xs flex gap-2 items-center"
        >
          <Languages className="w-4 h-4 text-primary" />
          <span className="uppercase">{lang}</span>
        </Button>
      </div>

      {gameState === 'START' && (
        <div className="flex flex-col items-center justify-center h-full w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block text-center">
             <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-[2rem] blur-xl opacity-20"></div>
             <div className="relative bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-white/50">
               <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                 <Zap className="w-10 h-10 text-primary fill-current" />
               </div>
               <h1 className="text-4xl font-black text-foreground mb-1 tracking-tight leading-none uppercase">
                 {t(lang, 'title')}<br /><span className="text-secondary">{t(lang, 'titleSuffix')}</span>
               </h1>
               <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">{t(lang, 'subtitle')}</p>
             </div>
          </div>
          
          <div className="w-full space-y-4">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="w-full h-20 text-2xl font-black bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-[0_8px_0_rgb(220,38,38)] hover:translate-y-[2px] hover:shadow-[0_6px_0_rgb(220,38,38)] active:translate-y-[6px] active:shadow-[0_2px_0_rgb(220,38,38)] transition-all flex flex-col gap-0 items-center justify-center pt-2"
            >
              <span>{t(lang, 'playNow')}</span>
              <span className="text-[10px] font-bold opacity-70 tracking-widest">{t(lang, 'startBlitzing')}</span>
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 mb-1 text-secondary" />
                <span className="text-[9px] uppercase font-black text-muted-foreground">{t(lang, 'leaderboards')}</span>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center">
                <Zap className="w-5 h-5 mb-1 text-primary" />
                <span className="text-[9px] uppercase font-black text-muted-foreground">{t(lang, 'quickReflex')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className={`w-full h-full flex flex-col justify-between py-2 space-y-4 ${feedback === 'WRONG' ? 'game-shake' : ''}`}>
          <div className="w-full flex justify-between items-center px-2 pt-2">
             <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-primary/10">
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="text-xl font-black text-foreground tabular-nums">{score}</span>
             </div>
             <div className="flex-1 max-w-[160px] ml-4">
                <div className="relative h-4 w-full bg-white/50 rounded-full border-2 border-white overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-100 ease-linear"
                    style={{ width: `${timer}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t(lang, 'matchThis')}</h2>
              <div className="h-1 w-8 bg-primary/20 mx-auto rounded-full" />
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-full" />
              <div 
                className={`w-40 h-40 sm:w-48 sm:h-48 rounded-[3rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-200 border-8 border-white relative z-10 ${feedback === 'CORRECT' ? 'scale-110 game-bounce' : ''}`}
                style={{ backgroundColor: targetColor.hex }}
              />
              {feedback === 'CORRECT' && (
                <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg z-20 animate-bounce">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
              )}
            </div>
            
            <p className="text-base font-black text-foreground/80 uppercase tracking-[0.2em]">{tColor(lang, targetColor.name)}</p>
          </div>

          <div className="w-full flex flex-wrap justify-center gap-3 pb-16">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className={`
                  ${choices.length > 4 ? 'w-[calc(33%-8px)]' : 'w-[calc(50%-6px)]'} 
                  aspect-square rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_0_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none relative overflow-hidden border-4 border-white/80
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
        <div className="flex flex-col items-center justify-center h-full w-full space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto no-scrollbar py-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-t-8 border-primary w-full text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
            <h2 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tight">{t(lang, 'blitzOver')}</h2>
            <div className="text-7xl font-black text-primary mb-2 tracking-tighter tabular-nums">{score}</div>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">{t(lang, 'finalScore')}</p>
          </div>

          <div className="w-full space-y-4 pb-16">
            {fact && (
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-secondary/20 relative group w-full shadow-sm">
                <div className="absolute -top-3 left-6 bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 shadow-md">
                  <Info className="w-3 h-3" />
                  {t(lang, 'colorFact')}
                </div>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed text-center pt-2">
                  {fact}
                </p>
              </div>
            )}

            {loadingFact && (
              <div className="animate-pulse flex flex-col items-center space-y-2 w-full py-4">
                <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4" />
                <div className="h-3 bg-muted-foreground/20 rounded-full w-1/2" />
              </div>
            )}

            <div className="flex flex-col gap-3 w-full pt-4">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="h-16 text-xl font-black bg-primary hover:bg-primary/90 rounded-2xl shadow-[0_6px_0_rgb(220,38,38)] active:translate-y-1 active:shadow-none transition-all w-full"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                {t(lang, 'retryBlitz')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGameState('START')} 
                size="lg" 
                className="h-14 text-sm font-black border-2 border-muted rounded-2xl text-muted-foreground hover:bg-muted transition-all w-full uppercase tracking-widest"
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
