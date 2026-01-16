// Chess Game

// =====================
// UI: piece symbols
// =====================
const PIECES = {
  white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
};

// Board uses chars: 'P','N','B','R','Q','K' for White, lowercase for Black.
const INITIAL_BOARD = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

let state = null; // game state object
let selectedSquare = null;
let gameMode = null; // 'human' | 'ai'
let aiDifficulty = "easy";
let gameOver = false;

// DOM elements
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset");
const humanVsHumanButton = document.getElementById("human-vs-human");
const humanVsAiButton = document.getElementById("human-vs-ai");
const aiDifficultySelect = document.getElementById("ai-difficulty");
function cloneBoard(board) {
  return board.map(row => row.slice());
}
function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

function pieceColor(piece){
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "white" : "black";
}
function pieceType(piece){
  return piece ? piece.toLowerCase() : "";
}

function opponent(color){ return color === "white" ? "black" : "white"; }

function algebraic(r,c){
  return "abcdefgh"[c] + (8 - r);
}

function makeEmptyState() {
  return {
    board: cloneBoard(INITIAL_BOARD),
    turn: "white",
    // Castling rights: K/Q for white, k/q for black
    castling: { K: true, Q: true, k: true, q: true },
    enPassant: null, // { r, c } square that can be captured en passant
    halfmove: 0,
    fullmove: 1,
    lastMove: null // for UI
  };
}

// =====================
// Rendering
// =====================
function renderBoard() {
  boardElement.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement("div");
      square.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");
      square.dataset.row = r;
      square.dataset.col = c;
      square.addEventListener("click", handleSquareClick);

      const p = state.board[r][c];
      if (p) {
        const col = pieceColor(p);
        const t = pieceType(p);
        square.textContent = PIECES[col][t];
      }

      boardElement.appendChild(square);
    }
  }
}

function clearHighlights() {
  document.querySelectorAll(".selected, .possible-move").forEach(el => {
    el.classList.remove("selected", "possible-move");
  });
}

function highlightMoves(fromR, fromC) {
  clearHighlights();

  const selectedEl = document.querySelector(`[data-row="${fromR}"][data-col="${fromC}"]`);
  if (selectedEl) selectedEl.classList.add("selected");

  const moves = generateLegalMoves(state).filter(m => m.fromR===fromR && m.fromC===fromC);
  for (const m of moves) {
    const el = document.querySelector(`[data-row="${m.toR}"][data-col="${m.toC}"]`);
    if (el) el.classList.add("possible-move");
  }
}

function updateStatus(extra = "") {
  if (gameOver) return;
  const who = state.turn.charAt(0).toUpperCase() + state.turn.slice(1);
  statusElement.textContent = extra ? `${who}'s turn. ${extra}` : `${who}'s turn`;
}
function handleSquareClick(event) {
  if (gameOver) return;
  const squareEl = event.target.closest(".square");
  if (!squareEl) return;

  const r = parseInt(squareEl.dataset.row, 10);
  const c = parseInt(squareEl.dataset.col, 10);

  const clickedPiece = state.board[r][c];

  if (selectedSquare) {
    // Attempt move
    const legalMoves = generateLegalMoves(state);
    const chosen = legalMoves.find(m =>
      m.fromR === selectedSquare.r &&
      m.fromC === selectedSquare.c &&
      m.toR === r &&
      m.toC === c
    );

    if (chosen) {
      applyMoveInPlace(state, chosen);
      selectedSquare = null;
      clearHighlights();
      renderBoard();
      afterMove();
      return;
    } else {
      // Reselect or clear
      selectedSquare = null;
      clearHighlights();
      renderBoard();
      // If they clicked their own piece, select it
      if (clickedPiece && pieceColor(clickedPiece) === state.turn) {
        selectedSquare = { r, c };
        highlightMoves(r, c);
      }
      return;
    }
  } else {
    if (clickedPiece && pieceColor(clickedPiece) === state.turn) {
      selectedSquare = { r, c };
      highlightMoves(r, c);
    }
  }
}

function afterMove() {
  const end = getGameEndState(state);
  if (end.over) {
    gameOver = true;
    statusElement.textContent = end.message;
    return;
  }

  updateStatus(end.check ? "Check." : "");

  if (gameMode === "ai" && state.turn === "black") {
    setTimeout(() => {
      makeAiMove();
    }, 150);
  }
}

