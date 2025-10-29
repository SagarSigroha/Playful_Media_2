/*
  Windows of Light — final integration
  - Intro: black screen + typing: "Far from home, I walk alone,"
  - Then fade into game scene
  - Click 10 lit windows -> cursor-diya moves to center and zooms
  - Final line appears: "Yet in their light, I find my own."
*/

let buildings = [];
let numBuildings = 10;
let scrollX = 0;
let playerSpeed = 3;
let clickCount = 0;
let fireworks = [];
let zooming = false;
let zoomAmount = 1.0;
let zoomTarget = 2.2;
let zoomingStart = 0;
let showFinalLine = false;
let finalLineAlpha = 0;

// intro / typing
let introActive = true;
let introText = "Far from home, I walk alone,";
let typed = "";
let charIndex = 0;
let charDelay = 60; // ms per char
let lastCharTime = 0;
let introHold = 1200; // ms to hold after typing
let introFade = 1.0; // fade progress 1..0
let introFadeSpeed = 0.01;
let introTypedComplete = false;
let introCompleteTime = 0;

// visuals
let skyTop, skyBottom;
let memories = [
  "Maa making gujiya...",
  "Papa fixing fairy lights...",
  "Sister teasing me...",
  "Cleaning and laughter...",
  "Smell of sweets...",
  "Puja bell ringing...",
  "Dinner together...",
  "Crackers echoing...",
  "Dancing in the courtyard...",
  "Home’s warmth..."
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textFont("Georgia");
  // create buildings with random heights and spacing
  for (let i = 0; i < numBuildings; i++) {
    buildings.push(new Building(i * 420, random(280, 480)));
  }
  noCursor();

  skyTop = color(8, 8, 30);
  skyBottom = color(30, 30, 70);
  lastCharTime = millis();
}

function draw() {
  // intro handled on top
  if (introActive) {
    drawIntro();
    return;
  }

  // draw game scene
  drawSky();

  // fireworks spawn from start
  if (random() < 0.035) fireworks.push(new Firework(random(width), random(height * 0.38)));
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].display();
    if (fireworks[i].done) fireworks.splice(i, 1);
  }

  // movement allowed unless zooming started
  if (!zooming) {
    if (keyIsDown(RIGHT_ARROW)) scrollX += playerSpeed;
    if (keyIsDown(LEFT_ARROW)) scrollX -= playerSpeed;
  }
  scrollX = constrain(scrollX, 0, numBuildings * 420 - width);

  push();
  translate(-scrollX, 0);
  for (let b of buildings) {
    b.update();
    b.display();
  }
  pop();

  drawGround();

  // when not zooming, draw cursor diya at mouse
  if (!zooming) {
    drawCursorDiya(mouseX, mouseY, map(clickCount, 0, 10, 1.1, 1.8));
  } else {
    // animate zooming diya in center
    let now = millis();
    if (zoomAmount < zoomTarget) {
      // smooth approach
      zoomAmount = lerp(zoomAmount, zoomTarget, 0.03);
    }
    drawZoomingDiya();
    // when zoom nearly done, begin final line fade
    if (zoomAmount > zoomTarget - 0.05) {
      showFinalLine = true;
      finalLineAlpha = min(255, finalLineAlpha + 3);
    }
  }

  drawInstructions();

  // Ensure fireworks continue
}

// ------------------------- Classes -------------------------
class Building {
  constructor(x, h) {
    this.x = x;
    this.h = h;
    this.y = height - h - 60;
    this.w = int(random(320, 380));
    this.windows = [];
    let cols = 3;
    let rows = max(2, int(h / 60));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let padx = map(c, 0, cols - 1, 50, this.w - 100);
        let wx = this.x + padx;
        let wy = this.y + 30 + r * 60;
        this.windows.push(new Win(wx, wy, 56, 42));
      }
    }
    // fairy lights random positions on facade
    this.lights = [];
    let numLights = int(this.w / 20);
    for (let i = 0; i < numLights; i++) {
      this.lights.push({
        x: this.x + random(12, this.w - 12),
        y: this.y + random(6, this.h - 6),
        phase: random(TWO_PI)
      });
    }
  }

  update() {
    for (let w of this.windows) w.update();
  }

  display() {
    // building body
    push();
    fill(38, 38, 60);
    rect(this.x, this.y, this.w, this.h, 6);

    // fairy lights
    for (let l of this.lights) {
      let a = 180 + 60 * sin(frameCount * 0.02 + l.phase);
      fill(255, 210, 120, a);
      ellipse(l.x, l.y, 6, 6);
    }

    // windows
    for (let w of this.windows) w.display();
    pop();
  }

  checkClick(px, py) {
    for (let w of this.windows) {
      if (w.contains(px, py) && w.lit) {
        w.showMemory();
        return { x: w.x + w.w / 2, y: w.y + w.h / 2 };
      }
    }
    return null;
  }
}

