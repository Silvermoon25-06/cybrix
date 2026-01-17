const grid = document.getElementById("grid");
const scoreText = document.getElementById("score");

let board = Array(16).fill(0);
let score = 0;

function createGrid(){
    grid.innerHTML="";
    board.forEach(v=>{
        const div=document.createElement("div");
        div.className="cell";
        if(v){
            div.textContent=v;
            div.classList.add("t"+v);
        }
        grid.appendChild(div);
    });
}

function addTile(){
    let empty=[];
    board.forEach((v,i)=>{ if(v===0) empty.push(i); });
    if(!empty.length) return;
    let i=empty[Math.floor(Math.random()*empty.length)];
    board[i]=Math.random()>0.9?4:2;
}

function slide(row){
    row=row.filter(v=>v);
    for(let i=0;i<row.length-1;i++){
        if(row[i]===row[i+1]){
            row[i]*=2;
            score+=row[i];
            row.splice(i+1,1);
        }
    }
    while(row.length<4) row.push(0);
    return row;
}

function moveLeft(){
    for(let r=0;r<4;r++){
        let row=slide(board.slice(r*4,r*4+4));
        for(let i=0;i<4;i++) board[r*4+i]=row[i];
    }
}

function moveRight(){
    for(let r=0;r<4;r++){
        let row=slide(board.slice(r*4,r*4+4).reverse()).reverse();
        for(let i=0;i<4;i++) board[r*4+i]=row[i];
    }
}

function moveUp(){
    for(let c=0;c<4;c++){
        let col=[board[c],board[c+4],board[c+8],board[c+12]];
        col=slide(col);
        for(let i=0;i<4;i++) board[c+i*4]=col[i];
    }
}

function moveDown(){
    for(let c=0;c<4;c++){
        let col=[board[c],board[c+4],board[c+8],board[c+12]].reverse();
        col=slide(col).reverse();
        for(let i=0;i<4;i++) board[c+i*4]=col[i];
    }
}

function move(dir){
    let old=board.join();

    if(dir==="left") moveLeft();
    if(dir==="right") moveRight();
    if(dir==="up") moveUp();
    if(dir==="down") moveDown();

    if(old!==board.join()){
        addTile();
        createGrid();
        scoreText.textContent="Score: "+score;
        checkGameOver();
    }
}

function checkGameOver(){
    if(board.includes(0)) return;

    for(let i=0;i<16;i++){
        if(i%4<3 && board[i]===board[i+1]) return;
        if(i<12 && board[i]===board[i+4]) return;
    }
    alert("Game Over");
}

function resetGame(){
    board=Array(16).fill(0);
    score=0;
    addTile(); addTile();
    createGrid();
    scoreText.textContent="Score: 0";
}

document.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft") move("left");
    if(e.key==="ArrowRight") move("right");
    if(e.key==="ArrowUp") move("up");
    if(e.key==="ArrowDown") move("down");
});

let sx,sy;
document.addEventListener("touchstart",e=>{
    sx=e.touches[0].clientX;
    sy=e.touches[0].clientY;
});

document.addEventListener("touchend",e=>{
    let dx=e.changedTouches[0].clientX-sx;
    let dy=e.changedTouches[0].clientY-sy;

    if(Math.abs(dx)>Math.abs(dy)){
        if(dx>30) move("right");
        if(dx<-30) move("left");
    } else {
        if(dy>30) move("down");
        if(dy<-30) move("up");
    }
});

resetGame();
