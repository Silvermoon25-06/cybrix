const board = document.getElementById("board");
const statusText = document.getElementById("status");

const xScoreEl = document.getElementById("xScore");
const oScoreEl = document.getElementById("oScore");
const drawScoreEl = document.getElementById("drawScore");

let xScore = 0;
let oScore = 0;
let drawScore = 0;

let cells = ["","","","","","","","",""];
let gameActive = true;
let currentPlayer = "X";

const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

function createBoard(){
    board.innerHTML = "";
    cells.forEach((_, index)=>{
        const div = document.createElement("div");
        div.classList.add("cell");
        div.addEventListener("click", ()=>playerMove(index));
        board.appendChild(div);
    });
}

function playerMove(index){
    if(!gameActive || cells[index] !== "") return;

    makeMove(index,"X");

    if(gameActive){
        setTimeout(aiMove,500);
    }
}

function aiMove(){
    let emptyIndexes = cells
        .map((v,i)=> v==="" ? i : null)
        .filter(v=>v!==null);

    if(emptyIndexes.length===0) return;

    let move = emptyIndexes[Math.floor(Math.random()*emptyIndexes.length)];
    makeMove(move,"O");
}

function makeMove(index, player){
    cells[index] = player;
    board.children[index].textContent = player;
    board.children[index].classList.add(player==="X"?"x":"o");

    checkWinner(player);
}

function checkWinner(player){
    for(let pattern of winPatterns){
        const [a,b,c] = pattern;
        if(cells[a]===player && cells[b]===player && cells[c]===player){
            gameActive=false;
            if(player==="X"){xScore++; xScoreEl.textContent=xScore;}
            else {oScore++; oScoreEl.textContent=oScore;}
            statusText.textContent = `${player==="X"?"You":"AI"} win!`;
            return;
        }
    }

    if(!cells.includes("")){
        drawScore++;
        drawScoreEl.textContent = drawScore;
        statusText.textContent = "Draw!";
        gameActive=false;
    }
}

function resetGame(){
    cells = ["","","","","","","","",""];
    gameActive = true;
    statusText.textContent = "Your turn (X)";
    createBoard();
}

createBoard();
