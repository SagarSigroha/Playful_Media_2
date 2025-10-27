// Polytheist Pong (p5.js)
// - Fullscreen responsive circular arena
// - Multiple "gods" cycle; each god changes ball/paddle behavior & scoring
// - Players can "appeal" to the active god (W for P1, UP arrow for P2) to get a short boon
// - Unique mechanics: rotating divine influences, temporary ball clones, curved motion, score modifiers
//
// Controls:
// Player 1: A / D to rotate paddle
// Player 2: LEFT / RIGHT to rotate paddle
// Appeals: Player1 press 'W', Player2 press UP arrow
//
// Drop this into a p5 editor and run.

let ball, extraBalls;
let ballTrail = [];
let paddleAngle1, paddleAngle2;
let paddleWidth, paddleRadius;
let score1 = 0, score2 = 0;
let godList = [];
let activeGodIndex = 0;
let godTimer = 0;
let GOD_DURATION = 8000; // ms each god rules
let lastGodSwitch = 0;
let appealCooldownP1 = 0, appealCooldownP2 = 0;
let lastResize = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  initializeGame();
  createGods();
  lastGodSwitch = millis();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeGame();
}

function initializeGame() {
  paddleRadius = min(width, height) / 2 - 80;
  paddleAngle1 = -PI/6;
  paddleAngle2 = PI + PI/6;
  paddleWidth = PI / 9;
  resetBall();
  extraBalls = [];
  ballTrail = [];
}

function createGods() {
  // gods: name, color, apply (modifiers), onAppeal (player-sided short advantage)
  godList = [
    {
      name: "Ares (War)",
      color: [220, 40, 40],
      // Ares: increases speed, scoring doubled for hits while active
      applyModifiers: function(mod) {
        mod.speedMultiplier = 1.35;
        mod.scoreMultiplier = 2;
        mod.curve = 0;
        mod.cloneChance = 0;
      },
      onAppeal: function(player) {
        // short burst: powerful repulsion off your paddle
        player.tempRebound = 1.8;
      }
    },
    {
      name: "Athena (Wisdom)",
      color: [100, 180, 255],
      // Athena: slower ball, paddles more "precise" (narrow but strong)
      applyModifiers: function(mod) {
        mod.speedMultiplier = 0.75;
        mod.paddleWidthMultiplier = 0.8;
        mod.curve = 0;
        mod.cloneChance = 0;
        mod.scoreMultiplier = 1;
      },
      onAppeal: function(player) {
        // brief "focus" - paddle becomes temporarily larger for that player
        player.tempPaddleW = 1.5;
      }
    },
    {
      name: "Poseidon (Sea)",
      color: [20, 120, 180],
      // Poseidon: introduces curve (sinusoidal drift) that biases toward Player2 side
      applyModifiers: function(mod) {
        mod.speedMultiplier = 1.0;
        mod.curve = 0.008; // curvature amount
        mod.curveBias = 0.2; // positive -> drifts toward player2 side
        mod.cloneChance = 0;
        mod.scoreMultiplier = 1;
      },
      onAppeal: function(player) {
        // "tide" - briefly reduces opponent paddle mobility (slower control)
        player.opponentSlow = 0.6;
      }
    },
    {
      name: "Hermes (Trickster)",
      color: [220, 200, 80],
      // Hermes: randomness — teleport nudges, higher chance to clone ball
      applyModifiers: function(mod) {
        mod.speedMultiplier = 1.05;
        mod.curve = 0.0;
        mod.cloneChance = 0.12; // chance to spawn extra ball on hit
        mod.scoreMultiplier = 1;
      },
      onAppeal: function(player) {
        // "swiftness" - temporary speed boost for that player's hits
        player.tempHitSpeed = 1.4;
      }
    },
    {
      name: "Hestia (Hearth)",
      color: [255, 160, 90],
      // Hestia: calm — ball damps over time, heals trails (longer visibility)
      applyModifiers: function(mod) {
        mod.speedMultiplier = 0.9;
        mod.trailLength = 70;
        mod.cloneChance = 0;
        mod.scoreMultiplier = 1;
      },
      onAppeal: function(player) {
        // "warmth" - temporary shield: on next miss, nullify opponent point (one use)
        player.shieldNextMiss = true;
      }
    }
  ];
}

