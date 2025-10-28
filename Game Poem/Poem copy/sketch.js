/*
  Windows of Light — Walking Game Poem (Final)
  by [Your Name], NID Bangalore

  Theme:
  Walking alone through a Bangalore street on Diwali night.
  Missing home, but finding warmth in the lights around.
  Buildings glow with diyas and fairy lights.
  Firecrackers bloom in the sky.
  Click a window to remember.
*/

let buildings = [];
let numBuildings = 10;
let scrollX = 0;
let playerSpeed = 3;
let memoryTexts = [
  "Maa making gujiya...",
  "Papa fixing fairy lights...",
  "Sister arguing over cleaning...",
  "Laughter in the courtyard...",
  "Puja bell ringing softly...",
  "Dinner table and sweets...",
  "Crackers echoing far away...",
  "Dancing to old songs..."
];

let bellOsc, bellEnv;
let skyColors;
let fireworks = [];
let walkOffset = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  skyColors = [color(10, 10, 30), color(20, 20, 60)];

  // Create buildings along a long street
  for (let i = 0; i < numBuildings; i++) {
    buildings.push(new Building(i * 400));
  }

  // chime sound for memories
  bellOsc = new p5.Oscillator('sine');
  bellEnv = new p5.Envelope();
  bellEnv.setADSR(0.001, 0.2, 0.1, 0.5);
  bellEnv.setRange(0.5, 0);
  bellOsc.start();
  bellOsc.amp(0);
}

function draw() {
  drawSky();
  handleFireworks();

  // Move scene (auto-scroll or via keys)
  if (keyIsDown(RIGHT_ARROW)) scrollX += playerSpeed;
  if (keyIsDown(LEFT_ARROW)) scrollX -= playerSpeed;
  scrollX = constrain(scrollX, 0, numBuildings * 400 - width);

  // Draw buildings
  push();
  translate(-scrollX, 0);
  for (let b of buildings) {
    b.update();
    b.display();
  }
  pop();

  drawGround();
  drawInstructions();

  // Simulate subtle up-down camera bobbing
  walkOffset = sin(frameCount * 0.05) * 1.5;
}

//---------------------------------------------
// Mouse Interaction
//---------------------------------------------
function mousePressed() {
  let wx = mouseX + scrollX;
  let wy = mouseY;
  for (let b of buildings) {
    b.checkClick(wx, wy);
  }
}

//---------------------------------------------
// Fireworks
//---------------------------------------------
function handleFireworks() {
  // occasionally spawn a firework
  if (random() < 0.015) {
    fireworks.push(new Firework(random(width), random(height * 0.3)));
  }

  for (let f of fireworks) {
    f.update();
    f.display();
  }
  fireworks = fireworks.filter(f => !f.done);
}

class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.done = false;
    this.explode();
  }

  explode() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: random(-2, 2),
        vy: random(-2, 2),
        life: 255
      });
    }
  }

  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.life -= 3;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length === 0) this.done = true;
  }

  display() {
    noStroke();
    for (let p of this.particles) {
      fill(random(200, 255), random(100, 255), random(100, 255), p.life);
      ellipse(p.x, p.y, 4);
    }
  }
}

//---------------------------------------------
// Buildings & Windows
//---------------------------------------------
class Building {
  constructor(x) {
    this.x = x;
    this.y = height - 300;
    this.w = 300;
    this.h = 300;
    this.windows = [];

    for (let i = 0; i < 12; i++) {
      let wx = this.x + 40 + (i % 3) * 70;
      let wy = this.y + 40 + floor(i / 3) * 60;
      this.windows.push(new Window(wx, wy, 50, 40));
    }

    this.lightString = [];
    for (let i = 0; i < 10; i++) {
      this.lightString.push(createVector(this.x + i * 30, this.y - 10));
    }
  }

  update() {
    for (let w of this.windows) w.update();
  }

  display() {
    fill(40, 40, 60);
    rect(this.x, this.y + walkOffset, this.w, this.h, 5);

    // fairy lights
    for (let l of this.lightString) {
      let flicker = random(180, 255);
      fill(255, 200, 100, flicker);
      ellipse(l.x, l.y + sin(frameCount * 0.1 + l.x) * 2 + walkOffset, 6);
    }

    // windows
    for (let w of this.windows) w.display(walkOffset);

    // diyas at base
    for (let i = 0; i < 5; i++) {
      drawDiya(this.x + 30 + i * 60, this.y + this.h - 10 + walkOffset, 25);
    }
  }

  checkClick(px, py) {
    for (let w of this.windows) {
      if (w.contains(px, py)) {
        w.showMemory();
        playChime();
      }
    }
  }
}

class Window {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.lit = random() < 0.5;
    this.alpha = this.lit ? 200 : 50;
    this.text = "";
    this.textAlpha = 0;
  }

  update() {
    if (random() < 0.01) this.lit = !this.lit;
    this.alpha = lerp(this.alpha, this.lit ? 200 : 40, 0.05);
    this.textAlpha = max(0, this.textAlpha - 2);
  }

  display(offset = 0) {
    fill(255, 210, 100, this.alpha);
    rect(this.x, this.y + offset, this.w, this.h, 3);

    if (this.textAlpha > 0) {
      fill(255, this.textAlpha);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(this.text, this.x + this.w / 2, this.y + this.h / 2 + offset);
    }
  }

  contains(px, py) {
    return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
  }

  showMemory() {
    this.text = random(memoryTexts);
    this.textAlpha = 255;
  }
}

//---------------------------------------------
// Visuals & Sound
//---------------------------------------------
function drawSky() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(skyColors[0], skyColors[1], inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawGround() {
  noStroke();
  fill(20);
  rect(0, height - 50, width, 50);
}

function drawDiya(x, y, s) {
  push();
  translate(x, y);
  fill(60, 30, 10);
  arc(0, 0, s, s / 2, PI, 0, CHORD);
  fill(255, 200, 100, random(180, 255));
  ellipse(0, -s / 4, s / 4, s / 2);
  pop();
}

function drawInstructions() {
  fill(220);
  textSize(16);
  textAlign(CENTER, TOP);
  text("← → walk | click lit windows to remember", width / 2, 20);
}

function playChime() {
  let freq = random(400, 700);
  bellOsc.freq(freq);
  bellEnv.play(bellOsc, 0, 0.05);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
