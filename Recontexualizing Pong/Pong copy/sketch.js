let paddle1, paddle2;
let ball;
let score1 = 0, score2 = 0;
const paddleWidth = 20, paddleHeight = 100;
const ballSize = 15;

function setup() {
  createCanvas(800, 500);
  paddle1 = createVector(20, height/2 - paddleHeight/2);
  paddle2 = createVector(width - 40, height/2 - paddleHeight/2);
  ball = createVector(width/2, height/2);
  ball.dx = random([-5, 5]);
  ball.dy = random([-3, 3]);
}

function draw() {
  background(32, 58, 67);
  drawPaddles();
  drawBall();
  drawScores();
  movePaddles();
  updateBall();
}

function drawPaddles() {
  noStroke();
  fill(255, 255, 255, 200);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'white';
  rect(paddle1.x, paddle1.y, paddleWidth, paddleHeight);
  rect(paddle2.x, paddle2.y, paddleWidth, paddleHeight);
  drawingContext.shadowBlur = 0;
}

function drawBall() {
  // Invisible ball; flash occasionally on collision
  if (frameCount % 10 === 0) {
    fill(255);
    rect(ball.x, ball.y, ballSize, ballSize);
  }
}

function drawScores() {
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text(score1, width/4, 50);
  text(score2, width*3/4, 50);
}

function movePaddles() {
  if (keyIsDown(87) && paddle1.y > 0) paddle1.y -= 7;
  if (keyIsDown(83) && paddle1.y + paddleHeight < height) paddle1.y += 7;
  if (keyIsDown(UP_ARROW) && paddle2.y > 0) paddle2.y -= 7;
  if (keyIsDown(DOWN_ARROW) && paddle2.y + paddleHeight < height) paddle2.y += 7;
}

function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions
  if (ball.y <= 0 || ball.y >= height - ballSize) {
    ball.dy *= -1;
    playPing();
  }

  // Paddle collisions
  if (ball.x <= paddle1.x + paddleWidth && ball.y + ballSize >= paddle1.y && ball.y <= paddle1.y + paddleHeight) {
    ball.dx *= -1;
    playPing();
  }
  if (ball.x + ballSize >= paddle2.x && ball.y + ballSize >= paddle2.y && ball.y <= paddle2.y + paddleHeight) {
    ball.dx *= -1;
    playPing();
  }

  // Scoring
  if (ball.x < 0) { score2++; resetBall(); }
  if (ball.x > width) { score1++; resetBall(); }
}

function resetBall() {
  ball.x = width/2;
  ball.y = height/2;
  ball.dx = random([-5, 5]);
  ball.dy = random([-3, 3]);
}

function playPing() {
  // Simple beep using p5.sound or web audio if included
  if (typeof getAudioContext === 'function') {
    let osc = new p5.Oscillator('sine');
    osc.start();
    osc.amp(0.2);
    osc.freq(440);
    setTimeout(() => osc.stop(), 50);
  }
}