// =====================
// Game end: checkmate/stalemate
// =====================
function findKing(board, color) {
  const k = color === "white" ? "K" : "k";
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      if (board[r][c] === k) return { r, c };
    }
  }
  return null;
}

function isSquareAttacked(stateObj, targetR, targetC, byColor) {
  const board = stateObj.board;

  // Pawns
  const pawnDir = byColor === "white" ? -1 : 1;
  const pawnAttackRows = targetR - pawnDir;
  for (const dc of [-1, 1]) {
    const c = targetC + dc;
    const r = pawnAttackRows;
    if (inBounds(r,c)) {
      const p = board[r][c];
      if (p && pieceColor(p) === byColor && pieceType(p) === "p") return true;
    }
  }

  // Knights
  const knightD = [
    [-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]
  ];
  for (const [dr,dc] of knightD) {
    const r = targetR + dr, c = targetC + dc;
    if (!inBounds(r,c)) continue;
    const p = board[r][c];
    if (p && pieceColor(p)===byColor && pieceType(p)==="n") return true;
  }

  // Bishops / Queens diagonals
  const diag = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr,dc] of diag) {
    let r = targetR + dr, c = targetC + dc;
    while (inBounds(r,c)) {
      const p = board[r][c];
      if (p) {
        if (pieceColor(p)===byColor) {
          const t = pieceType(p);
          if (t==="b" || t==="q") return true;
        }
        break;
      }
      r += dr; c += dc;
    }
  }

  // Rooks / Queens orthogonal
  const ortho = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of ortho) {
    let r = targetR + dr, c = targetC + dc;
    while (inBounds(r,c)) {
      const p = board[r][c];
      if (p) {
        if (pieceColor(p)===byColor) {
          const t = pieceType(p);
          if (t==="r" || t==="q") return true;
        }
        break;
      }
      r += dr; c += dc;
    }
  }

  // King adjacent
  for (let dr=-1; dr<=1; dr++){
    for (let dc=-1; dc<=1; dc++){
      if (dr===0 && dc===0) continue;
      const r = targetR+dr, c = targetC+dc;
      if (!inBounds(r,c)) continue;
      const p = board[r][c];
      if (p && pieceColor(p)===byColor && pieceType(p)==="k") return true;
    }
  }

  return false;
}

function isInCheck(stateObj, color) {
  const kingPos = findKing(stateObj.board, color);
  if (!kingPos) return true; // king missing = illegal, treat as check
  return isSquareAttacked(stateObj, kingPos.r, kingPos.c, opponent(color));
}

function getGameEndState(stateObj) {
  const legal = generateLegalMoves(stateObj);
  const inCheck = isInCheck(stateObj, stateObj.turn);

  if (legal.length === 0) {
    if (inCheck) {
      return { over: true, check: true, message: `${opponent(stateObj.turn)[0].toUpperCase()+opponent(stateObj.turn).slice(1)} wins by checkmate.` };
    }
    return { over: true, check: false, message: "Draw by stalemate." };
  }

  return { over: false, check: inCheck, message: "" };
}
function generateLegalMoves(stateObj) {
  const pseudo = generatePseudoMoves(stateObj);
  const legal = [];
  for (const m of pseudo) {
    const copy = copyState(stateObj);
    applyMoveInPlace(copy, m);
    // legal if your king is not left in check (note: turn flips inside applyMove)
    const movedColor = opponent(copy.turn); // because applyMove toggled turn
    if (!isInCheck(copy, movedColor)) {
      legal.push(m);
    }
  }
  return legal;
}

function copyState(s) {
  return {
    board: cloneBoard(s.board),
    turn: s.turn,
    castling: { ...s.castling },
    enPassant: s.enPassant ? { ...s.enPassant } : null,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
    lastMove: s.lastMove ? { ...s.lastMove } : null
  };
}

function generatePseudoMoves(stateObj) {
  const moves = [];
  const board = stateObj.board;
  const turn = stateObj.turn;

  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const p = board[r][c];
      if (!p) continue;
      if (pieceColor(p) !== turn) continue;

      const t = pieceType(p);
      if (t==="p") genPawnMoves(stateObj, r,c,moves);
      else if (t==="n") genKnightMoves(stateObj, r,c,moves);
      else if (t==="b") genSlideMoves(stateObj, r,c,moves, [[-1,-1],[-1,1],[1,-1],[1,1]]);
      else if (t==="r") genSlideMoves(stateObj, r,c,moves, [[-1,0],[1,0],[0,-1],[0,1]]);
      else if (t==="q") genSlideMoves(stateObj, r,c,moves, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
      else if (t==="k") genKingMoves(stateObj, r,c,moves);
    }
  }

  return moves;
}

