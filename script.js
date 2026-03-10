// ===== STATE =====
let isLocked = true;

// ===== DOM REFS =====
const phoneFrame = document.getElementById('phoneFrame');
const lockScreen = document.getElementById('lockScreen');
const homeScreen = document.getElementById('homeScreen');
const unlockBtn = document.getElementById('unlockBtn');
const lockBtn = document.getElementById('lockBtn');
const lockDate = document.getElementById('lockDate');
const lockTime = document.getElementById('lockTime');
const heartsContainer = document.getElementById('heartsContainer');
const neuralCanvas = document.getElementById('neuralCanvas');

// ===== CLOCK =====
function updateClock() {
  const now = new Date();

  // Time
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  lockTime.textContent = `${hours}:${minutes}`;

  // Date
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const date = now.getDate();
  lockDate.textContent = `${dayName} ${date} ${monthName}`.toUpperCase();
}

updateClock();
setInterval(updateClock, 1000);

// ===== UNLOCK / LOCK =====
function unlock() {
  if (!isLocked) return;
  isLocked = false;
  lockScreen.classList.add('unlocked');
}

function lock() {
  isLocked = true;
  // Close any open section pages first
  document.querySelectorAll('.section-page.active').forEach(page => {
    page.classList.remove('active');
  });
  lockScreen.classList.remove('unlocked');
}

// Click unlock button to unlock
unlockBtn.addEventListener('click', (e) => {
  if (!isLocked) return;
  unlock();
});

// Lock button - use mousedown for more reliable capture
lockBtn.addEventListener('mousedown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  lock();
});

lockBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  lock();
});

// ===== APP NAVIGATION =====
function openAppNode(item) {
  const pageId = item.getAttribute('data-page');
  const page = document.getElementById(`page-${pageId}`);
  if (page) {
    page.classList.add('active');
    page.scrollTop = 0;
  }
}

document.querySelectorAll('.app-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    openAppNode(item);
  });

  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openAppNode(item);
    }
  });
});

// Back buttons
document.querySelectorAll('.back-btn[data-back]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const page = btn.closest('.section-page');
    if (page) {
      page.classList.remove('active');
    }
  });
});

// ===== NEURAL NETWORK CANVAS ANIMATION =====
const ctx = neuralCanvas.getContext('2d');
let nodes = [];
let mouse = { x: -1000, y: -1000 };
const NODE_COUNT = 80;
const CONNECTION_DISTANCE = 120;
const MOUSE_RADIUS = 200;

