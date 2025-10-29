/*
  Windows of Light — Final Refined Version
  ----------------------------------------
  ✦ Realistic upright diya bowl
  ✦ Memory lines appear only once
  ✦ Gentle hover glow on windows
  ✦ Poetic transitions maintained
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
let showFinalLine = false;
let finalLineAlpha = 0;

// intro
let introActive = true;
let introText = "Far from home, I walk alone....";
let typed = "";
let charIndex = 0;
let charDelay = 60;
let lastCharTime = 0;
let introHold = 1200;
let introFade = 1.0;
let introFadeSpeed = 0.01;
let introTypedComplete = false;
let introCompleteTime = 0;

let skyTop, skyBottom;
let serifFont, sansFont;

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

function preload() {
  serifFont = 'Georgia';
  sansFont = 'Helvetica';
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textFont(serifFont);
  for (let i = 0; i < numBuildings; i++) {
    buildings.push(new Building(i * 420, random(280, 480)));
  }
  noCursor();

  skyTop = color(10, 10, 40);
  skyBottom = color(40, 40, 80);
  lastCharTime = millis();
}

function draw() {
  if (introActive) {
    drawIntro();
    return;
  }

  drawSky();

  if (random() < 0.035) fireworks.push(new Firework(random(width), random(height * 0.38)));
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].display();
    if (fireworks[i].done) fireworks.splice(i, 1);
  }

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

  if (!zooming) {
    drawCursorDiya(mouseX, mouseY, map(clickCount, 0, 10, 1.2, 1.8));
  } else {
    if (zoomAmount < zoomTarget) zoomAmount = lerp(zoomAmount, zoomTarget, 0.03);
    drawZoomingDiya();
    if (zoomAmount > zoomTarget - 0.05) {
      showFinalLine = true;
      finalLineAlpha = min(255, finalLineAlpha + 3);
    }
  }

  drawInstructions();
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
  }

  update() {
    for (let w of this.windows) w.update();
  }

  display() {
    fill(38, 38, 60);
    rect(this.x, this.y, this.w, this.h, 6);
    for (let w of this.windows) w.display();
  }

  checkClick(px, py) {
    for (let w of this.windows) {
      if (w.contains(px, py) && w.lit && !w.clickedOnce) {
        w.showMemory();
        w.clickedOnce = true;
        return true;
      }
    }
    return false;
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
    this.clickedOnce = false;
  }

  update() {
    if (random() < 0.008) this.lit = !this.lit;
    this.alpha = lerp(this.alpha, this.lit ? 220 : 40, 0.04);
    this.textAlpha = max(0, this.textAlpha - 2);
  }

  display() {
    let hover = this.contains(mouseX + scrollX, mouseY);
    fill(255, 220, 100, this.alpha + (hover ? 40 : 0));
    rect(this.x, this.y, this.w, this.h, 4);

    if (this.textAlpha > 0) {
      fill(255, this.textAlpha);
      textFont(sansFont);
      textSize(15);
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

// ------------------------- Fireworks -------------------------
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
  textFont(sansFont);
  textSize(14);
  textAlign(CENTER, TOP);
  text("← → walk | click glowing windows to share light (" + clickCount + " / 10)", width / 2, 18);
}

// 🪔 Realistic vertical diya
function drawCursorDiya(x, y, scaleVal) {
  push();
  translate(x, y);
  scale(scaleVal);
  noStroke();

  // Glow
  let halo = map(clickCount, 0, 10, 60, 180);
  fill(255, 200, 80, halo * 0.4);
  ellipse(0, -10, halo * 0.5);

  // Bowl (upright with flat base)
  fill(90, 45, 25);
  beginShape();
  vertex(-35, 20);
  quadraticVertex(0, -25, 35, 20);
  quadraticVertex(0, 30, -35, 20);
  endShape(CLOSE);
  rect(-35, 20, 70, 6);

  // Flame
  let flicker = sin(frameCount * 0.15) * 4;
  fill(255, 220, 130);
  ellipse(0, -30 - flicker, 14, 40 + flicker);
  pop();
}

// Ending zooming diya
function drawZoomingDiya() {
  push();
  translate(width / 2, height / 2 + 20);
  scale(zoomAmount);
  noStroke();

  // Glow
  fill(255, 200, 90, 170);
  ellipse(0, -30, 220);

  // Bowl (realistic upright)
  fill(90, 45, 25);
  beginShape();
  vertex(-100, 60);
  quadraticVertex(0, -80, 100, 60);
  quadraticVertex(0, 80, -100, 60);
  endShape(CLOSE);
  rect(-100, 60, 200, 10);

  // Flame
  fill(255, 230, 150);
  ellipse(0, -90, 70, 120);
  pop();

  if (showFinalLine) {
    fill(255, finalLineAlpha);
    textFont(serifFont);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("In their light, I find my own.", width / 2, height / 2 + 160);
  }
}

// ------------------------- Input -------------------------
function mousePressed() {
  if (introActive || zooming) return;
  let wx = mouseX + scrollX;
  let wy = mouseY;

  for (let b of buildings) {
    if (b.checkClick(wx, wy)) {
      clickCount = min(10, clickCount + 1);
      if (clickCount >= 10) zooming = true;
      return;
    }
  }
}

// ------------------------- Intro -------------------------
function drawIntro() {
  background(0);

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
    if (millis() - introCompleteTime > introHold) {
      introFade -= introFadeSpeed;
      if (introFade <= 0) {
        introFade = 0;
        introActive = false;
      }
    }
  }

  fill(255, 255 * introFade);
  textFont(serifFont);
  textAlign(CENTER, CENTER);
  textSize(36);
  text(typed, width / 2, height / 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
