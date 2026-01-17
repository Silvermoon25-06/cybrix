const grid = document.getElementById("grid");
const scoreText = document.getElementById("score");

let board = Array(16).fill(0);
let score = 0;

function createGrid(){
    grid.innerHTML="";
    board.forEach(v=>{
        const div=document.createElement("div");
        div.classList.add("cell");
        if(v){
            div.textContent=v;
            div.classList.add("tile");
        }
        grid.appendChild(div);
    });
}

function addTile(){
    let empty = board.map((v,i)=>v===0?i:null).filter(v=>v!==null);
    if(empty.length===0) return;
    let index = empty[Math.floor(Math.random()*empty.length)];
    board[index] = Math.random()>0.9 ? 4 : 2;
}

function moveLeft(){
    for(let r=0;r<4;r++){
        let row = board.slice(r*4,r*4+4).filter(v=>v);
        for(let i=0;i<row.length-1;i++){
            if(row[i]===row[i+1]){
                row[i]*=2;
                score+=row[i];
                row.splice(i+1,1);
            }
        }
        while(row.length<4) row.push(0);
        for(let i=0;i<4;i++) board[r*4+i]=row[i];
    }
}

function handleKey(e){
    let old = board.join();
    if(e.key==="ArrowLeft") moveLeft();
    if(old!==board.join()){
        addTile();
        createGrid();
        scoreText.textContent="Score: "+score;
    }
}

function resetGame(){
    board=Array(16).fill(0);
    score=0;
    addTile();
    addTile();
    createGrid();
    scoreText.textContent="Score: 0";
}

document.addEventListener("keydown",handleKey);

resetGame();
