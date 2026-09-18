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

    // Update scroll wrapper height to maintain correct scrollable length (6700px)
    if (wrapper) {
      wrapper.style.height = `${6700 * currentScale}px`;
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
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.5,
    lerp: 0.08, // Ultra-smooth physics lerp across all devices!
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
  // 4. SECTION WAYPOINT MAGNET SNAPPING & DEPTH INDICATOR
  // ==========================================================================
  const scrollPercentText = document.getElementById('scroll-percent');
  const hudSceneTag = document.getElementById('hud-scene-tag');
  const navDots = document.querySelectorAll('.nav-dot');

  // Scene Waypoint Configurations (Unscaled target pixel positions & titles)
  const sceneWaypoints = [
    { num: 1, pos: 0, title: "EXHIBITION • SCENE I — THE CANOPY SKY" },
    { num: 2, pos: 1400, title: "EXHIBITION • SCENE II — HORIZON & SILHOUETTES" },
    { num: 3, pos: 2600, title: "EXHIBITION • SCENE III — THE RAILWAY BRIDGE" },
    { num: 4, pos: 3787, title: "EXHIBITION • SCENE IV — SPRAWLING CITADEL" },
    { num: 5, pos: 5000, title: "EXHIBITION • SCENE V — GOLDEN SANCTUARY REVEAL" }
  ];

  let currentActiveScene = 1;
  let lastSnapScene = 0;
  let isSnapHolding = false;

  lenis.on('scroll', (e) => {
    const scrollY = Math.max(0, e.scroll);
    const scaledTotalHeight = (6700 * currentScale) - window.innerHeight;
    const progress = Math.min(100, Math.round((scrollY / scaledTotalHeight) * 100));
    if (scrollPercentText) scrollPercentText.textContent = `${progress}%`;

    // Determine Active Scene based on scaled Y
    let detectedScene = 1;
    sceneWaypoints.forEach(wp => {
      if (scrollY >= (wp.pos - 200) * currentScale) {
        detectedScene = wp.num;
      }
    });

    // Handle 0.1s Tactile Magnetic Slowdown on arrival at any new section
    sceneWaypoints.forEach(wp => {
      const targetY = wp.pos * currentScale;
      const dist = Math.abs(scrollY - targetY);

      if (dist < 40 * currentScale && detectedScene !== lastSnapScene && !isSnapHolding) {
        lastSnapScene = detectedScene;
        isSnapHolding = true;

        // Apply 0.1s tactile magnetic slowdown lerp
        lenis.options.lerp = 0.032;
        setTimeout(() => {
          lenis.options.lerp = 0.08;
          isSnapHolding = false;
        }, 140);

        // Flash glowing ring pulse on active nav dot
        const activeDot = document.querySelector(`.nav-dot[data-scene="${detectedScene}"]`);
        if (activeDot) {
          activeDot.classList.remove('active-snap');
          void activeDot.offsetWidth; // Trigger reflow for restart
          activeDot.classList.add('active-snap');
        }

        // Highlight HUD Scene Tag
        if (hudSceneTag) {
          const wpData = sceneWaypoints.find(w => w.num === detectedScene);
          if (wpData) hudSceneTag.textContent = wpData.title;
          hudSceneTag.classList.add('scene-highlight');
          setTimeout(() => hudSceneTag.classList.remove('scene-highlight'), 600);
        }
      }
    });

    if (detectedScene !== currentActiveScene) {
      currentActiveScene = detectedScene;

      navDots.forEach(dot => {
        const sceneNum = parseInt(dot.dataset.scene, 10);
        dot.classList.toggle('active', sceneNum === currentActiveScene);
      });

      const activeWp = sceneWaypoints.find(w => w.num === currentActiveScene);
      if (hudSceneTag && activeWp) {
        hudSceneTag.textContent = activeWp.title;
      }
    }
  });

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sceneNum = parseInt(dot.dataset.scene, 10);
      const wp = sceneWaypoints.find(w => w.num === sceneNum);
      const targetY = (wp ? wp.pos : 0) * currentScale;
      lenis.scrollTo(targetY, { duration: 1.6 });
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

  // Vignette Atmospheric Frame Overlay Parallax for Train & Bridge Pillars Area
  gsap.fromTo('#bridge-vignette-overlay',
    { opacity: 0.2, y: 60 },
    {
      opacity: 0.95,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(2200),
        end: s(3800),
        scrub: 0.8,
      }
    }
  );

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
  );  // ==========================================================================
  // 5A. SECTION 5: MANUAL LINE-BY-LINE SKETCH & WATER-DROP COLOR REVEAL ENGINE
  // ==========================================================================
  const s5Canvas = document.getElementById('section-5-canvas');

  if (s5Canvas) {
    const ctx5 = s5Canvas.getContext('2d');
    const cw = 1440;
    const ch = 900;
    s5Canvas.width = cw;
    s5Canvas.height = ch;

    // Offscreen Canvas Buffer for Line-by-Line Sketch Masking
    const sketchMaskCanvas = document.createElement('canvas');
    sketchMaskCanvas.width = cw;
    sketchMaskCanvas.height = ch;
    const sketchMaskCtx = sketchMaskCanvas.getContext('2d');

    // Offscreen Canvas Buffer for Masking Fluid Droplets
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = cw;
    maskCanvas.height = ch;
    const maskCtx = maskCanvas.getContext('2d');

    // Offscreen Temp Color Image Buffer
    const colorBufCanvas = document.createElement('canvas');
    colorBufCanvas.width = cw;
    colorBufCanvas.height = ch;
    const colorBufCtx = colorBufCanvas.getContext('2d');

    // Offscreen Temp Sketch Image Buffer
    const sketchBufCanvas = document.createElement('canvas');
    sketchBufCanvas.width = cw;
    sketchBufCanvas.height = ch;
    const sketchBufCtx = sketchBufCanvas.getContext('2d');

    // Load Image Pair
    const imgSketch = new Image();
    const imgColor = new Image();
    let sketchLoaded = false;
    let colorLoaded = false;

    imgSketch.src = 'images from figma/section 5 sketch.png';
    imgColor.src = 'images from figma/section 5 color.png';

    imgSketch.onload = () => { sketchLoaded = true; checkAndDrawS5(); };
    imgColor.onload = () => { colorLoaded = true; checkAndDrawS5(); };

    // Structural Vector Contour Paths for Live Hand-Drawn Sketching (Scaled to 1440x900)
    const contourPaths = [
      // Group 1: Sky Flying Birds & Seagulls
      { startT: 0.00, duration: 0.18, pts: [{ x: 440, y: 160 }, { x: 480, y: 100 }, { x: 540, y: 140 }, { x: 590, y: 110 }, { x: 650, y: 170 }] },
      { startT: 0.05, duration: 0.18, pts: [{ x: 800, y: 180 }, { x: 850, y: 140 }, { x: 910, y: 160 }, { x: 960, y: 140 }, { x: 1040, y: 190 }] },
      { startT: 0.10, duration: 0.15, pts: [{ x: 320, y: 250 }, { x: 350, y: 230 }, { x: 390, y: 260 }, { x: 430, y: 240 }, { x: 470, y: 270 }] },

      // Group 2: Cathedral Spire & Dome Architecture
      { startT: 0.12, duration: 0.22, pts: [{ x: 1150, y: 620 }, { x: 1150, y: 480 }, { x: 1150, y: 340 }, { x: 1155, y: 240 }, { x: 1155, y: 160 }] },
      { startT: 0.18, duration: 0.20, pts: [{ x: 1010, y: 570 }, { x: 1070, y: 520 }, { x: 1120, y: 490 }, { x: 1150, y: 480 }, { x: 1200, y: 510 }, { x: 1290, y: 560 }] },
      { startT: 0.22, duration: 0.18, pts: [{ x: 870, y: 590 }, { x: 930, y: 560 }, { x: 990, y: 540 }, { x: 1050, y: 570 }, { x: 1120, y: 590 }] },

      // Group 3: River Arch Bridge & Railings
      { startT: 0.25, duration: 0.25, pts: [{ x: 170, y: 710 }, { x: 370, y: 690 }, { x: 570, y: 680 }, { x: 770, y: 690 }, { x: 970, y: 700 }, { x: 1170, y: 720 }] },
      { startT: 0.30, duration: 0.22, pts: [{ x: 190, y: 670 }, { x: 400, y: 650 }, { x: 610, y: 640 }, { x: 820, y: 650 }, { x: 1030, y: 670 }] },
      { startT: 0.35, duration: 0.18, pts: [{ x: 370, y: 750 }, { x: 380, y: 690 }, { x: 390, y: 750 }] },
      { startT: 0.38, duration: 0.18, pts: [{ x: 770, y: 750 }, { x: 780, y: 690 }, { x: 790, y: 750 }] },

      // Group 4: Left Riverside Bare Trees & Branches
      { startT: 0.15, duration: 0.25, pts: [{ x: 40, y: 850 }, { x: 60, y: 680 }, { x: 80, y: 540 }, { x: 100, y: 410 }, { x: 110, y: 300 }] },
      { startT: 0.20, duration: 0.20, pts: [{ x: 80, y: 540 }, { x: 140, y: 480 }, { x: 200, y: 450 }, { x: 250, y: 440 }] },
      { startT: 0.24, duration: 0.20, pts: [{ x: 100, y: 410 }, { x: 40, y: 360 }, { x: 10, y: 340 }] },

      // Group 5: River Surface & Promenade Edge
      { startT: 0.32, duration: 0.25, pts: [{ x: 0, y: 790 }, { x: 270, y: 800 }, { x: 580, y: 810 }, { x: 900, y: 820 }, { x: 1440, y: 850 }] },
      { startT: 0.40, duration: 0.22, pts: [{ x: 210, y: 840 }, { x: 480, y: 850 }, { x: 740, y: 860 }, { x: 1060, y: 870 }] }
    ];

    // Droplet Impact Configurations for Phase 2 Fluid Color Bloom (Scaled to 1440x900)
    const droplets = [
      { x: 1155, y: 210, startProgress: 0.0, maxR: 620 },
      { x: 470, y: 680, startProgress: 0.08, maxR: 580 },
      { x: 910, y: 160, startProgress: 0.16, maxR: 600 },
      { x: 630, y: 810, startProgress: 0.26, maxR: 560 },
      { x: 1060, y: 130, startProgress: 0.36, maxR: 570 },
      { x: 110, y: 300, startProgress: 0.46, maxR: 540 },
      { x: 370, y: 850, startProgress: 0.56, maxR: 580 },
      { x: 1270, y: 650, startProgress: 0.66, maxR: 590 },
      { x: 790, y: 410, startProgress: 0.76, maxR: 640 },
      { x: 720, y: 450, startProgress: 0.86, maxR: 800 }
    ];

    let s5TargetProgress = 0;
    let s5LerpProgress = 0;

    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(5000),
      end: s(6200),
      scrub: true,
      onUpdate: (self) => {
        s5TargetProgress = self.progress;
      }
    });

    function s5Loop() {
      s5LerpProgress += (s5TargetProgress - s5LerpProgress) * 0.08;

      // Exact Zero-Lag Viewport Pinning (Stays 100% stationary without any lerp lag or double-transform bugs!)
      const currentScrollY = lenis ? lenis.actualScroll : (window.scrollY || 0);
      const scaledPinStart = 5000 * currentScale;
      const scaledPinEnd = 6200 * currentScale;

      let targetPinY = 0;
      if (currentScrollY >= scaledPinStart && currentScrollY <= scaledPinEnd) {
        targetPinY = (currentScrollY - scaledPinStart) / currentScale;
      } else if (currentScrollY > scaledPinEnd) {
        targetPinY = (scaledPinEnd - scaledPinStart) / currentScale;
      }

      s5Canvas.style.position = 'absolute';
      s5Canvas.style.top = '5000px';
      s5Canvas.style.left = '0px';
      s5Canvas.style.transform = `translateY(${targetPinY}px)`;

      checkAndDrawS5();
      requestAnimationFrame(s5Loop);
    }
    requestAnimationFrame(s5Loop);

    function checkAndDrawS5() {
      if (!sketchLoaded || !colorLoaded) return;
      renderSection5(s5LerpProgress);
    }

    function renderSection5(progress) {
      ctx5.clearRect(0, 0, cw, ch);

      // Phase 1: Manual Hand-Drawn Sketching (Progress 0.0 -> 0.45)
      const sketchProg = Math.min(1.0, progress / 0.45);

      // Phase 2: Water Drop Fluid Color Reveal (Progress 0.40 -> 1.0)
      const fluidProg = Math.max(0.0, (progress - 0.40) / 0.60);

      // 1. RENDER MANUAL LINE-BY-LINE HAND SKETCHING
      sketchMaskCtx.clearRect(0, 0, cw, ch);

      if (sketchProg < 1.0) {
        // Draw progressive stroke lines along contour paths
        contourPaths.forEach((path) => {
          if (sketchProg >= path.startT) {
            const pathProg = Math.min(1.0, (sketchProg - path.startT) / path.duration);
            const totalPts = path.pts.length;
            const currentIdx = Math.floor(pathProg * (totalPts - 1));
            const subT = (pathProg * (totalPts - 1)) - currentIdx;

            // Draw organic line stroke reveal mask
            sketchMaskCtx.save();
            sketchMaskCtx.lineCap = 'round';
            sketchMaskCtx.lineJoin = 'round';
            sketchMaskCtx.lineWidth = 110 * (0.3 + pathProg * 0.7);
            sketchMaskCtx.fillStyle = '#000000';
            sketchMaskCtx.strokeStyle = '#000000';
            sketchMaskCtx.beginPath();

            for (let i = 0; i <= currentIdx; i++) {
              const pt = path.pts[i];
              if (i === 0) sketchMaskCtx.moveTo(pt.x, pt.y);
              else sketchMaskCtx.lineTo(pt.x, pt.y);
            }

            if (currentIdx < totalPts - 1) {
              const pA = path.pts[currentIdx];
              const pB = path.pts[currentIdx + 1];
              const curX = pA.x + (pB.x - pA.x) * subT;
              const curY = pA.y + (pB.y - pA.y) * subT;
              sketchMaskCtx.lineTo(curX, curY);
            }
            sketchMaskCtx.stroke();
            sketchMaskCtx.restore();
          }
        });

        // Background base reveal radius expanding with overall sketch progress
        sketchMaskCtx.save();
        const baseR = sketchProg * cw * 0.65;
        const radG = sketchMaskCtx.createRadialGradient(cw * 0.5, ch * 0.5, 0, cw * 0.5, ch * 0.5, baseR);
        radG.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        radG.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
        radG.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sketchMaskCtx.fillStyle = radG;
        sketchMaskCtx.fillRect(0, 0, cw, ch);
        sketchMaskCtx.restore();

        // Mask sketch image with progressive line drawing mask
        sketchBufCtx.clearRect(0, 0, cw, ch);
        sketchBufCtx.drawImage(imgSketch, 0, 0, cw, ch);
        sketchBufCtx.globalCompositeOperation = 'destination-in';
        sketchBufCtx.drawImage(sketchMaskCanvas, 0, 0, cw, ch);
        sketchBufCtx.globalCompositeOperation = 'source-over';

        ctx5.drawImage(sketchBufCanvas, 0, 0, cw, ch);

        // Draw active pencil tip dots along leading line strokes
        contourPaths.forEach((path) => {
          if (sketchProg >= path.startT && sketchProg <= path.startT + path.duration) {
            const pathProg = (sketchProg - path.startT) / path.duration;
            const totalPts = path.pts.length;
            const currentIdx = Math.min(totalPts - 2, Math.floor(pathProg * (totalPts - 1)));
            const subT = (pathProg * (totalPts - 1)) - currentIdx;
            const pA = path.pts[currentIdx];
            const pB = path.pts[currentIdx + 1];
            const tipX = pA.x + (pB.x - pA.x) * subT;
            const tipY = pA.y + (pB.y - pA.y) * subT;

            ctx5.save();
            ctx5.shadowColor = '#d4af37';
            ctx5.shadowBlur = 12;
            ctx5.fillStyle = '#1c1b18';
            ctx5.beginPath();
            ctx5.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
            ctx5.fill();

            ctx5.fillStyle = '#d4af37';
            ctx5.beginPath();
            ctx5.arc(tipX, tipY, 2.0, 0, Math.PI * 2);
            ctx5.fill();
            ctx5.restore();
          }
        });

      } else {
        // Full sketch complete
        ctx5.drawImage(imgSketch, 0, 0, cw, ch);
      }

      // 2. RENDER FLUID WATER DROP COLOR BLOOM REVEAL
      if (fluidProg > 0.0) {
        maskCtx.clearRect(0, 0, cw, ch);

        // Render expanding organic watercolor blobs onto maskCtx
        droplets.forEach((d) => {
          if (fluidProg >= d.startProgress) {
            const dropAge = (fluidProg - d.startProgress) / (1.0 - d.startProgress);
            const currentR = Math.pow(dropAge, 0.72) * d.maxR;

            maskCtx.save();
            const radGrad = maskCtx.createRadialGradient(d.x, d.y, currentR * 0.25, d.x, d.y, currentR);
            radGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
            radGrad.addColorStop(0.78, 'rgba(0, 0, 0, 0.92)');
            radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            maskCtx.fillStyle = radGrad;
            maskCtx.beginPath();

            const points = 28;
            for (let i = 0; i <= points; i++) {
              const angle = (i / points) * Math.PI * 2;
              const wobble = Math.sin(angle * 6 + fluidProg * 14) * (currentR * 0.05);
              const r = currentR + wobble;
              const px = d.x + Math.cos(angle) * r;
              const py = d.y + Math.sin(angle) * r;
              if (i === 0) maskCtx.moveTo(px, py);
              else maskCtx.lineTo(px, py);
            }
            maskCtx.closePath();
            maskCtx.fill();
            maskCtx.restore();

            // Splash rings for newly landed water drops
            if (dropAge < 0.22) {
              const splashRingR = dropAge * 4.5 * 60;
              const ringAlpha = (1.0 - dropAge * 4.5);
              ctx5.save();
              ctx5.strokeStyle = `rgba(212, 175, 55, ${ringAlpha * 0.85})`;
              ctx5.lineWidth = 2.2;
              ctx5.beginPath();
              ctx5.arc(d.x, d.y, splashRingR, 0, Math.PI * 2);
              ctx5.stroke();
              ctx5.restore();
            }
          }
        });

        // Composite Color Image with Fluid Mask
        colorBufCtx.clearRect(0, 0, cw, ch);
        colorBufCtx.drawImage(imgColor, 0, 0, cw, ch);
        colorBufCtx.globalCompositeOperation = 'destination-in';
        colorBufCtx.drawImage(maskCanvas, 0, 0, cw, ch);
        colorBufCtx.globalCompositeOperation = 'source-over';

        // Render Color Artwork over Hand-Drawn Sketch
        ctx5.drawImage(colorBufCanvas, 0, 0, cw, ch);
      }
    }
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

    // Exact Custom Color Palette (Updated by User)
    const PALETTE = {
      cyan: '#414219ff',
      cyanGlow: 'rgba(65, 66, 25, 0.95)',
      gold: '#412c06ff',
      goldGlow: 'rgba(71, 45, 1, 0.95)',
      rose: '#485304ff',
      roseGlow: 'rgba(72, 83, 4, 0.9)',
      amber: '#503104ff',
      amberGlow: 'rgba(80, 49, 4, 0.9)',
      mint: '#3e4105ff',
      mintGlow: 'rgba(102, 91, 6, 0.9)',
      cardBg: 'rgba(6, 16, 32, 0.88)'
    };
    let geomTargetProgress = 0;
    let geomLerpProgress = 0;

    // ScrollTrigger starts 0.52s faster / earlier (start: s(2100))
    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(2100),
      end: s(6600),
      scrub: true,
      onUpdate: (self) => {
        geomTargetProgress = self.progress;
      }
    });

    // 100% SCROLL-DRIVEN LOOP WITH LENIS LERP SMOOTHING (120 FPS Performance)
    function geomLoop() {
      geomLerpProgress += (geomTargetProgress - geomLerpProgress) * 0.14;

      if (Math.abs(geomTargetProgress - geomLerpProgress) > 0.0001) {
        drawMathematicalGeometry(geomLerpProgress);
      } else {
        drawMathematicalGeometry(geomTargetProgress);
      }

      requestAnimationFrame(geomLoop);
    }
    requestAnimationFrame(geomLoop);

    function drawMathematicalGeometry(progress) {
      ctxG.clearRect(0, 0, geomCanvas.width, geomCanvas.height);

      const pathProgress = Math.min(1.0, progress * 1.35);

      // Scroll-derived motion value (moves ONLY when user scrolls!)
      const scrollMotion = progress * Math.PI * 10;

      // ------------------------------------------------------------------------
      // 1. ORGANIC TENDRIL VORTEX & CONSTELLATION STREAM (MATCHING REFERENCE IMAGE!)
      // 12 Fine Organic Tendril Threads with Micro-Dots Spiraling into a Tight Core
      // ------------------------------------------------------------------------
      if (pathProgress > 0.02) {
        drawOrganicTendrilVortexStream(ctxG, pathProgress, scrollMotion);
      }

      // ------------------------------------------------------------------------
      // 2. FOCAL RETICLE NODES & HUD BADGE CARDS
      // ------------------------------------------------------------------------
      const nodes = {
        citadel: { x: 1060, y: 1200, title: "CITADEL APEX", code: "3787px • 42.8° N", color: PALETTE.gold, glow: PALETTE.goldGlow },
        minaretLeft: { x: 160, y: 1600, title: "MINARET SPIRE", code: "4900px • 18.4° E", color: PALETTE.rose, glow: PALETTE.roseGlow },
        skyline: { x: 1280, y: 1650, title: "EUROPEAN DOME", code: "4950px • 64.2° W", color: PALETTE.cyan, glow: PALETTE.cyanGlow },
        roadBase: { x: 650, y: 2450, title: "ROAD BASE", code: "5900px • ELEV 0m", color: PALETTE.mint, glow: PALETTE.mintGlow }
      };

      if (pathProgress > 0.35) {
        drawEpicycloidGear(ctxG, nodes.citadel.x, nodes.citadel.y, 130, 39, 30, scrollMotion * 0.4, PALETTE.gold, PALETTE.cyan);
        drawEpicycloidGear(ctxG, nodes.minaretLeft.x, nodes.minaretLeft.y, 120, 36, 28, -scrollMotion * 0.5, PALETTE.rose, PALETTE.amber);
        drawEpicycloidGear(ctxG, nodes.skyline.x, nodes.skyline.y, 135, 40, 32, scrollMotion * 0.45, PALETTE.cyan, PALETTE.mint);
        drawEpicycloidGear(ctxG, nodes.roadBase.x, nodes.roadBase.y, 125, 38, 29, -scrollMotion * 0.35, PALETTE.mint, PALETTE.gold);

        Object.values(nodes).forEach((node) => {
          drawHUDNodeBadge(ctxG, node);
        });
      }
    }

    // --- ORGANIC TENDRIL VORTEX & CONSTELLATION STREAM (3 LINES ONLY) ---
    function drawOrganicTendrilVortexStream(ctx, progress, scrollMotion) {
      const paletteColors = [PALETTE.gold, PALETTE.rose, PALETTE.mint];
      const paletteGlows = [PALETTE.goldGlow, PALETTE.roseGlow, PALETTE.mintGlow];

      const tendrilCount = 3; // Reduced to exactly 3 elegant lines
      const waypoints = [
        { x: 680, y: 640 },
        { x: 650, y: 950 },
        { x: 1080, y: 1200 },
        { x: 260, y: 1550 },
        { x: 520, y: 1950 },
        { x: 650, y: 2450 }
      ];

      const totalSteps = 220;
      const maxSteps = Math.floor(totalSteps * progress);

      ctx.save();

      // Render 3 Elegant Organic Tendril Threads
      for (let t = 0; t < tendrilCount; t++) {
        const color = paletteColors[t % paletteColors.length];
        const glow = paletteGlows[t % paletteGlows.length];
        const phase = (t / tendrilCount) * Math.PI * 2;

        ctx.shadowColor = glow;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = color;

        const pathPoints = [];

        for (let step = 0; step <= maxSteps; step++) {
          const u = step / totalSteps;
          let x, y, z = 0;

          if (u < 0.40) {
            // STAGE 1: Top Dynamic Fanned Horns & Vortex Funnel (Matching Reference Image!)
            const funnelT = u / 0.40;
            const cy = 165 + funnelT * (640 - 165);

            // Radius tapers from wide fanned horns (220px) down to tight core (20px)
            const radius = (220 * Math.pow(1.0 - funnelT, 1.2)) + 20;
            const ry = radius * 0.38;

            // Spiral twist angle
            const angle = funnelT * Math.PI * 6 + phase + scrollMotion * 0.6;
            z = Math.sin(angle);

            // Wing flare out at top (matching reference image horns!)
            const wingFlare = Math.pow(1.0 - funnelT, 2.0) * 80 * Math.sin(phase * 2);

            x = 680 + Math.cos(angle) * radius + wingFlare;
            y = cy + Math.sin(angle) * ry;
          } else {
            // STAGE 2: Seamless Tendril Stream Sweep through Citadel, Minaret, and Road Base
            const sweepT = (u - 0.40) / 0.60;
            const spinePt = getSplinePoint(waypoints, sweepT);
            const nextPt = getSplinePoint(waypoints, Math.min(1.0, sweepT + 0.015));
            const angle = Math.atan2(nextPt.y - spinePt.y, nextPt.x - spinePt.x);
            const normalAngle = angle + Math.PI / 2;

            const strandOffset = (28 * Math.sin(sweepT * Math.PI * 10 + phase + scrollMotion * 0.5)
              + 12 * Math.cos(sweepT * Math.PI * 16 - scrollMotion * 0.3)) * (0.4 + (t % 4) * 0.25);

            x = spinePt.x + Math.cos(normalAngle) * strandOffset;
            y = spinePt.y + Math.sin(normalAngle) * strandOffset;
          }

          pathPoints.push({ x, y, z });
        }

        if (pathPoints.length < 2) continue;

        // 1. Render Fine Tendril Thread Line (Matching Reference Image Thin Strokes!)
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.1 + (t % 3) * 0.3; // Fine 1.1px - 1.7px stroke
        ctx.beginPath();
        pathPoints.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // 2. Render Solid Micro-Dots along Tendril Thread (Matching Reference Image Dots!)
        ctx.globalAlpha = 0.95;
        pathPoints.forEach((p, i) => {
          if ((i + t * 3) % 9 === 0) {
            // Dynamic micro-dot radius (1.2px to 2.8px)
            const dotRadius = 1.3 + Math.sin(i * 0.2 + phase) * 1.3;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      ctx.restore();
    }

    // --- COMPASS TARGET RETICLE WITH SCROLL-DRIVEN AZIMUTH TICKS ---
    function drawCompassTargetReticle(ctx, x, y, color, scrollMotion) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 1.0;

      // Outer Compass Ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, 11.5, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Azimuth Ticks (Driven 100% by scrollMotion!)
      ctx.lineWidth = 1.1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
        const rotA = a + scrollMotion * 0.4;
        const x1 = x + Math.cos(rotA) * 9;
        const y1 = y + Math.sin(rotA) * 9;
        const x2 = x + Math.cos(rotA) * 15;
        const y2 = y + Math.sin(rotA) * 15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center Core White & Color Dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
      ctx.lineWidth = 1.6;
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

      // Outer Pitch Circle with Degree Tick Marks
      ctx.strokeStyle = color2;
      ctx.shadowColor = color2;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R + 18, 0, Math.PI * 2);
      ctx.stroke();

      // Degree Ticks
      ctx.setLineDash([]);
      ctx.lineWidth = 1.2;
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg * Math.PI) / 180 + rotAngle * 0.5;
        const x1 = cx + Math.cos(rad) * (R + 15);
        const y1 = cy + Math.sin(rad) * (R + 15);
        const x2 = cx + Math.cos(rad) * (R + 22);
        const y2 = cy + Math.sin(rad) * (R + 22);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawHUDNodeBadge(ctx, node) {
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

      // Translucent Glassmorphic Badge Card
      const cardW = 155;
      const cardH = 40;
      const cardX = x + 24;
      const cardY = y - 20;

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
      ctx.fillText(code, cardX + 10, cardY + 30);

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

  // ==========================================================================
  // 7. ABSOLUTE BOTTOM TERMINAL: PARALLAX STRETCH ARROW & TEXT HANDLERS
  // ==========================================================================
  const endArrowWrap = document.getElementById('end-arrow-wrap');
  const endScrollText = document.getElementById('end-scroll-text');

  const scrollToTop = () => {
    lenis.scrollTo(0, { immediate: false, duration: 2.2 });
  };

  if (endArrowWrap) endArrowWrap.addEventListener('click', scrollToTop);
  if (endScrollText) endScrollText.addEventListener('click', scrollToTop);

  // Parallax Vertical Stretch & Float for Upward Arrow
  gsap.fromTo('#end-arrow-svg',
    { scaleY: 0.6, y: 60, opacity: 0.2 },
    {
      scaleY: 1.5,
      y: -30,
      opacity: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(5600),
        end: s(6600),
        scrub: 0.8,
      }
    }
  );

  // Terminal Section Parallax Entrance
  gsap.fromTo('#terminal-end-section',
    { opacity: 0, y: 80 },
    {
      opacity: 1,
      y: -20,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(5600),
        end: s(6600),
        scrub: 0.8,
      }
    }
  );

});
