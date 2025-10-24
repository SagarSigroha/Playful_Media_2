let ball;
let leftPaddle, rightPaddle;
let paddleWidth = 15;
let paddleHeight = 100;
let paddleSpeed = 7;
let roleSwitchTime = 10000; // 10 seconds
let lastSwitch = 0;
let ballControlledBy = 'player1';
let scoreLeft = 0;
let scoreRight = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeGame();
  lastSwitch = millis();
}

function draw() {
  background(0);
  
  // Draw paddles
  fill(255);
  rect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
  rect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);
  
  // Draw ball
  ellipse(ball.x, ball.y, 20, 20);
  
  // Draw scores
  textSize(32);
  textAlign(CENTER);
  text(scoreLeft + " : " + scoreRight, width/2, 50);
  
  // Role switching
  if (millis() - lastSwitch > roleSwitchTime) {
    ballControlledBy = ballControlledBy === 'player1' ? 'player2' : 'player1';
    lastSwitch = millis();
  }
  
  // Paddle movement
  if (ballControlledBy !== 'player1') {
    if (keyIsDown(87)) leftPaddle.y -= paddleSpeed; // W
    if (keyIsDown(83)) leftPaddle.y += paddleSpeed; // S
  }
  if (ballControlledBy !== 'player2') {
    if (keyIsDown(UP_ARROW)) rightPaddle.y -= paddleSpeed;
    if (keyIsDown(DOWN_ARROW)) rightPaddle.y += paddleSpeed;
  }
  
  // Ball control
  let ballSpeed = 3; // slower speed
  if (ballControlledBy === 'player1') {
    if (keyIsDown(87)) ball.vy = -ballSpeed;
    else if (keyIsDown(83)) ball.vy = ballSpeed;
    if (keyIsDown(65)) ball.vx = -ballSpeed;
    else if (keyIsDown(68)) ball.vx = ballSpeed;
  } else {
    if (keyIsDown(UP_ARROW)) ball.vy = -ballSpeed;
    else if (keyIsDown(DOWN_ARROW)) ball.vy = ballSpeed;
    if (keyIsDown(LEFT_ARROW)) ball.vx = -ballSpeed;
    else if (keyIsDown(RIGHT_ARROW)) ball.vx = ballSpeed;
  }
  
  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Bounce top/bottom
  if (ball.y <= 0 || ball.y >= height) {
    ball.vy *= -1;
  }
  
  // Paddle collisions
  if (ball.x - 10 <= leftPaddle.x + paddleWidth && ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + paddleHeight) {
    ball.vx *= -1;
  }
  if (ball.x + 10 >= rightPaddle.x && ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + paddleHeight) {
    ball.vx *= -1;
  }
  
  // Scoring
  if (ball.x < 0) {
    scoreRight++;
    resetBall();
  }
  if (ball.x > width) {
    scoreLeft++;
    resetBall();
  }
}

function resetBall() {
  ball.x = width / 2;
  ball.y = height / 2;
  ball.vx = random([-3,3]);
  ball.vy = random([-3,3]);
  ballControlledBy = random(['player1','player2']);
  lastSwitch = millis();
}

function initializeGame() {
  ball = {
    x: width / 2,
    y: height / 2,
    vx: random([-3, 3]),
    vy: random([-3, 3])
  };
  leftPaddle = {
    x: 50,
    y: height / 2 - paddleHeight / 2
  };
  rightPaddle = {
    x: width - 50 - paddleWidth,
    y: height / 2 - paddleHeight / 2
  };
}

// Make canvas resize with window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeGame();
}