function pushIfOk(stateObj, moves, fromR,fromC,toR,toC, extra={}) {
  if (!inBounds(toR,toC)) return;
  const target = stateObj.board[toR][toC];
  const me = stateObj.board[fromR][fromC];
  if (target && pieceColor(target) === pieceColor(me)) return;
  moves.push({ fromR, fromC, toR, toC, captured: target || "", ...extra });
}

function genPawnMoves(stateObj, r,c,moves) {
  const board = stateObj.board;
  const p = board[r][c];
  const color = pieceColor(p);
  const dir = color === "white" ? -1 : 1;
  const startRow = color === "white" ? 6 : 1;
  const promoRow = color === "white" ? 0 : 7;

  // forward 1
  const r1 = r + dir;
  if (inBounds(r1,c) && !board[r1][c]) {
    if (r1 === promoRow) {
      pushIfOk(stateObj,moves,r,c,r1,c,{ promo:"q" }); // auto-queen (simple)
    } else {
      pushIfOk(stateObj,moves,r,c,r1,c,{});
    }

    // forward 2 from start, must have middle empty
    const r2 = r + 2*dir;
    if (r === startRow && inBounds(r2,c) && !board[r2][c] && !board[r1][c]) {
      pushIfOk(stateObj,moves,r,c,r2,c,{});
    }
  }

  // captures
  for (const dc of [-1,1]) {
    const rr = r + dir, cc = c + dc;
    if (!inBounds(rr,cc)) continue;
    const target = board[rr][cc];
    if (target && pieceColor(target) !== color) {
      if (rr === promoRow) pushIfOk(stateObj,moves,r,c,rr,cc,{ promo:"q" });
      else pushIfOk(stateObj,moves,r,c,rr,cc,{});
    }
  }

  // en passant
  if (stateObj.enPassant) {
    const ep = stateObj.enPassant;
    if (ep.r === r + dir && Math.abs(ep.c - c) === 1) {
      // capture onto enPassant square
      moves.push({ fromR:r, fromC:c, toR:ep.r, toC:ep.c, isEnPassant:true, captured:"p" });
    }
  }
}

function genKnightMoves(stateObj, r,c,moves) {
  const d = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr,dc] of d) pushIfOk(stateObj,moves,r,c,r+dr,c+dc,{});
}

function genSlideMoves(stateObj, r,c,moves, dirs) {
  const board = stateObj.board;
  const me = board[r][c];
  for (const [dr,dc] of dirs) {
    let rr=r+dr, cc=c+dc;
    while (inBounds(rr,cc)) {
      const t = board[rr][cc];
      if (!t) {
        moves.push({ fromR:r, fromC:c, toR:rr, toC:cc, captured:"" });
      } else {
        if (pieceColor(t) !== pieceColor(me)) {
          moves.push({ fromR:r, fromC:c, toR:rr, toC:cc, captured:t });
        }
        break;
      }
      rr += dr; cc += dc;
    }
  }
}

function genKingMoves(stateObj, r,c,moves) {
  for (let dr=-1; dr<=1; dr++){
    for (let dc=-1; dc<=1; dc++){
      if (dr===0 && dc===0) continue;
      pushIfOk(stateObj,moves,r,c,r+dr,c+dc,{});
    }
  }
  // Castling (pseudo here; legality checked later by "king not in check + squares not attacked" inside apply filter)
  const color = stateObj.turn;
  if (color === "white" && r===7 && c===4) {
    if (stateObj.castling.K && !stateObj.board[7][5] && !stateObj.board[7][6]) {
      moves.push({ fromR:7, fromC:4, toR:7, toC:6, isCastle:"K", captured:"" });
    }
    if (stateObj.castling.Q && !stateObj.board[7][3] && !stateObj.board[7][2] && !stateObj.board[7][1]) {
      moves.push({ fromR:7, fromC:4, toR:7, toC:2, isCastle:"Q", captured:"" });
    }
  }
  if (color === "black" && r===0 && c===4) {
    if (stateObj.castling.k && !stateObj.board[0][5] && !stateObj.board[0][6]) {
      moves.push({ fromR:0, fromC:4, toR:0, toC:6, isCastle:"k", captured:"" });
    }
    if (stateObj.castling.q && !stateObj.board[0][3] && !stateObj.board[0][2] && !stateObj.board[0][1]) {
      moves.push({ fromR:0, fromC:4, toR:0, toC:2, isCastle:"q", captured:"" });
    }
  }
}

