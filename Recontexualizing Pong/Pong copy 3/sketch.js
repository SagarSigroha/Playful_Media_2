// Ripple Pong Prototype - p5.js

let paddle1, paddle2;
let paddleWidth = 20, paddleHeight = 100;
let ripples = [];
let score1 = 0, score2 = 0;

function setup() {
  createCanvas(800, 500);
  paddle1 = createVector(50, height/2 - paddleHeight/2);
  paddle2 = createVector(width - 70, height/2 - paddleHeight/2);
}

function draw() {
  background(20, 40, 60);

  // Update paddles
  movePaddles();
  drawPaddles();

  // Generate ripples from paddle movements
  generateRipples();

  // Update and draw ripples
  updateRipples();

  // Draw center line
  stroke(255, 50);
  strokeWeight(2);
  line(width/2, 0, width/2, height);

  // Draw scores
  drawScores();
}

function movePaddles() {
  if (keyIsDown(87) && paddle1.y > 0) paddle1.y -= 5;
  if (keyIsDown(83) && paddle1.y + paddleHeight < height) paddle1.y += 5;
  if (keyIsDown(UP_ARROW) && paddle2.y > 0) paddle2.y -= 5;
  if (keyIsDown(DOWN_ARROW) && paddle2.y + paddleHeight < height) paddle2.y += 5;
}

function drawPaddles() {
  noStroke();
  fill(200, 220, 255);
  rect(paddle1.x, paddle1.y, paddleWidth, paddleHeight, 10);
  rect(paddle2.x, paddle2.y, paddleWidth, paddleHeight, 10);
}

function generateRipples() {
  // Paddle1 ripple
  if (keyIsDown(87) || keyIsDown(83)) {
    ripples.push({x: paddle1.x + paddleWidth, y: paddle1.y + paddleHeight/2, r: 0, dx: 2, owner: 1});
  }
  // Paddle2 ripple
  if (keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW)) {
    ripples.push({x: paddle2.x, y: paddle2.y + paddleHeight/2, r: 0, dx: -2, owner: 2});
  }
}

function updateRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    let ripple = ripples[i];

    // Update ripple radius
    ripple.r += 3;
    ripple.x += ripple.dx;

    // Draw ripple
    noFill();
    stroke(100, 200, 255, 150);
    strokeWeight(2);
    ellipse(ripple.x, ripple.y, ripple.r*2);

    // Check if ripple reached opponent goal
    if (ripple.owner === 1 && ripple.x > width) {
      score1++;
      ripples.splice(i,1);
    } else if (ripple.owner === 2 && ripple.x < 0) {
      score2++;
      ripples.splice(i,1);
    }
  }
}

function drawScores() {
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text(score1, width/4, 50);
  text(score2, width*3/4, 50);
}
