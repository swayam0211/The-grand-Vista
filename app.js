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
    let animTime = 0;

    // Exact Custom Color Palette (From User's Code Editor Screenshot)
    const PALETTE = {
      cyan: '#414219ff',
      cyanGlow: 'rgba(4, 66, 69, 0.95)',
      gold: '#054701ff',
      goldGlow: 'rgba(36, 34, 5, 0.95)',
      rose: '#485304ff',
      roseGlow: 'rgba(74, 62, 2, 0.9)',
      amber: '#503104ff',
      amberGlow: 'rgba(121, 75, 5, 0.9)',
      mint: '#056344ff',
      cardBg: 'rgba(6, 16, 32, 0.88)'
    };

    // ScrollTrigger starts 0.52s faster / earlier (start: s(2100))
    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(2100),
      end: s(6600),
      scrub: true,
      onUpdate: (self) => {
        geomProgress = self.progress;
      }
    });

    function geomLoop() {
      animTime += 0.016;
      drawMathematicalGeometry(geomProgress, animTime);
      requestAnimationFrame(geomLoop);
    }
    requestAnimationFrame(geomLoop);

    function drawMathematicalGeometry(progress, time) {
      ctxG.clearRect(0, 0, geomCanvas.width, geomCanvas.height);

      const pathProgress = Math.min(1.0, progress * 1.35);

      // ------------------------------------------------------------------------
      // 1. STAGE 1: TORNADO VORTEX SPIRAL FUNNEL (USER'S 2nd IMAGE RECREATION)
      // 5 Streams from Bridge Pillars enter a 3D Swirling Tornado Funnel taper!
      // ------------------------------------------------------------------------
      const pillars = [
        { start: { x: 184, y: 167 }, color: PALETTE.cyan, glow: PALETTE.cyanGlow, phase: 0 },
        { start: { x: 447, y: 167 }, color: PALETTE.gold, glow: PALETTE.goldGlow, phase: 1.25 },
        { start: { x: 702, y: 167 }, color: PALETTE.rose, glow: PALETTE.roseGlow, phase: 2.50 },
        { start: { x: 953, y: 167 }, color: PALETTE.amber, glow: PALETTE.amberGlow, phase: 3.75 },
        { start: { x: 1210, y: 165 }, color: PALETTE.mint, glow: PALETTE.cyanGlow, phase: 5.00 }
      ];

      // Draw Tornado Funnel Strands (Image 2)
      pillars.forEach((p, idx) => {
        drawTornadoVortexStream(ctxG, p.start, idx, pathProgress, time, p.color, p.glow, p.phase);
      });

      // ------------------------------------------------------------------------
      // 2. STAGE 2: SWEEPING 3D CURVED RIBBON WAVE WITH BEAD DOTS (USER'S 1st IMAGE RECREATION)
      // Passing behind Citadel -> Emerge Bottom-Right -> U-Curve Left -> Behind Minaret -> Road Base
      // (PRESERVED EXACT PATH WAYPOINTS UNTOUCHED)
      // ------------------------------------------------------------------------
      if (pathProgress > 0.32) {
        const waveProgress = Math.min(1.0, (pathProgress - 0.32) * 1.6);
        drawSweepingRibbonWave(ctxG, waveProgress, time);
      }

      // ------------------------------------------------------------------------
      // 3. FOCAL NODES & HUD BADGE CARDS
      // ------------------------------------------------------------------------
      const nodes = {
        citadel: { x: 1060, y: 1200, title: "CITADEL APEX", code: "3787px • 42.8° N", color: PALETTE.gold, glow: PALETTE.goldGlow },
        minaretLeft: { x: 160, y: 1600, title: "MINARET SPIRE", code: "4900px • 18.4° E", color: PALETTE.rose, glow: PALETTE.roseGlow },
        skyline: { x: 1280, y: 1650, title: "EUROPEAN DOME", code: "4950px • 64.2° W", color: PALETTE.cyan, glow: PALETTE.cyanGlow },
        roadBase: { x: 650, y: 2450, title: "ROAD BASE", code: "5900px • ELEV 0m", color: PALETTE.mint, glow: PALETTE.cyanGlow }
      };

      if (pathProgress > 0.4) {
        drawEpicycloidGear(ctxG, nodes.citadel.x, nodes.citadel.y, 130, 39, 30, time * 0.6, PALETTE.gold, PALETTE.cyan);
        drawEpicycloidGear(ctxG, nodes.minaretLeft.x, nodes.minaretLeft.y, 120, 36, 28, -time * 0.8, PALETTE.rose, PALETTE.amber);
        drawEpicycloidGear(ctxG, nodes.skyline.x, nodes.skyline.y, 135, 40, 32, time * 0.7, PALETTE.cyan, PALETTE.mint);
        drawEpicycloidGear(ctxG, nodes.roadBase.x, nodes.roadBase.y, 125, 38, 29, -time * 0.5, PALETTE.mint, PALETTE.gold);

        Object.values(nodes).forEach((node) => {
          drawHUDNodeBadge(ctxG, node, time);
        });
      }
    }

    // --- STAGE 1: TORNADO VORTEX FUNNEL (IMAGE 2 RECREATION) ---
    function drawTornadoVortexStream(ctx, startPt, idx, progress, time, color, glowColor, phase) {
      if (progress <= 0) return;

      const steps = 140;
      const maxSteps = Math.floor(steps * progress);

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      let headPt = startPt;
      const beadPositions = [];

      for (let step = 0; step <= maxSteps; step++) {
        const u = step / steps;
        let x, y;

        if (u < 0.22) {
          // Entry stream from bridge pillar base
          const entryT = u / 0.22;
          x = startPt.x + (680 + (idx - 2) * 120 - startPt.x) * entryT * entryT;
          y = startPt.y + (220 - startPt.y) * entryT;
        } else {
          // 3D Tornado Funnel Spiral (Wide top funnel tapering down to tight core - Image 2)
          const funnelT = (u - 0.22) / 0.78;
          const funnelY = 220 + funnelT * 420;

          // Funnel Radius Taper: 190px top down to 28px bottom core
          const funnelRadius = (190 * (1.0 - funnelT)) + 28;

          // 3D Rotation Angle around Tornado Axis
          const angle = funnelT * Math.PI * 16 + phase + time * 2.2;

          // 3D Perspective Projection (Perspective tilt)
          const rx = funnelRadius * Math.cos(angle);
          const ry = funnelRadius * Math.sin(angle) * 0.38;

          x = 680 + rx;
          y = funnelY + ry;

          // Record positions for orbiting particle beads along tornado rings (Image 2)
          if (step % 12 === 0) {
            beadPositions.push({ x, y, size: 3.5 + (1.0 - funnelT) * 2.5 });
          }
        }

        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        if (step === maxSteps) {
          headPt = { x, y };
        }
      }
      ctx.stroke();

      // Draw Orbiting Particle Beads along Tornado Funnel (Image 2)
      beadPositions.forEach(b => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Leading Snake Head Circle Dot
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headPt.x, headPt.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(headPt.x, headPt.y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- STAGE 2: SWEEPING 3D CURVED RIBBON WAVE WITH BEAD DOTS (IMAGE 1 RECREATION) ---
    function drawSweepingRibbonWave(ctx, progress, time) {
      const waypoints = [
        { x: 680, y: 640 },
        { x: 650, y: 950 },
        { x: 1080, y: 1200 },
        { x: 260, y: 1550 },
        { x: 520, y: 1950 },
        { x: 650, y: 2450 }
      ];

      const strandColors = [PALETTE.cyan, PALETTE.gold, PALETTE.rose, PALETTE.amber, PALETTE.mint];
      const strandCount = 5;
      const steps = 180;
      const maxSteps = Math.floor(steps * progress);

      for (let sIdx = 0; sIdx < strandCount; sIdx++) {
        const color = strandColors[sIdx];
        const strandPhase = sIdx * (Math.PI * 2 / strandCount);

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();

        let headPt = waypoints[0];
        const arcBeads = [];

        for (let i = 0; i <= maxSteps; i++) {
          const u = i / steps;
          const spinePt = getSplinePoint(waypoints, u);

          const nextPt = getSplinePoint(waypoints, Math.min(1.0, u + 0.01));
          const angle = Math.atan2(nextPt.y - spinePt.y, nextPt.x - spinePt.x);
          const normalAngle = angle + Math.PI / 2;

          // 3D Sweeping Arc Offset (Image 1 Style)
          const waveOffset = 36 * Math.sin(u * Math.PI * 16 + strandPhase + time * 2.8);

          const x = spinePt.x + Math.cos(normalAngle) * waveOffset;
          const y = spinePt.y + Math.sin(normalAngle) * waveOffset;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          // Collect Particle Bead dots along the 3D ribbon arc (Image 1)
          if (i % 16 === 0) {
            arcBeads.push({ x, y, r: 4.0 });
          }

          if (i === maxSteps) {
            headPt = { x, y };
          }
        }
        ctx.stroke();

        // Draw Attached Particle Beads along each arc strand (Image 1)
        arcBeads.forEach(b => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Glowing Snake Head Dot at leading edge
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 5.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 8.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Spline Interpolation through Waypoints
    function getSplinePoint(pts, u) {
      if (pts.length < 2) return pts[0];
      const n = pts.length - 1;
      const idx = Math.min(n - 1, Math.floor(u * n));
      const t = u * n - idx;

      const p0 = pts[Math.max(0, idx - 1)];
      const p1 = pts[idx];
      const p2 = pts[Math.min(n, idx + 1)];
      const p3 = pts[Math.min(n, idx + 2)];

      // Catmull-Rom Spline Formula
      const t2 = t * t;
      const t3 = t2 * t;

      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      };
    }

    function drawEpicycloidGear(ctx, cx, cy, R, r, p, rotAngle, color1, color2) {
      ctx.save();
      ctx.shadowColor = color1;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color1;
      ctx.beginPath();
      const points = 160;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2 + rotAngle;
        const x = cx + (R + r) * Math.cos(theta) - p * Math.cos(((R + r) / r) * theta);
        const y = cy + (R + r) * Math.sin(theta) - p * Math.sin(((R + r) / r) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = color2;
      ctx.shadowColor = color2;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R + 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawHUDNodeBadge(ctx, node, time) {
      const { x, y, title, code, color, glow } = node;

      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent Badge Card
      const cardW = 150;
      const cardH = 38;
      const cardX = x + 24;
      const cardY = y - 19;

      ctx.fillStyle = PALETTE.cardBg;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      roundRect(ctx, cardX, cardY, cardW, cardH, 6, true, true);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px "Inter", monospace';
      ctx.fillStyle = color;
      ctx.fillText(title, cardX + 10, cardY + 16);

      ctx.font = '9px "Inter", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(code, cardX + 10, cardY + 29);

      ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
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