function draw() {
  background(12, 10, 22);

  // GOD rotation handling
  let now = millis();
  if (now - lastGodSwitch > GOD_DURATION) {
    activeGodIndex = (activeGodIndex + 1) % godList.length;
    lastGodSwitch = now;
  }
  let activeGod = godList[activeGodIndex];
  let timeLeft = max(0, GOD_DURATION - (now - lastGodSwitch));

  // modifiers base, then apply active god
  let modifiers = {
    speedMultiplier: 1.0,
    paddleWidthMultiplier: 1.0,
    curve: 0.0,
    curveBias: 0.0,
    cloneChance: 0.0,
    trailLength: 40,
    scoreMultiplier: 1
  };
  activeGod.applyModifiers(modifiers);

  // Draw circular arena
  push();
  noFill();
  stroke(90);
  strokeWeight(3);
  ellipse(width/2, height/2, paddleRadius*2);
  pop();

  // Update paddles and inputs (apply possible slowdowns from appeals)
  // We'll keep simple state objects for players to hold temporary appeal effects
  if (!this.player1) this.player1 = createPlayerState();
  if (!this.player2) this.player2 = createPlayerState();

  handlePaddleInput(this.player1, 'P1');
  handlePaddleInput(this.player2, 'P2');

  // Ball movement - include active god modifiers
  updateBall(modifiers);

  // update extra balls if clones exist
  updateExtraBalls(modifiers);

  // Draw trails based on longest trail from ball + clones
  drawTrails(modifiers.trailLength);

  // Draw balls (main + extras)
  drawBall(ball);
  for (let b of extraBalls) drawBall(b);

  // Draw paddles (use player's temp paddle multipliers)
  let p1Width = paddleWidth * modifiers.paddleWidthMultiplier * (this.player1.tempPaddleW || 1);
  let p2Width = paddleWidth * modifiers.paddleWidthMultiplier * (this.player2.tempPaddleW || 1);
  drawPaddle(paddleAngle1, color(120,220,255), p1Width);
  drawPaddle(paddleAngle2, color(255,120,120), p2Width);

  // Collisions: check main ball and extraBalls against paddles
  if (checkPaddleCollision(ball, paddleAngle1, this.player1, modifiers)) {
    // award point on a successful paddle-hit? we'll award points when a miss occurs instead
    // Potentially spawn clone (Hermes)
    attemptCloneSpawn(modifiers, ball);
  }
  for (let b of extraBalls) {
    if (checkPaddleCollision(b, paddleAngle1, this.player1, modifiers)) attemptCloneSpawn(modifiers, b);
  }
  if (checkPaddleCollision(ball, paddleAngle2, this.player2, modifiers)) attemptCloneSpawn(modifiers, ball);
  for (let b of extraBalls) {
    if (checkPaddleCollision(b, paddleAngle2, this.player2, modifiers)) attemptCloneSpawn(modifiers, b);
  }

  // Check out-of-bounds: if ball leaves arena, award point to opposite side (unless shield)
  checkOutOfBounds(ball, modifiers);
  // Extra balls: if they leave, remove and award points similarly
  let survivors = [];
  for (let b of extraBalls) {
    if (checkOutOfBounds(b, modifiers, true)) {
      // removed inside function if out
    } else survivors.push(b);
  }
  extraBalls = survivors;

  // Display HUD: scores and active god
  drawHUD(activeGod.name, activeGod.color, timeLeft);

  // Reduce temp effects over time (simple decay)
  decayPlayerTemps(this.player1);
  decayPlayerTemps(this.player2);

  // Handle appeal cooldown timers
  if (appealCooldownP1 > 0) appealCooldownP1 = max(0, appealCooldownP1 - deltaTime);
  if (appealCooldownP2 > 0) appealCooldownP2 = max(0, appealCooldownP2 - deltaTime);
}

// ---------- game object helpers ----------

function createPlayerState() {
  return {
    tempPaddleW: 1,
    tempRebound: 1,
    tempHitSpeed: 1,
    opponentSlow: 1,
    shieldNextMiss: false
  };
}

