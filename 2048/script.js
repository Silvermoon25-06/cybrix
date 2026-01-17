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
            div.classList.add("t"+v);
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

function move(arr){
    let newArr = arr.filter(v=>v);
    for(let i=0;i<newArr.length-1;i++){
        if(newArr[i]===newArr[i+1]){
            newArr[i]*=2;
            score+=newArr[i];
            newArr.splice(i+1,1);
        }
    }
    while(newArr.length<4) newArr.push(0);
    return newArr;
}

function rotate(times){
    while(times--){
        let temp=[];
        for(let i=0;i<4;i++){
            for(let j=3;j>=0;j--){
                temp.push(board[j*4+i]);
            }
        }
        board=temp;
    }
}

function moveBoard(direction){
    let old = board.join();

    if(direction==="up") rotate(1);
    if(direction==="right") rotate(2);
    if(direction==="down") rotate(3);

    for(let r=0;r<4;r++){
        let row = board.slice(r*4,r*4+4);
        let moved = move(row);
        for(let i=0;i<4;i++) board[r*4+i]=moved[i];
    }

    if(direction==="up") rotate(3);
    if(direction==="right") rotate(2);
    if(direction==="down") rotate(1);

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
        let x=i%4, y=Math.floor(i/4);
        if(x<3 && board[i]===board[i+1]) return;
        if(y<3 && board[i]===board[i+4]) return;
    }

    alert("Game Over!");
}

function resetGame(){
    board=Array(16).fill(0);
    score=0;
    addTile();
    addTile();
    createGrid();
    scoreText.textContent="Score: 0";
}

document.addEventListener("keydown",e=>{
    if(e.key==="ArrowLeft") moveBoard("left");
    if(e.key==="ArrowRight") moveBoard("right");
    if(e.key==="ArrowUp") moveBoard("up");
    if(e.key==="ArrowDown") moveBoard("down");
});

let startX,startY;
document.addEventListener("touchstart",e=>{
    startX=e.touches[0].clientX;
    startY=e.touches[0].clientY;
});

document.addEventListener("touchend",e=>{
    let dx=e.changedTouches[0].clientX-startX;
    let dy=e.changedTouches[0].clientY-startY;

    if(Math.abs(dx)>Math.abs(dy)){
        if(dx>30) moveBoard("right");
        if(dx<-30) moveBoard("left");
    } else {
        if(dy>30) moveBoard("down");
        if(dy<-30) moveBoard("up");
    }
});

resetGame();
