/*
  Windows of Light — Final Version (With Sounds)
  ---------------------------------------------
  ✦ Background sad tune (bg.mp3)
  ✦ Crackers ambient sound (crackers.mp3)
  ✦ Footsteps when moving (footstep.mp3)
  ✦ 14 family sounds (s1.mp3–s14.mp3)
  ✦ 15 window clicks trigger ending
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
let endFade = 0;
let lanterns = [];

// diya
let diyaScale = 0.12;
let targetScale = 0.12;
let diyaX, diyaY;
let targetX, targetY;
let sparkles = [];

// sounds
let bgMusic, crackersSound, footstep;
let familySounds = [];
let soundIndex = 0;
let soundOrder = [];

// intro text
let introActive = true;
let introText = "Far from home, I walk alone...";
let typed = "";
let charIndex = 0;
let charDelay = 60;
let lastCharTime = 0;
let introFade = 1.0;
let introFadeSpeed = 0.01;
let introTypedComplete = false;
let introCompleteTime = 0;

let skyTop, skyBottom;
let serifFont, sansFont;

function preload() {
  serifFont = 'Georgia';
  sansFont = 'Helvetica';
  soundFormats('mp3');

  bgMusic = loadSound('props/bg.mp3');
  crackersSound = loadSound('props/crackers.mp3');
  footstep = loadSound('props/footstep.mp3');

  for (let i = 1; i <= 14; i++) {
    familySounds.push(loadSound('props/s' + i + '.mp3'));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textFont(serifFont);

  let xPos = width * 0.9;
  for (let i = 0; i < numBuildings; i++) {
    let h = random(420, 650);
    buildings.push(new Building(xPos, h));
    if (i === 0) xPos += 280;
    else xPos += random(420, 700);
  }

  noCursor();
  diyaX = mouseX;
  diyaY = mouseY;
  targetX = mouseX;
  targetY = mouseY;

  skyTop = color(10, 10, 40);
  skyBottom = color(40, 40, 80);
  lastCharTime = millis();

  soundOrder = shuffle(Array.from(Array(14).keys()));

  // background music
  bgMusic.setLoop(true);
  bgMusic.setVolume(0.5);
  bgMusic.play();

  // crackers sound
  crackersSound.setLoop(true);
  crackersSound.setVolume(0.5);
  crackersSound.play();
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
    if (keyIsDown(RIGHT_ARROW)) {
      scrollX += playerSpeed;
      if (!footstep.isPlaying()) footstep.play();
    } else if (keyIsDown(LEFT_ARROW)) {
      scrollX -= playerSpeed;
      if (!footstep.isPlaying()) footstep.play();
    } else {
      if (footstep.isPlaying()) footstep.stop();
    }
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

  // diya
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
  updateSparkles();

  if (ending) {
    endFade = min(255, endFade + 1);
    fill(0, endFade * 0.8);
    rect(0, 0, width, height);

    if (frameCount % 10 === 0 && lanterns.length < 25) {
      lanterns.push(new Lantern(random(width * 0.2, width * 0.8), height + 50));
    }
    for (let l of lanterns) l.update().display();
  }

  if (showFinalLine) {
    finalLineAlpha = min(255, finalLineAlpha + 2);
    fill(255, finalLineAlpha);
    textAlign(CENTER, TOP);
    textSize(32);
    text("In their light, I find my own.", width / 2, height * 0.45);
  }

  drawInstructions();
}

function mousePressed() {
  if (introActive || ending) return;
  let wx = mouseX + scrollX;
  let wy = mouseY;

  for (let b of buildings) {
    if (b.checkClick(wx, wy)) {
      clickCount = min(15, clickCount + 1);
      targetScale += 0.05;

      let next = familySounds[soundOrder[soundIndex]];
      if (next && !next.isPlaying()) {
        next.setVolume(0.5);
        next.play();
      }
      soundIndex = (soundIndex + 1) % familySounds.length;

      if (clickCount >= 15 && !ending) {
        ending = true;
        showFinalLine = true;
        bgMusic.setVolume(0.25, 2);
      }
      return;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ------------------------- Classes -------------------------
class Building {
  constructor(x, h) {
    this.x = x;
    this.h = h;
    this.w = random(200, 300);
    this.windows = [];
    let rows = int(random(4, 7));
    let cols = int(random(3, 6));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        this.windows.push({
          x: this.x - this.w / 2 + 40 + j * 50,
          y: height - this.h + 50 + i * 60,
          lit: random() < 0.2
        });
      }
    }
  }

  update() {
    for (let w of this.windows) {
      if (random() < 0.002) w.lit = !w.lit;
    }
  }

  display() {
    fill(40);
    rect(this.x - this.w / 2, height - this.h, this.w, this.h);
    stroke(10);
    for (let w of this.windows) {
      fill(w.lit ? color(255, 220, 120) : color(30));
      rect(w.x, w.y, 30, 40, 3);
    }
    // fairy light line
    noFill();
    stroke(255, 240, 180);
    strokeWeight(2);
    let topY = height - this.h;
    for (let i = -this.w / 2; i < this.w / 2; i += 20) {
      let y = topY + sin((frameCount * 0.05) + i * 0.3) * 2;
      point(this.x + i, y);
    }
  }

  checkClick(px, py) {
    for (let w of this.windows) {
      if (px > w.x && px < w.x + 30 && py > w.y && py < w.y + 40) {
        w.lit = true;
        return true;
      }
    }
    return false;
  }
}

class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        life: random(60, 100)
      });
    }
    this.done = false;
  }

  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.life--;
    }
    if (this.particles.every(p => p.life <= 0)) this.done = true;
  }

  display() {
    noStroke();
    for (let p of this.particles) {
      if (p.life > 0) {
        fill(255, random(150, 255), random(50, 150), p.life * 2);
        circle(p.x, p.y, 4);
      }
    }
  }
}

class Lantern {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(0.5, 1);
    this.size = random(30, 50);
  }

  update() {
    this.y -= this.speed;
    return this;
  }

  display() {
    fill(255, 150, 50, 200);
    ellipse(this.x, this.y, this.size * 0.8, this.size);
  }
}

// ------------------------- Visual Helpers -------------------------
function drawSky() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(skyTop, skyBottom, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGround() {
  fill(0);
  rect(0, height - 50, width, 80);
}

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
  let glowScale = map(clickCount, 0, 15, 1, 1.8);

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
  pop();
}

function updateSparkles() {
  sparkles.push({ x: diyaX + random(-40, 40), y: diyaY - 40 + random(-20, 20), life: 255 });
  for (let i = sparkles.length - 1; i >= 0; i--) {
    let s = sparkles[i];
    s.y -= 0.5;
    s.life -= 4;
    fill(255, 220, 150, s.life);
    noStroke();
    circle(s.x, s.y, 4);
    if (s.life <= 0) sparkles.splice(i, 1);
  }
}

function drawInstructions() {
  fill(255);
  textAlign(CENTER);
  textSize(16);
  text("→ Move  ←   •   Click glowing windows to hear memories", width / 2, height - 25);
}

function drawIntro() {
  background(0);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);

  if (charIndex < introText.length && millis() - lastCharTime > charDelay) {
    typed += introText[charIndex];
    charIndex++;
    lastCharTime = millis();
  }

  text(typed, width / 2, height / 2);

  if (charIndex >= introText.length && !introTypedComplete) {
    introTypedComplete = true;
    introCompleteTime = millis();
  }

  if (introTypedComplete && millis() - introCompleteTime > 2000) {
    introFade -= introFadeSpeed;
    if (introFade <= 0) introActive = false;
    fill(0, (1 - introFade) * 255);
    rect(0, 0, width, height);
  }
}
