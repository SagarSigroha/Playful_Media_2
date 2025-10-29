/*
  Windows of Light — Lanterns + Sparkles + Fairy Light Strings
  ------------------------------------------------------------
  ✦ Diya sparkles follow movement
  ✦ Fairy light garlands on each rooftop
  ✦ Floating lanterns appear at the end
  ✦ 2nd building closer to 1st (lonely → warm progression)
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

// diya
let diyaScale = 0.12;
let targetScale = 0.12;
let diyaX, diyaY;
let targetX, targetY;
let sparkles = [];

// lanterns
let lanterns = [];

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

  // --- Buildings ---
  let xPos = width * 0.9; // only corner visible at start
  for (let i = 0; i < numBuildings; i++) {
    let h = random(420, 650);
    buildings.push(new Building(xPos, h));
    if (i === 0) xPos += 320; // 2nd building closer
    else xPos += random(460, 780);
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

  if (random() < 0.03) fireworks.push(new Firework(random(width), random(height * 0.38)));
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].display();
    if (fireworks[i].done) fireworks.splice(i, 1);
  }

  if (!ending) {
    if (keyIsDown(RIGHT_ARROW)) scrollX += playerSpeed;
    if (keyIsDown(LEFT_ARROW)) scrollX -= playerSpeed;
  }

  scrollX = constrain(scrollX, 0, (buildings[buildings.length - 1].x + 400) - width);

  push();
  translate(-scrollX, 0);
  for (let b of buildings) {
    b.update();
    b.display();
  }
  pop();

  drawGround();

  // --- Diya position & size ---
  if (!ending) {
    targetX = mouseX;
    targetY = mouseY;
  } else {
    targetX = width / 2;
    targetY = height * 0.35;
    targetScale = 1.2;
  }

  diyaX = lerp(diyaX, targetX, 0.07);
  diyaY = lerp(diyaY, targetY, 0.07);
  diyaScale = lerp(diyaScale, targetScale, 0.05);

  drawCursorDiya(diyaX, diyaY, diyaScale);

  // sparkles around diya
  updateSparkles();

  // lanterns when ending
  if (ending) {
    if (frameCount % 10 === 0 && lanterns.length < 25) {
      lanterns.push(new Lantern(random(width * 0.2, width * 0.8), height + 50));
    }
    for (let l of lanterns) l.update().display();
  }

  if (showFinalLine) {
    finalLineAlpha = min(255, finalLineAlpha + 2);
    fill(255, finalLineAlpha);
    textFont(serifFont);
    textAlign(CENTER, TOP);
    textSize(32);
    text("In their light, I find my own.", width / 2, height * 0.45);
  }

  drawInstructions();
}

// ------------------------- Classes -------------------------
class Building {
  constructor(x, h) {
    this.x = x;
    this.h = h;
    this.y = height - h - 60;
    this.w = int(random(200, 260));
    this.windows = [];

    let cols = 2;
    let rows = max(3, int(h / 70));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let padx = map(c, 0, cols - 1, 30, this.w - 70);
        let wx = this.x + padx;
        let wy = this.y + 30 + r * 60;
        this.windows.push(new Win(wx, wy, 52, 38));
      }
    }

    // rooftop fairy light line
    this.fairyTop = [];
    for (let i = 0; i < this.w; i += 20) {
      this.fairyTop.push({
        lx: this.x + i,
        ly: this.y,
        bright: random(100, 255),
      });
    }

    // random fairy dots
    this.fairyLights = [];
    for (let i = 0; i < int(random(10, 20)); i++) {
      this.fairyLights.push({
        lx: this.x + random(0, this.w),
        ly: this.y + random(0, this.h),
        bright: random(100, 255),
      });
    }
  }

  update() { for (let w of this.windows) w.update(); }

  display() {
    fill(36, 36, 56);
    rect(this.x, this.y, this.w, this.h, 8);

    // fairy top garland
    for (let i = 0; i < this.fairyTop.length; i++) {
      let f = this.fairyTop[i];
      f.bright += random(-10, 10);
      f.bright = constrain(f.bright, 80, 255);
      fill(255, 220, 140, f.bright);
      ellipse(f.lx, f.ly, 5);
    }

    // random fairy lights
    for (let f of this.fairyLights) {
      f.bright += random(-15, 15);
      f.bright = constrain(f.bright, 80, 255);
      fill(255, 220, 120, f.bright);
      ellipse(f.lx, f.ly, 4);
    }

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
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.lit = random() < 0.6;
    this.alpha = this.lit ? random(180, 230) : random(30, 80);
    this.text = ""; this.textAlpha = 0; this.clickedOnce = false;
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
  contains(px, py) { return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h; }
  showMemory() {
    this.text = random(memories);
    this.textAlpha = 255;
  }
}

// ------------------------- Fireworks -------------------------
class Firework {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.particles = []; this.done = false;
    for (let i = 0; i < 36; i++) {
      this.particles.push({
        x: this.x, y: this.y,
        vx: random(-3, 3), vy: random(-3, 3),
        life: random(150, 255),
        col: color(random(200, 255), random(120, 255), random(120, 255))
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 3;
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

// ------------------------- Lantern -------------------------
class Lantern {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.speed = random(0.5, 1.2);
    this.w = random(24, 38);
    this.h = this.w * 1.3;
    this.alpha = random(150, 255);
    this.drift = random(-0.3, 0.3);
  }
  update() {
    this.y -= this.speed;
    this.x += this.drift * sin(frameCount * 0.01);
    this.alpha -= 0.2;
    return this;
  }
  display() {
    push();
    noStroke();
    fill(255, 170, 60, this.alpha);
    rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, 6);
    fill(255, 220, 120, this.alpha * 0.6);
    ellipse(this.x, this.y - this.h / 2, this.w * 0.5, 10);
    pop();
  }
}

// ------------------------- Sparkles -------------------------
function updateSparkles() {
  if (frameCount % 3 === 0) {
    sparkles.push({
      x: diyaX + random(-30, 30),
      y: diyaY - random(20, 60),
      size: random(2, 5),
      life: 255
    });
  }
  for (let s of sparkles) {
    s.y -= 0.6;
    s.life -= 4;
  }
  sparkles = sparkles.filter(s => s.life > 0);
  for (let s of sparkles) {
    fill(255, 220, 140, s.life);
    ellipse(s.x, s.y, s.size);
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
  fill(255, 240);
  textFont(sansFont);
  textSize(18);
  textAlign(CENTER, BOTTOM);
  if (!ending)
    text("← → Move   |   Click glowing windows (" + clickCount + " / 10)", width / 2, height - 15);
}

// ------------------------- Diya -------------------------
function drawCursorDiya(x, y, s) {
  push();
  translate(x, y);
  noStroke();

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
      targetScale += 0.05;
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
  } else if (millis() - introCompleteTime > introHold) {
    introFade -= introFadeSpeed;
    if (introFade <= 0) {
      introFade = 0;
      introActive = false;
    }
  }

  fill(255, 255 * introFade);
  textFont(serifFont);
  textAlign(CENTER, CENTER);
  textSize(36);
  text(typed, width / 2, height / 2);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
