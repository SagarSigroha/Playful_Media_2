// Animist Pong with System Scoring

let ball;
let leftPaddle, rightPaddle;
let leftScore = 0;
let rightScore = 0;
let systemScore = 0; // Points for system (spirits)
let ballSpiritMood = 0;
let wallSpiritMood = 0;

function setup() {
  createCanvas(800, 400);
  
  // Ball setup
  ball = { x: width/2, y: height/2, r: 20, speedX: random([-5,5]), speedY: random([-3,3]) };
  
  // Paddles setup
  leftPaddle = { x: 50, y: height/2 - 50, w: 20, h: 100, mood: 0 };
  rightPaddle = { x: width-70, y: height/2 - 50, w: 20, h: 100, mood: 0 };
}

function draw() {
  background(20, 30, 50);
  
  // Draw center line
  stroke(100);
  for(let i=0; i<height; i+=20) line(width/2, i, width/2, i+10);
  
  // Update paddles
  updatePaddle(leftPaddle, 87, 83);
  updatePaddle(rightPaddle, UP_ARROW, DOWN_ARROW);
  
  // Update ball
  updateBall();
  
  // Wall spirit effect
  wallSpiritMood += random(-0.05,0.05);
  wallSpiritMood = constrain(wallSpiritMood,-2,2);
  
  if(random(1)<0.002){ // Occasionally wall deflects ball unpredictably
    ball.speedY *= -1;
  }
  
  // Draw ball and paddles spirit aura
  drawSpirit(ball.x, ball.y, ballSpiritMood, color(255,200,50));
  drawSpirit(leftPaddle.x+leftPaddle.w/2, leftPaddle.y+leftPaddle.h/2, leftPaddle.mood, color(50,200,255));
  drawSpirit(rightPaddle.x+rightPaddle.w/2, rightPaddle.y+rightPaddle.h/2, rightPaddle.mood, color(255,50,200));
  
  // Draw scores
  fill(255);
  textSize(28);
  text(leftScore, width/4, 40);
  text(rightScore, 3*width/4, 40);
  text("SYSTEM: "+systemScore, width/2 - 60, 40);
}

function updatePaddle(paddle, upKey, downKey){
  let speed = 5 + paddle.mood;
  if(keyIsDown(upKey)) paddle.y -= speed;
  if(keyIsDown(downKey)) paddle.y += speed;
  
  paddle.y = constrain(paddle.y, 0, height - paddle.h);
  fill(200);
  rect(paddle.x, paddle.y, paddle.w, paddle.h, 10);
  
  paddle.mood += random(-0.1,0.1);
  paddle.mood = constrain(paddle.mood,-2,2);
}

function updateBall(){
  ball.x += ball.speedX + ballSpiritMood*0.5;
  ball.y += ball.speedY + ballSpiritMood*0.5;
  
  // Bounce top/bottom walls
  if(ball.y < 0 || ball.y > height){
    ball.speedY *= -1;
    // Wall spirit sometimes gets point
    if(random(1)<0.3) systemScore++;
  }
  
  // Paddle collision
  if(collides(ball,leftPaddle) || collides(ball,rightPaddle)){
    ball.speedX *= -1;
    ballSpiritMood += random(-1,1);
    ballSpiritMood = constrain(ballSpiritMood, -3, 3);
  }
  
  // Player miss
  if(ball.x < 0){
    rightScore++;
    systemScore += 1; // system gains point when player misses
    resetBall();
  }
  
  if(ball.x > width){
    leftScore++;
    systemScore += 1; // system gains point when player misses
    resetBall();
  }
  
  fill(255,200,50);
  ellipse(ball.x, ball.y, ball.r*2);
}

function collides(b,p){
  return (b.x - b.r < p.x + p.w && b.x + b.r > p.x && b.y + b.r > p.y && b.y - b.r < p.y + p.h);
}

function resetBall(){
  ball.x = width/2;
  ball.y = height/2;
  ball.speedX = random([-5,5]);
  ball.speedY = random([-3,3]);
  ballSpiritMood = 0;
}

function drawSpirit(x, y, mood, c){
  noFill();
  stroke(c.levels[0], c.levels[1], c.levels[2], 100 + mood*50);
  strokeWeight(2 + abs(mood)*2);
  ellipse(x, y, 60 + mood*20);
}
