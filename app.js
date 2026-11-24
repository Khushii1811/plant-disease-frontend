/**
 * app.js — Hale Frontend Logic
 * Connects to the Plant Disease FastAPI backend (/api/v1/predict)
 */

console.log("🌿 Hale app.js v2.0.2 loaded");

const API_BASE = window.API_BASE_URL !== undefined ? window.API_BASE_URL : 'https://khushi85012--plant-disease-backend-fastapi-app.us-east.modal.run';
const PREDICT_URL = `${API_BASE}/api/v1/predict`;
const HEALTH_URL  = `${API_BASE}/api/v1/health`;
const CROPS_URL   = `${API_BASE}/api/v1/crops`;
const CLASSES_URL = `${API_BASE}/api/v1/classes`;

// ── DOM References ────────────────────────────────────────
const uploadZone       = document.getElementById('upload-zone');
const fileInput        = document.getElementById('file-input');
const browseBtn        = document.getElementById('browse-btn');
const uploadIdle       = document.getElementById('upload-idle');
const uploadPreview    = document.getElementById('upload-preview');
const previewImg       = document.getElementById('preview-img');
const previewMeta      = document.getElementById('preview-meta');
const changeImgBtn     = document.getElementById('change-img-btn');
const cropImgBtn       = document.getElementById('crop-img-btn');
const resetCropBtn     = document.getElementById('reset-crop-btn');
const cropSelect       = document.getElementById('crop-select');
const analyzeBtn       = document.getElementById('analyze-btn');
const analyzeBtnContent= document.getElementById('analyze-btn-content');
const analyzeBtnLoading= document.getElementById('analyze-btn-loading');
const dragOverlay      = document.getElementById('drag-overlay');

// Status
const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const statDevice = document.getElementById('stat-device');
const statClasses = document.getElementById('stat-classes');

