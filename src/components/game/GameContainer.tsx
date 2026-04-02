"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Trophy, RotateCcw, Info, Zap, Volume2, VolumeX } from 'lucide-react';
import { initYandexSDK, showFullscreenAd, submitScoreToLeaderboard, YandexSDK } from '@/lib/yandex-sdk';
import { aiCreatedColorFact } from '@/ai/flows/ai-created-color-fact-flow';

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
  const [choices, setChoices] = useState(COLORS_POOL.slice(0, 4));
  const [fact, setFact] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [sdk, setSdk] = useState<YandexSDK | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    initYandexSDK().then(setSdk);
    
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
    // 1. Pick a target color
    const correctIdx = Math.floor(Math.random() * COLORS_POOL.length);
    const correctColor = COLORS_POOL[correctIdx];
    
    // 2. Determine number of choices (3 to 6)
    const numChoices = Math.min(6, 3 + Math.floor(currentScore / 5));
    
    // 3. Get wrong choices (filtered by hex to avoid confusing duplicates like Magenta/Fuchsia)
    const wrongChoicesPool = COLORS_POOL.filter(c => c.hex !== correctColor.hex);
    
    // 4. Shuffle pool and take needed amount
    const shuffledPool = [...wrongChoicesPool].sort(() => Math.random() - 0.5);
    const selectedWrongOnes = shuffledPool.slice(0, numChoices - 1);
    
    // 5. Finalize and shuffle choices - ensuring the correct color is definitely included
    const finalChoices = [...selectedWrongOnes, correctColor].sort(() => Math.random() - 0.5);
    
    // 6. Update states together
    setTargetColor(correctColor);
    setChoices(finalChoices);
    setTimer(100);
  }, []);

  const endGame = useCallback(async (finalScore: number, finalColorName: string) => {
    setGameState('GAMEOVER');
    
    setLoadingFact(true);
    try {
      const result = await aiCreatedColorFact({ colorName: finalColorName });
      setFact(result.fact);
    } catch (e) {
      setFact("Color theory is the art and science of how colors interact!");
    } finally {
      setLoadingFact(false);
    }

    if (Math.random() > 0.6) {
      await showFullscreenAd(sdk);
    }
    
    if (finalScore > 0) {
      submitScoreToLeaderboard(sdk, 'high_scores', finalScore);
    }
  }, [sdk]);

  // Handle timer countdown and game state transitions
  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (timer <= 0) {
        endGame(score, targetColor.name);
      } else {
        const id = setInterval(() => {
          setTimer((prev) => Math.max(0, prev - 2));
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
      setTimeout(() => setFeedback(null), 300);
      generateLevel(nextScore);
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback(null), 300);
      setTimer(t => Math.max(0, t - 20));
    }
  }, [targetColor.hex, generateLevel, score]);

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <div className="flex flex-col items-center justify-between h-[100dvh] w-full p-4 max-w-md mx-auto relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl -z-10" />

      {/* Settings bar */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMute} 
          className="rounded-full bg-white/50 backdrop-blur hover:bg-white/80 h-10 w-10"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-primary" />}
        </Button>
      </div>

      {gameState === 'START' && (
        <div className="flex flex-col items-center justify-center h-full w-full space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block text-center">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25"></div>
             <div className="relative bg-white p-6 rounded-2xl shadow-xl">
               <Zap className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
               <h1 className="text-3xl font-black text-foreground mb-1 leading-tight">Color Dash <span className="text-secondary">Blitz</span></h1>
               <p className="text-sm text-muted-foreground font-medium">Test your reaction speed!</p>
             </div>
          </div>
          
          <Button 
            onClick={startGame} 
            size="lg" 
            className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 group"
          >
            <Play className="w-6 h-6 mr-2 fill-current group-hover:rotate-12 transition-transform" />
            PLAY NOW
          </Button>

          <div className="flex justify-center gap-6 text-muted-foreground">
            <div className="flex flex-col items-center">
              <Trophy className="w-5 h-5 mb-1 text-secondary" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Compete</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-5 h-5 mb-1 text-primary" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Fast Pace</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className={`w-full h-full flex flex-col justify-between py-2 space-y-4 ${feedback === 'WRONG' ? 'game-shake' : ''}`}>
          <div className="w-full flex justify-between items-center px-2 pt-2">
             <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm flex items-center gap-2 border">
                <Trophy className="w-4 h-4 text-secondary" />
                <span className="text-lg font-black text-foreground">{score}</span>
             </div>
             <div className="flex-1 max-w-[140px] ml-4">
                <Progress value={timer} className="h-3 bg-white/50 border border-primary/20" />
             </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">Match This Color</h2>
            <div 
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] shadow-2xl transition-transform border-4 border-white ${feedback === 'CORRECT' ? 'scale-110 game-bounce' : ''}`}
              style={{ backgroundColor: targetColor.hex }}
            />
            <p className="text-sm font-bold text-foreground opacity-60 uppercase tracking-widest">{targetColor.name}</p>
          </div>

          <div className={`grid gap-3 w-full pb-4 ${choices.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className="aspect-video sm:aspect-square rounded-2xl shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden group border-2 border-white/50"
                style={{ backgroundColor: choice.hex }}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="flex flex-col items-center justify-center h-full w-full space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto no-scrollbar py-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-primary w-full text-center">
            <h2 className="text-xl font-black text-foreground mb-2">Game Over!</h2>
            <div className="text-5xl font-black text-primary mb-1">{score}</div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Final Score</p>
          </div>

          {fact && (
            <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 relative group w-full">
              <Info className="w-5 h-5 text-secondary absolute -top-2 -left-2 bg-white rounded-full p-1 border shadow-sm" />
              <p className="text-xs italic text-foreground/80 leading-relaxed text-center">
                {fact}
              </p>
            </div>
          )}

          {loadingFact && (
            <div className="animate-pulse space-y-2 w-full">
              <div className="h-3 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
            </div>
          )}

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="h-14 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-md transition-transform active:scale-95 w-full"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              TRY AGAIN
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setGameState('START')} 
              size="lg" 
              className="h-14 text-sm font-bold border-2 rounded-2xl text-muted-foreground hover:bg-muted w-full"
            >
              MAIN MENU
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
