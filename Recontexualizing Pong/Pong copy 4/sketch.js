let paddle1, paddle2;
let paddleWidth = 20, paddleHeight = 100;
let historyLength = 120; // store 120 frames (~2 seconds at 60fps)
let paddle1History = [];
let paddle2History = [];
let score1 = 0, score2 = 0;

function setup() {
  createCanvas(800, 500);
  paddle1 = createVector(50, height/2 - paddleHeight/2);
  paddle2 = createVector(width - 70, height/2 - paddleHeight/2);
}

function draw() {
  background(20, 40, 60);

  handleInput();

  // Save history
  paddle1History.push(paddle1.y);
  paddle2History.push(paddle2.y);
  if(paddle1History.length > historyLength) paddle1History.shift();
  if(paddle2History.length > historyLength) paddle2History.shift();

  // Draw paddles and trails
  drawPaddles();

  // Draw center line
  stroke(255, 50);
  strokeWeight(2);
  line(width/2, 0, width/2, height);

  drawScores();
}

function handleInput() {
  // Paddle movement
  if(keyIsDown(87) && paddle1.y > 0) paddle1.y -= 5;
  if(keyIsDown(83) && paddle1.y + paddleHeight < height) paddle1.y += 5;
  if(keyIsDown(UP_ARROW) && paddle2.y > 0) paddle2.y -= 5;
  if(keyIsDown(DOWN_ARROW) && paddle2.y + paddleHeight < height) paddle2.y += 5;

  // Temporal manipulation
  if(keyIsDown(65)) rewindPaddle(1); // Player1 rewinds
  if(keyIsDown(37)) rewindPaddle(2); // Player2 rewinds
}

function drawPaddles() {
  // Draw trails (ghosted past positions)
  for(let i=0; i<paddle1History.length; i+=5){
    let alpha = map(i, 0, paddle1History.length, 50, 0);
    fill(200, 220, 255, alpha);
    rect(paddle1.x, paddle1History[i], paddleWidth, paddleHeight, 10);

    fill(255, 180, 180, alpha);
    rect(paddle2.x, paddle2History[i], paddleWidth, paddleHeight, 10);
  }

  // Draw current paddles
  noStroke();
  fill(200, 220, 255);
  rect(paddle1.x, paddle1.y, paddleWidth, paddleHeight, 10);

  fill(255, 180, 180);
  rect(paddle2.x, paddle2.y, paddleWidth, paddleHeight, 10);
}

function rewindPaddle(player) {
  // Rewind 30 frames (~0.5 sec)
  let rewindFrames = 30;
  if(player===1 && paddle1History.length>=rewindFrames){
    paddle1.y = paddle1History[paddle1History.length - rewindFrames];
  } else if(player===2 && paddle2History.length>=rewindFrames){
    paddle2.y = paddle2History[paddle2History.length - rewindFrames];
  }
}

function drawScores(){
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text(score1, width/4, 50);
  text(score2, width*3/4, 50);
}