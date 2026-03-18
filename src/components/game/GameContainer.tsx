"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Trophy, RotateCcw, Info, Zap } from 'lucide-react';
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initYandexSDK().then(setSdk);
  }, []);

  const generateLevel = useCallback(() => {
    const correctIdx = Math.floor(Math.random() * COLORS_POOL.length);
    const correctColor = COLORS_POOL[correctIdx];
    
    // Difficulty progression: more choices as score increases
    const numChoices = Math.min(6, 3 + Math.floor(score / 5));
    
    const shuffledPool = [...COLORS_POOL].sort(() => 0.5 - Math.random());
    const filteredChoices = shuffledPool.filter(c => c.hex !== correctColor.hex).slice(0, numChoices - 1);
    const finalChoices = [...filteredChoices, correctColor].sort(() => 0.5 - Math.random());
    
    setTargetColor(correctColor);
    setChoices(finalChoices);
    setTimer(100);
  }, [score]);

  const startGame = async () => {
    setScore(0);
    setGameState('PLAYING');
    setFact(null);
    setFeedback(null);
    generateLevel();
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          endGame();
          return 0;
        }
        return prev - 2; // Fast decay for hyper casual feel
      });
    }, 100);
  };

  const handleChoice = (color: typeof targetColor) => {
    if (color.hex === targetColor.hex) {
      setScore(s => s + 1);
      setFeedback('CORRECT');
      setTimeout(() => setFeedback(null), 300);
      generateLevel();
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback(null), 300);
      setTimer(t => Math.max(0, t - 20)); // Penalty
    }
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('GAMEOVER');
    
    // AI Fact Integration
    setLoadingFact(true);
    try {
      const result = await aiCreatedColorFact({ colorName: targetColor.name });
      setFact(result.fact);
    } catch (e) {
      setFact("Color theory is the art and science of how colors interact!");
    } finally {
      setLoadingFact(false);
    }

    // Yandex SDK: Show ad every few games
    if (Math.random() > 0.6) {
      await showFullscreenAd(sdk);
    }
    
    // Yandex SDK: Submit leaderboard
    if (score > 0) {
      submitScoreToLeaderboard(sdk, 'high_scores', score);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-md mx-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-3xl -z-10" />

      {gameState === 'START' && (
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-block">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative bg-white p-8 rounded-2xl shadow-xl">
               <Zap className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
               <h1 className="text-4xl font-black text-foreground mb-2">Color Dash <span className="text-secondary">Blitz</span></h1>
               <p className="text-muted-foreground font-medium">Test your reaction speed!</p>
             </div>
          </div>
          
          <Button 
            onClick={startGame} 
            size="lg" 
            className="w-full h-20 text-2xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 group"
          >
            <Play className="w-8 h-8 mr-2 fill-current group-hover:rotate-12 transition-transform" />
            PLAY NOW
          </Button>

          <div className="flex justify-center gap-4 text-muted-foreground">
            <div className="flex flex-col items-center">
              <Trophy className="w-6 h-6 mb-1 text-secondary" />
              <span className="text-xs uppercase font-bold tracking-widest">Compete</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-6 h-6 mb-1 text-primary" />
              <span className="text-xs uppercase font-bold tracking-widest">Fast Pace</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className={`w-full flex flex-col items-center space-y-8 ${feedback === 'WRONG' ? 'game-shake' : ''}`}>
          <div className="w-full flex justify-between items-center mb-4">
             <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="text-xl font-black text-foreground">{score}</span>
             </div>
             <div className="flex-1 max-w-[200px] ml-4">
                <Progress value={timer} className="h-4 bg-white/50 border border-primary/20" />
             </div>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Match This Color</h2>
            <div 
              className={`w-48 h-48 rounded-[3rem] shadow-2xl transition-transform ${feedback === 'CORRECT' ? 'scale-110 game-bounce' : ''}`}
              style={{ backgroundColor: targetColor.hex }}
            />
            <p className="text-lg font-bold text-foreground opacity-50">{targetColor.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                className="aspect-square rounded-3xl shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-90 relative overflow-hidden group"
                style={{ backgroundColor: choice.hex }}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="text-center space-y-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-4 border-primary">
            <h2 className="text-2xl font-black text-foreground mb-4">Game Over!</h2>
            <div className="text-6xl font-black text-primary mb-2">{score}</div>
            <p className="text-muted-foreground font-semibold uppercase tracking-widest">Final Score</p>
          </div>

          {fact && (
            <div className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20 relative group">
              <Info className="w-6 h-6 text-secondary absolute -top-3 -left-3 bg-white rounded-full p-1 border shadow-sm" />
              <p className="text-sm italic text-foreground/80 leading-relaxed">
                {fact}
              </p>
            </div>
          )}

          {loadingFact && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={startGame} 
              size="lg" 
              className="h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-md transition-transform active:scale-95"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              TRY AGAIN
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setGameState('START')} 
              size="lg" 
              className="h-16 text-lg font-bold border-2 rounded-2xl text-muted-foreground hover:bg-muted"
            >
              MAIN MENU
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
