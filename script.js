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
  electronCount: 70,
  electrons: [],
  nuclei: [],
  loopLength: 1,
  resistorStartS: 0,
  resistorEndS: 0,
  resistorRegion: null,
  geometry: null,
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
  rebuildScene();
  resetParticles();
}

function getResistance() {
  return (state.rho * state.length) / state.area;
}

function getGeometry() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const left = 70;
  const right = Math.max(left + 300, w - 70);
  const top = Math.max(60, h * 0.22);
  const bottom = Math.min(h - 60, h * 0.78);

  const topWidth = right - left;

  const normalizedLength = (state.length - 1) / 9;
  const resistorWidth = 120 + normalizedLength * (topWidth * 0.6 - 120);
  const resistorStartX = (left + right - resistorWidth) / 2;
  const resistorEndX = resistorStartX + resistorWidth;

  const normalizedArea = (state.area - 0.5) / 4.5;
  const resistorHeight = 70 + normalizedArea * (Math.min(180, h * 0.45) - 70);

  return {
    left,
    right,
    top,
    bottom,
    resistorStartX,
    resistorEndX,
    resistorWidth,
    resistorHeight,
  };
}

function buildPathData(g) {
  const seg1 = g.resistorStartX - g.left;
  const seg2 = g.resistorWidth;
  const seg3 = g.right - g.resistorEndX;
  const seg4 = g.bottom - g.top;
  const seg5 = g.right - g.left;
  const seg6 = g.bottom - g.top;

  state.resistorStartS = seg1;
  state.resistorEndS = seg1 + seg2;
  state.loopLength = seg1 + seg2 + seg3 + seg4 + seg5 + seg6;

  state.geometry = g;
  state.resistorRegion = {
    x: g.resistorStartX,
    y: g.top - g.resistorHeight / 2,
    width: g.resistorWidth,
    height: g.resistorHeight,
  };
}

function pathPointFromS(s) {
  const g = state.geometry;
  const seg1 = g.resistorStartX - g.left;
  const seg2 = g.resistorWidth;
  const seg3 = g.right - g.resistorEndX;
  const seg4 = g.bottom - g.top;
  const seg5 = g.right - g.left;

  let p = ((s % state.loopLength) + state.loopLength) % state.loopLength;

  if (p <= seg1) {
    return { x: g.left + p, y: g.top, tangent: { x: 1, y: 0 } };
  }
  p -= seg1;
  if (p <= seg2) {
    return { x: g.resistorStartX + p, y: g.top, tangent: { x: 1, y: 0 } };
  }
  p -= seg2;
  if (p <= seg3) {
    return { x: g.resistorEndX + p, y: g.top, tangent: { x: 1, y: 0 } };
  }
  p -= seg3;
  if (p <= seg4) {
    return { x: g.right, y: g.top + p, tangent: { x: 0, y: 1 } };
  }
  p -= seg4;
  if (p <= seg5) {
    return { x: g.right - p, y: g.bottom, tangent: { x: -1, y: 0 } };
  }
  p -= seg5;
  return { x: g.left, y: g.bottom - p, tangent: { x: 0, y: -1 } };
}

function rebuildNuclei() {
  const r = state.resistorRegion;
  const count = 60;
  state.nuclei = Array.from({ length: count }, () => {
    const baseX = r.x + Math.random() * r.width;
    const baseY = r.y + Math.random() * r.height;
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
      speed: 1.8 + Math.random() * 2.8,
    };
  });
}

function rebuildElectrons() {
  state.electrons = Array.from({ length: state.electronCount }, (_, i) => {
    return {
      s: (state.loopLength * i) / state.electronCount,
      speed: 55 + Math.random() * 14,
      lateral: (Math.random() - 0.5) * 9,
      lateralV: (Math.random() - 0.5) * 8,
    };
  });
}

function rebuildScene() {
  const g = getGeometry();
  buildPathData(g);
  rebuildNuclei();
  rebuildElectrons();
}

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
  rebuildScene();
  resetParticles();
}

[lengthSlider, areaSlider, rhoSlider].forEach((slider) => {
  slider.addEventListener("input", syncStateFromControls, { passive: true });
});

