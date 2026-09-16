/* ==========================================================================
   THE GRAND VISTA — INTERACTIVE CANVAS DRAWING & COORDINATE EXPORTER
   Allows user to draw freehand pencil strokes, straight lines, rectangles,
   circles, and triangles directly on top of any section of the site.
   All drawings are anchored to absolute page coordinates (Y: 0-6600px) and
   scroll seamlessly with the page layout.
   ========================================================================== */

(function () {
  let isDrawMode = false;
  let currentTool = 'pencil'; // 'pencil', 'line', 'rect', 'circle', 'triangle'
  let currentColor = '#ffd700';
  let currentWidth = 3;
  let isDrawing = false;
  let startPoint = { x: 0, y: 0 };

  const shapes = []; // Array of drawn shapes: { type, points, color, width, x, y, w, h, cx, cy, r, x1, y1, x2, y2 }
  let currentPencilPoints = [];

  let canvas, ctx;

  function initDrawingEngine() {
    // 1. Target the master parallax canvas container
    const parallaxCanvas = document.querySelector('.parallax-canvas');
    if (!parallaxCanvas) return;

    // Create interactive user draw overlay canvas
    canvas = document.createElement('canvas');
    canvas.id = 'user-draw-canvas';
    canvas.width = 1440;
    canvas.height = 6600; // Covers entire document length
    canvas.style.cssText = 'position:absolute; left:0; top:0; width:1440px; height:6600px; z-index:9998; pointer-events:none;';
    parallaxCanvas.appendChild(canvas);

    ctx = canvas.getContext('2d');

    // 2. Create Floating Interactive UI Toolbar
    createToolbarUI();

    // 3. Attach Event Listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Touch Event Support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  }

  function handleMouseDown(e) {
    if (!isDrawMode) return;
    isDrawing = true;
    startPoint = getCanvasCoords(e);

    if (currentTool === 'pencil') {
      currentPencilPoints = [{ x: startPoint.x, y: startPoint.y }];
    }
  }

  function handleMouseMove(e) {
    if (!isDrawMode || !isDrawing) return;
    const curr = getCanvasCoords(e);

    redrawAll();

    // Draw live preview of shape currently being drawn
    ctx.save();
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = currentWidth;
    ctx.shadowColor = currentColor;
    ctx.shadowBlur = 8;

    if (currentTool === 'pencil') {
      currentPencilPoints.push({ x: curr.x, y: curr.y });
      drawPencilStroke(ctx, currentPencilPoints, currentColor, currentWidth);
    } else if (currentTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    } else if (currentTool === 'rect') {
      ctx.strokeRect(startPoint.x, startPoint.y, curr.x - startPoint.x, curr.y - startPoint.y);
    } else if (currentTool === 'circle') {
      const radius = Math.hypot(curr.x - startPoint.x, curr.y - startPoint.y);
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'triangle') {
      drawTriangle(ctx, startPoint.x, startPoint.y, curr.x, curr.y);
    }

    ctx.restore();
  }

  function handleMouseUp(e) {
    if (!isDrawMode || !isDrawing) return;
    isDrawing = false;
    const endPoint = getCanvasCoords(e);

    // Save completed shape to memory
    if (currentTool === 'pencil') {
      if (currentPencilPoints.length > 1) {
        shapes.push({
          type: 'pencil',
          points: [...currentPencilPoints],
          color: currentColor,
          width: currentWidth
        });
      }
      currentPencilPoints = [];
    } else if (currentTool === 'line') {
      shapes.push({
        type: 'line',
        x1: startPoint.x, y1: startPoint.y,
        x2: endPoint.x, y2: endPoint.y,
        color: currentColor,
        width: currentWidth
      });
    } else if (currentTool === 'rect') {
      shapes.push({
        type: 'rect',
        x: startPoint.x, y: startPoint.y,
        w: endPoint.x - startPoint.x,
        h: endPoint.y - startPoint.y,
        color: currentColor,
        width: currentWidth
      });
    } else if (currentTool === 'circle') {
      const radius = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
      shapes.push({
        type: 'circle',
        cx: startPoint.x, cy: startPoint.y,
        r: Math.round(radius),
        color: currentColor,
        width: currentWidth
      });
    } else if (currentTool === 'triangle') {
      shapes.push({
        type: 'triangle',
        x1: startPoint.x, y1: startPoint.y,
        x2: endPoint.x, y2: endPoint.y,
        color: currentColor,
        width: currentWidth
      });
    }

    redrawAll();
  }

  function handleTouchStart(e) {
    if (!isDrawMode) return;
    e.preventDefault();
    handleMouseDown(e);
  }

  function handleTouchMove(e) {
    if (!isDrawMode) return;
    e.preventDefault();
    handleMouseMove(e);
  }

  function handleTouchEnd(e) {
    if (!isDrawMode) return;
    handleMouseUp(e);
  }

  function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach(s => {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;

      if (s.type === 'pencil') {
        drawPencilStroke(ctx, s.points, s.color, s.width);
      } else if (s.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      } else if (s.type === 'rect') {
        ctx.strokeRect(s.x, s.y, s.w, s.h);
      } else if (s.type === 'circle') {
        ctx.beginPath();
        ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.type === 'triangle') {
        drawTriangle(ctx, s.x1, s.y1, s.x2, s.y2);
      }

      ctx.restore();
    });
  }

  function drawPencilStroke(context, points, color, width) {
    if (points.length < 2) return;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
    context.stroke();
  }

  function drawTriangle(context, x1, y1, x2, y2) {
    const topX = (x1 + x2) / 2;
    const topY = y1;
    context.beginPath();
    context.moveTo(topX, topY);
    context.lineTo(x2, y2);
    context.lineTo(x1, y2);
    context.closePath();
    context.stroke();
  }

  function createToolbarUI() {
    const toolbar = document.createElement('div');
    toolbar.id = 'drawing-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      top: 75px;
      left: 20px;
      z-index: 9999;
      background: rgba(10, 15, 30, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 215, 0, 0.45);
      border-radius: 12px;
      padding: 12px 16px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 280px;
      user-select: none;
    `;

    toolbar.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 8px;">
        <span style="font-weight:700; font-size: 12px; color: #ffd700; letter-spacing: 0.5px;">🎨 CREATIVE DRAW TOOL</span>
        <button id="draw-toggle-btn" style="background:#ffd700; color:#000; border:none; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11px; cursor:pointer;">DRAW: OFF</button>
      </div>

      <!-- Tools Group -->
      <div style="display:flex; gap:6px; justify-content:space-between;" id="draw-tools-group">
        <button data-tool="pencil" class="draw-tool-btn active" title="Pencil">✏️ Pencil</button>
        <button data-tool="line" class="draw-tool-btn" title="Line">📏 Line</button>
        <button data-tool="rect" class="draw-tool-btn" title="Rectangle">🔲 Rect</button>
        <button data-tool="circle" class="draw-tool-btn" title="Circle">⭕ Circle</button>
        <button data-tool="triangle" class="draw-tool-btn" title="Triangle">🔺 Tri</button>
      </div>

      <!-- Color Palette -->
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:11px; color:#aaa;">Color:</span>
        <div style="display:flex; gap:6px; align-items:center;" id="draw-color-presets">
          <span class="color-swatch active" data-color="#ffd700" style="background:#ffd700;"></span>
          <span class="color-swatch" data-color="#00f3ff" style="background:#00f3ff;"></span>
          <span class="color-swatch" data-color="#ff007f" style="background:#ff007f;"></span>
          <span class="color-swatch" data-color="#ff9900" style="background:#ff9900;"></span>
          <span class="color-swatch" data-color="#00ffaa" style="background:#00ffaa;"></span>
          <span class="color-swatch" data-color="#ffffff" style="background:#ffffff;"></span>
          <input type="color" id="draw-color-picker" value="#ffd700" style="width:22px; height:22px; border:none; background:transparent; cursor:pointer; padding:0;">
        </div>
      </div>

      <!-- Stroke Width -->
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:11px; color:#aaa;">Width:</span>
        <input type="range" id="draw-width-slider" min="1" max="20" value="3" style="flex:1;">
        <span id="draw-width-val" style="font-size:11px; font-weight:bold; color:#ffd700;">3px</span>
      </div>

      <!-- Actions -->
      <div style="display:flex; gap:6px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 8px;">
        <button id="draw-undo-btn" style="flex:1; background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2); padding:6px; border-radius:6px; font-size:11px; cursor:pointer;">↩️ Undo</button>
        <button id="draw-clear-btn" style="flex:1; background:rgba(255,0,0,0.2); color:#ff6b6b; border:1px solid rgba(255,0,0,0.4); padding:6px; border-radius:6px; font-size:11px; cursor:pointer;">🗑️ Clear</button>
      </div>

      <button id="draw-export-btn" style="background: linear-gradient(135deg, #00f3ff, #ffd700); color:#000; border:none; padding:8px; border-radius:6px; font-weight:bold; font-size:11px; cursor:pointer; text-align:center;">📋 Export Coordinates to Console</button>
    `;

    document.body.appendChild(toolbar);

    // Bind UI Controls
    const toggleBtn = document.getElementById('draw-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      isDrawMode = !isDrawMode;
      toggleBtn.innerText = `DRAW: ${isDrawMode ? 'ON' : 'OFF'}`;
      toggleBtn.style.background = isDrawMode ? '#00f3ff' : '#ffd700';
      canvas.style.pointerEvents = isDrawMode ? 'auto' : 'none';
      canvas.style.cursor = isDrawMode ? 'crosshair' : 'default';
    });

    // Tool Selection
    const toolBtns = toolbar.querySelectorAll('.draw-tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
      });
    });

    // Color Preset Swatches
    const colorSwatches = toolbar.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.dataset.color;
        document.getElementById('draw-color-picker').value = currentColor;
      });
    });

    // Custom Color Picker
    document.getElementById('draw-color-picker').addEventListener('input', (e) => {
      currentColor = e.target.value;
      colorSwatches.forEach(s => s.classList.remove('active'));
    });

    // Line Width Slider
    const widthSlider = document.getElementById('draw-width-slider');
    const widthVal = document.getElementById('draw-width-val');
    widthSlider.addEventListener('input', (e) => {
      currentWidth = parseInt(e.target.value);
      widthVal.innerText = `${currentWidth}px`;
    });

    // Undo Last Shape
    document.getElementById('draw-undo-btn').addEventListener('click', () => {
      shapes.pop();
      redrawAll();
    });

    // Clear Canvas
    document.getElementById('draw-clear-btn').addEventListener('click', () => {
      shapes.length = 0;
      redrawAll();
    });

    // Export Coordinates to Browser Console & Clipboard
    document.getElementById('draw-export-btn').addEventListener('click', () => {
      if (shapes.length === 0) {
        alert('No drawings to export yet! Turn ON Draw mode and sketch shapes on screen first.');
        return;
      }

      console.log('====================================================');
      console.log('🎨 DRAWN SHAPES & LINES COORDINATES EXPORT (Absolute Layout Y: 0-6600px):');
      console.log(JSON.stringify(shapes, null, 2));
      console.log('====================================================');

      // Try copying to clipboard
      navigator.clipboard.writeText(JSON.stringify(shapes, null, 2)).then(() => {
        alert(`Copied ${shapes.length} drawn shape coordinate(s) to clipboard & browser console!`);
      }).catch(() => {
        alert(`Logged ${shapes.length} shape coordinate(s) to browser console! Check F12 Developer Console.`);
      });
    });
  }

  // Auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrawingEngine);
  } else {
    initDrawingEngine();
  }
})();
