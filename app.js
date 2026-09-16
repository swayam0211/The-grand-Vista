/* ==========================================================================
   THE GRAND VISTA — PARALLAX ENGINE & ANIMATION LOGIC (PAINTER'S EDITION)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger);

  // ==========================================================================
  // 0. AUTOFIT SCREEN SCALING LOGIC
  // ==========================================================================
  let currentScale = 1;
  const wrapper = document.querySelector('.scroll-wrapper');

  function updateScale() {
    // Calculate scale factor to fit exactly 1440px wide canvas into current window width
    currentScale = window.innerWidth / 1440;

    // Set CSS variable for transform: scale()
    document.documentElement.style.setProperty('--scale', currentScale);

    // Update scroll wrapper height to maintain correct scrollable lengt    // Update scroll wrapper height to maintain correct scrollable length (6600px)
    if (wrapper) {
      wrapper.style.height = `${6600 * currentScale}px`;
    }

    // Refresh ScrollTrigger to recalculate distances based on new heights
    ScrollTrigger.refresh();
  }

  window.addEventListener('resize', updateScale);
  updateScale();

  // Helper for GSAP to dynamically scale pixel start/end triggers based on currentScale
  const s = (px) => () => `${px * currentScale}px top`;

  // ==========================================================================
  // 1. LENIS SMOOTH SCROLL INITIALIZATION
  // ==========================================================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 2,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Main scroll wrapper trigger
  const mainTrigger = '.scroll-wrapper';

  // ==========================================================================
  // 2. SCROLL-DRIVEN FULL-SCREEN CLOUD DISPERSAL TIMELINE
  // ==========================================================================
  const skyClouds = document.querySelectorAll('.sky-cloud');

  // Master ScrollTrigger timeline: clouds slide outwards (left, right, top) and fade on scroll
  const cloudPartingTl = gsap.timeline({
    scrollTrigger: {
      trigger: mainTrigger,
      start: 'top top',
      end: s(600),
      scrub: 0.8,
      invalidateOnRefresh: true,
    }
  });

  // Small cloud cutouts slide outwards left, right, and upwards out of screen until opacity 0
  skyClouds.forEach((cloud, index) => {
    const leftPos = parseFloat(cloud.style.left) || 0;
    const isLeft = leftPos < 500;
    const isCenter = leftPos >= 300 && leftPos <= 700;

    let targetX = isLeft ? -850 : 850;
    let targetY = isCenter ? -550 : -250;

    cloudPartingTl.fromTo(cloud,
      { x: 0, y: 0, opacity: 1.0 },
      {
        x: targetX,
        y: targetY,
        opacity: 0,
        ease: 'none',
        immediateRender: true,
      },
      (index * 0.03)
    );
  });

  // Replay Intro Button scrolls smooth back to top (where clouds cover section)
  const replayBtn = document.getElementById('replay-curtain-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      lenis.scrollTo(0, { immediate: false, duration: 1.5 });
    });
  }

  // ==========================================================================
  // 4. SCROLL DEPTH INDICATOR & SIDE NAV DOTS
  // ==========================================================================
  const scrollPercentText = document.getElementById('scroll-percent');
  const navDots = document.querySelectorAll('.nav-dot');

  lenis.on('scroll', (e) => {
    const scrollY = Math.max(0, e.scroll);
    // Use scaled total height for percentage (6600px)
    const scaledTotalHeight = (6600 * currentScale) - window.innerHeight;
    const progress = Math.min(100, Math.round((scrollY / scaledTotalHeight) * 100));
    if (scrollPercentText) scrollPercentText.textContent = `${progress}%`;

    let activeScene = 1;
    if (scrollY > 4800 * currentScale) activeScene = 5;
    else if (scrollY > 3600 * currentScale) activeScene = 4;
    else if (scrollY > 2600 * currentScale) activeScene = 3;
    else if (scrollY > 1400 * currentScale) activeScene = 2;

    navDots.forEach(dot => {
      const sceneNum = parseInt(dot.dataset.scene, 10);
      dot.classList.toggle('active', sceneNum === activeScene);
    });
  });

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sceneNum = parseInt(dot.dataset.scene, 10);
      const targets = [0, 0, 1400, 2600, 3600, 4800];
      const targetY = (targets[sceneNum] || 0) * currentScale;
      lenis.scrollTo(targetY, { duration: 1.8 });
    });
  });

  // ==========================================================================
  // 5. SCENE-BY-SCENE GSAP SCROLLTRIGGER PARALLAX SPECIFICATIONS
  // ==========================================================================

  // --- SCENE 1 FOREGROUND & CANOPY PARALLAX ---
  // Bare Tree Left
  gsap.to('#tree-bare-left', {
    y: -140,
    ease: 'none',
    scrollTrigger: {
      trigger: mainTrigger,
      start: 'top top',
      end: s(2200),
      scrub: true,
    }
  });

  // Giant Tree Overlay Right
  gsap.to('#trees-giant-overlay', {
    y: -120,
    ease: 'none',
    scrollTrigger: {
      trigger: mainTrigger,
      start: 'top top',
      end: s(2200),
      scrub: true,
    }
  });

  // Trees Top Section Canopy (Comes 50px down with 0.7X speed)
  gsap.fromTo('#tree-top-canopy',
    { y: 0, opacity: 1 },
    {
      y: 50,
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: 'top top',
        end: s(1400),
        scrub: 0.7,
      }
    }
  );

  // --- SCENE 2 ENHANCED SILHOUETTE PARALLAX (Y: 1000 - 2600) ---
  gsap.fromTo('#figures-silhouette',
    { y: 50, scale: 0.95, opacity: 0.4, rotate: -2 },
    {
      y: -160,
      scale: 1.10,
      opacity: 1.0,
      rotate: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(1000),
        end: s(2600),
        scrub: 1,
      }
    }
  );

  gsap.fromTo('#city-right-intro',
    { x: 180, opacity: 0.1 },
    {
      x: 0,
      opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(1000),
        end: s(2200),
        scrub: 1,
      }
    }
  );

  gsap.to('#birds-flock-static', {
    x: 220,
    y: -120,
    ease: 'none',
    scrollTrigger: {
      trigger: mainTrigger,
      start: s(1800),
      end: s(3200),
      scrub: true,
    }
  });

  // --- SCENE 3 PARALLAX & TRAIN BRIDGE (Y: 2800 - 4200) ---
  gsap.to('#city-panorama-lower', {
    y: -100,
    ease: 'none',
    scrollTrigger: {
      trigger: mainTrigger,
      start: s(2500),
      end: s(4200),
      scrub: true,
    }
  });

  // --- SCENE 4 PARALLAX: CITADEL ARCHITECTURE (Y: 3100 - 5200) ---
  // 1. Building Cluster Mixed comes from left side before reaching 3787px and places on screen
  gsap.fromTo('#building-cluster-mixed',
    { x: -650, opacity: 0.2 },
    {
      x: 0,
      opacity: 1.0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3100),
        end: s(3650),
        scrub: 0.8,
      }
    }
  );

  // 2. Building Cluster Large (above it) fades opacity from 0 to 100% at fixed location
  gsap.fromTo('#building-cluster-large',
    { opacity: 0 },
    {
      opacity: 1.0,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3650),
        end: s(3950),
        scrub: 0.6,
      }
    }
  );

  // 3. As scroll continues down, Building Cluster Large fades opacity from 100% down to 60%
  gsap.fromTo('#building-cluster-large',
    { opacity: 1.0 },
    {
      opacity: 0.6,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4100),
        end: s(5200),
        scrub: true,
      }
    }
  );

  gsap.fromTo('#atmosphere-band',
    { opacity: 0.4 },
    {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4200),
        end: s(5800),
        scrub: true,
      }
    }
  );

  // --- SCENE 5 PARALLAX: MINARET & BASE ROAD (REPOSITIONED AT Y: 4800 - 6600) ---
  gsap.fromTo('#minaret-tower',
    { y: 160, opacity: 0.2, scale: 0.96 },
    {
      y: -220,
      opacity: 1.0,
      scale: 1.05,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4200),
        end: s(6600),
        scrub: true,
      }
    }
  );

  gsap.fromTo('#city-cluster-european',
    { x: 180, opacity: 0.2 },
    {
      x: 0,
      opacity: 1.0,
      y: -160,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4300),
        end: s(6600),
        scrub: true,
      }
    }
  );

  gsap.fromTo('#horse-cart',
    { x: 120, opacity: 0.3 },
    {
      x: -160,
      y: -180,
      opacity: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(5000),
        end: s(6600),
        scrub: true,
      }
    }
  );

  let bounceTime = 0;
  const horseCartEl = document.getElementById('horse-cart');
  if (horseCartEl) {
    lenis.on('scroll', () => {
      bounceTime += 0.18;
      const bounceY = Math.sin(bounceTime) * 3.5;
      horseCartEl.style.transform = `translateY(${bounceY}px)`;
    });
  }

  // ==========================================================================
  // 5B. MATHEMATICAL BLUEPRINT & ARCHITECTURAL GEOMETRY ENGINE (SCENES 4 & 5)
  // ==========================================================================
  const geomCanvas = document.getElementById('geometry-canvas');
  if (geomCanvas) {
    const ctxG = geomCanvas.getContext('2d');
    geomCanvas.width = 1440;
    geomCanvas.height = 3300; // Covers Y = 3300px to 6600px

    let geomProgress = 0;

    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(3100),
      end: s(6600),
      scrub: true,
      onUpdate: (self) => {
        geomProgress = self.progress;
        drawMathematicalGeometry(geomProgress);
      }
    });

    function drawMathematicalGeometry(progress) {
      ctxG.clearRect(0, 0, geomCanvas.width, geomCanvas.height);
      ctxG.lineWidth = 1.4;

      // Focal Node Coordinates beside image connection margins (Local canvas Y = global Y - 3300)
      const citadelNode = { x: 880, y: 3750 - 3300, name: "CITADEL APEX // 3787px" };     // Beside Citadel (right side)
      const minaretNode = { x: 280, y: 4910 - 3300, name: "MINARET SPIRE // 4900px" };     // Beside Minaret (left side)
      const skylineNode = { x: 1220, y: 4980 - 3300, name: "EUROPEAN DOME // 4950px" };   // Beside Skyline (right side)
      const roadNode = { x: 720, y: 5900 - 3300, name: "ROAD BASE // 5900px" };         // Center Road Base

      // Angle & Rotation Progress
      const angle = progress * Math.PI * 10;
      const pathProgress = Math.min(1.0, progress * 1.4);

      // 1. DUAL MULTI-STRAND GLOWING BEZIER CONNECTORS (Beside building margins)
      // Citadel -> Minaret Connection Cable (Gold + Cyan)
      drawGlowBezier(ctxG, citadelNode, { x: 780, y: 950 }, { x: 400, y: 1280 }, minaretNode, pathProgress, '#f5d061', '#035041ff');

      // Minaret -> Skyline Connection Cable (Amber + Gold)
      drawGlowBezier(ctxG, minaretNode, { x: 500, y: 1650 }, { x: 950, y: 1670 }, skylineNode, pathProgress, '#603003ff', '#4f3d05ff');

      // Skyline -> Road Base Connection Cable
      drawGlowBezier(ctxG, skylineNode, { x: 1100, y: 2100 }, { x: 900, y: 2450 }, roadNode, pathProgress, '#095848ff', '#502d0cff');

      // 2. VIBRANT SPIROGRAPHIC ROTATING ORBITAL GEAR RINGS
      drawSpirograph(ctxG, citadelNode.x, citadelNode.y, 140, 42, 35, angle, 'rgba(90, 68, 1, 0.82)', 'rgba(2, 68, 55, 0.45)');
      drawSpirograph(ctxG, minaretNode.x, minaretNode.y, 150, 45, 38, -angle * 1.3, 'rgba(156, 163, 209, 0.85)', 'rgba(92, 78, 29, 0.5)');
      drawSpirograph(ctxG, skylineNode.x, skylineNode.y, 130, 39, 30, angle * 1.1, 'rgba(11, 4, 77, 0.85)', 'rgba(98, 75, 4, 0.45)');

      // 3. ARCHITECTURAL COMPASS DEGREE ARCS & TICK MARKS
      [citadelNode, minaretNode, skylineNode].forEach((node, idx) => {
        const sweepAngle = Math.min(Math.PI * 2, progress * Math.PI * 3.5 + idx * 0.4);

        ctxG.strokeStyle = idx % 2 === 0 ? 'rgba(245, 208, 97, 0.50)' : 'rgba(78, 240, 208, 0.50)';
        ctxG.setLineDash([8, 4]);

        [120, 180, 250].forEach(r => {
          ctxG.beginPath();
          ctxG.arc(node.x, node.y, r, 0, sweepAngle);
          ctxG.stroke();
        });

        // Compass Tick Marks
        ctxG.setLineDash([]);
        ctxG.strokeStyle = 'rgba(245, 208, 97, 0.65)';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          if (a <= sweepAngle) {
            const tx1 = node.x + Math.cos(a) * 170;
            const ty1 = node.y + Math.sin(a) * 170;
            const tx2 = node.x + Math.cos(a) * 180;
            const ty2 = node.y + Math.sin(a) * 180;
            ctxG.beginPath();
            ctxG.moveTo(tx1, ty1);
            ctxG.lineTo(tx2, ty2);
            ctxG.stroke();
          }
        }
      });

      // 4. METRIC FOCAL CALLOUT LABELS & GLOWING CROSSHAIRS
      [citadelNode, minaretNode, skylineNode, roadNode].forEach(node => {
        // Glowing Center Node
        ctxG.fillStyle = '#ffffff';
        ctxG.beginPath();
        ctxG.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctxG.fill();

        ctxG.strokeStyle = 'rgba(73, 48, 3, 0.9)';
        ctxG.lineWidth = 1.5;
        ctxG.beginPath();
        ctxG.arc(node.x, node.y, 9, 0, Math.PI * 2);
        ctxG.stroke();

        // Crosshairs
        ctxG.strokeStyle = 'rgba(200, 156, 36, 0.7)';
        ctxG.beginPath();
        ctxG.moveTo(node.x - 24, node.y); ctxG.lineTo(node.x + 24, node.y);
        ctxG.moveTo(node.x, node.y - 24); ctxG.lineTo(node.x, node.y + 24);
        ctxG.stroke();

        // Architectural Monospace Text Label
        ctxG.font = '11px "Inter", monospace';
        ctxG.fillStyle = '#02223eff';
        ctxG.fillText(node.name, node.x + 14, node.y - 12);
      });
    }

    function drawGlowBezier(ctx, p0, p1, p2, p3, t, mainColor, glowColor) {
      // Primary Cable
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([]);
      drawPartialBezier(ctx, p0, p1, p2, p3, t);

      // Offset Parallel Glow Cable
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      drawPartialBezier(ctx,
        { x: p0.x + 12, y: p0.y - 8 },
        { x: p1.x + 12, y: p1.y - 8 },
        { x: p2.x + 12, y: p2.y - 8 },
        { x: p3.x + 12, y: p3.y - 8 },
        t
      );
    }

    function drawSpirograph(ctx, cx, cy, R, r, p, rotAngle, color1, color2) {
      ctx.setLineDash([]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = color1;
      ctx.beginPath();
      const points = 140;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2 + rotAngle;
        const x = cx + (R + r) * Math.cos(theta) - p * Math.cos(((R + r) / r) * theta);
        const y = cy + (R + r) * Math.sin(theta) - p * Math.sin(((R + r) / r) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Inner Rotator Ring
      ctx.strokeStyle = color2;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2 - rotAngle * 1.5;
        const x = cx + (R * 0.6 + r) * Math.cos(theta) - p * 0.5 * Math.cos(((R + r) / r) * theta);
        const y = cy + (R * 0.6 + r) * Math.sin(theta) - p * 0.5 * Math.sin(((R + r) / r) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function drawPartialBezier(ctx, p0, p1, p2, p3, t) {
      ctx.beginPath();
      const steps = 70;
      const maxSteps = Math.floor(steps * t);
      for (let i = 0; i <= maxSteps; i++) {
        const stepT = (i / steps);
        const u = 1 - stepT;
        const x = u * u * u * p0.x + 3 * u * u * stepT * p1.x + 3 * u * stepT * stepT * p2.x + stepT * stepT * stepT * p3.x;
        const y = u * u * u * p0.y + 3 * u * u * stepT * p1.y + 3 * u * stepT * stepT * p2.y + stepT * stepT * stepT * p3.y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // ==========================================================================
  // 6. INTERACTIVE CANVASES: BIRDS FLOCK & SCROLL-CONTROLLED TRAIN
  // ==========================================================================
  function setupBirdsCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctxB = canvas.getContext('2d');
    canvas.width = 1440;
    canvas.height = 600;

    const birds = Array.from({ length: 14 }, () => ({
      x: Math.random() * 1440,
      y: Math.random() * 400 + 50,
      speed: Math.random() * 2.2 + 1.5,
      size: Math.random() * 8 + 6,
      wingState: Math.random() * Math.PI * 2,
    }));

    function drawBirds() {
      ctxB.clearRect(0, 0, canvas.width, canvas.height);
      ctxB.fillStyle = 'rgba(25, 20, 15, 0.75)';

      birds.forEach(b => {
        b.x += b.speed;
        b.wingState += 0.15;
        if (b.x > 1460) b.x = -40;

        const wingY = Math.sin(b.wingState) * (b.size * 0.6);

        ctxB.beginPath();
        ctxB.moveTo(b.x, b.y);
        ctxB.quadraticCurveTo(b.x - b.size, b.y - wingY, b.x - b.size * 1.5, b.y + wingY * 0.5);
        ctxB.quadraticCurveTo(b.x - b.size * 0.5, b.y, b.x, b.y);
        ctxB.quadraticCurveTo(b.x + b.size * 0.5, b.y, b.x + b.size * 1.5, b.y + wingY * 0.5);
        ctxB.quadraticCurveTo(b.x + b.size, b.y - wingY, b.x, b.y);
        ctxB.fill();
      });

      requestAnimationFrame(drawBirds);
    }
    drawBirds();
  }

  // Initialize interactive birds flock canvases at 1500px and 2500px
  setupBirdsCanvas('birds-canvas-top');
  setupBirdsCanvas('birds-canvas');

  // ==========================================================================
  // 6. SCROLL-DRIVEN 24FPS WEBP TRAIN VIDEO FRAME SEQUENCE
  // ==========================================================================
  const trainCanvas = document.getElementById('train-canvas');
  if (trainCanvas) {
    const ctxT = trainCanvas.getContext('2d');
    trainCanvas.width = 1455;
    trainCanvas.height = 651;

    const totalFrames = 140;
    const trainFrames = [];
    let currentFrameIndex = 0;

    // Preload 24fps transparent WebP frames from video
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      img.src = `images from figma/train_frames/frame_${frameNum}.webp`;
      trainFrames.push(img);
    }

    function renderTrainFrame(index) {
      const frame = trainFrames[index];
      if (frame && frame.complete && frame.naturalWidth !== 0) {
        ctxT.clearRect(0, 0, trainCanvas.width, trainCanvas.height);
        ctxT.drawImage(frame, 0, 0, trainCanvas.width, trainCanvas.height);
      }
    }

    // ScrollTrigger scrubs frame sequence bi-directionally based on scroll position (starts 0.5s/300px earlier)
    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(2300),
      end: s(3800),
      scrub: true,
      onUpdate: (self) => {
        const frameIdx = Math.min(totalFrames - 1, Math.max(0, Math.floor(self.progress * (totalFrames - 1))));
        if (frameIdx !== currentFrameIndex) {
          currentFrameIndex = frameIdx;
          renderTrainFrame(currentFrameIndex);
        }
      }
    });

    // Render initial frame on load
    if (trainFrames[0]) {
      if (trainFrames[0].complete) {
        renderTrainFrame(0);
      } else {
        trainFrames[0].onload = () => renderTrainFrame(0);
      }
    }
  }

});
