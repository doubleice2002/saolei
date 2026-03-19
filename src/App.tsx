import { useState, useEffect, useCallback } from 'react';
import { Board, createEmptyBoard, placeMines, reveal } from './utils/minesweeper';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Board3D from './components/Board3D';
import CatExplosion3D from './components/CatExplosion3D';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { size: number; mines: number }> = {
  easy: { size: 4, mines: 5 },     // 4x4x4 = 64 cells
  medium: { size: 6, mines: 30 },  // 6x6x6 = 216 cells
  hard: { size: 8, mines: 99 },    // 8x8x8 = 512 cells
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Board>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [time, setTime] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [inputMode, setInputMode] = useState<'reveal' | 'flag'>('reveal');

  const { size, mines } = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    setBoard(createEmptyBoard(size));
    setGameState('idle');
    setFlagsPlaced(0);
    setTime(0);
    setRevealedCount(0);
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing') {
      timer = window.setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const handleCellClick = (x: number, y: number, z: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    
    if (inputMode === 'flag') {
      handleCellRightClick(null, x, y, z);
      return;
    }

    if (board[x][y][z].isFlagged) return;

    let currentBoard = board;

    if (gameState === 'idle') {
      currentBoard = placeMines(createEmptyBoard(size), mines, x, y, z);
      setGameState('playing');
    }

    const { newBoard, hitMine, revealedCount: newRevealed } = reveal(currentBoard, x, y, z);
    setBoard(newBoard);
    
    const totalRevealed = revealedCount + newRevealed;
    setRevealedCount(totalRevealed);

    if (hitMine) {
      setGameState('lost');
      setBoard((prev) =>
        prev.map((slice) =>
          slice.map((row) =>
            row.map((c) => ({
              ...c,
              isRevealed: c.isMine ? true : c.isRevealed,
            }))
          )
        )
      );
    } else if (totalRevealed === size * size * size - mines) {
      setGameState('won');
      setBoard((prev) =>
        prev.map((slice) =>
          slice.map((row) =>
            row.map((c) => ({
              ...c,
              isFlagged: c.isMine ? true : c.isFlagged,
            }))
          )
        )
      );
      setFlagsPlaced(mines);
    }
  };

  const handleCellRightClick = (e: any, x: number, y: number, z: number) => {
    if (e?.preventDefault) e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    if (board[x][y][z].isRevealed) return;

    if (gameState === 'idle') {
      setGameState('playing');
    }

    const isCurrentlyFlagged = board[x][y][z].isFlagged;
    if (!isCurrentlyFlagged && flagsPlaced >= mines) return; 

    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[x] = [...newBoard[x]];
      newBoard[x][y] = [...newBoard[x][y]];
      newBoard[x][y][z] = {
        ...newBoard[x][y][z],
        isFlagged: !isCurrentlyFlagged
      };
      return newBoard;
    });
    
    setFlagsPlaced((prev) => isCurrentlyFlagged ? prev - 1 : prev + 1);
  };

  const getFaceEmoji = () => {
    switch (gameState) {
      case 'won': return '😻';
      case 'lost': return '🙀';
      case 'playing': return '😺';
      default: return '😸';
    }
  };

  return (
    <div 
      className="w-full h-screen bg-pink-50 relative overflow-hidden font-sans selection:bg-pink-200"
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none flex flex-col items-center pt-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-pink-100 max-w-full overflow-x-auto pointer-events-auto"
        >
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black text-pink-500 mb-2 tracking-tight">3D Cat Sweeper 🐾</h1>
            <p className="text-pink-400 font-medium mb-6">Find all the safe spots, avoid the angry dogs!</p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex gap-2 bg-pink-100 p-1 rounded-full">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${
                      difficulty === d 
                        ? 'bg-white text-pink-600 shadow-sm' 
                        : 'text-pink-400 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 bg-pink-100 p-1 rounded-full">
                <button
                  onClick={() => setInputMode('reveal')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    inputMode === 'reveal' ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-400 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  👆 Reveal
                </button>
                <button
                  onClick={() => setInputMode('flag')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    inputMode === 'flag' ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-400 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  🚩 Flag
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between w-full bg-pink-100 p-4 rounded-2xl shadow-inner">
              <div className="flex items-center gap-2 bg-black/80 text-red-400 font-mono text-2xl px-4 py-2 rounded-xl min-w-[5rem] justify-center shadow-inner">
                <span className="text-xl">🐟</span>
                {String(mines - flagsPlaced).padStart(3, '0')}
              </div>
              
              <button 
                onClick={initGame}
                className="text-5xl hover:scale-110 active:scale-95 transition-transform drop-shadow-md"
              >
                {getFaceEmoji()}
              </button>
              
              <div className="flex items-center gap-2 bg-black/80 text-red-400 font-mono text-2xl px-4 py-2 rounded-xl min-w-[5rem] justify-center shadow-inner">
                <span className="text-xl">⏱️</span>
                {String(time).padStart(3, '0')}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 15, 15], fov: 45 }}>
        <color attach="background" args={['#fdf2f8']} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          castShadow 
          intensity={1.5} 
          shadow-mapSize={[2048, 2048]}
        />
        <Environment preset="city" />
        
        <Board3D board={board} onReveal={handleCellClick} onFlag={handleCellRightClick} />
        
        {gameState === 'won' && <CatExplosion3D />}
        
        <ContactShadows position={[0, -0.2, 0]} opacity={0.4} scale={40} blur={2} far={4} />
        
        <OrbitControls 
          target={[0, 0, 0]} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={5} 
          maxDistance={40} 
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
