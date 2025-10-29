/*
  Windows of Light — Final Version (Single Realistic Diya)
  ----------------------------------------------------------
  ✦ Small diya from start
  ✦ Outer glow expands with each click
  ✦ After 10 clicks → diya moves to center & grows
  ✦ Poetic ending line fades in
*/

let buildings = [];
let numBuildings = 10;
let scrollX = 0;
let playerSpeed = 3;
let clickCount = 0;
let fireworks = [];
let showFinalLine = false;
let finalLineAlpha = 0;
let ending = false;
let diyaScale = 0.35;
let targetScale = 0.35;
let diyaX, diyaY;
let targetX, targetY;

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

  diyaX = mouseX;
  diyaY = mouseY;
  targetX = mouseX;
  targetY = mouseY;

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

  // fireworks
  if (random() < 0.035) fireworks.push(new Firework(random(width), random(height * 0.38)));
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].display();
    if (fireworks[i].done) fireworks.splice(i, 1);
  }

  // movement (disabled after ending)
  if (!ending) {
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

  // update diya movement and scaling
  if (!ending) {
    targetX = mouseX;
    targetY = mouseY;
  } else {
    targetX = width / 2;
    targetY = height * 0.6;
    targetScale = 1.2;
  }

  diyaX = lerp(diyaX, targetX, 0.07);
  diyaY = lerp(diyaY, targetY, 0.07);
  diyaScale = lerp(diyaScale, targetScale, 0.05);

  drawCursorDiya(diyaX, diyaY, diyaScale);

  // after 10 clicks — show final line
  if (showFinalLine) {
    finalLineAlpha = min(255, finalLineAlpha + 2);
    fill(255, finalLineAlpha);
    textFont(serifFont);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("In their light, I find my own.", width / 2, height * 0.75);
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

// ------------------------- Sky & Ground -------------------------
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
  if (!ending)
    text("← → walk | click glowing windows to share light (" + clickCount + " / 10)", width / 2, 18);
}

// ------------------------- Beautiful Diya -------------------------
function drawCursorDiya(x, y, s) {
  push();
  translate(x, y);
  noStroke();

  // 🪔 Terracotta base
  fill(120, 50, 25);
  arc(0, 35 * s, 200 * s, 120 * s, 0, PI, CHORD);
  fill(90, 35, 18);
  arc(0, 38 * s, 190 * s, 110 * s, 0, PI, CHORD);

  let yMove = sin(frameCount * 0.05) * 8 * s;
  drawFlame(0, -60 * s + yMove, s);
  pop();
}

function drawFlame(x, y, s) {
  push();
  translate(x, y);

  let baseSize = 90 * s;
  let n = noise(frameCount * 0.02) * 2 - 1;
  let jitter = n * 8 * s;
  let pulse = sin(frameCount * 0.02) * 0.15 + 1;
  let glowScale = map(clickCount, 0, 10, 1, 1.8);

  for (let g = 0; g < 6; g++) {
    let alpha = map(g, 0, 5, 120, 6);
    fill(255, 150 - g * 20, 60 - g * 6, alpha);
    ellipse(0, g + jitter,
      baseSize * pulse * glowScale * (1 + g * 0.18),
      baseSize * pulse * glowScale * (1 + g * 0.12));
  }

  fill(255, 240, 120);
  beginShape();
  vertex(0, -baseSize * 0.9 * pulse);
  bezierVertex(baseSize * 0.25, -baseSize * 0.4 * pulse,
               baseSize * 0.15, baseSize * 0.3 * pulse, 0, baseSize * 0.6 * pulse);
  bezierVertex(-baseSize * 0.15, baseSize * 0.3 * pulse,
               -baseSize * 0.25, -baseSize * 0.4 * pulse, 0, -baseSize * 0.9 * pulse);
  endShape(CLOSE);

  fill(255, 140, 40, 230);
  beginShape();
  vertex(0, -baseSize * pulse);
  bezierVertex(baseSize * 0.7, -baseSize * 0.25 * pulse,
               baseSize * 0.5, baseSize * 0.6 * pulse, 0, baseSize * 0.85 * pulse);
  bezierVertex(-baseSize * 0.5, baseSize * 0.6 * pulse,
               -baseSize * 0.7, -baseSize * 0.25 * pulse, 0, -baseSize * pulse);
  endShape(CLOSE);

  pop();
}

// ------------------------- Input -------------------------
function mousePressed() {
  if (introActive || ending) return;

  let wx = mouseX + scrollX;
  let wy = mouseY;

  for (let b of buildings) {
    if (b.checkClick(wx, wy)) {
      clickCount = min(10, clickCount + 1);

      if (clickCount >= 10 && !ending) {
        ending = true;
        showFinalLine = true;
      }
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
