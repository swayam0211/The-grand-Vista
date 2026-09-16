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
    
    // Update scroll wrapper height to maintain correct scrollable length
    if (wrapper) {
      wrapper.style.height = `${8592 * currentScale}px`;
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
    // Use scaled total height for percentage
    const scaledTotalHeight = (8592 * currentScale) - window.innerHeight;
    const progress = Math.min(100, Math.round((scrollY / scaledTotalHeight) * 100));
    if (scrollPercentText) scrollPercentText.textContent = `${progress}%`;

    let activeScene = 1;
    if (scrollY > 6300 * currentScale) activeScene = 5;
    else if (scrollY > 4200 * currentScale) activeScene = 4;
    else if (scrollY > 2800 * currentScale) activeScene = 3;
    else if (scrollY > 1400 * currentScale) activeScene = 2;

    navDots.forEach(dot => {
      const sceneNum = parseInt(dot.dataset.scene, 10);
      dot.classList.toggle('active', sceneNum === activeScene);
    });
  });

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const sceneNum = parseInt(dot.dataset.scene, 10);
      const targets = [0, 0, 1500, 2900, 4300, 6400];
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

  // --- SCENE 4 PARALLAX: CITADEL BUILDINGS (Y: 4200 - 6300) ---
  gsap.fromTo('#building-cluster-large',
    { opacity: 0.2 },
    {
      opacity: 1.0,
      y: -180,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(3600),
        end: s(5200),
        scrub: true,
      }
    }
  );

  const mixedTl = gsap.timeline({
    scrollTrigger: {
      trigger: mainTrigger,
      start: s(3800),
      end: s(5800),
      scrub: true,
    }
  });

  mixedTl
    .fromTo('#building-cluster-mixed',
      { x: -180, opacity: 0.5 },
      { x: 0, opacity: 1.0, duration: 1 }
    )
    .to('#building-cluster-mixed', { y: -80, duration: 0.8 })
    .to('#building-cluster-mixed',
      { x: -320, opacity: 0, duration: 1.2, ease: 'power1.in' }
    );

  gsap.fromTo('#atmosphere-band',
    { opacity: 0.4 },
    {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(4800),
        end: s(6200),
        scrub: true,
      }
    }
  );

  // --- SCENE 5 PARALLAX: MINARET & BASE ROAD (Y: 6300 - 8592) ---
  gsap.fromTo('#minaret-tower',
    { y: 220, opacity: 0.2, scale: 0.95 },
    {
      y: -320,
      opacity: 1.0,
      scale: 1.05,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(5600),
        end: s(8592),
        scrub: true,
      }
    }
  );

  gsap.fromTo('#city-cluster-european',
    { x: 180, opacity: 0.2 },
    {
      x: 0,
      opacity: 1.0,
      y: -180,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(5800),
        end: s(8592),
        scrub: true,
      }
    }
  );

  gsap.fromTo('#horse-cart',
    { x: 120, opacity: 0.3 },
    {
      x: -160,
      y: -220,
      opacity: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: mainTrigger,
        start: s(6800),
        end: s(8592),
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
