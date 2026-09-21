/* ==========================================================================
   THE GRAND VISTA — PARALLAX ENGINE & ANIMATION LOGIC (PAINTER'S EDITION)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger);

  // Clear any stale scroll memory from previous session to prevent GSAP state flash on refresh
  ScrollTrigger.clearScrollMemory();
  window.history.scrollRestoration = 'manual'; // Prevents browser from restoring scroll on refresh

  // ==========================================================================
  // 0. AUTOFIT SCREEN SCALING LOGIC
  // ==========================================================================
  let currentScale = 1;
  let lastWidth = 0;
  const wrapper = document.querySelector('.scroll-wrapper');

  function updateScale() {
    const newWidth = window.innerWidth;
    if (newWidth === lastWidth && lastWidth !== 0) return;
    lastWidth = newWidth;

    // Calculate scale factor to fit exactly 1440px wide canvas into current window width
    currentScale = newWidth / 1440;

    // Set CSS variable for transform: scale()
    document.documentElement.style.setProperty('--scale', currentScale);

    // Update scroll wrapper height to maintain correct scrollable length (7100px)
    if (wrapper) {
      wrapper.style.height = `${7100 * currentScale}px`;
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
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);

  const lenis = new Lenis({
    duration: isTouchDevice ? 1.2 : 2.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.42,
    touchMultiplier: isTouchDevice ? 1.8 : 0.9,
    lerp: isTouchDevice ? 0.09 : 0.04, // Museum-grade smooth physics lerp (responsive touch lerp)
    syncTouch: true,
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
      scrub: 1.2,
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

  // Big App Hero Title ("THE GRAND VISTA") fades from 100% to 0% opacity as clouds part (0 to 600px)
  gsap.fromTo('#hero-grand-title',
    { opacity: 1.0, y: 0 },
    {
      opacity: 0,
      y: -80,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: 'top top',
        end: s(600),
        scrub: 1.0,
      }
    }
  );

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

  // Throttled scroll handler — batch DOM writes to once per RAF frame to avoid layout thrash
  let scrollRafPending = false;
  lenis.on('scroll', (e) => {
    if (!scrollRafPending) {
      scrollRafPending = true;
      requestAnimationFrame(() => {
        scrollRafPending = false;
        const scrollY = Math.max(0, e.scroll);
        const scaledTotalHeight = (7100 * currentScale) - window.innerHeight;
        const progress = Math.min(100, Math.round((scrollY / scaledTotalHeight) * 100));
        if (scrollPercentText) scrollPercentText.textContent = `${progress}%`;

        // Determine Active Scene based on scaled Y
        let detectedScene = 1;
        sceneWaypoints.forEach(wp => {
          if (scrollY >= (wp.pos - 200) * currentScale) {
            detectedScene = wp.num;
          }
        });

        // Handle Tactile Magnetic Slowdown on arrival at any new section
        sceneWaypoints.forEach(wp => {
          const targetY = wp.pos * currentScale;
          const dist = Math.abs(scrollY - targetY);

          if (dist < 60 * currentScale && detectedScene !== lastSnapScene && !isSnapHolding) {
            lastSnapScene = detectedScene;
            isSnapHolding = true;

            lenis.options.lerp = 0.025;
            setTimeout(() => {
              lenis.options.lerp = 0.05;
              isSnapHolding = false;
            }, 280);

            const activeDot = document.querySelector(`.nav-dot[data-scene="${detectedScene}"]`);
            if (activeDot) {
              activeDot.classList.remove('active-snap');
              void activeDot.offsetWidth;
              activeDot.classList.add('active-snap');
            }

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
      immediateRender: false,
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
      immediateRender: false,
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
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(1000),
        end: s(2200),
        scrub: 1,
      }
    }
  );

  // Scene II Containerless Typography Float Reveal
  gsap.fromTo('#scene-2-text-block',
    { y: 80, opacity: 0 },
    {
      y: -30,
      opacity: 1.0,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(1200),
        end: s(2200),
        scrub: 1.0,
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
    { opacity: 1.0, rotate: 180, y: 60 },
    {
      opacity: 1.0,
      rotate: 180,
      y: -60,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(2200),
        end: s(3800),
        scrub: 0.8,
      }
    }
  );

  // --- SCENE 4 PARALLAX: CITADEL ARCHITECTURE & CONTAINERLESS TYPOGRAPHY (Y: 3100 - 5200) ---
  // 1. Building Cluster Mixed (Background architecture layer with atmospheric depth)
  gsap.fromTo('#building-cluster-mixed',
    { y: 180, scale: 0.92, opacity: 0.15 },
    {
      y: -30,
      scale: 1.02,
      opacity: 1.0,
      ease: 'power1.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3100),
        end: s(4400),
        scrub: 1.2,
      }
    }
  );

  // 2. Building Cluster Large (Foreground architecture layer with 3D scale entrance)
  gsap.fromTo('#building-cluster-large',
    { y: 220, scale: 0.92, opacity: 0.2 },
    {
      y: -80,
      scale: 1.06,
      opacity: 1.0,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3300),
        end: s(4600),
        scrub: 1.0,
      }
    }
  );

  // 3. Containerless Dark Brown Typography Float Reveal (Right Side Open Space)
  gsap.fromTo('#scene-4-text-block',
    { y: 110, x: 30, opacity: 0 },
    {
      y: -20,
      x: 0,
      opacity: 1.0,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3400),
        end: s(4400),
        scrub: 1.0,
      }
    }
  );

  // 4. Dark Atmosphere Transition Band (Statically covers background seam at 5548px with 100% solid opacity)
  gsap.fromTo('#atmosphere-band',
    { opacity: 1.0, y: 0 },
    {
      opacity: 1.0,
      y: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4200),
        end: s(5800),
        scrub: 1.0,
      }
    }
  );  // ==========================================================================
  // 5A. SECTION 5: MANUAL LINE-BY-LINE SKETCH & WATER-DROP COLOR REVEAL ENGINE
  // ==========================================================================
  const s5Canvas = document.getElementById('section-5-canvas');

  if (s5Canvas) {
    const ctx5 = s5Canvas.getContext('2d');
    const cw = 1480;
    const ch = 925;
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

    imgSketch.src = 'images/section-5-sketch.png';
    imgColor.src = 'images/section-5-color.png';

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
      end: s(6600),
      scrub: true,
      onUpdate: (self) => {
        s5TargetProgress = self.progress;
      }
    });

    let s5Running = false;
    let s5RafId = null;

    function startS5Loop() {
      if (s5Running) return;
      s5Running = true;
      s5Loop();
    }

    function stopS5Loop() {
      s5Running = false;
      if (s5RafId) {
        cancelAnimationFrame(s5RafId);
        s5RafId = null;
      }
    }

    function s5Loop() {
      if (!s5Running) return;
      s5LerpProgress += (s5TargetProgress - s5LerpProgress) * 0.08;

      // Exact Zero-Lag Viewport Pinning (Stays 100% stationary without any lerp lag or double-transform bugs!)
      const currentScrollY = lenis ? lenis.actualScroll : (window.scrollY || 0);
      const scaledPinStart = 5000 * currentScale;
      const scaledPinEnd = 6600 * currentScale;

      let targetPinY = 0;
      if (currentScrollY >= scaledPinStart && currentScrollY <= scaledPinEnd) {
        targetPinY = (currentScrollY - scaledPinStart) / currentScale;
      } else if (currentScrollY > scaledPinEnd) {
        targetPinY = (scaledPinEnd - scaledPinStart) / currentScale;
      }

      s5Canvas.style.position = 'absolute';
      s5Canvas.style.top = '5000px';
      s5Canvas.style.left = '-23px';
      s5Canvas.style.transform = `translateY(${targetPinY}px)`;

      checkAndDrawS5();
      s5RafId = requestAnimationFrame(s5Loop);
    }

    const s5Observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startS5Loop();
        } else {
          stopS5Loop();
        }
      });
    }, { rootMargin: '300px 0px 300px 0px' });
    s5Observer.observe(s5Canvas);
    startS5Loop();

    function checkAndDrawS5() {
      if (!sketchLoaded || !colorLoaded) return;
      renderSection5(s5LerpProgress);
    }

    function renderSection5(progress) {
      ctx5.clearRect(0, 0, cw, ch);

      // Phase 1: Manual Hand-Drawn Sketching (Progress 0.0 -> 0.70) - Expanded for 2.5x longer pencil tracing!
      const sketchProg = Math.min(1.0, progress / 0.70);

      // Phase 2: Water Drop Fluid Color Reveal (Progress 0.55 -> 1.0)
      const fluidProg = Math.max(0.0, (progress - 0.55) / 0.45);

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

    // Dirty-flag system: track last drawn progress to skip identical redraws
    let geomLastDrawnProgress = -1;

    let geomRunning = false;
    let geomRafId = null;

    function startGeomLoop() {
      if (geomRunning) return;
      geomRunning = true;
      geomLoop();
    }

    function stopGeomLoop() {
      geomRunning = false;
      if (geomRafId) {
        cancelAnimationFrame(geomRafId);
        geomRafId = null;
      }
    }

    // 100% SCROLL-DRIVEN LOOP WITH LENIS LERP SMOOTHING (120 FPS Performance)
    function geomLoop() {
      if (!geomRunning) return;
      geomLerpProgress += (geomTargetProgress - geomLerpProgress) * 0.14;

      // Only redraw if progress has meaningfully changed (saves ~40ms/frame when idle)
      const drawProgress = Math.abs(geomTargetProgress - geomLerpProgress) > 0.0001
        ? geomLerpProgress
        : geomTargetProgress;

      if (Math.abs(drawProgress - geomLastDrawnProgress) > 0.00035) {
        geomLastDrawnProgress = drawProgress;
        drawMathematicalGeometry(drawProgress);
      }

      geomRafId = requestAnimationFrame(geomLoop);
    }

    const geomObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startGeomLoop();
        } else {
          stopGeomLoop();
        }
      });
    }, { rootMargin: '300px 0px 300px 0px' });
    geomObserver.observe(geomCanvas);
    startGeomLoop();

    // ------------------------------------------------------------------------
    // SACRED GEOMETRY: GOLDEN RATIO FIBONACCI BLUEPRINT & CELESTIAL STARDUST ENGINE
    // (100% Matching User Reference Image in Dark Brown Theme Palette!)
    // ------------------------------------------------------------------------

    // Pre-calculate Spline Path for the 3 Connecting Vector Lines
    const pathNodes = [
      { x: 720, y: 150 },
      { x: 1330, y: 1100 },
      { x: 180, y: 1850 },
      { x: 1140, y: 2600 },
      { x: 720, y: 3200 }
    ];

    function getCatmullRomPoint(p0, p1, p2, p3, t) {
      const t2 = t * t;
      const t3 = t2 * t;
      const f0 = -0.5 * t3 + t2 - 0.5 * t;
      const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
      const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
      const f3 = 0.5 * t3 - 0.5 * t2;
      return {
        x: f0 * p0.x + f1 * p1.x + f2 * p2.x + f3 * p3.x,
        y: f0 * p0.y + f1 * p1.y + f2 * p2.y + f3 * p3.y
      };
    }

    const isMobileDevice = (window.innerWidth <= 768) || ('ontouchstart' in window);
    const splinePoints = [];
    const stepsPerSeg = isMobileDevice ? 40 : 80;
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const p0 = pathNodes[Math.max(0, i - 1)];
      const p1 = pathNodes[i];
      const p2 = pathNodes[i + 1];
      const p3 = pathNodes[Math.min(pathNodes.length - 1, i + 2)];

      for (let s = 0; s < stepsPerSeg; s++) {
        const t = s / stepsPerSeg;
        splinePoints.push(getCatmullRomPoint(p0, p1, p2, p3, t));
      }
    }
    splinePoints.push(pathNodes[pathNodes.length - 1]);

    // Pre-calculated Stardust Particle Array for Smooth 120 FPS Physics
    const stardustParticles = [];
    const numStardust = isMobileDevice ? 35 : 80;
    for (let i = 0; i < numStardust; i++) {
      stardustParticles.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 220 + 15,
        speed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 3.0 + 0.8,
        pulseOffset: Math.random() * Math.PI * 2,
        colorIdx: i % 3
      });
    }

    function drawConnectingLines(ctx, pathProgress, scrollMotion) {
      if (pathProgress <= 0.005) return;

      const darkBrown = '#322008';
      const medBrown = '#503104';
      const ochreBrown = '#784c0a';

      const totalPts = splinePoints.length - 1;

      // Dynamic traveling window parameters (draws and moves live with scroll)
      const headIdx = Math.min(totalPts, Math.floor(pathProgress * 1.2 * totalPts));
      const windowLen = Math.floor(totalPts * 0.38); // ~120 spline points long (~900px visible line segment)
      const startIdx = Math.max(0, headIdx - windowLen);

      if (headIdx - startIdx < 2) return;

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, pathProgress * 3.0);

      // Compute normals for offset parallel paths along active segment window
      const leftLine = [];
      const rightLine = [];
      const offsetDist = 14;

      for (let i = startIdx; i <= headIdx; i++) {
        const pt = splinePoints[i];
        let nx = 0, ny = -1;
        if (i < totalPts) {
          const nextPt = splinePoints[i + 1];
          const dx = nextPt.x - pt.x;
          const dy = nextPt.y - pt.y;
          const len = Math.hypot(dx, dy) || 1;
          nx = -dy / len;
          ny = dx / len;
        } else if (i > 0) {
          const prevPt = splinePoints[i - 1];
          const dx = pt.x - prevPt.x;
          const dy = pt.y - prevPt.y;
          const len = Math.hypot(dx, dy) || 1;
          nx = -dy / len;
          ny = dx / len;
        }

        leftLine.push({ x: pt.x + nx * offsetDist, y: pt.y + ny * offsetDist });
        rightLine.push({ x: pt.x - nx * offsetDist, y: pt.y - ny * offsetDist });
      }

      // --- 1. CENTER SPINE LINE (Solid Dark Ink with Soft Tapering) ---
      ctx.strokeStyle = darkBrown;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(50, 32, 8, 0.4)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(splinePoints[startIdx].x, splinePoints[startIdx].y);
      for (let i = startIdx + 1; i <= headIdx; i++) {
        ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
      }
      ctx.stroke();

      // --- 2. LEFT PARALLEL CONNECTING LINE (Dashed Med Brown, scrolling with travel) ---
      ctx.strokeStyle = medBrown;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -scrollMotion * 14;
      ctx.beginPath();
      ctx.moveTo(leftLine[0].x, leftLine[0].y);
      for (let i = 1; i < leftLine.length; i++) {
        ctx.lineTo(leftLine[i].x, leftLine[i].y);
      }
      ctx.stroke();

      // --- 3. RIGHT PARALLEL CONNECTING LINE (Dashed Ochre Brown, scrolling with travel) ---
      ctx.strokeStyle = ochreBrown;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = scrollMotion * 18;
      ctx.beginPath();
      ctx.moveTo(rightLine[0].x, rightLine[0].y);
      for (let i = 1; i < rightLine.length; i++) {
        ctx.lineTo(rightLine[i].x, rightLine[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // --- 4. LEADING DRAWING TIP CROSSHAIR & ARROW (Moves live with scroll) ---
      if (headIdx > 0 && headIdx < totalPts) {
        const leadPt = splinePoints[headIdx];
        const prevPt = splinePoints[Math.max(0, headIdx - 2)];
        const dirAng = Math.atan2(leadPt.y - prevPt.y, leadPt.x - prevPt.x);

        ctx.save();
        ctx.translate(leadPt.x, leadPt.y);
        ctx.rotate(dirAng);

        // Leading arrow tip
        ctx.fillStyle = darkBrown;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fill();

        // Pulsing drawing head dot
        ctx.fillStyle = ochreBrown;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = darkBrown;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 7.0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // --- 5. TRAVELING PARTICLES ALONG ACTIVE CONNECTING WINDOW ---
      const numBeads = 4;
      const segLen = headIdx - startIdx;
      for (let b = 0; b < numBeads; b++) {
        const beadFrac = ((pathProgress * 3.0 + b / numBeads) % 1.0);
        const beadIdx = Math.floor(startIdx + beadFrac * segLen);

        if (beadIdx >= startIdx && beadIdx <= headIdx && beadIdx < totalPts) {
          const pt = splinePoints[beadIdx];
          ctx.fillStyle = ochreBrown;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    function drawGoldenRatioFibonacciBlueprint(ctx, cx, cy, progress, scrollMotion, scaleFactor = 0.85) {
      ctx.save();

      const darkBrown = '#322008';
      const medBrown = '#503104';
      const ochreBrown = '#784c0a';
      const paletteColors = [darkBrown, medBrown, ochreBrown];

      // --- 1. NESTED GOLDEN RECTANGLES & GRID LINES ---
      ctx.strokeStyle = darkBrown;
      ctx.shadowColor = 'rgba(80, 49, 4, 0.4)';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.1 * scaleFactor;
      ctx.globalAlpha = Math.min(1.0, progress * 1.5);

      // Golden ratio box dimensions (~20px tighter sizing)
      const boxes = [
        { x: cx - 10 * scaleFactor, y: cy - 10 * scaleFactor, w: 20 * scaleFactor, h: 20 * scaleFactor },
        { x: cx - 10 * scaleFactor, y: cy - 30 * scaleFactor, w: 20 * scaleFactor, h: 20 * scaleFactor },
        { x: cx + 10 * scaleFactor, y: cy - 30 * scaleFactor, w: 40 * scaleFactor, h: 40 * scaleFactor },
        { x: cx - 50 * scaleFactor, y: cy - 30 * scaleFactor, w: 60 * scaleFactor, h: 60 * scaleFactor },
        { x: cx - 50 * scaleFactor, y: cy + 30 * scaleFactor, w: 100 * scaleFactor, h: 100 * scaleFactor },
        { x: cx + 50 * scaleFactor, y: cy - 90 * scaleFactor, w: 160 * scaleFactor, h: 160 * scaleFactor }
      ];

      // Draw Golden Rectangles
      boxes.forEach((box, i) => {
        if (progress > i * 0.08) {
          ctx.strokeRect(box.x, box.y, box.w, box.h);

          // Crosshair ticks inside boxes
          ctx.beginPath();
          ctx.moveTo(box.x + box.w / 2 - 3, box.y + box.h / 2);
          ctx.lineTo(box.x + box.w / 2 + 3, box.y + box.h / 2);
          ctx.moveTo(box.x + box.w / 2, box.y + box.h / 2 - 3);
          ctx.lineTo(box.x + box.w / 2, box.y + box.h / 2 + 3);
          ctx.stroke();
        }
      });

      // Central Axis Construction Lines
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 0.9 * scaleFactor;
      ctx.strokeStyle = medBrown;
      ctx.beginPath();
      ctx.moveTo(cx - 230 * scaleFactor, cy);
      ctx.lineTo(cx + 230 * scaleFactor, cy);
      ctx.moveTo(cx, cy - 290 * scaleFactor);
      ctx.lineTo(cx, cy + 290 * scaleFactor);
      ctx.stroke();

      // Diagonal Ray Construction Guides (~20px smaller)
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - 180 * scaleFactor, cy - 180 * scaleFactor);
      ctx.lineTo(cx + 180 * scaleFactor, cy + 180 * scaleFactor);
      ctx.moveTo(cx + 180 * scaleFactor, cy - 180 * scaleFactor);
      ctx.lineTo(cx - 180 * scaleFactor, cy + 180 * scaleFactor);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- 2. LOGARITHMIC FIBONACCI SPIRAL ARC (DRAWN LIVE STROKE-BY-STROKE) ---
      const maxAngle = Math.PI * 3.8 * Math.min(1.0, progress * 1.4);
      const a = 4.5 * scaleFactor;
      const b = 0.306349; // Logarithmic growth factor for Golden Ratio phi

      if (maxAngle > 0.05) {
        // Heavy main ink spiral stroke
        ctx.strokeStyle = darkBrown;
        ctx.lineWidth = 2.2 * scaleFactor;
        ctx.beginPath();

        const steps = 180;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * maxAngle;
          const r = a * Math.exp(b * theta);
          const px = cx + Math.cos(theta + scrollMotion * 0.12) * r;
          const py = cy + Math.sin(theta + scrollMotion * 0.12) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Parallel Echo Line
        ctx.lineWidth = 0.9 * scaleFactor;
        ctx.strokeStyle = ochreBrown;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * maxAngle;
          const r = (a + 3.5 * scaleFactor) * Math.exp(b * theta);
          const px = cx + Math.cos(theta + scrollMotion * 0.12) * r;
          const py = cy + Math.sin(theta + scrollMotion * 0.12) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- 3. CONCENTRIC COMPASS RINGS & DEGREE TICK MARKS (~20px smaller) ---
      const ringRadii = [35, 75, 135, 215, 290];
      ringRadii.forEach((radius, idx) => {
        if (progress > 0.1 + idx * 0.12) {
          const r = radius * scaleFactor;
          ctx.strokeStyle = idx % 2 === 0 ? medBrown : darkBrown;
          ctx.lineWidth = idx === 1 ? 1.5 * scaleFactor : 1.0 * scaleFactor;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          // Azimuth degree tick marks
          const ticks = 12;
          for (let t = 0; t < ticks; t++) {
            const rotA = (t / ticks) * Math.PI * 2 + scrollMotion * 0.15;
            const x1 = cx + Math.cos(rotA) * (r - 3.5 * scaleFactor);
            const y1 = cy + Math.sin(rotA) * (r - 3.5 * scaleFactor);
            const x2 = cx + Math.cos(rotA) * (r + 3.5 * scaleFactor);
            const y2 = cy + Math.sin(rotA) * (r + 3.5 * scaleFactor);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      });

      // --- 4. RADIAL VECTOR RAYS & ARROWHEAD MARKERS ---
      const rayAngles = [-0.6, 0.4, 1.2, 1.9, 2.7, 3.5, 4.2, 5.1];
      rayAngles.forEach((ang, idx) => {
        if (progress > 0.15 + idx * 0.08) {
          const rotAng = ang + scrollMotion * 0.08;
          const rayLen = (150 + idx * 18) * scaleFactor;
          const endX = cx + Math.cos(rotAng) * rayLen;
          const endY = cy + Math.sin(rotAng) * rayLen;

          ctx.strokeStyle = darkBrown;
          ctx.lineWidth = 1.1 * scaleFactor;
          if (idx % 2 === 1) ctx.setLineDash([3, 4]);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Vector Arrowhead tip
          const arrowSize = 6.5 * scaleFactor;
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(rotAng);
          ctx.fillStyle = darkBrown;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-arrowSize, -arrowSize * 0.5);
          ctx.lineTo(-arrowSize * 0.6, 0);
          ctx.lineTo(-arrowSize, arrowSize * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Dotted nodes along vector rays
          const dotCount = 4;
          for (let d = 1; d <= dotCount; d++) {
            const dotR = (rayLen / dotCount) * d;
            const dx = cx + Math.cos(rotAng) * dotR;
            const dy = cy + Math.sin(rotAng) * dotR;
            ctx.fillStyle = darkBrown;
            ctx.beginPath();
            ctx.arc(dx, dy, 1.8 * scaleFactor, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // --- 5. FLOATING CELESTIAL STARDUST PARTICLES ---
      stardustParticles.forEach((p, i) => {
        if (progress > 0.05) {
          const curAngle = p.angle + scrollMotion * 0.2 + (progress * p.speed * 20);
          const curDist = p.distance * scaleFactor * (0.8 + 0.4 * Math.sin(progress * Math.PI + p.pulseOffset));
          const px = cx + Math.cos(curAngle) * curDist;
          const py = cy + Math.sin(curAngle) * curDist;

          const pAlpha = 0.4 + 0.5 * Math.sin(progress * Math.PI * 4 + p.pulseOffset);
          ctx.globalAlpha = Math.max(0.1, Math.min(1.0, pAlpha));
          ctx.fillStyle = paletteColors[p.colorIdx];
          ctx.beginPath();
          ctx.arc(px, py, p.size * scaleFactor, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Center Core Focal Circle
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = darkBrown;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.0 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = darkBrown;
      ctx.lineWidth = 1.6 * scaleFactor;
      ctx.beginPath();
      ctx.arc(cx, cy, 8.0 * scaleFactor, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    function drawMathematicalGeometry(progress) {
      ctxG.clearRect(0, 0, geomCanvas.width, geomCanvas.height);

      const pathProgress = Math.min(1.0, progress * 1.35);
      const scrollMotion = progress * Math.PI * 10;

      if (pathProgress > 0.02) {
        // Draw continuous 3 scroll-connecting vector lines
        drawConnectingLines(ctxG, pathProgress, scrollMotion);

        // Blueprint 1: Scene 3 Railway Bridge / River Apex (X: 1330, Y: 1100 - 20% off-screen right)
        drawGoldenRatioFibonacciBlueprint(ctxG, 1330, 1100, pathProgress, scrollMotion, 0.65);

        // Blueprint 2: Scene 4 Citadel Architecture Center (X: 380, Y: 1850)
        if (pathProgress > 0.22) {
          drawGoldenRatioFibonacciBlueprint(ctxG, 180, 1850, (pathProgress - 0.22) / 0.78, -scrollMotion * 0.8, 0.75);
        }

        // Blueprint 3: Scene 5 Sanctuary / Sky Center (X: 1040, Y: 2600)
        if (pathProgress > 0.45) {
          drawGoldenRatioFibonacciBlueprint(ctxG, 1140, 2600, (pathProgress - 0.45) / 0.55, scrollMotion * 0.9, 0.82);
        }
      }
    }

  }

  // ==========================================================================
  // 6. INTERACTIVE CANVASES: BIRDS FLOCK & SCROLL-CONTROLLED TRAIN
  // ==========================================================================
  // ------------------------------------------------------------------------
  // 4 DISTINCT AVIAN SPECIES SILHOUETTE RENDERERS
  // ------------------------------------------------------------------------

  // Species 0: Soaring Eagle / Falcon (Broad Fingered Wingtips & Fan Tail)
  function drawEagle(ctx, size, wingAngle, wFold) {
    const wY = Math.sin(wingAngle) * (size * 0.85);
    ctx.beginPath();
    ctx.moveTo(size * 1.4, -size * 0.05); // Sharp beak
    ctx.quadraticCurveTo(size * 1.0, -size * 0.25, size * 0.6, -size * 0.15);

    // Right Wing
    const rTipX = -size * 0.4 + wFold;
    const rTipY = -wY * 1.15 - size * 0.4;
    ctx.quadraticCurveTo(size * 0.35 + wFold * 0.3, -wY * 0.85 - size * 0.2, rTipX, rTipY);
    ctx.lineTo(rTipX + size * 0.18, rTipY + size * 0.18);
    ctx.lineTo(rTipX + size * 0.12, rTipY + size * 0.32);
    ctx.lineTo(rTipX + size * 0.06, rTipY + size * 0.46);
    ctx.quadraticCurveTo(size * 0.05, -size * 0.05, -size * 0.3, 0);

    // Wide Fan Tail
    ctx.lineTo(-size * 1.3, size * 0.02);
    ctx.lineTo(-size * 1.6, size * 0.3);
    ctx.lineTo(-size * 1.3, size * 0.35);

    // Left Wing
    const lTipX = -size * 0.4 + wFold;
    const lTipY = wY * 1.15 + size * 0.4;
    ctx.quadraticCurveTo(size * 0.35 + wFold * 0.3, wY * 0.85 + size * 0.2, lTipX, lTipY);
    ctx.lineTo(lTipX + size * 0.18, lTipY - size * 0.18);
    ctx.lineTo(lTipX + size * 0.12, lTipY - size * 0.32);
    ctx.lineTo(lTipX + size * 0.06, lTipY - size * 0.46);
    ctx.quadraticCurveTo(size * 0.1, size * 0.05, size * 0.5, size * 0.15);

    ctx.quadraticCurveTo(size * 0.9, size * 0.08, size * 1.4, -size * 0.05);
    ctx.closePath();
    ctx.fill();
  }

  // Species 1: High-Speed Swallow (Swept-Back Scimitar Wings & Deeply Forked V-Tail)
  function drawSwallow(ctx, size, wingAngle, wFold) {
    const wY = Math.sin(wingAngle) * (size * 0.95);
    ctx.beginPath();
    ctx.moveTo(size * 1.2, 0); // Sleek beak
    ctx.quadraticCurveTo(size * 0.8, -size * 0.18, size * 0.4, -size * 0.1);

    // Right Wing (Crescent tip)
    const rTipX = -size * 0.7 + wFold * 1.2;
    const rTipY = -wY * 1.25 - size * 0.3;
    ctx.quadraticCurveTo(size * 0.2, -wY * 0.7 - size * 0.15, rTipX, rTipY);
    ctx.quadraticCurveTo(-size * 0.2, -wY * 0.4 - size * 0.05, -size * 0.2, 0);

    // DEEPLY FORKED V-TAIL
    ctx.lineTo(-size * 1.2, size * 0.05);
    ctx.lineTo(-size * 1.95, -size * 0.25); // Top long forked streamer
    ctx.lineTo(-size * 1.35, size * 0.15);  // Inner V notch
    ctx.lineTo(-size * 1.95, size * 0.55);  // Bottom long forked streamer
    ctx.lineTo(-size * 1.2, size * 0.25);

    // Left Wing (Crescent tip)
    const lTipX = -size * 0.7 + wFold * 1.2;
    const lTipY = wY * 1.25 + size * 0.3;
    ctx.quadraticCurveTo(size * 0.2, wY * 0.7 + size * 0.15, lTipX, lTipY);
    ctx.quadraticCurveTo(-size * 0.2, wY * 0.4 + size * 0.05, size * 0.4, size * 0.1);

    ctx.quadraticCurveTo(size * 0.8, size * 0.08, size * 1.2, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Species 2: Graceful Seagull / Albatross (Angled "M" Wings & Elbow Joint)
  function drawSeagull(ctx, size, wingAngle, wFold) {
    const wY = Math.sin(wingAngle) * (size * 0.8);
    ctx.beginPath();
    ctx.moveTo(size * 1.3, -size * 0.02);
    ctx.quadraticCurveTo(size * 0.9, -size * 0.2, size * 0.5, -size * 0.12);

    // Right Wing ("M" Elbow Joint)
    const elbowX = size * 0.25;
    const elbowY = -wY * 0.6 - size * 0.35;
    const rTipX = -size * 0.5 + wFold * 0.4;
    const rTipY = -wY * 1.0 - size * 0.1;

    ctx.quadraticCurveTo(size * 0.4, -size * 0.2, elbowX, elbowY);
    ctx.quadraticCurveTo(elbowX - size * 0.2, elbowY - size * 0.1, rTipX, rTipY);
    ctx.quadraticCurveTo(-size * 0.1, -wY * 0.3, -size * 0.2, 0);

    // Pointed Tail
    ctx.lineTo(-size * 1.3, size * 0.08);
    ctx.lineTo(-size * 1.45, size * 0.18);
    ctx.lineTo(-size * 1.15, size * 0.24);

    // Left Wing ("M" Elbow Joint)
    const lElbowY = wY * 0.6 + size * 0.35;
    const lTipX = -size * 0.5 + wFold * 0.4;
    const lTipY = wY * 1.0 + size * 0.1;

    ctx.quadraticCurveTo(-size * 0.1, wY * 0.3, lTipX, lTipY);
    ctx.quadraticCurveTo(elbowX - size * 0.2, lElbowY + size * 0.1, elbowX, lElbowY);
    ctx.quadraticCurveTo(size * 0.4, size * 0.2, size * 0.5, size * 0.12);

    ctx.quadraticCurveTo(size * 0.9, size * 0.08, size * 1.3, -size * 0.02);
    ctx.closePath();
    ctx.fill();
  }

  // Species 3: Compact Songbird / Finch (Short Rounded Wings & Small Body)
  function drawSongbird(ctx, size, wingAngle, wFold) {
    const wY = Math.sin(wingAngle) * (size * 0.75);
    ctx.beginPath();
    ctx.moveTo(size * 1.1, 0);
    ctx.arc(size * 0.5, -size * 0.05, size * 0.3, -Math.PI * 0.5, Math.PI * 0.2, true);

    // Right Wing (Short rounded)
    const rTipX = -size * 0.2 + wFold;
    const rTipY = -wY * 1.1 - size * 0.3;
    ctx.quadraticCurveTo(size * 0.3, -wY * 0.8 - size * 0.2, rTipX, rTipY);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.1, -size * 0.2, 0);

    // Short Square Tail
    ctx.lineTo(-size * 1.1, size * 0.05);
    ctx.lineTo(-size * 1.25, size * 0.25);
    ctx.lineTo(-size * 1.0, size * 0.3);

    // Left Wing (Short rounded)
    const lTipX = -size * 0.2 + wFold;
    const lTipY = wY * 1.1 + size * 0.3;
    ctx.quadraticCurveTo(-size * 0.1, size * 0.1, lTipX, lTipY);
    ctx.quadraticCurveTo(size * 0.3, wY * 0.8 + size * 0.2, size * 0.4, size * 0.15);

    ctx.quadraticCurveTo(size * 0.8, size * 0.1, size * 1.1, 0);
    ctx.closePath();
    ctx.fill();
  }

  function drawBirdBySpecies(ctx, x, y, size, wingAngle, flightAngle, color, opacity, speciesType) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flightAngle);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    const wFold = Math.cos(wingAngle) * (size * 0.22);

    switch (speciesType) {
      case 0:
        drawEagle(ctx, size, wingAngle, wFold);
        break;
      case 1:
        drawSwallow(ctx, size, wingAngle, wFold);
        break;
      case 2:
        drawSeagull(ctx, size, wingAngle, wFold);
        break;
      case 3:
      default:
        drawSongbird(ctx, size, wingAngle, wFold);
        break;
    }

    ctx.restore();
  }

  // Initialize interactive birds flock canvases with IntersectionObserver pause when off-screen
  function setupBirdsCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctxB = canvas.getContext('2d');
    canvas.width = 1440;
    canvas.height = 600;

    const isMobileDevice = (window.innerWidth <= 768) || ('ontouchstart' in window);
    const birdCount = isMobileDevice ? 12 : 24;

    const birds = Array.from({ length: birdCount }, (_, idx) => {
      const type = idx % 4;
      return {
        id: idx,
        speciesType: type,
        x: Math.random() * 1440,
        y: Math.random() * 450 + 40,
        speed: (type === 1 ? 2.6 : (type === 0 ? 1.4 : 2.0)) + Math.random() * 0.6,
        size: (type === 0 ? 10.5 : (type === 3 ? 5.5 : 8.0)) + Math.random() * 2.0,
        wingState: Math.random() * Math.PI * 2,
        wingSpeed: (type === 1 ? 0.16 : (type === 0 ? 0.08 : 0.12)) + Math.random() * 0.03,
        yOffset: Math.random() * 100,
        color: idx % 3 === 0 ? '#1b1002' : (idx % 3 === 1 ? '#322008' : '#492f05'),
        opacity: Math.random() * 0.35 + 0.55
      };
    });

    let birdsRunning = false;
    let birdsRafId = null;

    function startBirdsLoop() {
      if (birdsRunning) return;
      birdsRunning = true;
      drawBirds();
    }

    function stopBirdsLoop() {
      birdsRunning = false;
      if (birdsRafId) {
        cancelAnimationFrame(birdsRafId);
        birdsRafId = null;
      }
    }

    function drawBirds() {
      if (!birdsRunning) return;

      ctxB.clearRect(0, 0, canvas.width, canvas.height);

      birds.forEach(b => {
        b.x += b.speed;
        b.wingState += b.wingSpeed;
        b.y += Math.sin(b.x * 0.008 + b.yOffset) * 0.32;

        if (b.x > 1480) {
          b.x = -50;
          b.y = Math.random() * 450 + 40;
        }

        const flightAngle = Math.sin(b.wingState * 0.5) * 0.07;
        drawBirdBySpecies(ctxB, b.x, b.y, b.size, b.wingState, flightAngle, b.color, b.opacity, b.speciesType);
      });

      birdsRafId = requestAnimationFrame(drawBirds);
    }

    // IntersectionObserver: pause RAF when canvas is completely off screen
    const birdsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startBirdsLoop();
        } else {
          stopBirdsLoop();
        }
      });
    }, { rootMargin: '300px 0px 300px 0px', threshold: 0 });

    birdsObserver.observe(canvas);
    startBirdsLoop();
  }

  setupBirdsCanvas('birds-canvas-top');
  setupBirdsCanvas('birds-canvas');

  // ==========================================================================
  // 6. SMART 3-PHASE TRAIN FRAME PROGRESSIVE LOADER
  //    Phase 1: Frames 1-20  — loaded immediately at startup
  //    Phase 2: Frames 21-140 — loaded silently in background via requestIdleCallback
  //    Priority Mode: If user jumps to Scene 3 before Phase 2 finishes,
  //                   pause background load and immediately load frames around current position
  // ==========================================================================
  const trainCanvas = document.getElementById('train-canvas');
  if (trainCanvas) {
    const ctxT = trainCanvas.getContext('2d');
    trainCanvas.width = 1455;
    trainCanvas.height = 651;

    const totalFrames = 140;
    // Pre-allocate the full array — slots filled as frames load
    const trainFrames = new Array(totalFrames).fill(null);
    let currentFrameIndex = 0;
    let lastGoodFrame = null;      // last successfully rendered frame — shown if next is not ready
    let phase2IdleHandle = null;   // handle for cancelling idle background loading
    let priorityMode = false;      // true when user is in Section 3 and frames may not be ready

    // Helper: create and start loading a single frame image
    function loadFrame(i) {
      if (trainFrames[i] && trainFrames[i].complete && trainFrames[i].naturalWidth !== 0) return;
      const img = new Image();
      const frameNum = String(i + 1).padStart(4, '0');
      img.decoding = 'async'; // Non-blocking decode
      img.src = `images/train_frames/frame_${frameNum}.webp`;
      trainFrames[i] = img;
    }

    // PHASE 1: Load frames 0-19 immediately (covers first 14% of train scroll)
    for (let i = 0; i < 20; i++) loadFrame(i);

    // Render a frame by index — uses lastGoodFrame as fallback if target not ready
    function renderTrainFrame(index) {
      const frame = trainFrames[index];
      if (frame && frame.complete && frame.naturalWidth !== 0) {
        ctxT.clearRect(0, 0, trainCanvas.width, trainCanvas.height);
        ctxT.drawImage(frame, 0, 0, trainCanvas.width, trainCanvas.height);
        lastGoodFrame = frame;
      } else if (lastGoodFrame) {
        // Frame not ready yet — hold last good frame (no blank flash)
        ctxT.clearRect(0, 0, trainCanvas.width, trainCanvas.height);
        ctxT.drawImage(lastGoodFrame, 0, 0, trainCanvas.width, trainCanvas.height);
      }
    }

    // PHASE 2: Load remaining frames 20-139 in background using requestIdleCallback
    // This loads during browser idle time — zero impact on scroll/animation performance
    let phase2NextIndex = 20;
    function runIdleLoad(deadline) {
      if (priorityMode) return; // Yield to priority mode when user is in Scene 3
      while (phase2NextIndex < totalFrames && (deadline.timeRemaining() > 2 || deadline.didTimeout)) {
        loadFrame(phase2NextIndex);
        phase2NextIndex++;
      }
      if (phase2NextIndex < totalFrames) {
        phase2IdleHandle = requestIdleCallback(runIdleLoad, { timeout: 3000 });
      }
    }

    // Start Phase 2 background loading after 1.5s (give critical content time to load first)
    const idleCallbackSupported = typeof requestIdleCallback !== 'undefined';
    let phase2StartTimer = setTimeout(() => {
      if (idleCallbackSupported) {
        phase2IdleHandle = requestIdleCallback(runIdleLoad, { timeout: 3000 });
      } else {
        // Fallback for Safari: load in small batches with setTimeout
        let safariIdx = 20;
        function safariLoad() {
          for (let i = 0; i < 8 && safariIdx < totalFrames; i++, safariIdx++) {
            loadFrame(safariIdx);
          }
          if (safariIdx < totalFrames) setTimeout(safariLoad, 200);
        }
        setTimeout(safariLoad, 200);
      }
    }, 1500);

    // PRIORITY MODE: Activated when ScrollTrigger detects user is in Scene 3
    // Immediately loads the ~20 frames around the current scroll position first
    function activatePriorityMode(currentTargetFrame) {
      if (priorityMode) return;
      priorityMode = true;

      // Cancel idle background loading
      if (phase2IdleHandle && idleCallbackSupported) {
        cancelIdleCallback(phase2IdleHandle);
      }

      // Load a window of 20 frames centered on current position immediately
      const start = Math.max(0, currentTargetFrame - 5);
      const end = Math.min(totalFrames - 1, currentTargetFrame + 15);
      for (let i = start; i <= end; i++) loadFrame(i);

      // Then resume background loading of the rest after priority window is set
      setTimeout(() => {
        priorityMode = false;
        phase2NextIndex = Math.max(phase2NextIndex, end + 1);
        if (phase2NextIndex < totalFrames) {
          if (idleCallbackSupported) {
            phase2IdleHandle = requestIdleCallback(runIdleLoad, { timeout: 3000 });
          }
        }
      }, 800);
    }

    let targetTrainFrame = 0;
    let lerpTrainFrame = 0;
    let priorityActivated = false;

    // ScrollTrigger scrubs frame sequence bi-directionally with lerp smoothing
    ScrollTrigger.create({
      trigger: mainTrigger,
      start: s(2300),
      end: s(3800),
      scrub: true,
      onEnter: () => {
        // User has arrived at Scene 3 — activate priority loading if needed
        if (!priorityActivated && phase2NextIndex < totalFrames) {
          priorityActivated = true;
          activatePriorityMode(Math.round(targetTrainFrame));
        }
      },
      onUpdate: (self) => {
        targetTrainFrame = self.progress * (totalFrames - 1);
      }
    });

    let trainRunning = false;
    let trainRafId = null;

    function startTrainLoop() {
      if (trainRunning) return;
      trainRunning = true;
      trainLoop();
    }

    function stopTrainLoop() {
      trainRunning = false;
      if (trainRafId) {
        cancelAnimationFrame(trainRafId);
        trainRafId = null;
      }
    }

    function trainLoop() {
      if (!trainRunning) return;
      lerpTrainFrame += (targetTrainFrame - lerpTrainFrame) * 0.14;
      const frameIdx = Math.min(totalFrames - 1, Math.max(0, Math.round(lerpTrainFrame)));

      if (frameIdx !== currentFrameIndex) {
        currentFrameIndex = frameIdx;
        renderTrainFrame(currentFrameIndex);
      }

      trainRafId = requestAnimationFrame(trainLoop);
    }

    const trainObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startTrainLoop();
        } else {
          stopTrainLoop();
        }
      });
    }, { rootMargin: '300px 0px 300px 0px' });
    trainObserver.observe(trainCanvas);
    startTrainLoop();

    // Render initial frame when ready
    const firstFrame = trainFrames[0];
    if (firstFrame) {
      if (firstFrame.complete && firstFrame.naturalWidth !== 0) {
        renderTrainFrame(0);
      } else {
        firstFrame.onload = () => renderTrainFrame(0);
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
        start: s(6000),
        end: s(7000),
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
        start: s(6000),
        end: s(7000),
        scrub: 0.8,
      }
    }
  );

});
