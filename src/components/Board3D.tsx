import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from '../utils/minesweeper';

const NUMBER_COLORS_3D = [
  '#000000', '#2196f3', '#4caf50', '#f44336', '#9c27b0', '#ff9800', '#00bcd4', '#000000', '#757575',
  '#e91e63', '#3f51b5', '#009688', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff5722', '#795548', '#607d8b',
  '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'
];

function Cell3D({ cell, size, expanded, onClick, onContextMenu, onHoverStart, onHoverEnd }: any) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { isRevealed, isMine, isFlagged, neighborMines, x, y, z } = cell;

  // Calculate target position based on expanded state
  const spacing = expanded ? 1.8 : 1.05;
  const targetX = (x - size / 2 + 0.5) * spacing;
  const targetY = (y - size / 2 + 0.5) * spacing;
  const targetZ = (z - size / 2 + 0.5) * spacing;

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 10);
    }
  });

  // Make empty revealed cells highly transparent to see inside the cube
  const isEmptyRevealed = isRevealed && !isMine && neighborMines === 0;
  
  let color = '#ff8da1';
  let opacity = 1;
  let transparent = false;

  if (isEmptyRevealed) {
    opacity = 0.08;
    transparent = true;
    color = '#ffffff';
  } else if (isRevealed) {
    color = isMine ? '#ff4444' : '#ffffff';
    opacity = 0.9;
    transparent = true;
  } else if (isFlagged) {
    color = '#4fc3f7'; // Blue for flagged
  } else if (hovered) {
    color = '#ff69b4';
  }

  // Scale down empty cells slightly to reduce clutter
  const scale = isEmptyRevealed ? 0.6 : 0.95;

  return (
    <group ref={ref}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerUp={(e) => {
          if (e.button === 2) {
            e.stopPropagation();
            onContextMenu(e);
          }
        }}
        onContextMenu={(e) => { e.stopPropagation(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHoverStart?.(); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHoverEnd?.(); }}
        receiveShadow
        castShadow={!isRevealed}
      >
        <boxGeometry args={[scale, scale, scale]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1} 
          transparent={transparent} 
          opacity={opacity} 
          depthWrite={!transparent} 
        />
      </mesh>

      {isRevealed && !isMine && neighborMines > 0 && (
        <Billboard>
          <Text 
            fontSize={0.6}
            color={NUMBER_COLORS_3D[neighborMines] || '#000'}
            fontWeight="bold"
            outlineWidth={0.02}
            outlineColor="#ffffff"
          >
            {neighborMines}
          </Text>
        </Billboard>
      )}

      {isRevealed && isMine && (
        <Html center style={{ pointerEvents: 'none', fontSize: '24px', userSelect: 'none' }}>
          🐶
        </Html>
      )}

      {!isRevealed && isFlagged && (
        <Html center style={{ pointerEvents: 'none', fontSize: '24px', userSelect: 'none' }}>
          🐟
        </Html>
      )}
    </group>
  );
}

export default function Board3D({ board, onReveal, onFlag }: { board: Board, onReveal: any, onFlag: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeoutRef = useRef<any>(null);

  if (!board || board.length === 0) return null;
  const size = board.length;

  const handlePointerOver = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExpanded(true);
  };

  const handlePointerOut = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300); // Small delay to prevent jitter when moving between cells
  };

  return (
    <group position={[0, 0, 0]}>
      {board.map((slice, x) => 
        slice.map((row, y) => 
          row.map((cell, z) => (
            <Cell3D 
              key={`${x}-${y}-${z}`}
              cell={cell}
              size={size}
              expanded={isExpanded}
              onClick={() => onReveal(x, y, z)}
              onContextMenu={(e: any) => onFlag(e, x, y, z)}
              onHoverStart={handlePointerOver}
              onHoverEnd={handlePointerOut}
            />
          ))
        )
      )}
    </group>
  );
}
