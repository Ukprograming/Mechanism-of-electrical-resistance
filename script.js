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
  electronCount: 76,
  electrons: [],
  nuclei: [],
  loopLength: 1,
  resistorStartS: 0,
  resistorEndS: 0,
  resistorRegion: null,
  geometry: null,
  lastTs: performance.now(),
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  rebuildScene();
}

function getResistance() {
  return (state.rho * state.length) / state.area;
}

function getGeometry() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const left = 72;
  const right = Math.max(left + 360, w - 72);
  const top = Math.max(62, h * 0.26);
  const bottom = Math.min(h - 62, h * 0.76);

  const topWidth = right - left;
  const normalizedLength = (state.length - 1) / 9;

  // 長さの見た目変化を明確化（最短〜最長で大きく変わる）
  const minResistorWidth = Math.min(90, topWidth * 0.2);
  const maxResistorWidth = Math.max(220, topWidth * 0.82);
  const resistorWidth =
    minResistorWidth + normalizedLength * (maxResistorWidth - minResistorWidth);

  const resistorStartX = (left + right - resistorWidth) / 2;
  const resistorEndX = resistorStartX + resistorWidth;

  const normalizedArea = (state.area - 0.5) / 4.5;
  const resistorHeight = 72 + normalizedArea * (Math.min(188, h * 0.46) - 72);

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
  const count = 64;
  state.nuclei = Array.from({ length: count }, () => {
    const baseX = r.x + Math.random() * r.width;
    const baseY = r.y + Math.random() * r.height;
    return {
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      phase: Math.random() * Math.PI * 2,
      // 熱運動を前回よりさらに高速化
      speed: 3.6 + Math.random() * 4.2,
    };
  });
}

function rebuildElectrons() {
  state.electrons = Array.from({ length: state.electronCount }, (_, i) => {
    return {
      s: (state.loopLength * i) / state.electronCount,
      speed: 76 + Math.random() * 10,
      lateral: (Math.random() - 0.5) * 8,
      lateralV: (Math.random() - 0.5) * 5,
    };
  });
}

function rebuildScene() {
  const g = getGeometry();
  buildPathData(g);
  rebuildNuclei();
  rebuildElectrons();
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
}

[lengthSlider, areaSlider, rhoSlider].forEach((slider) => {
  slider.addEventListener("input", syncStateFromControls, { passive: true });
});

function drawResistorBody(r) {
  ctx.fillStyle = "#dfe9ff";
  ctx.fillRect(r.x, r.y, r.width, r.height);
  ctx.strokeStyle = "#7fa1ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.width, r.height);

  const zigCount = Math.max(6, Math.round(r.width / 36));
  const step = r.width / zigCount;
  const midY = r.y + r.height / 2;
  const amp = Math.min(18, r.height * 0.22);

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#3a5ba7";
  ctx.moveTo(r.x, midY);
  for (let i = 0; i < zigCount; i += 1) {
    const x1 = r.x + step * (i + 0.5);
    const x2 = r.x + step * (i + 1);
    const y = i % 2 === 0 ? midY - amp : midY + amp;
    ctx.lineTo(x1, y);
    ctx.lineTo(x2, midY);
  }
  ctx.stroke();

  ctx.fillStyle = "#30496d";
  ctx.font = "13px sans-serif";
  ctx.fillText("抵抗体", r.x + 8, r.y + 18);
}

function drawCircuit() {
  const g = state.geometry;
  const r = state.resistorRegion;

  // 導線
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

  // 電池（左側枝）
  const midY = (g.top + g.bottom) / 2;
  ctx.strokeStyle = "#243248";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.left - 14, midY - 26);
  ctx.lineTo(g.left + 14, midY - 26);
  ctx.moveTo(g.left - 8, midY + 16);
  ctx.lineTo(g.left + 8, midY + 16);
  ctx.stroke();
  ctx.fillStyle = "#243248";
  ctx.font = "14px sans-serif";
  ctx.fillText("+", g.left + 18, midY - 22);
  ctx.fillText("-", g.left + 12, midY + 22);

  drawResistorBody(r);
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
    ctx.fill();
  }
}

function applyResistivityScattering(electron, dt) {
  const inResistor =
    electron.s >= state.resistorStartS && electron.s <= state.resistorEndS;
  if (!inResistor) return;

  // 1) 散乱回数（イベント率）
  const scatterRate = 1.2 + state.rho * 2.0;
  const eventProbability = 1 - Math.exp(-scatterRate * dt);
  if (Math.random() > eventProbability) return;

  const rhoNorm = (state.rho - 0.5) / 4.5;
  // 2) 後方散乱の割合
  const backscatterRatio = 0.05 + rhoNorm * 0.55;
  // 3) 散乱角の広がり
  const spread = 0.14 + rhoNorm * 1.06;

  const backward = Math.random() < backscatterRatio;
  const baseAngle = backward ? Math.PI : 0;
  const scatterAngle = baseAngle + (Math.random() - 0.5) * spread * Math.PI;

  // 速度の絶対値を保ちつつ進行方向成分だけ変更（散乱強度直接変更はしない）
  const absSpeed = Math.max(24, Math.abs(electron.speed));
  const longitudinal = Math.cos(scatterAngle);
  const sign = longitudinal >= 0 ? 1 : -1;
  electron.speed = sign * absSpeed * Math.max(0.35, Math.abs(longitudinal));

  electron.lateralV += Math.sin(scatterAngle) * 24;
}

function updateNuclei(ts, dt) {
  const amp = 5.5;
  for (const nucleus of state.nuclei) {
    nucleus.phase += dt * nucleus.speed;
    nucleus.x = nucleus.baseX + Math.sin(nucleus.phase + ts * 0.00055) * amp;
    nucleus.y = nucleus.baseY + Math.cos(nucleus.phase * 1.22 + ts * 0.0005) * amp;
  }
}

function updateElectrons(dt) {
  const drive = 38;
  for (const electron of state.electrons) {
    electron.speed += drive * dt;
    electron.speed *= 0.994;

    applyResistivityScattering(electron, dt);

    electron.s += electron.speed * dt;
    electron.s = ((electron.s % state.loopLength) + state.loopLength) % state.loopLength;

    electron.lateralV += (Math.random() - 0.5) * 10 * dt;
    electron.lateralV *= 0.9;
    electron.lateral += electron.lateralV;
    electron.lateral *= 0.94;
    electron.lateral = Math.max(-11, Math.min(11, electron.lateral));
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

  requestAnimationFrame(tick);
}

window.addEventListener("resize", resizeCanvas);
updateReadout();
resizeCanvas();
requestAnimationFrame((ts) => {
  state.lastTs = ts;
  requestAnimationFrame(tick);
});
