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

// Paddle colors
let leftColor, rightColor;

// Ball speed
let baseSpeed = 5;        // starting speed
let speedIncrement = 0.02; // acceleration
let ballTrail = []; // trail particles

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Paddle colors
  leftColor = color(0, 162, 232); // blue
  rightColor = color(255, 127, 39); // orange
  
  initializeGame();
  lastSwitch = millis();
}

function draw() {
  background(0, 60); // slight fade for smooth trail effect
  
  // Draw trail and glowing ball
  drawMagicalBall();
  
  // Draw paddles with glow
  drawPaddle(leftPaddle, leftColor);
  drawPaddle(rightPaddle, rightColor);
  
  // Draw scores
  textSize(32);
  textAlign(CENTER);
  fill(255);
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
  
  // Ball control with smoothing
  let ballSpeed = baseSpeed;
  if (ballControlledBy === 'player1') {
    if (keyIsDown(87)) ball.vy = lerp(ball.vy, -ballSpeed, 0.2);
    else if (keyIsDown(83)) ball.vy = lerp(ball.vy, ballSpeed, 0.2);
    if (keyIsDown(65)) ball.vx = lerp(ball.vx, -ballSpeed, 0.2);
    else if (keyIsDown(68)) ball.vx = lerp(ball.vx, ballSpeed, 0.2);
  } else {
    if (keyIsDown(UP_ARROW)) ball.vy = lerp(ball.vy, -ballSpeed, 0.2);
    else if (keyIsDown(DOWN_ARROW)) ball.vy = lerp(ball.vy, ballSpeed, 0.2);
    if (keyIsDown(LEFT_ARROW)) ball.vx = lerp(ball.vx, -ballSpeed, 0.2);
    else if (keyIsDown(RIGHT_ARROW)) ball.vx = lerp(ball.vx, ballSpeed, 0.2);
  }
  
  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Gradually increase speed
  ball.vx += (ball.vx > 0 ? speedIncrement : -speedIncrement);
  ball.vy += (ball.vy > 0 ? speedIncrement : -speedIncrement);
  
  // Bounce top/bottom
  if (ball.y <= 0 || ball.y >= height) ball.vy *= -1;
  
  // Paddle collisions with glow trigger
  if (ball.x - 10 <= leftPaddle.x + paddleWidth && ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + paddleHeight) {
    ball.vx *= -1;
    leftPaddle.glow = 200;
  }
  if (ball.x + 10 >= rightPaddle.x && ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + paddleHeight) {
    ball.vx *= -1;
    rightPaddle.glow = 200;
  }
  
  // Reduce paddle glow over time
  if (leftPaddle.glow) leftPaddle.glow = max(0, leftPaddle.glow - 10);
  if (rightPaddle.glow) rightPaddle.glow = max(0, rightPaddle.glow - 10);
  
  // Scoring
  if (ball.x < 0) { scoreRight++; resetBall(); }
  if (ball.x > width) { scoreLeft++; resetBall(); }
}

// Draw paddles with glow
function drawPaddle(p, col) {
  noStroke();
  if (!p.glow) p.glow = 0;
  for (let i = 3; i > 0; i--) {
    fill(red(col), green(col), blue(col), p.glow/i);
    rect(p.x-i, p.y-i, paddleWidth + i*2, paddleHeight + i*2);
  }
  fill(col);
  rect(p.x, p.y, paddleWidth, paddleHeight);
}

// Draw ball with magical trail and glow
function drawMagicalBall() {
  let ballColor = ballControlledBy === 'player1' ? leftColor : rightColor;
  
  // Add current ball position to trail
  ballTrail.push({
    x: ball.x,
    y: ball.y,
    c: ballColor,
    size: 20 + random(5, 10),
    alpha: 150
  });

  // Draw the trail
  for (let i = 0; i < ballTrail.length; i++) {
    let t = ballTrail[i];
    noStroke();
    fill(red(t.c), green(t.c), blue(t.c), t.alpha);
    ellipse(t.x, t.y, t.size, t.size);
    t.alpha -= 4;
    t.size *= 0.95;
  }
  ballTrail = ballTrail.filter(t => t.alpha > 0);

  // Draw glowing aura
  noStroke();
  for (let r = 30; r >= 6; r -= 2) {
    let alpha = map(r, 6, 30, 200, 10);
    fill(red(ballColor), green(ballColor), blue(ballColor), alpha);
    ellipse(ball.x, ball.y, r*2, r*2);
  }
  
  // Draw solid center
  fill(ballColor);
  ellipse(ball.x, ball.y, 20, 20);
}

function resetBall() {
  ball.x = width / 2;
  ball.y = height / 2;
  ball.vx = random([-baseSpeed, baseSpeed]);
  ball.vy = random([-baseSpeed, baseSpeed]);
  ballControlledBy = random(['player1','player2']);
  lastSwitch = millis();
}

function initializeGame() {
  ball = {x: width / 2, y: height / 2, vx: random([-baseSpeed, baseSpeed]), vy: random([-baseSpeed, baseSpeed])};
  leftPaddle = {x: 50, y: height / 2 - paddleHeight / 2, glow: 0};
  rightPaddle = {x: width - 50 - paddleWidth, y: height / 2 - paddleHeight / 2, glow: 0};
}

// Fullscreen canvas resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeGame();
}