function resizeCanvas() {
  neuralCanvas.width = window.innerWidth;
  neuralCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Track mouse for interactivity
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

document.addEventListener('mouseleave', () => {
  mouse.x = -1000;
  mouse.y = -1000;
});

class NeuralNode {
  constructor() {
    this.x = Math.random() * neuralCanvas.width;
    this.y = Math.random() * neuralCanvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 1;
    this.baseAlpha = Math.random() * 0.4 + 0.1;
    this.pulseSpeed = Math.random() * 0.02 + 0.005;
    this.pulsePhase = Math.random() * Math.PI * 2;
    // Color: mix of cyan and violet
    this.colorType = Math.random();
    if (this.colorType < 0.5) {
      this.color = { r: 0, g: 212, b: 255 };   // cyan
    } else if (this.colorType < 0.8) {
      this.color = { r: 123, g: 47, b: 247 };   // violet
    } else {
      this.color = { r: 0, g: 255, b: 136 };    // green
    }
    this.depth = Math.random() * 0.5 + 0.5; // parallax depth factor
  }

  update(time) {
    this.x += this.vx * this.depth;
    this.y += this.vy * this.depth;

    // Wrap around edges
    if (this.x < -20) this.x = neuralCanvas.width + 20;
    if (this.x > neuralCanvas.width + 20) this.x = -20;
    if (this.y < -20) this.y = neuralCanvas.height + 20;
    if (this.y > neuralCanvas.height + 20) this.y = -20;

    // Pulse alpha
    this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.15;
  }

  draw() {
    const { r, g, b } = this.color;

    // Glow
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha + 0.3})`;
    ctx.fill();
  }
}

// Initialize nodes
function initNodes() {
  nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(new NeuralNode());
  }
}
initNodes();

function drawConnections(time) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONNECTION_DISTANCE) {
        const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.15;

        // Check mouse proximity — brighten connections near cursor
        const midX = (nodes[i].x + nodes[j].x) / 2;
        const midY = (nodes[i].y + nodes[j].y) / 2;
        const mouseDist = Math.sqrt(
          (midX - mouse.x) ** 2 + (midY - mouse.y) ** 2
        );

        let finalAlpha = alpha;
        let lineWidth = 0.5;
        if (mouseDist < MOUSE_RADIUS) {
          const mouseInfluence = 1 - mouseDist / MOUSE_RADIUS;
          finalAlpha = alpha + mouseInfluence * 0.25;
          lineWidth = 0.5 + mouseInfluence * 1.5;
        }

        // Synapse pulse effect
        const pulse = Math.sin(time * 0.003 + i * 0.1) * 0.5 + 0.5;
        finalAlpha *= (0.7 + pulse * 0.3);

        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(0, 212, 255, ${finalAlpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }
  }
}

function animate(time) {
  ctx.clearRect(0, 0, neuralCanvas.width, neuralCanvas.height);

  // Update and draw nodes
  nodes.forEach(node => {
    node.update(time);
    node.draw();
  });

  // Draw connections (synaptic lines)
  drawConnections(time);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Re-init nodes on resize
window.addEventListener('resize', () => {
  resizeCanvas();
  initNodes();
});

// ===== FLOATING CODE PARTICLES (subtle extra layer) =====
function createParticle() {
  const particle = document.createElement('div');
  particle.classList.add('heart');

  const symbols = ['{ }', '</>', '01', 'λ', '∑', '//', '>>>', '::'];
  particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

  particle.style.left = Math.random() * 100 + '%';
  particle.style.fontSize = (Math.random() * 10 + 8) + 'px';
  particle.style.animationDuration = (Math.random() * 15 + 12) + 's';
  particle.style.animationDelay = (Math.random() * 5) + 's';

  heartsContainer.appendChild(particle);

  // Remove after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 30000);
}

function createDot() {
  const dot = document.createElement('div');
  dot.classList.add('dot');

  dot.style.left = Math.random() * 100 + '%';
  dot.style.width = (Math.random() * 3 + 2) + 'px';
  dot.style.height = dot.style.width;
  dot.style.animationDuration = (Math.random() * 20 + 15) + 's';
  dot.style.animationDelay = (Math.random() * 8) + 's';

  heartsContainer.appendChild(dot);

  setTimeout(() => {
    if (dot.parentNode) {
      dot.parentNode.removeChild(dot);
    }
  }, 40000);
}

// Initial batch
for (let i = 0; i < 8; i++) {
  setTimeout(createParticle, Math.random() * 3000);
}
for (let i = 0; i < 15; i++) {
  setTimeout(createDot, Math.random() * 4000);
}

// Ongoing generation
setInterval(createParticle, 3500);
setInterval(createDot, 2000);

// ===== AUDIO PLAYER =====
const bgMusic = document.getElementById('bgMusic');
const tracks = [
  { file: 'audio/track1_deep_space.wav', title: 'Deep Space Drone' },
  { file: 'audio/track2_neural_pulse.wav', title: 'Neural Pulse' },
  { file: 'audio/track3_data_stream.wav', title: 'Data Stream' },
  { file: 'audio/track4_quantum_harmony.wav', title: 'Quantum Harmony' },
  { file: 'audio/track5_core_resonance.wav', title: 'Core Resonance' }
];

let currentTrackIndex = 0;
let isPlaying = false;

// UI Elements
const npIcons = [document.getElementById('npIconLock'), document.getElementById('npIconHome')];
const npInfos = [document.getElementById('npInfoLock'), document.getElementById('npInfoHome')];
const npLabels = [document.getElementById('npLabelLock'), document.getElementById('npLabelHome')];
const npTitles = [document.getElementById('npTitleLock'), document.getElementById('npTitleHome')];
const npDots = [document.getElementById('npDotsLock'), document.getElementById('npDotsHome')];
const prevBtns = [document.getElementById('prevTrackBtnLock'), document.getElementById('prevTrackBtnHome')];
const nextBtns = [document.getElementById('nextTrackBtnLock'), document.getElementById('nextTrackBtnHome')];

const playSvg = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"></polygon></svg>';
const pauseSvg = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

function loadTrack(index) {
  currentTrackIndex = index;
  if (bgMusic) bgMusic.src = tracks[currentTrackIndex].file;

  const labelText = `Now Playing: ${currentTrackIndex + 1}/${tracks.length}`;
  const titleText = tracks[currentTrackIndex].title;

  npLabels.forEach(el => { if (el) el.textContent = labelText; });
  npTitles.forEach(el => { if (el) el.textContent = titleText; });

  if (isPlaying && bgMusic) {
    bgMusic.play().catch(e => console.log('Audio play failed', e));
  }
}

function togglePlay(e) {
  if (e) e.stopPropagation();

  if (!bgMusic) return;

  if (isPlaying) {
    bgMusic.pause();
    isPlaying = false;
  } else {
    bgMusic.play().catch(e => console.log('Audio play failed', e));
    isPlaying = true;
  }
  updatePlayUI();
}

function updatePlayUI() {
  const icon = isPlaying ? pauseSvg : playSvg;
  npIcons.forEach(el => { if (el) el.innerHTML = icon; });

  if (isPlaying) {
    npDots.forEach(el => { if (el) el.classList.add('playing'); });
  } else {
    npDots.forEach(el => { if (el) el.classList.remove('playing'); });
  }
}

function nextTrack(e) {
  if (e) e.stopPropagation();
  let nextIdx = currentTrackIndex + 1;
  if (nextIdx >= tracks.length) nextIdx = 0;
  loadTrack(nextIdx);
}

function prevTrack(e) {
  if (e) e.stopPropagation();
  let prevIdx = currentTrackIndex - 1;
  if (prevIdx < 0) prevIdx = tracks.length - 1;
  loadTrack(prevIdx);
}

// Bind events
[...npIcons, ...npInfos].forEach(el => {
  if (el) el.addEventListener('click', togglePlay);
});

prevBtns.forEach(btn => {
  if (btn) btn.addEventListener('click', prevTrack);
});

nextBtns.forEach(btn => {
  if (btn) btn.addEventListener('click', nextTrack);
});

// Initialize
loadTrack(0);

// ===== DESKTOP TERMINAL ANIMATION =====
const terminalBody = document.getElementById('terminalBody');

const terminalLines = [
  { text: "sys_admin@ayush-portfolio:~# ./init_system.sh", type: "cmd" },
  { text: "[ OK ] Loading neural network modules...", type: "info" },
  { text: "[ OK ] Establishing secure connection to server...", type: "info" },
  { text: "[WARN] Unrecognized entity detected in sector 429.", type: "warn" },
  { text: "Bypassing security protocols...", type: "info" },
  { text: "Access GRANTED.", type: "cmd" },
  { text: "sys_admin@ayush-portfolio:~# python3 load_portfolio.py", type: "cmd" },
  { text: "Loading Ayush Singh's Data Research Profile...", type: "info" },
  { text: "--> Algorithm Analysis: 100%", type: "info" },
  { text: "--> Frontend Architecture: Optimized", type: "info" },
  { text: "--> ML Models: Calibrated", type: "info" },
  { text: "System ready. Awaiting user input.", type: "cmd" }
];

let termLineIdx = 0;
let isTypingTerm = false;

function addTerminalLine(lineObj) {
  const lineEl = document.createElement('div');
  lineEl.className = 'terminal-line';
  if (lineObj.type === 'cmd') lineEl.classList.add('terminal-cmd');
  if (lineObj.type === 'warn') lineEl.classList.add('terminal-warn');
  if (lineObj.type === 'err') lineEl.classList.add('terminal-err');

  terminalBody.appendChild(lineEl);

  let charIdx = 0;
  isTypingTerm = true;

  function typeChar() {
    if (charIdx < lineObj.text.length) {
      lineEl.textContent += lineObj.text.charAt(charIdx);
      charIdx++;
      terminalBody.scrollTop = terminalBody.scrollHeight;
      setTimeout(typeChar, Math.random() * 30 + 20); // typing speed
    } else {
      isTypingTerm = false;
      setTimeout(processNextTermLine, Math.random() * 800 + 200);
    }
  }

  typeChar();
}

function processNextTermLine() {
  if (termLineIdx < terminalLines.length && !isTypingTerm) {
    addTerminalLine(terminalLines[termLineIdx]);
    termLineIdx++;
  } else if (termLineIdx >= terminalLines.length) {
    // Loop back after a long delay
    setTimeout(() => {
      terminalBody.innerHTML = '';
      termLineIdx = 0;
      processNextTermLine();
    }, 10000);
  }
}

// Start terminal animation if screen is large enough
if (window.innerWidth >= 1100 && terminalBody) {
  setTimeout(processNextTermLine, 1000);
}

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1100 && termLineIdx === 0 && !isTypingTerm && terminalBody) {
    processNextTermLine();
  }
});

// ===== DRAGGABLE PHONE FRAME (Desktop) =====
const dragHandle = document.getElementById('dragHandle');
let isDraggingPhone = false;
let startPhoneX = 0, startPhoneY = 0;
let translatePhoneX = 0, translatePhoneY = 0;
let currentTranslatePhoneX = 0, currentTranslatePhoneY = 0;

if (dragHandle && phoneFrame) {
  dragHandle.addEventListener('mousedown', (e) => {
    if (window.innerWidth <= 430) return; // Disable on mobile
    isDraggingPhone = true;
    startPhoneX = e.clientX;
    startPhoneY = e.clientY;
    e.preventDefault(); // Prevent text selection
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingPhone) return;
    const dx = e.clientX - startPhoneX;
    const dy = e.clientY - startPhoneY;

    currentTranslatePhoneX = translatePhoneX + dx;
    currentTranslatePhoneY = translatePhoneY + dy;

    phoneFrame.style.transform = `translate(${currentTranslatePhoneX}px, ${currentTranslatePhoneY}px)`;
    phoneFrame.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    if (!isDraggingPhone) return;
    isDraggingPhone = false;
    translatePhoneX = currentTranslatePhoneX;
    translatePhoneY = currentTranslatePhoneY;
    phoneFrame.style.cursor = 'pointer';
  });

  // Handle case where mouse leaves the window entirely
  window.addEventListener('mouseleave', () => {
    if (!isDraggingPhone) return;
    isDraggingPhone = false;
    translatePhoneX = currentTranslatePhoneX;
    translatePhoneY = currentTranslatePhoneY;
    phoneFrame.style.cursor = 'pointer';
  });
}
