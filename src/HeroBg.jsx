import { useEffect, useRef } from 'react';

export default function HeroBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── Pillar particle streams ───
    const makeStreamParticles = (count) =>
      Array.from({ length: count }, () => ({
        y: Math.random(),
        speed: Math.random() * 0.003 + 0.001,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        offset: Math.random() * 0.06 - 0.03,
      }));
    const streamL1 = makeStreamParticles(60);
    const streamL2 = makeStreamParticles(40);
    const streamR1 = makeStreamParticles(60);
    const streamR2 = makeStreamParticles(40);

    // ─── Floating particles ───
    const floatParts = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -Math.random() * 0.0005 - 0.0001,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.6 + 0.2,
      c: Math.random() > 0.5 ? '#8b5cf6' : '#00d4ff',
    }));

    // Ground pipe data movers
    const pipeMovers = Array.from({ length: 8 }, (_, i) => ({
      offset: i * 0.13,
      speed: 0.25 + Math.random() * 0.15,
      row: i % 4,
    }));

    function lerp(a, b, t) { return a + (b - a) * t; }

    // Draw a glowing line
    function gLine(x1, y1, x2, y2, color, alpha, width = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      t += 0.013;

      // ──────────────────────────────────────────
      // 1. BACKGROUND
      // ──────────────────────────────────────────
      ctx.fillStyle = '#08051a';
      ctx.fillRect(0, 0, W, H);

      // Ambient purple glow from center
      const amGrad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.7);
      amGrad.addColorStop(0, 'rgba(80,30,160,0.3)');
      amGrad.addColorStop(0.5, 'rgba(30,10,80,0.15)');
      amGrad.addColorStop(1, 'rgba(0,0,30,0)');
      ctx.fillStyle = amGrad;
      ctx.fillRect(0, 0, W, H);

      // ──────────────────────────────────────────
      // 2. PERSPECTIVE ROOM / CEILING + WALLS
      // ──────────────────────────────────────────
      const VP = { x: W * 0.5, y: H * 0.3 }; // vanishing point

      // Ceiling lines converging to VP
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = 0; i <= 16; i++) {
        const fx = (i / 16) * W;
        const g = ctx.createLinearGradient(VP.x, VP.y, fx, 0);
        g.addColorStop(0, '#8b5cf6');
        g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(VP.x, VP.y);
        ctx.lineTo(fx, 0);
        ctx.stroke();
      }
      ctx.restore();

      // Floor lines converging to VP
      const floorY = H * 0.73;
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let i = -20; i <= 20; i++) {
        const fx = W * 0.5 + i * W * 0.055;
        const g = ctx.createLinearGradient(VP.x, floorY, fx, H);
        g.addColorStop(0, '#6d28d9');
        g.addColorStop(1, 'rgba(109,40,217,0.03)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(VP.x, floorY);
        ctx.lineTo(fx, H);
        ctx.stroke();
      }
      // Floor horizontals
      for (let r = 0; r <= 14; r++) {
        const frac = r / 14;
        const fy = floorY + (H - floorY) * (frac * frac);
        const spread = W * 0.52 * frac;
        const hg = ctx.createLinearGradient(W * 0.5 - spread, fy, W * 0.5 + spread, fy);
        hg.addColorStop(0, 'transparent');
        hg.addColorStop(0.5, 'rgba(100,50,220,0.6)');
        hg.addColorStop(1, 'transparent');
        ctx.strokeStyle = hg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.5 - spread, fy);
        ctx.lineTo(W * 0.5 + spread, fy);
        ctx.stroke();
      }
      ctx.restore();

      // ──────────────────────────────────────────
      // 3. SERVER RACKS (background, sides)
      // ──────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.13;
      // Left side racks
      for (let rack = 0; rack < 4; rack++) {
        const rx = W * (0.01 + rack * 0.045);
        ctx.fillStyle = 'rgba(80,60,180,0.5)';
        ctx.fillRect(rx, H * 0.15, W * 0.032, H * 0.55);
        // Rack lights
        for (let led = 0; led < 8; led++) {
          const ly = H * 0.18 + led * H * 0.065;
          ctx.fillStyle = Math.random() > 0.7 ? '#00d4ff' : '#8b5cf6';
          ctx.fillRect(rx + 2, ly, W * 0.025, 3);
        }
      }
      // Right side racks (mirrored)
      for (let rack = 0; rack < 4; rack++) {
        const rx = W * (0.99 - 0.032 - rack * 0.045);
        ctx.fillStyle = 'rgba(80,60,180,0.5)';
        ctx.fillRect(rx, H * 0.15, W * 0.032, H * 0.55);
        for (let led = 0; led < 8; led++) {
          const ly = H * 0.18 + led * H * 0.065;
          ctx.fillStyle = Math.random() > 0.7 ? '#00d4ff' : '#8b5cf6';
          ctx.fillRect(rx + 2, ly, W * 0.025, 3);
        }
      }
      ctx.restore();

      // ──────────────────────────────────────────
      // 4. PILLARS (glass crystal columns)
      // ──────────────────────────────────────────
      const drawPillar = (cxP, topY, botY, hw, streams, side) => {
        // Glass body
        const bGrad = ctx.createLinearGradient(cxP - hw, 0, cxP + hw, 0);
        if (side === 'L') {
          bGrad.addColorStop(0, 'rgba(0,0,40,0)');
          bGrad.addColorStop(0.2, 'rgba(70,50,160,0.22)');
          bGrad.addColorStop(0.55, 'rgba(120,90,220,0.38)');
          bGrad.addColorStop(0.82, 'rgba(160,120,255,0.55)');
          bGrad.addColorStop(1, 'rgba(200,180,255,0.25)');
        } else {
          bGrad.addColorStop(0, 'rgba(200,180,255,0.25)');
          bGrad.addColorStop(0.18, 'rgba(160,120,255,0.55)');
          bGrad.addColorStop(0.45, 'rgba(120,90,220,0.38)');
          bGrad.addColorStop(0.8, 'rgba(70,50,160,0.22)');
          bGrad.addColorStop(1, 'rgba(0,0,40,0)');
        }
        ctx.fillStyle = bGrad;
        ctx.fillRect(cxP - hw, topY, hw * 2, botY - topY);

        // Bright highlight edge
        const edgeX = side === 'L' ? cxP + hw * 0.82 : cxP - hw * 0.82;
        const eGrad = ctx.createLinearGradient(0, topY, 0, botY);
        eGrad.addColorStop(0, 'rgba(180,140,255,0)');
        eGrad.addColorStop(0.08, 'rgba(200,170,255,0.9)');
        eGrad.addColorStop(0.5, 'rgba(150,110,255,0.8)');
        eGrad.addColorStop(0.92, 'rgba(200,170,255,0.9)');
        eGrad.addColorStop(1, 'rgba(180,140,255,0)');
        ctx.save();
        ctx.strokeStyle = eGrad;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(edgeX, topY);
        ctx.lineTo(edgeX, botY);
        ctx.stroke();
        ctx.restore();

        // Inner edge line (opposite side)
        const innerX = side === 'L' ? cxP - hw * 0.75 : cxP + hw * 0.75;
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = 'rgba(139,92,246,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX, topY + 10);
        ctx.lineTo(innerX, botY - 10);
        ctx.stroke();
        ctx.restore();

        // Horizontal band lines on pillar
        const bands = 12;
        for (let b = 0; b < bands; b++) {
          const by = topY + ((b + 0.5) / bands) * (botY - topY);
          const ba = 0.2 + 0.12 * Math.sin(t * 1.5 + b * 0.8);
          ctx.save();
          ctx.globalAlpha = ba;
          ctx.strokeStyle = 'rgba(139,92,246,0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cxP - hw * 0.7, by);
          ctx.lineTo(cxP + hw * 0.7, by);
          ctx.stroke();
          ctx.restore();
        }

        // Particle streams inside pillar
        streams.forEach(p => {
          p.y += p.speed;
          if (p.y > 1) p.y = 0;
          const py = topY + p.y * (botY - topY);
          const px = cxP + p.offset * hw * 8;
          const alpha = Math.sin(p.y * Math.PI) * p.brightness * 0.85;
          ctx.save();
          ctx.globalAlpha = alpha;
          const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
          pg.addColorStop(0, '#ffffff');
          pg.addColorStop(0.3, '#a78bfa');
          pg.addColorStop(1, 'transparent');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Glow at pillar base
        ctx.save();
        const baseGlow = ctx.createRadialGradient(cxP, botY, 0, cxP, botY, hw * 2.5);
        baseGlow.addColorStop(0, 'rgba(139,92,246,0.4)');
        baseGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = baseGlow;
        ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 1.5);
        ctx.beginPath();
        ctx.ellipse(cxP, botY, hw * 2.5, hw * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Draw 4 pillars matching the reference image layout
      drawPillar(W * 0.17, H * 0.04, H * 0.88, W * 0.045, streamL1, 'L');
      drawPillar(W * 0.295, H * 0.08, H * 0.78, W * 0.028, streamL2, 'L');
      drawPillar(W * 0.705, H * 0.08, H * 0.78, W * 0.028, streamR2, 'R');
      drawPillar(W * 0.83, H * 0.04, H * 0.88, W * 0.045, streamR1, 'R');

      // ──────────────────────────────────────────
      // 5. HORIZONTAL PIPE SYSTEM (foreground)
      // ──────────────────────────────────────────
      const drawPipe = (y, xL, xR, diam, offset) => {
        const py = y * H;
        const pxL = xL * W, pxR = xR * W;
        const d = diam * H;

        // Pipe 3D cylinder effect
        const cGrad = ctx.createLinearGradient(pxL, py - d, pxL, py + d);
        cGrad.addColorStop(0, 'rgba(180,150,255,0.25)');
        cGrad.addColorStop(0.25, 'rgba(139,92,246,0.55)');
        cGrad.addColorStop(0.5, 'rgba(80,50,180,0.7)');
        cGrad.addColorStop(0.75, 'rgba(50,30,120,0.55)');
        cGrad.addColorStop(1, 'rgba(20,10,60,0.2)');
        ctx.save();
        ctx.fillStyle = cGrad;
        ctx.fillRect(pxL, py - d, pxR - pxL, d * 2);

        // Top highlight line
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = 'rgba(200,180,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(pxL, py - d * 0.75);
        ctx.lineTo(pxR, py - d * 0.75);
        ctx.stroke();

        // Bottom reflection
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = 'rgba(139,92,246,0.5)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(pxL, py + d * 0.75);
        ctx.lineTo(pxR, py + d * 0.75);
        ctx.stroke();
        ctx.restore();

        // Neon strip on top of pipe
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2 + offset);
        const stripGrad = ctx.createLinearGradient(pxL, 0, pxR, 0);
        stripGrad.addColorStop(0, 'transparent');
        stripGrad.addColorStop(0.1, '#00d4ff');
        stripGrad.addColorStop(0.9, '#8b5cf6');
        stripGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = stripGrad;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(pxL, py - d);
        ctx.lineTo(pxR, py - d);
        ctx.stroke();
        ctx.restore();

        // Moving energy packet
        pipeMovers.filter(m => Math.abs(m.offset - offset) < 0.15).forEach(mover => {
          const prog = ((t * mover.speed + mover.offset) % 1);
          const mx = pxL + prog * (pxR - pxL);
          const ma = Math.sin(prog * Math.PI) * 0.95;
          ctx.save();
          ctx.globalAlpha = ma;
          const mg = ctx.createRadialGradient(mx, py, 0, mx, py, 16);
          mg.addColorStop(0, '#ffffff');
          mg.addColorStop(0.25, '#00d4ff');
          mg.addColorStop(0.6, 'rgba(0,212,255,0.3)');
          mg.addColorStop(1, 'transparent');
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.arc(mx, py, 16, 0, Math.PI * 2);
          ctx.fill();
          // Tail glow
          ctx.globalAlpha = ma * 0.35;
          const tailG = ctx.createLinearGradient(mx - 60, py, mx, py);
          tailG.addColorStop(0, 'transparent');
          tailG.addColorStop(1, '#00d4ff');
          ctx.strokeStyle = tailG;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(mx - 60, py);
          ctx.lineTo(mx, py);
          ctx.stroke();
          ctx.restore();
        });
      };

      // Foreground pipes
      drawPipe(0.78, 0.18, 0.42, 0.025, 0);
      drawPipe(0.78, 0.58, 0.82, 0.025, 0.3);
      drawPipe(0.84, 0.18, 0.42, 0.02, 0.5);
      drawPipe(0.84, 0.58, 0.82, 0.02, 0.7);
      drawPipe(0.90, 0.18, 0.82, 0.015, 0.2);

      // Middle horizontal pipe connectors
      drawPipe(0.42, 0.03, 0.36, 0.018, 0.1);
      drawPipe(0.42, 0.64, 0.97, 0.018, 0.6);
      drawPipe(0.55, 0.03, 0.3, 0.015, 0.4);
      drawPipe(0.55, 0.7, 0.97, 0.015, 0.8);

      // ──────────────────────────────────────────
      // 6. CENTRAL PORTAL ARCH FRAME
      // ──────────────────────────────────────────
      const cx = W * 0.5, cy = H * 0.44;
      const arcW = W * 0.42, arcH = H * 0.58;
      const ax = cx - arcW / 2, ay = cy - arcH * 0.54;
      const framePulse = 0.65 + 0.35 * Math.sin(t * 1.1);

      // Frame glow
      const frameGrad = ctx.createLinearGradient(ax, ay, ax + arcW, ay);
      frameGrad.addColorStop(0, 'rgba(0,212,255,0)');
      frameGrad.addColorStop(0.2, `rgba(139,92,246,${framePulse * 0.85})`);
      frameGrad.addColorStop(0.5, `rgba(0,212,255,${framePulse})`);
      frameGrad.addColorStop(0.8, `rgba(139,92,246,${framePulse * 0.85})`);
      frameGrad.addColorStop(1, 'rgba(0,212,255,0)');

      ctx.save();
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = frameGrad;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = framePulse;
      // Top horizontal
      ctx.beginPath(); ctx.moveTo(ax + 24, ay); ctx.lineTo(ax + arcW - 24, ay); ctx.stroke();
      // Bottom horizontal
      ctx.beginPath(); ctx.moveTo(ax + 24, ay + arcH); ctx.lineTo(ax + arcW - 24, ay + arcH); ctx.stroke();
      // Left vertical
      ctx.beginPath(); ctx.moveTo(ax, ay + 24); ctx.lineTo(ax, ay + arcH - 24); ctx.stroke();
      // Right vertical
      ctx.beginPath(); ctx.moveTo(ax + arcW, ay + 24); ctx.lineTo(ax + arcW, ay + arcH - 24); ctx.stroke();

      // Corner L-brackets
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = 0.92;
      const corners = [
        [ax, ay, 1, 1], [ax + arcW, ay, -1, 1],
        [ax, ay + arcH, 1, -1], [ax + arcW, ay + arcH, -1, -1],
      ];
      corners.forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx, by + dy * 38);
        ctx.lineTo(bx, by); ctx.lineTo(bx + dx * 38, by);
        ctx.stroke();
      });
      // Inner corner smaller accents
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.45;
      corners.forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + dx * 10, by + dy * 55);
        ctx.lineTo(bx + dx * 10, by + dy * 10);
        ctx.lineTo(bx + dx * 55, by + dy * 10);
        ctx.stroke();
      });
      ctx.restore();

      // ──────────────────────────────────────────
      // 7. ARCH / PIPING above logo (like reference)
      // ──────────────────────────────────────────
      // Top horizontal pipe spanning frame width
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.25 * Math.sin(t * 1.8);
      const topPipeGrad = ctx.createLinearGradient(ax, 0, ax + arcW, 0);
      topPipeGrad.addColorStop(0, 'transparent');
      topPipeGrad.addColorStop(0.1, '#8b5cf6');
      topPipeGrad.addColorStop(0.5, '#00d4ff');
      topPipeGrad.addColorStop(0.9, '#8b5cf6');
      topPipeGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = topPipeGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(ax + arcW, ay);
      ctx.stroke();
      ctx.restore();

      // Extended horizontal pipes from frame sides
      gLine(W * 0.08, ay, ax, ay, '#8b5cf6', 0.5, 2);
      gLine(ax + arcW, ay, W * 0.92, ay, '#8b5cf6', 0.5, 2);

      // ──────────────────────────────────────────
      // 8. HOLOGRAPHIC RINGS around logo
      // ──────────────────────────────────────────
      const logoY = cy - H * 0.08;
      const ringsData = [
        { rx: 0.12, ry: 0.045, speed: 0.55, col: '#8b5cf6', lw: 2, ph: 0 },
        { rx: 0.175, ry: 0.065, speed: -0.38, col: '#00d4ff', lw: 1.5, ph: 1.5 },
        { rx: 0.235, ry: 0.088, speed: 0.28, col: '#a78bfa', lw: 1, ph: 3 },
      ];
      ringsData.forEach(ring => {
        ctx.save();
        ctx.translate(cx, logoY);
        ctx.rotate(t * ring.speed + ring.ph);
        const ra = 0.4 + 0.2 * Math.sin(t * 1.5 + ring.ph);
        ctx.globalAlpha = ra;
        ctx.strokeStyle = ring.col;
        ctx.lineWidth = ring.lw;
        ctx.shadowColor = ring.col;
        ctx.shadowBlur = 12;
        ctx.scale(1, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, ring.rx * W, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // ──────────────────────────────────────────
      // 9. VAMPEXAI TRIANGLE LOGO (drawn)
      // ──────────────────────────────────────────
      const logoSize = Math.min(W, H) * 0.13;
      const lx = cx, ly = cy - H * 0.16;

      // Outer halo
      ctx.save();
      const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, logoSize * 1.4);
      halo.addColorStop(0, `rgba(139,92,246,${0.45 + 0.2 * Math.sin(t * 1.5)})`);
      halo.addColorStop(0.5, 'rgba(0,212,255,0.12)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(lx, ly, logoSize * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Triangle shape (matching reference: blue top, purple overlap)
      const triSize = logoSize * 0.68;
      // Blue triangle (top one, pointing up-right)
      ctx.save();
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 30 + 12 * Math.sin(t * 1.5);
      const blueGrad = ctx.createLinearGradient(lx, ly - triSize, lx + triSize * 0.7, ly + triSize * 0.3);
      blueGrad.addColorStop(0, 'rgba(0,212,255,0.95)');
      blueGrad.addColorStop(1, 'rgba(0,150,200,0.6)');
      ctx.fillStyle = blueGrad;
      ctx.strokeStyle = 'rgba(0,212,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly - triSize * 1.05);
      ctx.lineTo(lx + triSize * 0.82, ly + triSize * 0.35);
      ctx.lineTo(lx - triSize * 0.1, ly + triSize * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Purple triangle (front one, pointing down)
      ctx.save();
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 25 + 10 * Math.sin(t * 1.5);
      const purpGrad = ctx.createLinearGradient(lx - triSize * 0.6, ly - triSize * 0.3, lx + triSize * 0.1, ly + triSize * 0.9);
      purpGrad.addColorStop(0, 'rgba(139,92,246,0.9)');
      purpGrad.addColorStop(1, 'rgba(80,30,160,0.85)');
      ctx.fillStyle = purpGrad;
      ctx.strokeStyle = 'rgba(139,92,246,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx - triSize * 0.68, ly - triSize * 0.25);
      ctx.lineTo(lx + triSize * 0.15, ly - triSize * 0.25);
      ctx.lineTo(lx - triSize * 0.25, ly + triSize * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // ──────────────────────────────────────────
      // 10. "VampExAi" TEXT (neon pink/cyan)
      // ──────────────────────────────────────────
      ctx.save();
      const fontSize = Math.max(22, W * 0.042);
      ctx.font = `900 ${fontSize}px Inter, 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      const textY = cy + H * 0.12;

      // Text neon glow layers
      ctx.shadowColor = '#cc00ff';
      ctx.shadowBlur = 35 + 15 * Math.sin(t);
      const tGrad = ctx.createLinearGradient(cx - W * 0.15, 0, cx + W * 0.15, 0);
      tGrad.addColorStop(0, '#a855f7');
      tGrad.addColorStop(0.35, '#ff00d4');
      tGrad.addColorStop(0.65, '#c084fc');
      tGrad.addColorStop(1, '#818cf8');
      ctx.fillStyle = tGrad;
      ctx.globalAlpha = 0.97;
      ctx.fillText('VampExAi', cx, textY);
      ctx.restore();

      // ──────────────────────────────────────────
      // 11. FLOATING PARTICLES
      // ──────────────────────────────────────────
      ctx.save();
      floatParts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02 || p.x > 1.02) p.x = Math.random();
        const flicker = 0.5 + 0.5 * Math.sin(t * 4 + p.x * 30);
        ctx.globalAlpha = p.a * flicker;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      // ──────────────────────────────────────────
      // 12. FLOOR REFLECTION (logo + text mirror)
      // ──────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.save();
      ctx.translate(cx, floorY);
      ctx.scale(1, -0.35);
      // Reflected text
      const reflFontSize = Math.max(18, W * 0.038);
      ctx.font = `900 ${reflFontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText('VampExAi', 0, -(floorY - (cy + H * 0.12)));
      ctx.restore();
      ctx.restore();

      // Scanlines
      ctx.save();
      ctx.globalAlpha = 0.03;
      for (let sl = 0; sl < H; sl += 4) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, sl, W, 2);
      }
      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
