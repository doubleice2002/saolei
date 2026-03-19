export type Cell = {
  x: number;
  y: number;
  z: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export type Board = Cell[][][];

export const createEmptyBoard = (size: number): Board => {
  return Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, z) => ({
        x,
        y,
        z,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    )
  );
};

export const placeMines = (
  board: Board,
  numMines: number,
  firstX: number,
  firstY: number,
  firstZ: number
): Board => {
  const size = board.length;
  let minesPlaced = 0;

  while (minesPlaced < numMines) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const z = Math.floor(Math.random() * size);

    if (!board[x][y][z].isMine && (x !== firstX || y !== firstY || z !== firstZ)) {
      board[x][y][z].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor mines (26 directions in 3D)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (!board[x][y][z].isMine) {
          let count = 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                const nx = x + dx;
                const ny = y + dy;
                const nz = z + dz;
                if (
                  nx >= 0 && nx < size &&
                  ny >= 0 && ny < size &&
                  nz >= 0 && nz < size &&
                  board[nx][ny][nz].isMine
                ) {
                  count++;
                }
              }
            }
          }
          board[x][y][z].neighborMines = count;
        }
      }
    }
  }
  return board;
};

export const reveal = (
  board: Board,
  x: number,
  y: number,
  z: number
): { newBoard: Board; hitMine: boolean; revealedCount: number } => {
  // Deep copy the 3D board
  const newBoard = board.map((slice) =>
    slice.map((row) => row.map((c) => ({ ...c })))
  );
  let hitMine = false;
  let revealedCount = 0;
  const size = board.length;

  if (newBoard[x][y][z].isRevealed || newBoard[x][y][z].isFlagged) {
    return { newBoard, hitMine, revealedCount };
  }

  if (newBoard[x][y][z].isMine) {
    newBoard[x][y][z].isRevealed = true;
    hitMine = true;
    return { newBoard, hitMine, revealedCount: 1 };
  }

  // 3D Flood fill for 0 neighbor mines
  const stack = [[x, y, z]];
  while (stack.length > 0) {
    const [cx, cy, cz] = stack.pop()!;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size || cz < 0 || cz >= size) continue;
    
    const cell = newBoard[cx][cy][cz];
    if (cell.isRevealed || cell.isFlagged) continue;

    cell.isRevealed = true;
    revealedCount++;

    if (cell.neighborMines === 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx !== 0 || dy !== 0 || dz !== 0) {
              stack.push([cx + dx, cy + dy, cz + dz]);
            }
          }
        }
      }
    }
  }

  return { newBoard, hitMine, revealedCount };
};