function handlePaddleInput(playerState, id) {
  let slowFactor = 1;
  if (id === 'P1') {
    if (keyIsDown(65)) paddleAngle1 -= 0.06 * slowFactor; // A
    if (keyIsDown(68)) paddleAngle1 += 0.06 * slowFactor; // D
    // appeal key W
    if (keyIsDown(87) && appealCooldownP1 <= 0) {
      godList[activeGodIndex].onAppeal(playerState);
      appealCooldownP1 = 5000; // 5s cooldown
    }
  } else {
    if (keyIsDown(LEFT_ARROW)) paddleAngle2 -= 0.06 * slowFactor;
    if (keyIsDown(RIGHT_ARROW)) paddleAngle2 += 0.06 * slowFactor;
    // appeal key UP_ARROW
    if (keyIsDown(UP_ARROW) && appealCooldownP2 <= 0) {
      godList[activeGodIndex].onAppeal(playerState);
      appealCooldownP2 = 5000;
    }
  }
}

function resetBall() {
  ball = {
    x: width/2,
    y: height/2,
    angle: random(TWO_PI),
    speed: 4,
    radius: 18,
    owner: null // not used but placeholder
  };
  extraBalls = [];
  ballTrail = [];
}

function updateBall(mod) {
  // curvature: add small angular drift proportional to y-position and mod.curve
  if (!ball) resetBall();

  // apply curve bias: bias sign pushes toward player2 side (positive is clockwise)
  let bias = mod.curveBias || 0;
  let curveAmt = mod.curve || 0;
  ball.angle += curveAmt * sin((ball.x + ball.y) * 0.01) + curveAmt * bias * 0.25;

  // move
  let sp = ball.speed * mod.speedMultiplier;
  ball.x += sp * cos(ball.angle);
  ball.y += sp * sin(ball.angle);

  // simple friction/damping to avoid runaway
  ball.speed = constrain(ball.speed, 2, 12);
}

function updateExtraBalls(mod) {
  for (let b of extraBalls) {
    let curveAmt = mod.curve || 0;
    let bias = mod.curveBias || 0;
    b.angle += curveAmt * sin((b.x + b.y)*0.01) + curveAmt * bias * 0.25;
    let sp = b.speed * mod.speedMultiplier;
    b.x += sp * cos(b.angle);
    b.y += sp * sin(b.angle);
    b.speed = constrain(b.speed, 2, 12);
  }
}

function drawTrails(maxLen) {
  // accumulate trails from main ball + extras into a single array for drawing
  // we keep ballTrail for main ball only; when clones exist, their positions are drawn translucent
  // push current main ball pos to trail
  ballTrail.push({x: ball.x, y: ball.y});
  if (ballTrail.length > maxLen) ballTrail.shift();

  noStroke();
  for (let i = 0; i < ballTrail.length; i++) {
    let alpha = map(i, 0, ballTrail.length, 10, 180);
    fill(255, 200, 60, alpha);
    ellipse(ballTrail[i].x, ballTrail[i].y, ball.radius * 1.2);
  }

  // extra balls trails (shorter)
  for (let b of extraBalls) {
    fill(200, 240, 255, 100);
    ellipse(b.x, b.y, b.radius);
  }
}

function drawBall(b) {
  // glow
  push();
  for (let i = 40; i > 0; i--) {
    let a = map(i, 0, 40, 0, 160);
    fill(255, 200, 40, a);
    ellipse(b.x + random(-1,1), b.y + random(-1,1), b.radius*2 + i*0.6);
  }
  pop();
  // core
  fill(255, 210, 60);
  ellipse(b.x, b.y, b.radius*2);
}

function drawPaddle(angle, col, w = paddleWidth) {
  let x1 = width/2 + paddleRadius * cos(angle - w/2);
  let y1 = height/2 + paddleRadius * sin(angle - w/2);
  let x2 = width/2 + paddleRadius * cos(angle + w/2);
  let y2 = height/2 + paddleRadius * sin(angle + w/2);
  stroke(col);
  strokeWeight(10);
  line(x1,y1,x2,y2);
}

// Returns true if a collision occurred
function checkPaddleCollision(b, paddleAngle, playerState, modifiers) {
  let dx = b.x - width/2;
  let dy = b.y - height/2;
  let angleBall = atan2(dy, dx);
  let distFromCenter = sqrt(dx*dx + dy*dy);
  let angleDiff = angleDiffFunc(angleBall, paddleAngle);
  if (distFromCenter > paddleRadius - b.radius*2 && angleDiff < (paddleWidth * (modifiers && modifiers.paddleWidthMultiplier || 1))/2) {
    // reflect
    // calculate normal reflection based on angle difference
    let normal = angleBall;
    let incidence = b.angle;
    // simple bounce: reverse direction around normal with a bit of randomness and player's tempRebound
    let rebound = (playerState && playerState.tempRebound) ? playerState.tempRebound : 1;
    b.angle = normal + PI + ( (normal - incidence) * 0.3 ) + random(-0.2,0.2);
    // adjust speed when hit; consider player's tempHitSpeed
    let hitBoost = (playerState && playerState.tempHitSpeed) ? playerState.tempHitSpeed : 1;
    b.speed = constrain(b.speed * (1.0 + 0.08*rebound) * hitBoost, 2, 14);
    return true;
  }
  return false;
}