// Results
const resultsEmpty   = document.getElementById('results-empty');
const resultsContent = document.getElementById('results-content');
const resultsError   = document.getElementById('results-error');
const errorMessage   = document.getElementById('error-message');
const retryBtn       = document.getElementById('retry-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

// Result fields
const resultBadge       = document.getElementById('result-badge');
const inferenceTime     = document.getElementById('inference-time');
const predCrop          = document.getElementById('pred-crop');
const predDisease       = document.getElementById('pred-disease');
const confidencePct     = document.getElementById('confidence-pct');
const confidenceBar     = document.getElementById('confidence-bar');
const actionCard        = document.getElementById('action-card');
const actionIcon        = document.getElementById('action-icon');
const actionLabel       = document.getElementById('action-label');
const actionDecision    = document.getElementById('action-decision');
const alternativesList  = document.getElementById('alternatives-list');
const altTitle          = document.getElementById('alt-title');
const altSubtitle       = document.getElementById('alt-subtitle');
const metaTemp          = document.getElementById('meta-temp');
const metaTime          = document.getElementById('meta-time');

// Structured Treatment Card DOM
const treatmentFullwidthWrap  = document.getElementById('treatment-fullwidth-wrap');
const treatmentUncertainAlert = document.getElementById('treatment-uncertain-alert');
const treatmentSymptoms       = document.getElementById('treatment-symptoms');
const treatmentImmediate      = document.getElementById('treatment-immediate');
const treatmentOrganic        = document.getElementById('treatment-organic');
const treatmentChemical       = document.getElementById('treatment-chemical');
const treatmentPrevention     = document.getElementById('treatment-prevention');
const treatmentDisclaimer     = document.getElementById('treatment-disclaimer');
const actionPathogenTag       = document.getElementById('action-pathogen-tag');
const treatmentCitations      = document.getElementById('treatment-citations');

// Grad-CAM & Explainability DOM
const camOverlay       = document.getElementById('cam-overlay');
const camControls      = document.getElementById('cam-controls');
const camToggle        = document.getElementById('cam-toggle');
const camOpacity       = document.getElementById('cam-opacity');
const camOpacityVal    = document.getElementById('cam-opacity-val');
const retakeTipsCard   = document.getElementById('retake-tips-card');
const retakeSubtitle   = document.getElementById('retake-subtitle');
const retakeCropTipTitle = document.getElementById('retake-crop-tip-title');
const retakeCropTipText  = document.getElementById('retake-crop-tip-text');
const bgRemoveToggle   = document.getElementById('bg-remove-toggle');

// Image Cropper Modal DOM
const cropModal        = document.getElementById('crop-modal');
const closeCropperBtn  = document.getElementById('close-cropper-btn');
const cancelCropBtn    = document.getElementById('cancel-crop-btn');
const applyCropBtn     = document.getElementById('apply-crop-btn');
const cropperSourceImg = document.getElementById('cropper-source-img');
const cropRotateLeft   = document.getElementById('crop-rotate-left');
const cropRotateRight  = document.getElementById('crop-rotate-right');
const cropResetTool    = document.getElementById('crop-reset-tool');
const aspectBtns       = document.querySelectorAll('.crop-aspect-btn');

// ── Multi-Photo Consensus Tray DOM ──────────────────────
const multiPhotoTray     = document.getElementById('multi-photo-tray');
const traySubtext        = document.getElementById('tray-subtext');
const consensusBadge     = document.getElementById('consensus-badge');
const consensusBadgeText = document.getElementById('consensus-badge-text');
const multiViewBar       = document.getElementById('multi-view-bar');
const multiViewTabs      = document.getElementById('multi-view-tabs');

// ── Dual-Head Verification Meter DOM ─────────────────────
const dualHeadMeter     = document.getElementById('dual-head-meter');
const meterCropName     = document.getElementById('meter-crop-name');
const meterCropPct      = document.getElementById('meter-crop-pct');
const meterCropBar      = document.getElementById('meter-crop-bar');
const meterCropBadge    = document.getElementById('meter-crop-badge');
const meterDiseaseName  = document.getElementById('meter-disease-name');
const meterDiseasePct   = document.getElementById('meter-disease-pct');
const meterDiseaseBar   = document.getElementById('meter-disease-bar');
const meterDiseaseBadge = document.getElementById('meter-disease-badge');
const meterVerdictNote  = document.getElementById('meter-verdict-note');

// ── State ─────────────────────────────────────────────────
let photoSlots = [
  { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
  { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
  { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
];
let activeSlot = 0;
let cropper = null;
let treatmentsData = null;
let latestPredictionData = null;

// ── Particle System ──────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left   = `${Math.random() * 100}%`;
    p.style.bottom = `${Math.random() * 20}%`;
    const duration = 8 + Math.random() * 14;
    const delay    = Math.random() * 12;
    const size     = 2 + Math.random() * 4;
    p.style.width  = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay   = `${delay}s`;
    p.style.opacity = String(0.3 + Math.random() * 0.5);
    container.appendChild(p);
  }
}

// ── Hero Foliar Pest & Ambient Chewing Simulation ────────
function initHeroPestAnimation() {
  const canvas = document.getElementById('pest-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const heroEl = document.getElementById('hero');

  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;

  function resize() {
    if (!heroEl || !canvas) return;
    const rect = heroEl.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Background Image Scale & Coordinate Mapping (hero-bg.jpg: 1376x768)
  const BG_NATURAL_W = 1376;
  const BG_NATURAL_H = 768;

  function getScreenCoords(normX, normY) {
    const scale = Math.max(width / BG_NATURAL_W, height / BG_NATURAL_H);
    const renderW = BG_NATURAL_W * scale;
    const renderH = BG_NATURAL_H * scale;
    const offsetX = (width - renderW) / 2;
    const offsetY = (height - renderH) / 2;
    return {
      x: offsetX + normX * renderW,
      y: offsetY + normY * renderH,
      scale: scale,
    };
  }

  // Spline Interpolation for Organic Crawling
  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  function getSplinePoint(points, globalT) {
    const n = points.length - 1;
    const clampedT = Math.max(0, Math.min(1, globalT));
    const seg = clampedT * n;
    const i = Math.floor(seg);
    const localT = seg - i;

    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(n, i + 1)];
    const p3 = points[Math.min(n, i + 2)];

    const u = catmullRom(p0.u, p1.u, p2.u, p3.u, localT);
    const v = catmullRom(p0.v, p1.v, p2.v, p3.v, localT);

    const delta = 0.006;
    const nextT = Math.min(1, clampedT + delta);
    const segNext = nextT * n;
    const iNext = Math.floor(segNext);
    const localTNext = segNext - iNext;
    const q0 = points[Math.max(0, iNext - 1)];
    const q1 = points[iNext];
    const q2 = points[Math.min(n, iNext + 1)];
    const q3 = points[Math.min(n, iNext + 2)];
    const uNext = catmullRom(q0.u, q1.u, q2.u, q3.u, localTNext);
    const vNext = catmullRom(q0.v, q1.v, q2.v, q3.v, localTNext);

    const angle = Math.atan2(vNext - v, uNext - u);
    return { u, v, angle };
  }

  // Botanical Waypoints Anchored to Foliage on hero-bg.jpg
  const HORNWORM_WAYPOINTS = [
    { u: 0.1090, v: 0.2474 }, // Upper petiole entry
    { u: 0.1526, v: 0.3125 }, // Down main rachis
    { u: 0.1926, v: 0.3646 }, // Petiole node turn
    { u: 0.2108, v: 0.3841 }, // Lateral leaflet petiolule
    { u: 0.2471, v: 0.3711 }, // Site 1: Upper lobe feeding
    { u: 0.2762, v: 0.4427 }, // Traversing secondary vein toward midrib
    { u: 0.3161, v: 0.4818 }, // Site 2: Middle lobe feeding
    { u: 0.3416, v: 0.5534 }, // Traversing blade to apex
    { u: 0.3525, v: 0.5924 }, // Site 3: Apical tip nibble
    { u: 0.3270, v: 0.6771 }, // Scurrying into lower canopy shadow
    { u: 0.2950, v: 0.7900 }, // Disappearing into foliage depth
  ];

  // Natural Chewed Shot-Hole Sites
  const SHOTHOLE_SITES = [
    {
      id: 'hole_1',
      u: 0.2471,
      v: 0.3711,
      feedStart: 3.2,
      feedEnd: 6.5,
      baseRadius: 6.0,
      seed: 4.82,
      frass: [
        { x: -3.5, y: 7.0, rx: 0.85, ry: 0.55, rot: 0.3 },
      ],
    },
    {
      id: 'hole_2',
      u: 0.3161,
      v: 0.4818,
      feedStart: 8.4,
      feedEnd: 11.6,
      baseRadius: 7.2,
      seed: 8.35,
      frass: [
        { x: -4.5, y: 8.5, rx: 0.95, ry: 0.60, rot: 0.5 },
        { x:  2.5, y: 9.0, rx: 0.80, ry: 0.50, rot: -0.3 },
      ],
    },
    {
      id: 'hole_3',
      u: 0.3525,
      v: 0.5924,
      feedStart: 12.6,
      feedEnd: 13.8,
      baseRadius: 4.0,
      seed: 2.14,
      frass: [
        { x: 1.5, y: 5.0, rx: 0.70, ry: 0.45, rot: 0.2 },
      ],
    },
  ];

  const CYCLE_DURATION = 17.5;
  let currentTime = 0;
  let isPaused = false;
  let lastTimestamp = performance.now();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    isPaused = true;
  }

  // Ragged Organic Shot-Hole Contour Generator
  function getRaggedShotHoleContour(baseRadius, seed, growth) {
    const points = [];
    const numPoints = 28;
    const rEffective = baseRadius * growth;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const h1 = Math.sin(angle * 3.0 + seed);
      const h2 = Math.cos(angle * 5.0 - seed * 1.7);
      const h3 = Math.sin(angle * 7.0 + seed * 2.3);
      const microNib = Math.cos(angle * 13.0 + seed * 0.5) * 0.08;
      const roughness = 1.0 + 0.22 * h1 + 0.14 * h2 + 0.09 * h3 + microNib;

      const stretchX = 1.14 + Math.sin(seed) * 0.08;
      const stretchY = 0.88 + Math.cos(seed) * 0.08;

      const r = rEffective * roughness;
      points.push({
        x: Math.cos(angle) * r * stretchX,
        y: Math.sin(angle) * r * stretchY,
      });
    }
    return points;
  }

  // Render Chewed Foliar Holes
  function renderHornwormShotHoles(time) {
    SHOTHOLE_SITES.forEach((site) => {
      let growth = 0;
      if (time >= site.feedStart) {
        growth = Math.min(1.0, (time - site.feedStart) / (site.feedEnd - site.feedStart));
      }
      if (growth <= 0.001) return;

      const screenPos = getScreenCoords(site.u, site.v);
      const baseScale = screenPos.scale * (width / 1376 > 1 ? 1.0 : 0.88);

      let healAlpha = 1.0;
      if (time >= 15.2 && time <= 17.2) {
        healAlpha = Math.max(0, 1.0 - (time - 15.2) / 2.0);
      } else if (time > 17.2) {
        healAlpha = 0;
      }

      if (healAlpha <= 0.01) return;

      ctx.save();
      ctx.globalAlpha = healAlpha;
      ctx.translate(screenPos.x, screenPos.y);

      const points = getRaggedShotHoleContour(site.baseRadius * baseScale, site.seed, growth);
      const len = points.length;

      // Single continuous organic path
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const p = points[i];
        const nextP = points[(i + 1) % len];
        const midX = (p.x + nextP.x) / 2;
        const midY = (p.y + nextP.y) / 2;
        if (i === 0) {
          ctx.moveTo(midX, midY);
        } else {
          ctx.quadraticCurveTo(p.x, p.y, midX, midY);
        }
      }
      ctx.closePath();

      // Translucent foliage shadow tone (natural, lightened)
      const rMax = site.baseRadius * baseScale * growth;
      const voidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, rMax));
      voidGrad.addColorStop(0.0, 'rgba(32, 58, 34, 0.80)');
      voidGrad.addColorStop(0.70, 'rgba(22, 44, 25, 0.86)');
      voidGrad.addColorStop(1.0, 'rgba(16, 34, 18, 0.90)');
      ctx.fillStyle = voidGrad;
      ctx.fill();

      // Soft warm-brown cut edge (0.8px, no central lines)
      ctx.strokeStyle = 'rgba(72, 54, 32, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Micro Frass
      if (growth > 0.45) {
        ctx.fillStyle = '#140e08';
        site.frass.forEach((fp) => {
          ctx.beginPath();
          ctx.ellipse(
            fp.x * baseScale,
            fp.y * baseScale,
            fp.rx * baseScale,
            fp.ry * baseScale,
            fp.rot,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
      }

      ctx.restore();
    });
  }

  // Render Authentic Tomato Hornworm Caterpillar (Manduca quinquemaculata)
  function renderTomatoHornworm(x, y, angle, isFeeding, walkPhase, opacity, scaleFactor) {
    if (opacity <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scaleFactor, scaleFactor);

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2.5;
    ctx.shadowOffsetY = 4.0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 22, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const segmentCount = 10;
    const segmentRadius = [4.2, 5.0, 5.4, 5.6, 5.8, 5.8, 5.7, 5.4, 4.8, 3.8];
    const undulationAmp = isFeeding ? 0.35 : 1.8;

    // Fleshy gripping prolegs
    const prolegSegments = [3, 4, 5, 6, 9];
    ctx.fillStyle = '#31632c';
    ctx.strokeStyle = '#1d3e1a';
    ctx.lineWidth = 0.9;

    prolegSegments.forEach((segIdx) => {
      const segX = 14 - segIdx * 3.7;
      const segYOffset = Math.sin(walkPhase - segIdx * 0.45) * undulationAmp;
      const r = segmentRadius[segIdx];

      [-1, 1].forEach((side) => {
        const py = (r - 0.5) * side + segYOffset;
        ctx.beginPath();
        ctx.ellipse(segX, py, 2.2, 2.8, side * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#112210';
        ctx.beginPath();
        ctx.arc(segX + 0.3, py + 2.2 * side, 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#31632c';
      });
    });

    // 3 True Thoracic Legs
    ctx.strokeStyle = '#1d3e1a';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    for (let t = 0; t < 3; t++) {
      const tx = 14 - t * 3.2;
      const legSwing = Math.sin(walkPhase + t * 0.8) * (isFeeding ? 0.4 : 2.2);
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.moveTo(tx, side * 3.5);
        ctx.lineTo(tx + 2.0 + legSwing * 0.5, side * 6.5);
        ctx.lineTo(tx + 4.0 + legSwing, side * 8.2);
        ctx.stroke();
      });
    }

    // Body Segments with White Chevrons and Spiracles
    for (let i = segmentCount - 1; i >= 0; i--) {
      const segX = 14 - i * 3.7;
      const segY = Math.sin(walkPhase - i * 0.45) * undulationAmp;
      const r = segmentRadius[i];

      ctx.save();
      ctx.translate(segX, segY);

      const segGrad = ctx.createRadialGradient(-0.8, -1.2, r * 0.2, 0, 0, r);
      segGrad.addColorStop(0.0, '#6cb85c');
      segGrad.addColorStop(0.55, '#4a943a');
      segGrad.addColorStop(0.85, '#357228');
      segGrad.addColorStop(1.0, '#234f19');

      ctx.fillStyle = segGrad;
      ctx.strokeStyle = 'rgba(30, 68, 22, 0.45)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White V-shaped chevrons
      if (i >= 2 && i <= 8) {
        ctx.strokeStyle = 'rgba(240, 255, 235, 0.85)';
        ctx.lineWidth = 0.95;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-1.2, -r * 0.75);
        ctx.lineTo(1.4, -r * 0.25);
        ctx.lineTo(-0.8, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-1.2, r * 0.75);
        ctx.lineTo(1.4, r * 0.25);
        ctx.lineTo(-0.8, 0);
        ctx.stroke();
      }

      // Spiracles
      if (i >= 1 && i <= 8) {
        [-1, 1].forEach((side) => {
          const sy = side * (r * 0.55);
          ctx.fillStyle = '#140c06';
          ctx.beginPath();
          ctx.ellipse(0.4, sy, 0.75, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(0.4, sy, 0.35, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    }

    // Caudal Horn at posterior end
    const tailX = 14 - (segmentCount - 1) * 3.7;
    const tailY = Math.sin(walkPhase - (segmentCount - 1) * 0.45) * undulationAmp;
    ctx.save();
    ctx.translate(tailX, tailY);
    ctx.strokeStyle = '#1b3a16';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.quadraticCurveTo(-6, -4, -10, -7);
    ctx.stroke();

    ctx.strokeStyle = '#0a140a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-10, -7);
    ctx.stroke();
    ctx.restore();

    // Head Capsule with chewing mandibles
    const headX = 17.5;
    const chewBobY = isFeeding ? Math.sin(walkPhase * 2.8) * 1.6 : 0;
    const chewBobX = isFeeding ? Math.cos(walkPhase * 2.8) * 0.8 : 0;

    ctx.save();
    ctx.translate(headX + chewBobX, chewBobY);

    const headGrad = ctx.createRadialGradient(-0.5, -0.8, 1, 0, 0, 3.8);
    headGrad.addColorStop(0, '#75c264');
    headGrad.addColorStop(0.7, '#438e34');
    headGrad.addColorStop(1, '#24561b');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#1c4516';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stemmata
    ctx.fillStyle = '#0a180a';
    ctx.beginPath();
    ctx.arc(1.2, -1.8, 0.65, 0, Math.PI * 2);
    ctx.arc(1.2,  1.8, 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Mandibles
    const mandAngle = isFeeding ? Math.abs(Math.sin(walkPhase * 3.5)) * 0.45 + 0.15 : 0.12;
    ctx.strokeStyle = '#231206';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(2.5, -1.0);
    ctx.lineTo(4.5 + Math.sin(mandAngle) * 1.5, -2.0 - Math.sin(mandAngle) * 2.0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2.5, 1.0);
    ctx.lineTo(4.5 + Math.sin(mandAngle) * 1.5, 2.0 + Math.sin(mandAngle) * 2.0);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  // Animation Loop
  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min(0.1, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    if (!isPaused) {
      currentTime += delta;
      if (currentTime >= CYCLE_DURATION) {
        currentTime = 0;
      }
    }

    ctx.clearRect(0, 0, width, height);

    let pestT = 0;
    let isFeeding = false;
    let walkPhase = currentTime * 16;
    let pestOpacity = 1.0;

    if (currentTime < 3.2) {
      pestT = (currentTime / 3.2) * 0.36;
      isFeeding = false;
    } else if (currentTime < 6.5) {
      pestT = 0.36;
      isFeeding = true;
      walkPhase = currentTime * 12;
    } else if (currentTime < 8.4) {
      pestT = 0.36 + ((currentTime - 6.5) / 1.9) * 0.24;
      isFeeding = false;
    } else if (currentTime < 11.6) {
      pestT = 0.60;
      isFeeding = true;
      walkPhase = currentTime * 12;
    } else if (currentTime < 12.6) {
      pestT = 0.60 + ((currentTime - 11.6) / 1.0) * 0.18;
      isFeeding = false;
    } else if (currentTime < 13.8) {
      pestT = 0.78;
      isFeeding = true;
      walkPhase = currentTime * 12;
    } else if (currentTime < 14.8) {
      pestT = 0.78 + ((currentTime - 13.8) / 1.0) * 0.22;
      isFeeding = false;
      if (currentTime > 14.2) {
        pestOpacity = Math.max(0, 1.0 - (currentTime - 14.2) / 0.6);
      }
    } else {
      pestOpacity = 0;
    }

    renderHornwormShotHoles(currentTime);

    if (pestOpacity > 0.01) {
      const spline = getSplinePoint(HORNWORM_WAYPOINTS, pestT);
      const screenPos = getScreenCoords(spline.u, spline.v);
      const scale = screenPos.scale * (width / 1376 > 1 ? 1.05 : 0.88);

      renderTomatoHornworm(
        screenPos.x,
        screenPos.y,
        spline.angle,
        isFeeding,
        walkPhase,
        pestOpacity,
        scale
      );
    }
  }

  requestAnimationFrame(animate);
}

// ── Navbar scroll shadow ──────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 10) {
    navbar.style.background = 'rgba(5,13,10,0.92)';
  } else {
    navbar.style.background = 'rgba(5,13,10,0.75)';
  }
}, { passive: true });

// ── Health Check ─────────────────────────────────────────
async function checkHealth() {
  try {
    const res  = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (statusDot) statusDot.className = 'status-dot online';
    if (statusText) statusText.textContent = 'API Online';
    if (data.device && statDevice) {
      // Shorten device string for display
      const dev = data.device.includes('cuda') ? 'GPU' :
                  data.device.includes('mps')  ? 'MPS' : 'CPU';
      statDevice.textContent = dev;
    }
  } catch {
    if (statusDot) statusDot.className = 'status-dot offline';
    if (statusText) statusText.textContent = 'API Offline';
    if (statDevice) statDevice.textContent = '—';
  }
}

// ── Slot UI & Active Preview Management ─────────────────
function updateSlotUI() {
  const titles = ['Upper Leaf', 'Little Zoom', 'Entire Leaf'];
  const icons = ['🌿', '🔍', '📷'];

  [0, 1, 2].forEach((i) => {
    const card = document.getElementById(`photo-slot-${i}`);
    const thumb = document.getElementById(`slot-thumb-${i}`);
    const clearBtn = document.getElementById(`slot-clear-${i}`);
    if (!card || !thumb) return;

    if (i === activeSlot) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    if (photoSlots[i].file) {
      card.classList.add('filled');
      thumb.innerHTML = `<img src="${photoSlots[i].dataUrl}" alt="${titles[i]}" />`;
      if (clearBtn) clearBtn.style.display = 'flex';
    } else {
      card.classList.remove('filled');
      thumb.innerHTML = `
        <span class="slot-placeholder-icon">${icons[i]}</span>
        <span class="slot-placeholder-text">${titles[i]}</span>
      `;
      if (clearBtn) clearBtn.style.display = 'none';
    }
  });

  const filledCount = photoSlots.filter((s) => s.file !== null).length;
  if (traySubtext) {
    if (filledCount === 0) {
      traySubtext.textContent = '0 Photos Uploaded';
    } else if (filledCount === 1) {
      traySubtext.textContent = '1 Photo (Single Angle)';
    } else {
      traySubtext.textContent = `${filledCount} Photos (Consensus Mode)`;
    }
  }

  if (analyzeBtn && analyzeBtnContent) {
    if (filledCount === 0) {
      analyzeBtn.disabled = true;
      analyzeBtnContent.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        Analyze Leaf
      `;
    } else if (filledCount === 1) {
      analyzeBtn.disabled = false;
      analyzeBtnContent.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        Analyze 1 Leaf
      `;
    } else {
      analyzeBtn.disabled = false;
      analyzeBtnContent.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        Analyze ${filledCount} Views (Consensus)
      `;
    }
  }
}

function renderActiveSlotPreview() {
  const slot = photoSlots[activeSlot];
  if (!slot || !slot.file) {
    uploadIdle.style.display    = 'flex';
    uploadPreview.style.display = 'none';
    previewImg.src = '';
    if (camOverlay) {
      camOverlay.src = '';
      camOverlay.style.display = 'none';
    }
    if (camControls) camControls.style.display = 'none';
    return;
  }

  uploadIdle.style.display    = 'none';
  uploadPreview.style.display = 'block';
  previewImg.src = slot.dataUrl;

  const sizeMB = (slot.file.size / 1024 / 1024).toFixed(2);
  const titles = ['Upper Leaf', 'Little Zoom', 'Entire Leaf'];
  previewMeta.textContent = `Slot ${activeSlot + 1} (${titles[activeSlot]}): ${slot.file.name} · ${sizeMB} MB ${slot.isCropped ? '(Cropped)' : ''}`;

  if (resetCropBtn) {
    resetCropBtn.style.display = slot.isCropped ? 'inline-block' : 'none';
  }

  // If latest prediction data has individual views, load activeSlot's heatmap
  if (latestPredictionData && Array.isArray(latestPredictionData.individual_views) && latestPredictionData.individual_views[activeSlot]) {
    const viewData = latestPredictionData.individual_views[activeSlot];
    if (camOverlay && viewData.heatmap_base64) {
      camOverlay.src = viewData.heatmap_base64;
      camOverlay.style.display = (camToggle && camToggle.checked) ? 'block' : 'none';
      if (camControls) camControls.style.display = 'flex';
    } else {
      if (camOverlay) {
        camOverlay.src = '';
        camOverlay.style.display = 'none';
      }
      if (camControls) camControls.style.display = 'none';
    }
  } else if (latestPredictionData && latestPredictionData.heatmap_base64 && activeSlot === 0) {
    if (camOverlay) {
      camOverlay.src = latestPredictionData.heatmap_base64;
      camOverlay.style.display = (camToggle && camToggle.checked) ? 'block' : 'none';
      if (camControls) camControls.style.display = 'flex';
    }
  } else {
    if (camOverlay) {
      camOverlay.src = '';
      camOverlay.style.display = 'none';
    }
    if (camControls) camControls.style.display = 'none';
  }
}

function selectSlot(idx) {
  activeSlot = idx;
  updateSlotUI();
  renderActiveSlotPreview();
}

function clearSlot(idx) {
  photoSlots[idx] = { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false };
  updateSlotUI();
  renderActiveSlotPreview();
  showEmpty();
}

// ── Multi-File Ingestion ──────────────────────────────────
function handleIncomingFiles(filesList) {
  if (!filesList || filesList.length === 0) return;
  const validExtensions = /\.(jpe?g|png|webp|bmp|tiff|jfif)$/i;
  const filtered = Array.from(filesList).filter(
    (f) => (f.type && f.type.startsWith('image/')) || validExtensions.test(f.name)
  );

  if (filtered.length === 0) {
    showError('Please upload valid image files (JPG, PNG, WEBP).');
    return;
  }

  if (filtered.length > 1) {
    // Fill up to 3 slots
    const toLoad = filtered.slice(0, 3);
    let loadedCount = 0;
    toLoad.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoSlots[i] = {
          file: file,
          dataUrl: e.target.result,
          uncroppedFile: file,
          uncroppedDataUrl: e.target.result,
          isCropped: false,
        };
        loadedCount++;
        if (loadedCount === toLoad.length) {
          activeSlot = 0;
          updateSlotUI();
          renderActiveSlotPreview();
          showEmpty();
        }
      };
      reader.readAsDataURL(file);
    });
  } else {
    // Single file into active slot
    const file = filtered[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      photoSlots[activeSlot] = {
        file: file,
        dataUrl: e.target.result,
        uncroppedFile: file,
        uncroppedDataUrl: e.target.result,
        isCropped: false,
      };
      updateSlotUI();
      renderActiveSlotPreview();
      showEmpty();
    };
    reader.readAsDataURL(file);
  }
}

// Wire up Tray Slot Click & Clear Listeners
[0, 1, 2].forEach((slotIdx) => {
  const slotCard = document.getElementById(`photo-slot-${slotIdx}`);
  const clearBtn = document.getElementById(`slot-clear-${slotIdx}`);

  if (slotCard) {
    slotCard.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('slot-clear-btn')) return;
      selectSlot(slotIdx);
      if (!photoSlots[slotIdx].file) {
        fileInput.click();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSlot(slotIdx);
    });
  }
});

function resetUpload() {
  photoSlots = [
    { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
    { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
    { file: null, dataUrl: null, uncroppedFile: null, uncroppedDataUrl: null, isCropped: false },
  ];
  activeSlot = 0;
  latestPredictionData = null;
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  fileInput.value = '';
  updateSlotUI();
  renderActiveSlotPreview();
  showEmpty();
}

// ── Drag & Drop ───────────────────────────────────────────
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  dragOverlay.classList.add('active');
});

document.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dragOverlay.classList.remove('active');
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  dragOverlay.classList.remove('active');
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) handleIncomingFiles(files);
});

uploadZone.addEventListener('click', () => {
  if (!uploadPreview.style.display || uploadPreview.style.display === 'none') {
    fileInput.click();
  }
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

changeImgBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    handleIncomingFiles(fileInput.files);
  }
});

// ── In-Browser Cropper Logic ──────────────────────────────
function openCropperModal() {
  const slot = photoSlots[activeSlot];
  if (!slot || !slot.dataUrl) return;
  cropperSourceImg.src = slot.dataUrl;
  cropModal.style.display = 'flex';

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  setTimeout(() => {
    if (typeof Cropper !== 'undefined') {
      cropper = new Cropper(cropperSourceImg, {
        viewMode: 1,
        dragMode: 'crop',
        autoCropArea: 0.88,
        responsive: true,
        restore: false,
        background: false,
        checkCrossOrigin: false,
      });
    }
  }, 60);
}

function closeCropperModal() {
  cropModal.style.display = 'none';
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

if (cropImgBtn) {
  cropImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openCropperModal();
  });
}

if (resetCropBtn) {
  resetCropBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const slot = photoSlots[activeSlot];
    if (!slot || !slot.isCropped) return;
    slot.file = slot.uncroppedFile;
    slot.dataUrl = slot.uncroppedDataUrl;
    slot.isCropped = false;
    updateSlotUI();
    renderActiveSlotPreview();
    if (camOverlay) {
      camOverlay.src = '';
      camOverlay.style.display = 'none';
    }
    if (camControls) camControls.style.display = 'none';
    showEmpty();
  });
}

if (closeCropperBtn) closeCropperBtn.addEventListener('click', closeCropperModal);
if (cancelCropBtn) cancelCropBtn.addEventListener('click', closeCropperModal);

if (cropModal) {
  cropModal.addEventListener('click', (e) => {
    if (e.target === cropModal) closeCropperModal();
  });
}

if (cropRotateLeft) {
  cropRotateLeft.addEventListener('click', () => {
    if (cropper) cropper.rotate(-90);
  });
}

if (cropRotateRight) {
  cropRotateRight.addEventListener('click', () => {
    if (cropper) cropper.rotate(90);
  });
}

if (cropResetTool) {
  cropResetTool.addEventListener('click', () => {
    if (cropper) cropper.reset();
  });
}

aspectBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    aspectBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const ratio = btn.getAttribute('data-ratio');
    if (cropper) {
      if (ratio === 'free') {
        cropper.setAspectRatio(NaN);
      } else {
        cropper.setAspectRatio(parseFloat(ratio));
      }
    }
  });
});

if (applyCropBtn) {
  applyCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 2048,
      maxHeight: 2048,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const slot = photoSlots[activeSlot];
      const originalName = slot && slot.uncroppedFile ? slot.uncroppedFile.name : 'leaf.jpg';
      const baseName = originalName.replace(/\.[^/.]+$/, '');
      const croppedFile = new File([blob], `${baseName}_cropped.jpg`, { type: 'image/jpeg' });
      const croppedUrl = URL.createObjectURL(blob);

      slot.file = croppedFile;
      slot.dataUrl = croppedUrl;
      slot.isCropped = true;

      updateSlotUI();
      renderActiveSlotPreview();

      if (camOverlay) {
        camOverlay.src = '';
        camOverlay.style.display = 'none';
      }
      if (camControls) camControls.style.display = 'none';

      closeCropperModal();
      showEmpty();
    }, 'image/jpeg', 0.92);
  });
}

// ── Analyze ───────────────────────────────────────────────
analyzeBtn.addEventListener('click', runAnalysis);
retryBtn.addEventListener('click', runAnalysis);

// ── Grad-CAM Heatmap Listeners ───────────────────────────
if (camToggle) {
  camToggle.addEventListener('change', () => {
    if (camOverlay && camOverlay.src) {
      camOverlay.style.display = camToggle.checked ? 'block' : 'none';
    }
  });
}

if (camOpacity) {
  camOpacity.addEventListener('input', () => {
    const val = camOpacity.value;
    if (camOpacityVal) camOpacityVal.textContent = `${val}%`;
    if (camOverlay) camOverlay.style.opacity = (val / 100).toString();
  });
}

if (bgRemoveToggle) {
  bgRemoveToggle.addEventListener('change', () => {
    const slot = photoSlots[activeSlot];
    if (!bgRemoveToggle.checked && slot && slot.dataUrl && previewImg) {
      previewImg.src = slot.dataUrl;
    }
  });
}

async function runAnalysis() {
  const activeSlotsList = photoSlots.filter((s) => s.file !== null);
  if (activeSlotsList.length === 0) return;

  setLoading(true);
  showEmpty();  // clear previous results while loading

  try {
    const formData = new FormData();
    if (activeSlotsList.length === 1) {
      formData.append('file', activeSlotsList[0].file);
    } else {
      activeSlotsList.forEach((s) => {
        formData.append('files', s.file);
      });
    }
    if (cropSelect && cropSelect.value) {
      formData.append('crop', cropSelect.value);
    }
    if (bgRemoveToggle && bgRemoveToggle.checked) {
      formData.append('remove_bg', 'true');
    }
    if (camToggle && camToggle.checked) {
      formData.append('heatmap', 'true');
    }

    const res = await fetch(PREDICT_URL, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      let msg = `Server error ${res.status}`;
      try { const err = await res.json(); msg = err.detail || msg; } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    console.error('Diagnosis error:', err);
    if (err.name === 'TimeoutError') {
      showError('Diagnosis request timed out. Please try again with smaller images.');
    } else {
      showError(err.message || 'Analysis failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}

// ── Structured Treatment Data Layer ───────────────────────
async function loadTreatmentsData() {
  try {
    const res = await fetch('treatments.json');
    if (res.ok) {
      treatmentsData = await res.json();
      console.log('🌿 Treatments database loaded successfully.');
    }
  } catch (err) {
    console.warn('Could not load treatments.json:', err);
  }
}

function getTreatmentGuidance(crop, disease) {
  const fallbackGeneral = {
    category_name: 'General Foliar Care',
    pathogen_type: 'Unspecified Foliar Stress',
    symptoms: 'Atypical discoloration, chlorotic flecking, or necrotic tissue indicating physiological or pathogen pressure.',
    immediate_actions: [
      'Isolate symptomatic foliage and inspect closely with a hand lens for tiny pests or fungal signs.',
      'Refrain from overhead irrigation until the pathogen category is verified.'
    ],
    organic_treatments: [
      'Apply broad-spectrum bio-fungicide (Trichoderma or Bacillus strains).',
      'Foliar application of organic cold-pressed neem oil (0.5%) during cool morning hours.'
    ],
    chemical_treatments: [
      'Broad-spectrum protective contact fungicide (Mancozeb or Copper oxychloride).',
      'Consult with an agricultural extension officer for regional recommendations.'
    ],
    preventive_measures: [
      'Maintain balanced fertilizer ratios and avoid excess nitrogen.',
      'Ensure soil drainage and adequate inter-row aeration.'
    ],
    disclaimer: 'Always adhere to local agricultural regulations and manufacturer labels for approved application rates and pre-harvest intervals.',
    sources: 'UC Davis IPM General Guidelines; FAO Plant Health.'
  };

  if (!treatmentsData) return fallbackGeneral;

  const cropStr = (crop || '').trim();
  const diseaseStr = (disease || '').trim();
  const exactKey = `${cropStr} - ${diseaseStr}`;

  const formatGuidance = (obj, defaultName) => {
    if (!obj) return fallbackGeneral;
    return {
      ...obj,
      category_name: obj.category_name || obj.crop_disease || defaultName || 'General Foliar Care',
      pathogen_type: obj.pathogen_type || 'Botanical Foliar Pathogen',
    };
  };

  // 1. Exact match (exact and case-insensitive)
  if (treatmentsData.exact_matches) {
    if (treatmentsData.exact_matches[exactKey]) {
      return formatGuidance(treatmentsData.exact_matches[exactKey], exactKey);
    }
    const match = Object.entries(treatmentsData.exact_matches).find(
      ([k]) => k.trim().toLowerCase() === exactKey.toLowerCase()
    );
    if (match) return formatGuidance(match[1], match[0]);
  }

  // 2. Category matching by disease token
  const cats = treatmentsData.categories || {};
  const dLow = diseaseStr.toLowerCase();

  if (dLow.includes('healthy')) return cats.healthy || fallbackGeneral;
  
  // Abiotic & Nutritional Disorders
  if (dLow.includes('tip burn') || dLow.includes('deficiency') || dLow.includes('dehydrated') || dLow.includes('scorch')) {
    return cats.abiotic_nutritional || fallbackGeneral;
  }
  
  // Plant Viruses (NO chemical viricide exists)
  if (dLow.includes('mosaic') || dLow.includes('virus') || dLow.includes('bunchy') || dLow.includes('curl') || dLow.includes('crinkle')) {
    return cats.viral_disease || fallbackGeneral;
  }

  // Phytoplasma
  if (dLow.includes('little leaf')) {
    return cats.phytoplasma || fallbackGeneral;
  }

  // Bacterial Pathogens (Copper + Mancozeb, Antibiotics; FUNGICIDES INEFFECTIVE)
  if (dLow.includes('bacterial') || dLow.includes('canker') || dLow.includes('halo blight') || dLow.includes('fire blight') || dLow.includes('moko') || (dLow.includes('black rot') && (cropStr === 'Cabbage' || cropStr === 'Cauliflower'))) {
    return cats.bacterial_disease || fallbackGeneral;
  }

  // Oomycetes (Water molds - Late Blight / Downy Mildew)
  if (dLow.includes('late blight') || dLow.includes('downy')) {
    return cats.blight_oomycete || cats.downy_mildew || fallbackGeneral;
  }

  // Fungal Blights (Early Blight / Alternaria / Northern Blight)
  if (dLow.includes('early blight') || dLow.includes('blight')) {
    return cats.blight_fungal || fallbackGeneral;
  }

  // Rusts
  if (dLow.includes('rust')) return cats.rust || fallbackGeneral;

  // Powdery Mildews
  if (dLow.includes('powdery')) return cats.powdery_mildew || fallbackGeneral;

  // Scab
  if (dLow.includes('scab')) return cats.scab || fallbackGeneral;

  // Anthracnose
  if (dLow.includes('anthracnose') || dLow.includes('red rot')) return cats.anthracnose || fallbackGeneral;

  // Fruit & Stem Rots
  if (dLow.includes('rot') || dLow.includes('blackrot') || dLow.includes('esca') || dLow.includes('measles') || dLow.includes('panama') || dLow.includes('wilt')) {
    return cats.rot || fallbackGeneral;
  }

  // Leaf Spots
  if (dLow.includes('spot') || dLow.includes('alternaria') || dLow.includes('cercospora') || dLow.includes('septoria') || dLow.includes('frogeye') || dLow.includes('shot hole') || dLow.includes('sigatoka') || dLow.includes('streak') || dLow.includes('cordana') || dLow.includes('pestalotiopsis')) {
    return cats.leaf_spot || fallbackGeneral;
  }

  // Arthropod & Insect Pests
  if (dLow.includes('pest') || dLow.includes('insect') || dLow.includes('mite') || dLow.includes('thrip') || dLow.includes('weevil') || dLow.includes('beetle') || dLow.includes('miner') || dLow.includes('midge') || dLow.includes('slug')) {
    return cats.insect_mite_pest || fallbackGeneral;
  }

  return cats.general || fallbackGeneral;
}

// ── Date Formatting (dd-mm-yyyy) ──────────────────────────
function formatDateDDMMYYYY(dateInput, includeTime = true) {
  if (!dateInput) return '—';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const datePart = `${dd}-${mm}-${yyyy}`;

  if (!includeTime) return datePart;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');

  return `${datePart}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
}

// ── Render Results ────────────────────────────────────────
function renderResults(data) {
  latestPredictionData = data;
  const top = data.top_prediction || {};
  const cropStr = top.crop || data.crop || 'Unknown';
  const diseaseStr = top.disease || data.disease || 'Unknown';
  const isHealthy   = diseaseStr.toLowerCase().includes('healthy');

  const badge = resultBadge || document.getElementById('result-badge');
  const card = actionCard || document.getElementById('action-card');
  const icon = actionIcon || document.getElementById('action-icon');

  // Background removal display
  const activeView = (data.individual_views && data.individual_views[activeSlot]) ? data.individual_views[activeSlot] : null;
  if (data.processed_image_base64 && previewImg) {
    previewImg.src = data.processed_image_base64;
  } else if (photoSlots[activeSlot] && photoSlots[activeSlot].dataUrl && previewImg) {
    previewImg.src = photoSlots[activeSlot].dataUrl;
  }

  // Grad-CAM Heatmap overlay
  const camSrc = (activeView && activeView.heatmap_base64) ? activeView.heatmap_base64 : (data.heatmap_base64 || '');
  if (camOverlay && camSrc) {
    camOverlay.src = camSrc;
    camOverlay.style.display = (camToggle && camToggle.checked) ? 'block' : 'none';
    const opVal = camOpacity ? camOpacity.value : 55;
    camOverlay.style.opacity = (opVal / 100).toString();
    if (camControls) camControls.style.display = 'flex';
  } else if (camControls) {
    camControls.style.display = 'none';
  }

  // Inference time
  const infTime = typeof data.inference_time_ms === 'number' ? data.inference_time_ms.toFixed(1) : '—';
  if (inferenceTime) inferenceTime.textContent = `⚡ ${infTime} ms`;

  // Crop & Disease
  if (predCrop) predCrop.textContent    = cropStr;
  if (predDisease) predDisease.textContent = diseaseStr;

  // Multi-View Consensus Badge
  if (consensusBadge && consensusBadgeText) {
    if (data.num_views && data.num_views > 1) {
      consensusBadge.style.display = 'inline-flex';
      const pctAgree = Math.round((data.consensus_agreement || 1.0) * 100);
      consensusBadgeText.textContent = `${data.consensus_score} (${pctAgree}% agreement)`;
    } else {
      consensusBadge.style.display = 'none';
    }
  }

  // Multi-View Inspection Tabs
  if (multiViewBar && multiViewTabs) {
    if (data.num_views && data.num_views > 1 && Array.isArray(data.individual_views)) {
      multiViewBar.style.display = 'flex';
      multiViewTabs.innerHTML = '';
      const titles = ['Upper Leaf', 'Little Zoom', 'Entire Leaf'];
      data.individual_views.forEach((v, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `multi-view-tab-btn ${idx === activeSlot ? 'active' : ''}`;
        const viewLabel = titles[idx] || `View ${idx + 1}`;
        btn.textContent = `${idx + 1}. ${viewLabel}`;
        btn.title = `${v.crop} - ${v.disease} (${(v.confidence * 100).toFixed(1)}%)`;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.multi-view-tab-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          selectSlot(idx);
        });
        multiViewTabs.appendChild(btn);
      });
    } else {
      multiViewBar.style.display = 'none';
    }
  }

  // Confidence bar
  const rawConf = typeof top.confidence === 'number' ? top.confidence : 0;
  const confVal = rawConf <= 1.0 ? rawConf * 100 : rawConf;
  const pct = confVal.toFixed(1);
  if (confidencePct) confidencePct.textContent = `${pct}%`;
  if (confidenceBar) {
    requestAnimationFrame(() => {
      setTimeout(() => { confidenceBar.style.width = `${Math.min(100, Math.max(0, confVal))}%`; }, 60);
    });
  }

  // Actionable < 0.60 Uncertain State vs Confirmed State
  const isUncertain = (data.status === 'uncertain') || (confVal < 60.0);
  const isGuardTriggered = isUncertain && Boolean(data.warning_message || (data.crop_valid_mass !== undefined && data.crop_valid_mass < 0.15));

  // Badge
  if (badge) {
    if (isGuardTriggered) {
      badge.textContent = '🛡️ Crop Mismatch / Guard';
      badge.className   = 'result-badge uncertain';
    } else if (isUncertain) {
      badge.textContent = '⚠️ Uncertain Diagnosis';
      badge.className   = 'result-badge uncertain';
    } else if (isHealthy) {
      badge.textContent = '✅ Healthy';
      badge.className   = 'result-badge';
    } else {
      badge.textContent = '🔴 Disease Detected';
      badge.className   = 'result-badge diseased';
    }
  }

  // Warning banner under confidence bar
  const confWarning = document.getElementById('confidence-warning');
  if (confWarning) {
    if (isGuardTriggered) {
      confWarning.style.display = 'block';
      const massPct = typeof data.crop_valid_mass === 'number' ? (data.crop_valid_mass * 100).toFixed(1) : '<15';
      confWarning.innerHTML = `🛡️ <strong>Crop Diagnosis Guard:</strong> Relative confidence is ${pct}% inside the selected crop, but overall image match for ${cropStr} is only ${massPct}% prior mass. The leaf may be from a different crop, or this pathology is unsupported for ${cropStr}. Switch to Auto-Detect to verify.`;
    } else if (isUncertain) {
      confWarning.style.display = 'block';
      confWarning.innerHTML = `⚠️ Low confidence diagnosis (${pct}%). Consider re-photographing under balanced lighting or selecting the host crop above to constrain the diagnosis.`;
    } else {
      confWarning.style.display = 'none';
    }
  }

  // Dual-Head Verification Meter
  if (dualHeadMeter) {
    dualHeadMeter.style.display = 'block';

    const cConf = typeof data.crop_confidence === 'number' ? data.crop_confidence * 100 : (data.crop_valid_mass ? data.crop_valid_mass * 100 : 99.0);
    const dConf = typeof data.disease_confidence === 'number' ? data.disease_confidence * 100 : confVal;

    if (meterCropName) meterCropName.textContent = cropStr;
    if (meterCropPct) meterCropPct.textContent = `${cConf.toFixed(1)}%`;
    if (meterCropBar) {
      meterCropBar.className = `meter-bar-fill ${data.crop_status === 'mismatch' ? 'mismatch' : (data.crop_status === 'uncertain' ? 'uncertain' : '')}`;
      requestAnimationFrame(() => {
        meterCropBar.style.width = `${Math.min(100, Math.max(0, cConf))}%`;
      });
    }
    if (meterCropBadge) {
      if (data.crop_status === 'mismatch') {
        meterCropBadge.className = 'meter-badge mismatch';
        meterCropBadge.textContent = '🛡️ Mismatch';
      } else if (data.crop_status === 'uncertain') {
        meterCropBadge.className = 'meter-badge uncertain';
        meterCropBadge.textContent = '⚠️ Uncertain';
      } else {
        meterCropBadge.className = 'meter-badge pass';
        meterCropBadge.textContent = '✅ Confirmed';
      }
    }

    if (meterDiseaseName) meterDiseaseName.textContent = diseaseStr;
    if (meterDiseasePct) meterDiseasePct.textContent = `${dConf.toFixed(1)}%`;
    if (meterDiseaseBar) {
      meterDiseaseBar.className = `meter-bar-fill ${data.disease_status === 'uncertain' ? 'uncertain' : ''}`;
      requestAnimationFrame(() => {
        meterDiseaseBar.style.width = `${Math.min(100, Math.max(0, dConf))}%`;
      });
    }
    if (meterDiseaseBadge) {
      if (data.disease_status === 'uncertain') {
        meterDiseaseBadge.className = 'meter-badge uncertain';
        meterDiseaseBadge.textContent = '⚠️ Ambiguous';
      } else {
        meterDiseaseBadge.className = 'meter-badge pass';
        meterDiseaseBadge.textContent = '✅ Confirmed';
      }
    }

    if (meterVerdictNote) {
      if (data.failure_attribution) {
        meterVerdictNote.style.display = 'block';
        meterVerdictNote.innerHTML = `<strong>Diagnostic Attribution:</strong> ${data.failure_attribution}`;
      } else {
        meterVerdictNote.style.display = 'none';
      }
    }
  }

  // Photography Retake Guidelines & Warning Banner
  const guardAlert = document.getElementById('unsupported-guard-alert');
  const guardWarningText = document.getElementById('guard-warning-text');
  const selectedCropVal = (cropSelect && cropSelect.value) ? cropSelect.value.trim() : '';

  if (isUncertain) {
    // 1. Dynamic Uncertain Subtitle
    if (retakeSubtitle) {
      if (data.warning_message || (data.crop_valid_mass !== undefined && data.crop_valid_mass < 0.15)) {
        retakeSubtitle.textContent = 'Crop mismatch or unsupported disease detected. Please verify selected crop or follow these retake tips:';
      } else {
        retakeSubtitle.textContent = `Calibrated confidence is below 60% (${pct}%). Please retake following these tips:`;
      }
    }

    // 2. Context-Aware Crop Tip in Retake Grid
    if (retakeCropTipTitle && retakeCropTipText) {
      if (selectedCropVal) {
        retakeCropTipTitle.textContent = 'Verify Selected Crop:';
        retakeCropTipText.textContent = `Leaf may not match "${selectedCropVal}" or its pathology isn't in this crop's database. Try switching to Auto-Detect or selecting another crop.`;
      } else {
        retakeCropTipTitle.textContent = 'Select Host Crop:';
        retakeCropTipText.textContent = 'Pick the host crop in the dropdown above to focus neural diagnostic heads.';
      }
    }

    // 3. Context-Aware Warning Banner
    if (guardAlert && guardWarningText) {
      if (data.warning_message) {
        let warnText = data.warning_message;
        if (selectedCropVal) {
          warnText += ` 💡 Tip: Verify that this leaf is from a ${selectedCropVal} plant, or switch to "Auto-Detect (All 33 Crops)".`;
        }
        guardWarningText.textContent = warnText;
        guardAlert.style.display = 'flex';
      } else {
        guardAlert.style.display = 'none';
      }
    }

    if (retakeTipsCard) retakeTipsCard.style.display = 'block';
    if (altTitle) altTitle.textContent = 'Possible Visual Matches';
    if (altSubtitle) altSubtitle.textContent = 'Top candidates (unconfirmed)';
  } else {
    if (guardAlert) guardAlert.style.display = 'none';
    if (retakeTipsCard) retakeTipsCard.style.display = 'none';
    if (altTitle) altTitle.textContent = 'Alternative Diagnoses';
    if (altSubtitle) altSubtitle.textContent = 'Top 3 predictions';
  }

  // Structured Treatment & Prevention Card Rendering
  const guidance = getTreatmentGuidance(cropStr, diseaseStr);

  if (card) {
    card.className = `result-card action-card ${isUncertain ? 'uncertain' : (isHealthy ? 'healthy' : 'action-needed')}`;
  }
  if (icon) {
    icon.textContent = isUncertain ? '⚠️' : (isHealthy ? '✅' : '💊');
  }

  if (isUncertain) {
    if (actionDecision) {
      actionDecision.textContent = 'UNCERTAIN · CONFIRM BEFORE TREATMENT';
      actionDecision.className   = 'action-decision uncertain';
    }
    if (actionLabel) {
      const cleanDisease = diseaseStr.replace(/\b\w/g, c => c.toUpperCase());
      actionLabel.textContent = `${cropStr} — ${cleanDisease}`;
    }
    if (treatmentUncertainAlert) {
      treatmentUncertainAlert.style.display = 'flex';
    }
  } else if (isHealthy) {
    if (actionDecision) {
      actionDecision.textContent = 'HEALTHY FOLIAGE · NO CHEMICAL ACTION NEEDED';
      actionDecision.className   = 'action-decision healthy';
    }
    if (actionLabel) {
      actionLabel.textContent = `${cropStr} — Healthy Foliage`;
    }
    if (treatmentUncertainAlert) {
      treatmentUncertainAlert.style.display = 'none';
    }
  } else {
    if (actionDecision) {
      actionDecision.textContent = 'TREATMENT & CARE RECOMMENDED';
      actionDecision.className   = 'action-decision action-needed';
    }
    if (actionLabel) {
      const cleanDisease = diseaseStr.replace(/\b\w/g, c => c.toUpperCase());
      actionLabel.textContent = `${cropStr} — ${cleanDisease}`;
    }
    if (treatmentUncertainAlert) {
      treatmentUncertainAlert.style.display = 'none';
    }
  }

  if (actionPathogenTag) {
    if (guidance.pathogen_type) {
      actionPathogenTag.textContent = `Pathogen: ${guidance.pathogen_type}`;
      actionPathogenTag.style.display = 'inline-flex';
    } else {
      actionPathogenTag.style.display = 'none';
    }
  }

  // Direct link to Disease Wiki entry
  const actionWikiLink = document.getElementById('action-wiki-link');
  if (actionWikiLink) {
    const wikiQuery = isHealthy ? cropStr : `${cropStr} ${diseaseStr}`;
    actionWikiLink.href = `wiki.html?q=${encodeURIComponent(wikiQuery)}`;
    actionWikiLink.style.display = 'inline-flex';
  }

  if (treatmentSymptoms) {
    treatmentSymptoms.textContent = guidance.symptoms || '—';
  }
  if (treatmentImmediate) {
    const imm = Array.isArray(guidance.immediate_actions) ? guidance.immediate_actions : [];
    treatmentImmediate.innerHTML = imm.map((item) => `<li>${window.formatTokens ? window.formatTokens(item) : item}</li>`).join('');
  }
  if (treatmentOrganic) {
    const org = Array.isArray(guidance.organic_treatments) ? guidance.organic_treatments : [];
    treatmentOrganic.innerHTML = org.map((item) => `<li>${window.formatTokens ? window.formatTokens(item) : item}</li>`).join('');
  }
  if (treatmentChemical) {
    const chem = Array.isArray(guidance.chemical_treatments) ? guidance.chemical_treatments : [];
    treatmentChemical.innerHTML = chem.map((item) => `<li>${window.formatTokens ? window.formatTokens(item) : item}</li>`).join('');
  }
  if (treatmentPrevention) {
    const prev = Array.isArray(guidance.preventive_measures) ? guidance.preventive_measures : [];
    treatmentPrevention.innerHTML = prev.map((item) => `<li>${window.formatTokens ? window.formatTokens(item) : item}</li>`).join('');
  }
  if (treatmentDisclaimer) {
    treatmentDisclaimer.innerHTML = `⚖️ <strong>Regulatory Disclaimer:</strong> ${guidance.disclaimer || 'Always follow local pesticide safety and dosage labels.'}`;
  }
  if (treatmentCitations) {
    if (guidance.sources) {
      treatmentCitations.textContent = `Scientific Grounding: ${guidance.sources}`;
      treatmentCitations.style.display = 'block';
    } else {
      treatmentCitations.style.display = 'none';
    }
  }

  // Alternatives
  if (alternativesList) {
    alternativesList.innerHTML = '';
    const alts = Array.isArray(data.top_3_alternatives) ? data.top_3_alternatives : [];
    alts.forEach((alt, i) => {
      // Convert 0.0-1.0 probability to 0-100 percentage if needed
      const altRaw = typeof alt.confidence === 'number' ? alt.confidence : 0;
      const altVal = altRaw <= 1.0 ? altRaw * 100 : altRaw;
      const altPct = altVal < 0.01 && altVal > 0 ? altVal.toFixed(4) : altVal.toFixed(1);
      const item = document.createElement('div');
      item.className = 'alt-item';
      item.innerHTML = `
        <span class="alt-rank">Alt #${i + 1}</span>
        <div class="alt-info">
          <div class="alt-name">${alt.disease}</div>
          <div class="alt-crop">${alt.crop}</div>
        </div>
        <div class="alt-bar-wrap">
          <div class="alt-bar-bg">
            <div class="alt-bar-fill" style="width:0%" data-target="${altPct}"></div>
          </div>
          <span class="alt-pct">${altPct}%</span>
        </div>
      `;
      alternativesList.appendChild(item);
      // animate bars
      requestAnimationFrame(() => {
        setTimeout(() => {
          const bar = item.querySelector('.alt-bar-fill');
          if (bar) bar.style.width = `${Math.min(100, Math.max(0, altVal))}%`;
        }, 100 + i * 80);
      });
    });
  }

  // Meta
  if (metaTemp) {
    if (typeof data.threshold_applied === 'number') {
      metaTemp.textContent = `${data.threshold_applied.toFixed(2)} (60%)`;
    } else if (typeof data.temperature_applied === 'number') {
      metaTemp.textContent = data.temperature_applied.toFixed(4);
    } else {
      metaTemp.textContent = '0.60 (Calibrated)';
    }
  }
  if (metaTime) {
    const ts = data.timestamp ? new Date(data.timestamp) : new Date();
    metaTime.textContent = formatDateDDMMYYYY(ts);
  }

  // Show results
  if (resultsEmpty) resultsEmpty.style.display   = 'none';
  if (resultsError) resultsError.style.display   = 'none';
  if (resultsContent) resultsContent.style.display = 'flex';
  if (treatmentFullwidthWrap) treatmentFullwidthWrap.style.display = 'block';

  // Scroll to results on mobile
  if (window.innerWidth < 860) {
    const panel = document.getElementById('results-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Diagnostic PDF Export ─────────────────────────────────
async function downloadDiagnosticReport() {
  try {
    if (!latestPredictionData) {
      alert('Please run leaf analysis before exporting a report.');
      return;
    }

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
    if (!jsPDFClass) {
      alert('PDF generator module is still loading. Please try again in a moment.');
      return;
    }

    const data = latestPredictionData;
    const top = data.top_prediction || {};
    const cropStr = top.crop || data.crop || 'Unknown';
    const diseaseStr = top.disease || data.disease || 'Unknown';
    const rawConf = typeof top.confidence === 'number' ? top.confidence : 0;
    const confVal = rawConf <= 1.0 ? rawConf * 100 : rawConf;
    const isUncertain = (data.status === 'uncertain') || (confVal < 60.0);
    const statusStr = isUncertain ? 'UNCERTAIN' : 'CONFIRMED';
    const guidance = getTreatmentGuidance(cropStr, diseaseStr);

    const doc = new jsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Header banner (Dark forest header with Hale logo & accent rule)
    doc.setFillColor(12, 26, 19);
    doc.rect(0, 0, 210, 26, 'F');

    // Accent emerald rule at the bottom of the header banner
    doc.setDrawColor(52, 211, 153);
    doc.setLineWidth(0.6);
    doc.line(0, 26, 210, 26);

    // Concept 1: Hale Brand Icon Emblem (Exact Leaf + Vitality Pulse H mark)
    const HALE_LOGO_DATA_URI = 'data:image/png;base64,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';
    try {
      doc.addImage(HALE_LOGO_DATA_URI, 'PNG', 14, 4, 21.4, 18);
    } catch (logoErr) {
      console.warn('Could not add Hale logo to PDF:', logoErr);
    }

    doc.setTextColor(74, 222, 128);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HALE · PLANT HEALTH & DISEASE DIAGNOSTIC REPORT', 35, 11);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('ConvNeXt-Tiny DualHead Pathology & Agronomic Management Assessment', 35, 18);

    const dateStr = formatDateDDMMYYYY(new Date());
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${dateStr}`, 196, 18, { align: 'right' });

    // 2. Leaf Image Compositing
    let imgDataUrl = null;
    try {
      if (previewImg && previewImg.complete && previewImg.naturalWidth > 0) {
        const compCanvas = document.createElement('canvas');
        const w = previewImg.naturalWidth || 600;
        const h = previewImg.naturalHeight || 600;
        compCanvas.width = w;
        compCanvas.height = h;
        const ctx = compCanvas.getContext('2d');
        ctx.drawImage(previewImg, 0, 0, w, h);

        if (camOverlay && camOverlay.src && camOverlay.style.display !== 'none' && camOverlay.complete && camOverlay.naturalWidth > 0) {
          const alpha = parseFloat(camOverlay.style.opacity) || 0.55;
          ctx.globalAlpha = alpha;
          ctx.drawImage(camOverlay, 0, 0, w, h);
          ctx.globalAlpha = 1.0;
        }
        imgDataUrl = compCanvas.toDataURL('image/jpeg', 0.85);
      } else {
        imgDataUrl = (photoSlots[activeSlot] && photoSlots[activeSlot].dataUrl) || (previewImg ? previewImg.src : null);
      }
    } catch (err) {
      console.warn('Could not composite canvas image:', err);
      imgDataUrl = (photoSlots[activeSlot] && photoSlots[activeSlot].dataUrl) || (previewImg ? previewImg.src : null);
    }

    // Draw image on left side
    const imgX = 14;
    const imgY = 32;
    const imgW = 65;
    const imgH = 65;

    doc.setDrawColor(74, 222, 128);
    doc.setLineWidth(0.3);
    doc.rect(imgX - 0.5, imgY - 0.5, imgW + 1, imgH + 1);

    if (imgDataUrl && typeof imgDataUrl === 'string' && imgDataUrl.startsWith('data:image/')) {
      try {
        const format = imgDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(imgDataUrl, format, imgX, imgY, imgW, imgH);
      } catch (imgErr) {
        console.warn('Could not add image to PDF:', imgErr);
        doc.setTextColor(148, 163, 184);
        doc.text('[Leaf Image Preview]', imgX + 15, imgY + 30);
      }
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('[Leaf Image Preview]', imgX + 15, imgY + 30);
    }

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const camActive = (camOverlay && camOverlay.style.display !== 'none');
    doc.text(`Analyzed Leaf View ${camActive ? '(Grad-CAM Active)' : ''}`, imgX, imgY + imgH + 4);

    // 3. Diagnosis Verdict Box on Right Side
    const boxX = 85;
    const boxY = 32;
    const boxW = 111;
    const boxH = 65;

    doc.setFillColor(248, 250, 252);
    doc.rect(boxX, boxY, boxW, boxH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(boxX, boxY, boxW, boxH, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('IDENTIFIED HOST CROP', boxX + 6, boxY + 8);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(cropStr, boxX + 6, boxY + 14);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('PATHOLOGICAL DIAGNOSIS', boxX + 6, boxY + 22);
    doc.setFontSize(11);
    doc.setTextColor(isUncertain ? 180 : 21, isUncertain ? 83 : 128, isUncertain ? 9 : 61);
    doc.text(diseaseStr.substring(0, 36), boxX + 6, boxY + 28);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CALIBRATED CONFIDENCE', boxX + 6, boxY + 36);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${confVal.toFixed(1)}%`, boxX + 6, boxY + 43);

    // Status Badge
    doc.setFillColor(isUncertain ? 254 : 220, isUncertain ? 243 : 252, isUncertain ? 199 : 231);
    doc.roundedRect(boxX + 55, boxY + 34, 48, 11, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(isUncertain ? 180 : 22, isUncertain ? 83 : 101, isUncertain ? 9 : 52);
    doc.text(`Status: ${statusStr}`, boxX + 60, boxY + 41.5);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const latency = typeof data.inference_time_ms === 'number' ? `${data.inference_time_ms.toFixed(1)} ms` : '—';
    const filterApplied = (cropSelect && cropSelect.value) ? cropSelect.value : 'Auto-Detect';
    doc.text(`Model: ConvNeXt-Tiny DualHead (177 Classes)`, boxX + 6, boxY + 52);
    let modeInfo = guidance.pathogen_type ? `Pathogen: ${guidance.pathogen_type.substring(0, 32)}` : `Latency: ${latency} | Filter: ${filterApplied}`;
    if (data.num_views && data.num_views > 1) {
      const pctAgree = Math.round((data.consensus_agreement || 1.0) * 100);
      modeInfo = `Consensus: ${data.consensus_score} (${pctAgree}%) | Latency: ${latency}`;
    }
    doc.text(modeInfo, boxX + 6, boxY + 58);

    // 4. Differential Diagnoses Candidates Table
    let currentY = 106;
    doc.setFillColor(15, 35, 25);
    doc.rect(14, currentY, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('CANDIDATE DIFFERENTIAL DIAGNOSES (TOP-K CALIBRATED)', 18, currentY + 4.2);

    currentY += 7;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY, 182, 5, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('#', 18, currentY + 3.5);
    doc.text('Candidate Class Label', 30, currentY + 3.5);
    doc.text('Host Crop', 115, currentY + 3.5);
    doc.text('Calibrated Probability', 158, currentY + 3.5);

    const topK = Array.isArray(data.top_k) ? data.top_k : [top];
    currentY += 5;

    topK.slice(0, 4).forEach((item, idx) => {
      const rawK = typeof item.confidence === 'number' ? item.confidence : 0;
      const valK = rawK <= 1.0 ? rawK * 100 : rawK;
      const bgShade = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(bgShade, bgShade, bgShade);
      doc.rect(14, currentY, 182, 5, 'F');
      doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}`, 18, currentY + 3.5);
      doc.text((item.class_name || item.disease || '—').substring(0, 48), 30, currentY + 3.5);
      doc.text(item.crop || '—', 115, currentY + 3.5);
      doc.text(`${valK.toFixed(2)}%`, 164, currentY + 3.5);
      currentY += 5;
    });

    // 5. Agronomic Management & Action Protocol Section
    currentY += 4;
    doc.setFillColor(15, 35, 25);
    doc.rect(14, currentY, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const cleanDisease = diseaseStr.replace(/\b\w/g, c => c.toUpperCase());
    const catTitle = `${cropStr} — ${cleanDisease}`.toUpperCase();
    doc.text(`TREATMENT & CARE GUIDE (${catTitle})`, 18, currentY + 4.2);

    currentY += 8;

    // 5. Redesigned Agronomic Treatment Protocol with Distinct Bullets & Adaptive Spacing
    const sections = [
      {
        title: 'Visual Symptoms',
        badgeColor: [22, 101, 52],
        items: guidance.symptoms ? [guidance.symptoms] : ['—'],
        isBullet: false
      },
      {
        title: 'Immediate Actions',
        badgeColor: [185, 28, 28],
        items: Array.isArray(guidance.immediate_actions) ? guidance.immediate_actions : ['—'],
        isBullet: true
      },
      {
        title: 'Organic Solutions',
        badgeColor: [21, 128, 61],
        items: Array.isArray(guidance.organic_treatments) ? guidance.organic_treatments : ['—'],
        isBullet: true
      },
      {
        title: 'Chemical Treatments',
        badgeColor: [30, 64, 175],
        items: Array.isArray(guidance.chemical_treatments) ? guidance.chemical_treatments : ['—'],
        isBullet: true
      },
      {
        title: 'Preventive Culture',
        badgeColor: [14, 116, 144],
        items: Array.isArray(guidance.preventive_measures) ? guidance.preventive_measures : ['—'],
        isBullet: true
      }
    ];

    const contentWidth = 144;
    const labelX = 14;
    const labelW = 34;
    const textX = 52;

    // Adaptive height budgeting to guarantee zero overlap with footer
    const simulateLayout = (fs, lhF, iGap, sGap) => {
      let y = currentY;
      doc.setFontSize(fs);
      doc.setLineHeightFactor(lhF);
      const lH = (fs * lhF) / 2.83465;

      for (const sec of sections) {
        let secH = 0;
        for (const item of sec.items) {
          const prefix = sec.isBullet ? '• ' : '';
          const wrapped = doc.splitTextToSize(prefix + item, contentWidth);
          secH += wrapped.length * lH + iGap;
        }
        secH = Math.max(secH, 5.5);
        y += secH + sGap;
      }
      return y;
    };

    let fontSize = 7.2;
    let lhFactor = 1.32;
    let itemGap = 1.2;
    let sectionGap = 2.8;

    const maxSafeEndY = 274;
    let estEnd = simulateLayout(fontSize, lhFactor, itemGap, sectionGap);
    if (estEnd > maxSafeEndY) {
      fontSize = 6.6;
      lhFactor = 1.25;
      itemGap = 0.8;
      sectionGap = 2.0;
      estEnd = simulateLayout(fontSize, lhFactor, itemGap, sectionGap);
    }
    if (estEnd > maxSafeEndY) {
      fontSize = 6.2;
      lhFactor = 1.20;
      itemGap = 0.5;
      sectionGap = 1.6;
    }

    doc.setLineHeightFactor(lhFactor);
    const lineH = (fontSize * lhFactor) / 2.83465;

    for (const sec of sections) {
      const secStartY = currentY;

      // Category badge on left
      doc.setFillColor(...sec.badgeColor);
      doc.roundedRect(labelX, secStartY, labelW, 4.8, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      doc.text(sec.title, labelX + labelW / 2, secStartY + 3.4, { align: 'center' });

      // Action items on right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(30, 41, 59);

      let itemY = secStartY + 3.2;

      for (let i = 0; i < sec.items.length; i++) {
        const rawItem = sec.items[i];
        const prefix = sec.isBullet ? '• ' : '';
        const lines = doc.splitTextToSize(prefix + rawItem, contentWidth);
        doc.text(lines, textX, itemY);
        itemY += lines.length * lineH + itemGap;
      }

      const totalSecH = Math.max((itemY - secStartY) - itemGap, 5.5);
      currentY = secStartY + totalSecH + sectionGap;
    }

    // 6. Footer Disclaimer & Scientific Grounding
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, 280, 196, 280);

    if (guidance.sources) {
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const srcText = doc.splitTextToSize(`Scientific Grounding: ${guidance.sources}`, 182);
      doc.text(srcText, 14, 277);
    }

    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    const disc = 'DISCLAIMER: Hale is an automated visual decision-support tool. It is not a licensed plant pathologist. Diagnoses and chemical references (FRAC/OMRI) are for preliminary screening only. Verify symptoms with a certified agronomist before applying treatments.';
    doc.text(doc.splitTextToSize(disc, 182), 14, 284);

    // Save PDF
    const cleanCrop = (cropStr || 'Crop').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDis = (diseaseStr || 'Disease').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Hale_Report_${cleanCrop}_${cleanDis}.pdf`);
  } catch (err) {
    console.error('Error generating diagnostic PDF report:', err);
    alert(`Could not generate PDF report: ${err.message || err}`);
  }
}

if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', downloadDiagnosticReport);
}

// ── UI State Helpers ──────────────────────────────────────
function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtnContent.style.display = isLoading ? 'none' : 'flex';
  analyzeBtnLoading.style.display = isLoading ? 'flex' : 'none';
}

function showEmpty() {
  resultsEmpty.style.display   = 'flex';
  resultsContent.style.display = 'none';
  resultsError.style.display   = 'none';
  if (dualHeadMeter) dualHeadMeter.style.display = 'none';
  if (treatmentFullwidthWrap) treatmentFullwidthWrap.style.display = 'none';
  const actionWikiLink = document.getElementById('action-wiki-link');
  if (actionWikiLink) actionWikiLink.style.display = 'none';
}

function showError(msg) {
  errorMessage.textContent = msg;
  resultsEmpty.style.display   = 'none';
  resultsContent.style.display = 'none';
  resultsError.style.display   = 'flex';
  if (dualHeadMeter) dualHeadMeter.style.display = 'none';
  if (treatmentFullwidthWrap) treatmentFullwidthWrap.style.display = 'none';
  const actionWikiLink = document.getElementById('action-wiki-link');
  if (actionWikiLink) actionWikiLink.style.display = 'none';
}

// ── Intersection Observer for step cards ─────────────────
function initScrollAnimations() {
  const cards = document.querySelectorAll('.step-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach((card) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    obs.observe(card);
  });
}

// ── Load Supported Crops ─────────────────────────────────
async function loadCrops() {
  if (!cropSelect) return;
  try {
    const res = await fetch(CROPS_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return;
    const data = await res.json();
    if (data.crops && Array.isArray(data.crops) && data.crops.length > 0) {
      const current = cropSelect.value;
      cropSelect.innerHTML = `<option value="" style="background-color: #0b1a13; color: #f8fafc;">🌱 Auto-Detect (All ${data.crops.length} Crops)</option>`;
      data.crops.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        opt.style.backgroundColor = '#0b1a13';
        opt.style.color = '#f8fafc';
        cropSelect.appendChild(opt);
      });
      if (current) {
        cropSelect.value = current;
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const preCrop = urlParams.get('crop');
        if (preCrop) cropSelect.value = preCrop;
      }
    }
  } catch {
    // Keep HTML fallback options intact
  }
}

// ── Load Model Stats ─────────────────────────────────────
async function loadModelStats() {
  try {
    const res = await fetch(CLASSES_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return;
    const data = await res.json();
    if (data.total_classes && statClasses) {
      statClasses.textContent = data.total_classes;
    }
  } catch {
    // Keep HTML static fallback intact
  }
}

// ── Plant Pathology & Disease Wiki Controller ─────────────
function initDiseaseWiki() {
  const gridEl = document.getElementById('wiki-grid');
  if (!gridEl) return;

  const searchInput = document.getElementById('wiki-search');
  const catButtons = document.querySelectorAll('.cat-btn');
  const cropTray = document.getElementById('crop-chips-tray');
  const countText = document.getElementById('results-count-text');
  const resetBtn = document.getElementById('reset-filter-btn');

  // Modal Elements
  const modal = document.getElementById('wiki-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const modalHeroImage = document.getElementById('modal-hero-image');
  const modalCrop = document.getElementById('modal-crop');
  const modalBio = document.getElementById('modal-bio');
  const modalTitle = document.getElementById('modal-disease-title');
  const modalPathogen = document.getElementById('modal-pathogen-line');
  const modalSymptoms = document.getElementById('modal-symptoms');
  const modalImmediate = document.getElementById('modal-immediate');
  const modalOrganic = document.getElementById('modal-organic');
  const modalChemical = document.getElementById('modal-chemical');
  const modalPrevention = document.getElementById('modal-prevention');
  const modalCitations = document.getElementById('modal-citations');
  const modalDiagnoseLink = document.getElementById('modal-diagnose-link');

  let wikiData = [];
  let activeCat = 'all';
  let activeCrop = 'all';
  let searchQuery = '';

  // Bio Tag CSS Helper
  function getBioClass(bio) {
    const b = (bio || '').toLowerCase();
    if (b.includes('fungal')) return 'fungal';
    if (b.includes('bacteri')) return 'bacterial';
    if (b.includes('viral')) return 'viral';
    if (b.includes('oomycete')) return 'oomycete';
    if (b.includes('pest') || b.includes('insect')) return 'pest';
    if (b.includes('abiotic')) return 'abiotic';
    if (b.includes('healthy')) return 'healthy';
    if (b.includes('phytoplasma')) return 'phytoplasma';
    return 'fungal';
  }

  // Format tokens into styled micro-pills
  window.formatTokens = function(text) {
    let s = text || '';
    s = s.replace(/\((FRAC\s+[A-Za-z0-9\+\/]+)\)/gi, ' <span class="frac-pill">$1</span>');
    s = s.replace(/\((IRAC\s+[A-Za-z0-9\+\/]+)\)/gi, ' <span class="frac-pill irac-pill">$1</span>');
    s = s.replace(/\b(FRAC\s+[A-Za-z0-9\+\/]+)\b/gi, '<span class="frac-pill">$1</span>');
    s = s.replace(/\b(OMRI(?:\s+Listed)?)\b/gi, '<span class="omri-pill">$1</span>');
    return s;
  };

  // Structured action cards renderer for modal protocol sections
  function fillProtocolCards(containerEl, items, secType) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    if (!Array.isArray(items) || items.length === 0) {
      containerEl.innerHTML = `
        <div class="action-card action-card-${secType}">
          <div class="action-card-text" style="color: #94a3b8; font-style: italic;">
            Standard good agricultural practices and crop monitoring apply.
          </div>
        </div>
      `;
      return;
    }

    items.forEach((itemText, idx) => {
      let lead = '';
      let body = itemText;

      const colonIdx = itemText.indexOf(':');
      if (colonIdx > 0 && colonIdx < 42) {
        lead = itemText.substring(0, colonIdx).trim();
        body = itemText.substring(colonIdx + 1).trim();
      }

      const card = document.createElement('div');
      card.className = `action-card action-card-${secType}`;

      if (lead) {
        card.innerHTML = `
          <div class="action-card-header">
            <span class="action-step-badge step-${secType}">Step ${idx + 1}</span>
            <strong class="action-lead-title">${lead}</strong>
          </div>
          <div class="action-card-text">${window.formatTokens(body)}</div>
        `;
      } else {
        const words = itemText.split(' ');
        let leadVerb = '';
        let remaining = itemText;

        const firstWordUpper = (words[0] || '').toUpperCase();
        if (['NEVER', 'HALT', 'ROGUE', 'PRUNE', 'LOCATE', 'INSPECT', 'MAINTAIN', 'SOLARIZE', 'ROTATE', 'APPLY', 'DISINFECT', 'SWITCH', 'SANITIZED', 'REMOVE', 'CONTINUE', 'PROTECTANT', 'PREVENTIVE'].includes(firstWordUpper)) {
          leadVerb = words.slice(0, 2).join(' ');
          remaining = words.slice(2).join(' ');
        }

        card.innerHTML = `
          <div class="action-card-header">
            <span class="action-step-badge step-${secType}">Step ${idx + 1}</span>
            ${leadVerb ? `<span class="action-lead-verb ${firstWordUpper === 'NEVER' ? 'verb-alert' : 'verb-warn'}">${leadVerb}</span>` : ''}
          </div>
          <div class="action-card-text">${window.formatTokens(remaining)}</div>
        `;
      }

      containerEl.appendChild(card);
    });
  }

  // Open Modal
  function openModal(item) {
    if (!modal) return;
    if (modalHeroImage) modalHeroImage.src = item.image || 'assets/placeholder.webp';
    const fullLink = document.getElementById('modal-view-full-link');
    if (fullLink) fullLink.href = item.image || '#';
    if (modalCrop) modalCrop.textContent = `🌿 ${item.crop}`;
    if (modalBio) {
      modalBio.className = `bio-tag ${getBioClass(item.bio)}`;
      modalBio.textContent = item.bio;
    }
    if (modalTitle) modalTitle.textContent = `${item.crop} - ${item.disease}`;
    if (modalPathogen) modalPathogen.textContent = item.pathogen;
    if (modalSymptoms) modalSymptoms.textContent = item.symptoms || 'No specific visual symptom noted.';

    fillProtocolCards(modalImmediate, item.immediate, 'immediate');
    fillProtocolCards(modalOrganic, item.organic, 'organic');
    fillProtocolCards(modalChemical, item.chemical, 'chemical');
    fillProtocolCards(modalPrevention, item.prevention, 'prevention');

    if (modalCitations) {
      modalCitations.textContent = item.citations || 'UC Davis IPM, Cornell Vegetable MD, FRAC/IRAC Guidelines.';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') closeModal();
  });

  if (modalDiagnoseLink) {
    modalDiagnoseLink.addEventListener('click', () => {
      closeModal();
    });
  }

  // Filter and Render Cards
  function renderWikiGrid() {
    const q = searchQuery.trim().toLowerCase();

    const filtered = wikiData.filter(item => {
      if (activeCat !== 'all' && item.bio !== activeCat) return false;
      if (activeCrop !== 'all' && item.crop !== activeCrop) return false;
      if (q) {
        const matchCrop = item.crop.toLowerCase().includes(q);
        const matchDisease = item.disease.toLowerCase().includes(q);
        const matchPathogen = item.pathogen.toLowerCase().includes(q);
        const matchSymptoms = item.symptoms.toLowerCase().includes(q);
        if (!matchCrop && !matchDisease && !matchPathogen && !matchSymptoms) {
          return false;
        }
      }
      return true;
    });

    const isFiltered = activeCat !== 'all' || activeCrop !== 'all' || q !== '';
    if (countText) {
      countText.innerHTML = `Showing <strong>${filtered.length}</strong> of ${wikiData.length} covered conditions`;
    }
    if (resetBtn) {
      resetBtn.style.display = isFiltered ? 'inline-block' : 'none';
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 style="color:#ffffff;">No matching conditions found</h3>
          <p>Try clearing your search query or switching crop filters.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = '';
    filtered.forEach(item => {
      const card = document.createElement('div');
      const bioClass = getBioClass(item.bio);
      card.className = `wiki-card card-${bioClass}`;

      const imgSrc = item.image || 'assets/placeholder.webp';

      const hasOrganic = Array.isArray(item.organic) && item.organic.length > 0 && !item.organic[0].toLowerCase().includes('no organic');
      const hasChemical = Array.isArray(item.chemical) && item.chemical.length > 0 && !item.chemical[0].toLowerCase().includes('no chemical');
      const hasPrevention = Array.isArray(item.prevention) && item.prevention.length > 0;

      let protocolBadgesHtml = '<div class="card-protocols-row">';
      if (item.bio === 'Healthy') {
        protocolBadgesHtml += `<span class="card-protocol-chip chip-healthy">✨ Healthy Tissue</span>`;
      } else {
        if (hasOrganic) protocolBadgesHtml += `<span class="card-protocol-chip chip-organic">🌿 OMRI Organic</span>`;
        if (hasChemical) protocolBadgesHtml += `<span class="card-protocol-chip chip-chemical">🧪 FRAC Actives</span>`;
        if (hasPrevention) protocolBadgesHtml += `<span class="card-protocol-chip chip-prevent">🛡️ Agronomic Guide</span>`;
      }
      protocolBadgesHtml += '</div>';

      card.innerHTML = `
        <div>
          <div class="card-img-wrap">
            <img src="${imgSrc}" alt="${item.crop} - ${item.disease}" class="card-leaf-img" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-meta-bar">
              <span class="crop-tag">🌿 ${item.crop}</span>
              <span class="bio-tag ${bioClass}">${item.bio}</span>
            </div>
            <h4 class="card-title">${item.disease}</h4>
            <div class="card-pathogen-subline">${item.pathogen}</div>
            <div class="symptoms-callout">
              <div class="symptoms-callout-label">🔍 Field Symptoms</div>
              <p class="card-symptoms-snippet">${item.symptoms}</p>
            </div>
            ${protocolBadgesHtml}
          </div>
        </div>
        <div class="card-footer" style="padding: 1rem 1.25rem;">
          <button type="button" class="btn-view-protocol">
            <span>Treatment & Care</span>
            <span>➔</span>
          </button>
          <a href="#upload-section" class="link-diagnose-crop" data-crop="${item.crop}">Diagnose ➔</a>
        </div>
      `;

      // Card click opens modal
      card.addEventListener('click', (e) => {
        const diagLink = e.target.closest('.link-diagnose-crop');
        if (diagLink) {
          // Pre-select crop in dropdown if present
          if (cropSelect && item.crop) {
            cropSelect.value = item.crop;
          }
          return;
        }
        openModal(item);
      });

      gridEl.appendChild(card);
    });
  }

  // Search Event Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderWikiGrid();
    });
  }

  // Category Filter Buttons
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      renderWikiGrid();
    });
  });

  // Reset All Filters
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCat = 'all';
      activeCrop = 'all';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      catButtons.forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
      document.querySelectorAll('.crop-chip').forEach(b => b.classList.toggle('active', b.dataset.crop === 'all'));
      renderWikiGrid();
    });
  }

  // Load wiki_data.json and initialize
  fetch('wiki_data.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load wiki_data.json');
      return res.json();
    })
    .then(data => {
      wikiData = data;

      // Populate 33 Crop Chips
      if (cropTray) {
        const cropCounts = {};
        wikiData.forEach(item => {
          cropCounts[item.crop] = (cropCounts[item.crop] || 0) + 1;
        });

        const sortedCrops = Object.keys(cropCounts).sort();
        sortedCrops.forEach(c => {
          const btn = document.createElement('button');
          btn.className = 'crop-chip';
          btn.dataset.crop = c;
          btn.textContent = `${c} (${cropCounts[c]})`;
          btn.addEventListener('click', () => {
            document.querySelectorAll('.crop-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCrop = c;
            renderWikiGrid();
          });
          cropTray.appendChild(btn);
        });
      }

      renderWikiGrid();
    })
    .catch(err => {
      console.warn('Wiki data load warning:', err);
    });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  initHeroPestAnimation();
  checkHealth();
  loadModelStats();
  loadCrops();
  loadTreatmentsData();
  initDiseaseWiki();
  initScrollAnimations();

  // Set dynamic footer API links
  const footerDocs = document.getElementById('footer-api-docs');
  const footerRedoc = document.getElementById('footer-redoc');
  if (footerDocs) footerDocs.href = `${API_BASE}/docs`;
  if (footerRedoc) footerRedoc.href = `${API_BASE}/redoc`;

  // Initial health check on page load only (no periodic interval to allow serverless scale-to-zero)
});