// =====================
// Apply move
// =====================
function applyMoveInPlace(stateObj, move) {
  const b = stateObj.board;
  const piece = b[move.fromR][move.fromC];
  const color = pieceColor(piece);

  // Reset enPassant by default
  stateObj.enPassant = null;

  // Castling special legality: king cannot castle out of / through check.
  if (move.isCastle) {
    // Must not currently be in check
    if (isInCheck(stateObj, color)) return; // should be filtered by legal gen anyway

    // Squares king crosses must not be attacked
    if (color === "white" && move.isCastle === "K") {
      if (isSquareAttacked(stateObj,7,5,"black") || isSquareAttacked(stateObj,7,6,"black")) return;
      // move king
      b[7][6] = "K"; b[7][4] = "";
      // move rook
      b[7][5] = "R"; b[7][7] = "";
      stateObj.castling.K = false; stateObj.castling.Q = false;
    } else if (color === "white" && move.isCastle === "Q") {
      if (isSquareAttacked(stateObj,7,3,"black") || isSquareAttacked(stateObj,7,2,"black")) return;
      b[7][2] = "K"; b[7][4] = "";
      b[7][3] = "R"; b[7][0] = "";
      stateObj.castling.K = false; stateObj.castling.Q = false;
    } else if (color === "black" && move.isCastle === "k") {
      if (isSquareAttacked(stateObj,0,5,"white") || isSquareAttacked(stateObj,0,6,"white")) return;
      b[0][6] = "k"; b[0][4] = "";
      b[0][5] = "r"; b[0][7] = "";
      stateObj.castling.k = false; stateObj.castling.q = false;
    } else if (color === "black" && move.isCastle === "q") {
      if (isSquareAttacked(stateObj,0,3,"white") || isSquareAttacked(stateObj,0,2,"white")) return;
      b[0][2] = "k"; b[0][4] = "";
      b[0][3] = "r"; b[0][0] = "";
      stateObj.castling.k = false; stateObj.castling.q = false;
    }

    stateObj.lastMove = move;
    // Toggle turn
    stateObj.turn = opponent(stateObj.turn);
    if (stateObj.turn === "white") stateObj.fullmove += 1;
    return;
  }

  // En passant capture
  if (move.isEnPassant) {
    b[move.toR][move.toC] = piece;
    b[move.fromR][move.fromC] = "";
    // remove captured pawn behind target square
    const capR = color === "white" ? move.toR + 1 : move.toR - 1;
    b[capR][move.toC] = "";
  } else {
    // Normal move
    b[move.toR][move.toC] = piece;
    b[move.fromR][move.fromC] = "";
  }

  // Pawn double-step sets enPassant
  if (pieceType(piece) === "p" && Math.abs(move.toR - move.fromR) === 2) {
    const midR = (move.toR + move.fromR) / 2;
    stateObj.enPassant = { r: midR, c: move.fromC };
  }

  // Promotion (auto queen)
  if (move.promo) {
    b[move.toR][move.toC] = color === "white" ? "Q" : "q";
  }

  // Update castling rights when king/rook moves or rook captured
  if (pieceType(piece) === "k") {
    if (color === "white") { stateObj.castling.K = false; stateObj.castling.Q = false; }
    else { stateObj.castling.k = false; stateObj.castling.q = false; }
  }
  if (pieceType(piece) === "r") {
    // Rook moved from original squares
    if (move.fromR === 7 && move.fromC === 0) stateObj.castling.Q = false;
    if (move.fromR === 7 && move.fromC === 7) stateObj.castling.K = false;
    if (move.fromR === 0 && move.fromC === 0) stateObj.castling.q = false;
    if (move.fromR === 0 && move.fromC === 7) stateObj.castling.k = false;
  }
  // Rook captured on original squares
  if (move.captured) {
    if (move.toR === 7 && move.toC === 0) stateObj.castling.Q = false;
    if (move.toR === 7 && move.toC === 7) stateObj.castling.K = false;
    if (move.toR === 0 && move.toC === 0) stateObj.castling.q = false;
    if (move.toR === 0 && move.toC === 7) stateObj.castling.k = false;
  }

  stateObj.lastMove = move;

  // Toggle turn
  stateObj.turn = opponent(stateObj.turn);
  if (stateObj.turn === "white") stateObj.fullmove += 1;
}
const PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function evaluate(stateObj) {
  // Positive = good for black (AI), negative = good for white
  // because AI plays black in your current mode.
  let score = 0;
  const b = stateObj.board;
  for (let r=0;r<8;r++){
    for (let c=0;c<8;c++){
      const p = b[r][c];
      if (!p) continue;
      const val = PIECE_VALUE[pieceType(p)] || 0;
      if (pieceColor(p) === "black") score += val;
      else score -= val;
    }
  }
  return score;
}