function attemptCloneSpawn(modifiers, b) {
  if (random() < (modifiers.cloneChance || 0)) {
    // spawn small extra ball from this position with slightly different angle
    let nb = {
      x: b.x + random(-10,10),
      y: b.y + random(-10,10),
      angle: b.angle + random(-0.6,0.6),
      speed: b.speed * random(0.9,1.1),
      radius: max(8, b.radius*0.6)
    };
    extraBalls.push(nb);
    // cap clones
    if (extraBalls.length > 3) extraBalls.shift();
  }
}

function checkOutOfBounds(b, modifiers, isExtra = false) {
  let dx = b.x - width/2;
  let dy = b.y - height/2;
  let distFromCenter = sqrt(dx*dx + dy*dy);
  if (distFromCenter > paddleRadius + 40) {
    // determine which side missed: angle relative to center
    let ang = atan2(dy, dx);
    // convention: top half (ang between -PI/2 and PI/2) is Player2 side, bottom half is Player1 side
    // we'll award point to opposite player of the side where the ball left
    let leftSideIsTop = (ang > -PI/2 && ang < PI/2);
    let awardedTo = leftSideIsTop ? 1 : 2; // if leftSideIsTop true -> ball went out near right/top -> award P1
    // apply shield logic: if that player had shieldNextMiss true, cancel point and consume shield
    if (awardedTo === 1 && this.player1 && this.player1.shieldNextMiss) {
      this.player1.shieldNextMiss = false;
      // no point
    } else if (awardedTo === 2 && this.player2 && this.player2.shieldNextMiss) {
      this.player2.shieldNextMiss = false;
    } else {
      if (awardedTo === 1) score1 += (modifiers.scoreMultiplier || 1);
      else score2 += (modifiers.scoreMultiplier || 1);
    }
    // reset or remove ball
    if (!isExtra) {
      resetBall();
    }
    return true;
  }
  return false;
}

function angleDiffFunc(a,b) {
  let diff = abs(a-b) % TWO_PI;
  return diff > PI ? TWO_PI - diff : diff;
}

function drawHUD(godName, godColor, timeLeft) {
  push();
  // god panel
  noStroke();
  fill(godColor[0], godColor[1], godColor[2], 200);
  rectMode(CENTER);
  let gx = width/2;
  let gy = 30;
  rect(gx, gy, 360, 40, 8);
  fill(10);
  textAlign(CENTER, CENTER);
  textSize(16);
  fill(255);
  text(`${godName} — ${nf(timeLeft/1000,1,1)}s`, gx, gy);
  pop();

  // Scores
  push();
  textAlign(CENTER);
  fill(255);
  textSize(20);
  text(`Player 1  —  ${score1}`, width/4, height - 30);
  text(`Player 2  —  ${score2}`, (3*width)/4, height - 30);
  pop();

  // appeal hints and cooldowns
  push();
  textAlign(CENTER);
  textSize(12);
  fill(200);
  let p1cd = max(0, round(appealCooldownP1/1000));
  let p2cd = max(0, round(appealCooldownP2/1000));
  text(`P1 Appeal (W): ${p1cd > 0 ? p1cd + "s" : "READY"}`, width/4, height - 10);
  text(`P2 Appeal (UP): ${p2cd > 0 ? p2cd + "s" : "READY"}`, (3*width)/4, height - 10);
  pop();
}

function decayPlayerTemps(p) {
  // gently decay temporary multipliers towards default
  if (!p) return;
  p.tempPaddleW = lerp(p.tempPaddleW || 1, 1, 0.03);
  p.tempRebound = lerp(p.tempRebound || 1, 1, 0.04);
  p.tempHitSpeed = lerp(p.tempHitSpeed || 1, 1, 0.04);
  // opponentSlow and shieldNextMiss are boolean-ish; shield persists until used
}