function drawCircuit() {
  const g = state.geometry;
  const r = state.resistorRegion;

  // wires
  ctx.strokeStyle = "#4e627f";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(g.left, g.top);
  ctx.lineTo(g.resistorStartX, g.top);
  ctx.moveTo(g.resistorEndX, g.top);
  ctx.lineTo(g.right, g.top);
  ctx.lineTo(g.right, g.bottom);
  ctx.lineTo(g.left, g.bottom);
  ctx.lineTo(g.left, g.top);
  ctx.stroke();

  // battery (left vertical branch)
  const midY = (g.top + g.bottom) / 2;
  ctx.strokeStyle = "#243248";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.left - 14, midY - 24);
  ctx.lineTo(g.left + 14, midY - 24); // long (+)
  ctx.moveTo(g.left - 8, midY + 14);
  ctx.lineTo(g.left + 8, midY + 14); // short (-)
  ctx.stroke();
  ctx.fillStyle = "#243248";
  ctx.font = "14px sans-serif";
  ctx.fillText("+", g.left + 18, midY - 20);
  ctx.fillText("-", g.left + 12, midY + 20);

  // resistor body
  ctx.fillStyle = "#dfe9ff";
  ctx.fillRect(r.x, r.y, r.width, r.height);
  ctx.strokeStyle = "#7fa1ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.width, r.height);

  ctx.fillStyle = "#30496d";
  ctx.font = "13px sans-serif";
  ctx.fillText("抵抗体", r.x + 8, r.y + 18);
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
    const point = pathPointFromS(electron.s);
    const normalX = -point.tangent.y;
    const normalY = point.tangent.x;
    const x = point.x + normalX * electron.lateral;
    const y = point.y + normalY * electron.lateral;

    ctx.beginPath();
    ctx.fillStyle = "#2e5aff";
    ctx.arc(x, y, state.electronRadius, 0, Math.PI * 2);
    ctx.beginPath();
    ctx.fillStyle = "#2e5aff";
    ctx.arc(electron.x, electron.y, state.electronRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function applyResistivityScattering(electron, dt) {
  const inResistor =
    electron.s >= state.resistorStartS && electron.s <= state.resistorEndS;

  if (!inResistor) return;

  const scatterRate = 0.8 + state.rho * 1.6; // scattering count control
  const eventProbability = 1 - Math.exp(-scatterRate * dt);
  if (Math.random() > eventProbability) return;

  const rhoNorm = (state.rho - 0.5) / 4.5;
  const backscatterRatio = 0.06 + rhoNorm * 0.44; // backscatter ratio control
  const spread = 0.15 + rhoNorm * 0.95; // angle spread control

  const backward = Math.random() < backscatterRatio;
  const baseAngle = backward ? Math.PI : 0;
  const scatterAngle = baseAngle + (Math.random() - 0.5) * spread * Math.PI;

  const speedAbs = Math.max(24, Math.abs(electron.speed));
  const projected = Math.cos(scatterAngle) * speedAbs;
  electron.speed = Math.sign(projected || 1) * Math.max(18, Math.abs(projected));

  electron.lateralV += Math.sin(scatterAngle) * 22;
}

function updateNuclei(ts, dt) {
  const amp = 5;
  for (const nucleus of state.nuclei) {
    nucleus.phase += dt * nucleus.speed; // previous versionより高速
    nucleus.x = nucleus.baseX + Math.sin(nucleus.phase + ts * 0.0004) * amp;
    nucleus.y = nucleus.baseY + Math.cos(nucleus.phase * 1.15 + ts * 0.00035) * amp;
  }
}

function updateElectrons(dt) {
  const drive = 34; // battery-driven field
  for (const electron of state.electrons) {
    electron.speed += drive * dt;
    electron.speed *= 0.993;

    applyResistivityScattering(electron, dt);

    electron.s += electron.speed * dt;
    electron.s = ((electron.s % state.loopLength) + state.loopLength) % state.loopLength;

    electron.lateralV += (Math.random() - 0.5) * 12 * dt;
    electron.lateralV *= 0.9;
    electron.lateral += electron.lateralV;
    electron.lateral *= 0.94;
    electron.lateral = Math.max(-12, Math.min(12, electron.lateral));
  }
}

function tick(ts) {
  const dt = Math.min(0.033, (ts - state.lastTs) / 1000 || 0.016);
  state.lastTs = ts;

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawCircuit();

  updateNuclei(ts, dt);
  updateElectrons(dt);
  drawParticles();

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
updateReadout();
resizeCanvas();
resizeCanvas();
updateReadout();
requestAnimationFrame((ts) => {
  state.lastTs = ts;
  requestAnimationFrame(tick);
});