function orderMoves(moves) {
  // Captures first helps alpha-beta a lot
  return moves.slice().sort((a,b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));
}

function minimax(stateObj, depth, alpha, beta, maximizingBlack) {
  const end = getGameEndState(stateObj);
  if (end.over) {
    // Mate is huge
    if (end.message.includes("wins by checkmate")) {
      // If it's checkmate, side to move is mated.
      // maximizingBlack == true means black is choosing, but stateObj.turn indicates next to play.
      // Score perspective: positive is good for black.
      return stateObj.turn === "black" ? -999999 : 999999;
    }
    return 0; // stalemate draw
  }
  if (depth === 0) return evaluate(stateObj);

  const moves = orderMoves(generateLegalMoves(stateObj));
  if (moves.length === 0) return evaluate(stateObj);

  if (maximizingBlack) {
    let best = -Infinity;
    for (const m of moves) {
      const child = copyState(stateObj);
      applyMoveInPlace(child, m);
      const val = minimax(child, depth-1, alpha, beta, false);
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const child = copyState(stateObj);
      applyMoveInPlace(child, m);
      const val = minimax(child, depth-1, alpha, beta, true);
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

function pickAiMove() {
  const legal = generateLegalMoves(state);
  if (legal.length === 0) return null;

  // Difficulty tuning:
  // easy: mostly random + occasional blunder
  // medium: shallow minimax
  // hard: deeper minimax + less randomness (still offline JS, so don’t expect Stockfish)
  if (aiDifficulty === "easy") {
    // 70% random, 30% pick best 1-ply
    if (Math.random() < 0.7) {
      return legal[Math.floor(Math.random() * legal.length)];
    }
    let best = null, bestVal = -Infinity;
    for (const m of legal) {
      const child = copyState(state);
      applyMoveInPlace(child, m);
      const val = evaluate(child);
      // add noise so it still plays badly
      const noisy = val + (Math.random() * 200 - 100);
      if (noisy > bestVal) { bestVal = noisy; best = m; }
    }
    return best;
  }

  if (aiDifficulty === "medium") {
    const depth = 2;
    let best = null, bestVal = -Infinity;
    for (const m of legal) {
      const child = copyState(state);
      applyMoveInPlace(child, m);
      const val = minimax(child, depth-1, -Infinity, Infinity, false);
      // mild noise to keep it human-ish
      const noisy = val + (Math.random() * 40 - 20);
      if (noisy > bestVal) { bestVal = noisy; best = m; }
    }
    return best;
  }

  // hard
  {
    const depth = 4; 
    let best = null, bestVal = -Infinity;
    for (const m of legal) {
      const child = copyState(state);
      applyMoveInPlace(child, m);
      const val = minimax(child, depth-1, -Infinity, Infinity, false);
      if (val > bestVal) { bestVal = val; best = m; }
    }
    return best;
  }
}

function makeAiMove() {
  if (gameOver) return;
  const move = pickAiMove();
  if (!move) return;

  applyMoveInPlace(state, move);
  renderBoard();
  afterMove();
}

// =====================
// Init + event listeners
// =====================
function initGame() {
  state = makeEmptyState();
  selectedSquare = null;
  gameOver = false;
  renderBoard();
  updateStatus();
  clearHighlights();
}

humanVsHumanButton.addEventListener("click", () => {
  gameMode = "human";
  aiDifficultySelect.style.display = "none";
  initGame();
});

humanVsAiButton.addEventListener("click", () => {
  gameMode = "ai";
  aiDifficultySelect.style.display = "inline-block";
  aiDifficulty = aiDifficultySelect.value;
  initGame();
});

aiDifficultySelect.addEventListener("change", () => {
  aiDifficulty = aiDifficultySelect.value;
});

resetButton.addEventListener("click", initGame);

// Start
initGame();