class Win {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.lit = random() < 0.6;
    this.alpha = this.lit ? random(180, 230) : random(30, 80);
    this.text = "";
    this.textAlpha = 0;
  }

  update() {
    if (random() < 0.008) this.lit = !this.lit;
    this.alpha = lerp(this.alpha, this.lit ? 220 : 40, 0.04);
    this.textAlpha = max(0, this.textAlpha - 2);
  }

  display() {
    fill(255, 220, 100, this.alpha);
    rect(this.x, this.y, this.w, this.h, 4);
    if (this.textAlpha > 0) {
      fill(255, this.textAlpha);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(this.text, this.x + this.w / 2, this.y + this.h / 2);
    }
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  showMemory() {
    this.text = random(memories);
    this.textAlpha = 255;
  }
}

class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.done = false;
    for (let i = 0; i < 36; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        life: random(150, 255),
        col: color(random(200, 255), random(120, 255), random(120, 255))
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.life -= 3;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length === 0) this.done = true;
  }
  display() {
    noStroke();
    for (let p of this.particles) {
      fill(red(p.col), green(p.col), blue(p.col), p.life);
      ellipse(p.x, p.y, 4);
    }
  }
}

// ------------------------- Drawing helpers -------------------------
function drawSky() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(skyTop, skyBottom, inter);
    stroke(c);
    line(0, y, width, y);
  }
  noStroke();
}

function drawGround() {
  noStroke();
  fill(18);
  rect(0, height - 56, width, 56);
}

function drawInstructions() {
  fill(240, 220);
  textSize(14);
  textAlign(CENTER, TOP);
  text("← → walk | click glowing windows to share light (" + clickCount + " / 10)", width / 2, 18);
}

// cursor diya draws bowl + flame with slight flicker
function drawCursorDiya(x, y, scaleVal) {
  push();
  translate(x, y);
  scale(scaleVal);
  noStroke();
  // subtle halo
  let halo = map(clickCount, 0, 10, 50, 180);
  fill(255, 200, 100, halo * 0.6);
  ellipse(0, -18, halo * 0.5);
  // bowl flipped upward (more diya-like)
  fill(70, 40, 20);
  arc(0, 6, 64, 40, PI, TWO_PI);
  // flame
  let flameH = 8 + sin(frameCount * 0.12) * 3;
  fill(255, 220, 110, 250);
  ellipse(0, -18 - flameH * 0.5, 14, 26 + flameH);
  pop();
}

function drawZoomingDiya() {
  push();
  translate(width / 2, height / 2 + 20);
  scale(zoomAmount);
  noStroke();
  // large glow
  fill(255, 200, 90, 170);
  ellipse(0, -30, 220);
  // bowl
  fill(70, 40, 20);
  arc(0, 40, 220, 120, PI, TWO_PI);
  // flame
  fill(255, 230, 140);
  ellipse(0, -60, 70, 120);
  pop();

  // final line
  if (showFinalLine) {
    fill(255, finalLineAlpha);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("Yet in their light, I find my own.", width / 2, height / 2 + 140);
  }
}

// ------------------------- Input -------------------------
function mousePressed() {
  if (introActive) return; // ignore clicks during intro
  if (zooming) return; // ignore clicks during zoom
  // compute world coords
  let wx = mouseX + scrollX;
  let wy = mouseY;
  // check buildings
  for (let b of buildings) {
    let res = b.checkClick(wx, wy);
    if (res) {
      // a window was lit / clicked
      clickCount = min(10, clickCount + 1);
      // small spark towards cursor-diya (visual feedback) optional - we keep it simple
      if (clickCount >= 10) {
        // start zoom timer
        zooming = true;
        // lock scroll a bit, allow zoom to play
        setTimeout(() => {
          // maybe add extra fireworks
          for (let i = 0; i < 3; i++) fireworks.push(new Firework(random(width * 0.2, width * 0.8), random(height * 0.2, height * 0.4)));
        }, 200);
      }
      return;
    }
  }
}

// ------------------------- Intro: typing + fade -------------------------
function drawIntro() {
  // draw full black background
  background(0);

  // draw a subtle starry hint behind text (very faint)
  noStroke();
  for (let i = 0; i < 80; i++) {
    fill(255, 255, 255, 8);
    ellipse(random(width), random(height * 0.4), random(1, 2));
  }

  // typing logic
  if (!introTypedComplete) {
    if (millis() - lastCharTime > charDelay) {
      if (charIndex < introText.length) {
        typed += introText.charAt(charIndex);
        charIndex++;
        lastCharTime = millis();
      } else {
        introTypedComplete = true;
        introCompleteTime = millis();
      }
    }
  } else {
    // after typed complete, wait then fade
    if (millis() - introCompleteTime > introHold) {
      introFade -= introFadeSpeed;
      if (introFade <= 0) {
        introFade = 0;
        introActive = false; // move to game
      }
    }
  }

  // draw typed text centered
  push();
  translate(width / 2, height / 2);
  fill(255, 255 * introFade);
  textAlign(CENTER, CENTER);
  textSize(36);
  text(typed, 0, 0);
  pop();
}

// ------------------------- Utility -------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
