const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const lengthSlider = document.getElementById("lengthSlider");
const areaSlider = document.getElementById("areaSlider");
const rhoSlider = document.getElementById("rhoSlider");

const lengthValue = document.getElementById("lengthValue");
const areaValue = document.getElementById("areaValue");
const rhoValue = document.getElementById("rhoValue");
const readout = document.getElementById("readout");

const state = {
  length: Number(lengthSlider.value),
  area: Number(areaSlider.value),
  rho: Number(rhoSlider.value),
  electronRadius: 6,
  nucleusRadius: 10,
  electronCount: 55,
  nuclei: [],
  electrons: [],
  lastTs: performance.now(),
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  resetParticles();
}

function getResistance() {
  return (state.rho * state.length) / state.area;
}

function getConductorRegion() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const marginX = 26;
  const centerY = h / 2;
  const normalizedArea = (state.area - 0.5) / (5 - 0.5);
  const bandHeight = 90 + normalizedArea * (h * 0.55 - 90);
  return {
    x: marginX,
    y: centerY - bandHeight / 2,
    width: Math.max(100, w - marginX * 2),
    height: Math.max(70, bandHeight),
  };
}

function resetParticles() {
  const region = getConductorRegion();

  const normalizedResistance = getResistance() / 10;
  const nucleiCount = Math.max(
    30,
    Math.min(130, Math.round(45 + normalizedResistance * 95))
  );

  state.nuclei = Array.from({ length: nucleiCount }, () => {
    const baseX = region.x + Math.random() * region.width;
    const baseY = region.y + Math.random() * region.height;
    return {
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.2,
    };
  });

  state.electrons = Array.from({ length: state.electronCount }, () => {
    const x = region.x + Math.random() * region.width;
    const y = region.y + Math.random() * region.height;
    return {
      x,
      y,
      vx: 0,
      vy: (Math.random() - 0.5) * 24,
    };
  });
}

function updateReadout() {
  const resistance = getResistance();
  lengthValue.textContent = `${state.length.toFixed(1)} m`;
  areaValue.textContent = `${state.area.toFixed(1)} mm²`;
  rhoValue.textContent = `${state.rho.toFixed(1)} Ω·m`;
  readout.textContent = `抵抗値 R = ρL/A = ${resistance.toFixed(2)} Ω（相対表示）`;
}

function syncStateFromControls() {
  state.length = Number(lengthSlider.value);
  state.area = Number(areaSlider.value);
  state.rho = Number(rhoSlider.value);
  updateReadout();
  resetParticles();
}

[lengthSlider, areaSlider, rhoSlider].forEach((slider) => {
  slider.addEventListener("input", syncStateFromControls, { passive: true });
});

function bounceFromWalls(electron, region) {
  const r = state.electronRadius;
  if (electron.x < region.x + r) {
    electron.x = region.x + r;
    electron.vx *= -0.7;
  } else if (electron.x > region.x + region.width - r) {
    electron.x = region.x + region.width - r;
    electron.vx *= -0.7;
  }

  if (electron.y < region.y + r) {
    electron.y = region.y + r;
    electron.vy *= -0.85;
  } else if (electron.y > region.y + region.height - r) {
    electron.y = region.y + region.height - r;
    electron.vy *= -0.85;
  }
}

function handleCollisions(electron) {
  for (const nucleus of state.nuclei) {
    const dx = electron.x - nucleus.x;
    const dy = electron.y - nucleus.y;
    const minDist = state.electronRadius + state.nucleusRadius;
    const dist2 = dx * dx + dy * dy;

    if (dist2 < minDist * minDist && dist2 > 0.0001) {
      const dist = Math.sqrt(dist2);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      electron.x += nx * overlap;
      electron.y += ny * overlap;

      const dot = electron.vx * nx + electron.vy * ny;
      electron.vx -= 2 * dot * nx;
      electron.vy -= 2 * dot * ny;

      electron.vx *= 0.9;
      electron.vy *= 0.9;
    }
  }
}

function drawRegion(region) {
  ctx.fillStyle = "#dfe9ff";
  ctx.fillRect(region.x, region.y, region.width, region.height);

  ctx.strokeStyle = "#8aa8ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(region.x, region.y, region.width, region.height);
}

function drawParticles() {
  for (const nucleus of state.nuclei) {
    ctx.beginPath();
    ctx.fillStyle = "#f97f58";
    ctx.arc(nucleus.x, nucleus.y, state.nucleusRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const electron of state.electrons) {
    ctx.beginPath();
    ctx.fillStyle = "#2e5aff";
    ctx.arc(electron.x, electron.y, state.electronRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick(ts) {
  const dt = Math.min(0.033, (ts - state.lastTs) / 1000 || 0.016);
  state.lastTs = ts;
  const region = getConductorRegion();

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawRegion(region);

  const resistance = getResistance();
  const drift = 16 / (0.45 + resistance * 0.6);
  const thermalKick = 40;

  for (const nucleus of state.nuclei) {
    nucleus.phase += dt * nucleus.speed;
    const amp = 5;
    nucleus.x = nucleus.baseX + Math.sin(nucleus.phase) * amp;
    nucleus.y = nucleus.baseY + Math.cos(nucleus.phase * 0.9) * amp;
  }

  for (const electron of state.electrons) {
    electron.vx += drift * dt;
    electron.vx += (Math.random() - 0.5) * thermalKick * dt;
    electron.vy += (Math.random() - 0.5) * thermalKick * dt;

    electron.vx *= 0.985;
    electron.vy *= 0.975;

    electron.x += electron.vx;
    electron.y += electron.vy;

    bounceFromWalls(electron, region);
    handleCollisions(electron);
  }

  drawParticles();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
updateReadout();
requestAnimationFrame((ts) => {
  state.lastTs = ts;
  requestAnimationFrame(tick);
});
