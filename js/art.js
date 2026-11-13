/* Meridian Bureau: pixel painter.
   City scenes, witness portraits and the world map are all drawn in code. There are no image files. */
(function (MB) {
  'use strict';

  const W = 320, H = 180, HZ = 124;   // scene size and horizon line
  const MW = 360, MH = 140;           // world map: one pixel per degree, 80N down to 60S
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rngFrom = MB.Engine.rngFrom, hashStr = MB.Engine.hashStr;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  /* ---------- colour ---------- */
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return hex(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t));
  }

  function phaseOf(hour) {
    if (hour < 5 || hour >= 20.5) return 'night';
    if (hour < 7.5) return 'dawn';
    if (hour < 17.5) return 'day';
    return 'dusk';
  }
  const SKY = {
    night: ['#060a1c', '#10173a', '#232d5c'],
    dawn: ['#27296a', '#a8527c', '#f5a65f'],
    day: ['#2f7fd0', '#6bb4ea', '#c6e6f6'],
    dusk: ['#281f5e', '#b6446c', '#f8964a']
  };
  const TINT = { night: ['#0a1236', 0.6], dawn: ['#7a4372', 0.28], day: null, dusk: ['#5c2b60', 0.34] };

  /* ---------- painter: every shape is built from whole-pixel rectangles ---------- */
  function Painter(ctx, phase) { this.c = ctx; this.phase = phase; this.cache = {}; }
  Painter.prototype.lit = function (col) {
    const t = TINT[this.phase];
    if (!t) return col;
    return this.cache[col] || (this.cache[col] = mix(col, t[0], t[1]));
  };
  Painter.prototype.put = function (x, y, w, h, col) {
    if (w <= 0 || h <= 0) return;
    this.c.fillStyle = col;
    this.c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  // r: takes on the colour of the hour. glow: lamps, stars and the sun, which do not.
  Painter.prototype.r = function (x, y, w, h, col) { this.put(x, y, w, h, this.lit(col)); };
  Painter.prototype.glow = Painter.prototype.put;
  Painter.prototype.disc = function (cx, cy, rad, col, raw) {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.floor(Math.sqrt(rad * rad - dy * dy));
      this[raw ? 'glow' : 'r'](cx - w, cy + dy, 2 * w + 1, 1, col);
    }
  };
  Painter.prototype.dome = function (cx, base, rad, col) {
    for (let dy = 0; dy <= rad; dy++) {
      const w = Math.floor(Math.sqrt(rad * rad - dy * dy));
      this.r(cx - w, base - dy - 1, 2 * w + 1, 1, col);
    }
  };
  Painter.prototype.tri = function (cx, base, half, h, col, shade) {
    for (let i = 0; i < h; i++) {
      const w = Math.round(half * (1 - i / h)), y = base - i - 1;
      if (w < 1) { this.r(cx, y, 1, 1, col); continue; }
      this.r(cx - w, y, w, 1, col);
      this.r(cx, y, w, 1, shade || col);
    }
  };
  Painter.prototype.hump = function (cx, base, half, h, col, pow) {
    for (let dx = -half; dx <= half; dx++) {
      const hh = h * Math.pow(Math.cos(dx / half * Math.PI / 2), pow || 0.7);
      this.r(cx + dx, base - hh, 1, hh, col);
    }
  };
  Painter.prototype.line = function (x0, y0, x1, y1, col, gap) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      if (gap && i % gap) continue;
      this.r(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 1, 1, col);
    }
  };

  /* ---------- sky ---------- */
  function paintSky(ctx, phase) {
    const stops = SKY[phase], N = 8, ramp = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1) * 2, k = Math.min(1, Math.floor(t));
      ramp.push(rgb(mix(stops[k], stops[k + 1], t - k)));
    }
    const img = ctx.createImageData(W, HZ), d = img.data;
    for (let y = 0; y < HZ; y++) {
      const f = y / (HZ - 1) * (N - 1), i = Math.min(N - 2, Math.floor(f)), frac = f - i;
      for (let x = 0; x < W; x++) {
        const c = frac > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? ramp[i + 1] : ramp[i];
        const o = (y * W + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function paintLights(p, hour, r) {
    const stars = [];
    for (let i = 0; i < 70; i++) stars.push([r() * W, r() * HZ * 0.8, r()]);
    const mx = 40 + r() * 240, my = 16 + r() * 26;
    if (p.phase === 'night') {
      stars.forEach(s => p.glow(s[0], s[1], 1, 1, s[2] > 0.7 ? '#ffffff' : s[2] > 0.3 ? '#aab6ee' : '#6c7bc0'));
      p.disc(mx, my, 6, '#f3efd4', true);
      p.disc(mx + 3, my - 2, 5, mix(SKY.night[0], SKY.night[1], 0.6), true);
      return;
    }
    if (p.phase !== 'day') stars.slice(0, 14).forEach(s => p.glow(s[0], s[1] * 0.5, 1, 1, '#d8cfee'));
    const t = Math.max(0, Math.min(1, (hour - 5) / 15.5));
    const sx = 26 + t * 268, sy = HZ - 10 - Math.sin(Math.PI * t) * 96;
    p.disc(Math.round(sx), Math.round(sy), p.phase === 'day' ? 7 : 9,
      p.phase === 'day' ? '#fff4b8' : p.phase === 'dawn' ? '#ffd58a' : '#ffa25e', true);
  }

  function paintAurora(p, r) {
    const ph = r() * 6;
    for (let x = 10; x < W - 10; x++) {
      const y0 = 22 + Math.sin(x / 23 + ph) * 9 + Math.sin(x / 7 + ph * 2) * 3;
      const len = 12 + Math.sin(x / 11 + ph) * 6 + (x % 3);
      for (let k = 0; k < len; k++) {
        if ((x + k) % 2) continue;
        p.glow(x, y0 + k, 1, 1, k < len * 0.4 ? '#7dffb2' : k < len * 0.75 ? '#35d0a0' : '#2a8f9a');
      }
    }
  }

  function paintClouds(p, r) {
    const n = 3 + Math.floor(r() * 3), col = '#f3f6fb';
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = 10 + r() * 50, w = 18 + r() * 26;
      p.r(x, y, w, 3, col); p.r(x + 4, y - 2, w - 10, 2, col); p.r(x + 7, y + 3, w - 13, 1, col);
    }
  }

  /* ---------- far horizon ---------- */
  function ridge(p, r, o) {
    const ph = [r() * 9, r() * 9, r() * 9];
    for (let x = 0; x < W; x++) {
      let h = o.base + o.amp * (0.55 * Math.sin(x * 0.031 + ph[0]) + 0.3 * Math.sin(x * 0.083 + ph[1]) + 0.15 * Math.sin(x * 0.19 + ph[2]));
      if (o.jag) h += ((x * 7) % 5) * 0.5;
      h = Math.max(2, h);
      p.r(x, HZ - h, 1, h, o.col);
      if (o.snow) { const s = h - o.snow - ((x * 5) % 4); if (s > 0) p.r(x, HZ - h, 1, s, '#eef3f8'); }
    }
  }
  function cone(p, cx, h, half, col, snow) {
    for (let x = 0; x < W; x++) {
      const t = Math.max(Math.abs(x - cx), 5) / half;
      if (t >= 1) continue;
      const hh = h * Math.pow(1 - t, 1.25);
      p.r(x, HZ - hh, 1, hh, col);
      if (snow) { const s = hh - (h - snow) - ((x * 3) % 4); if (s > 0) p.r(x, HZ - hh, 1, s, '#eef3f8'); }
    }
  }
  function mesa(p) {
    const col = '#5f6f7a';
    for (let x = 0; x < W; x++) {
      let h = 6;
      if (x >= 60 && x <= 236) h = Math.min(62, 14 + Math.min(x - 60, 236 - x) * 3.2) - (x % 3 === 0 ? 1 : 0);
      h = Math.max(h, 46 - Math.abs(x - 34) * 1.25, 40 - Math.abs(x - 268) * 1.6);
      p.r(x, HZ - h, 1, h, col);
    }
    p.r(90, HZ - 65, 116, 3, '#f3f6fb'); p.r(104, HZ - 67, 82, 2, '#f3f6fb'); p.r(82, HZ - 62, 36, 2, '#f3f6fb');
  }
  function paintBackdrop(p, a, r) {
    switch (a.back) {
      case 'mountains': ridge(p, r, { base: 40, amp: 22, col: '#5d7193', jag: 1 }); break;
      case 'snow': ridge(p, r, { base: 48, amp: 22, col: '#5d7193', jag: 1, snow: 40 }); break;
      case 'hills': ridge(p, r, { base: 20, amp: 9, col: '#5c8a62' }); break;
      case 'dunes': ridge(p, r, { base: 13, amp: 6, col: '#dcb672' }); break;
      case 'fuji': ridge(p, r, { base: 10, amp: 4, col: '#56788a' }); cone(p, 96, 78, 96, '#5d7193', 22); break;
      case 'volcano': ridge(p, r, { base: 12, amp: 5, col: '#5c8a62' }); cone(p, 250, 46, 64, '#5a6f73', 0); break;
      case 'mesa': mesa(p); break;
      default: break;
    }
  }

  /* ---------- streets ---------- */
  const STYLE = {
    modern: { kind: 'tower', walls: ['#56637f', '#66769a', '#475370', '#7384a6', '#3f4a66'], h: [24, 66], near: 26 },
    old: { kind: 'roof', walls: ['#d8c7a0', '#c8b287', '#e3d7b6', '#bda07a', '#cdb99a'], roofs: ['#8c4a39', '#6b5858', '#7b4034', '#59606e'], h: [12, 24], near: 15 },
    bright: { kind: 'roof', walls: ['#d85c4d', '#e7b648', '#4e99b6', '#ece5d2', '#5dac78', '#c96f9a'], roofs: ['#3c495b', '#7b4034', '#2f3a4a'], h: [10, 20], near: 14 },
    gable: { kind: 'gable', walls: ['#8a4e3c', '#a8684a', '#6f4a3f', '#c2a078', '#5d4a45'], h: [20, 30], near: 20 },
    adobe: { kind: 'flat', walls: ['#c88a59', '#d89f65', '#b87649', '#e1b27c', '#cf9a6a'], h: [8, 18], near: 13 },
    white: { kind: 'flat', walls: ['#efe9da', '#e4dbc5', '#f6f1e4', '#ddd3bd'], h: [8, 16], near: 12 }
  };

  function building(p, st, x, w, h, r, far) {
    const wall0 = pick(r, st.walls), wall = far ? mix(wall0, '#a9bbd2', 0.42) : wall0;
    const roof0 = st.roofs ? pick(r, st.roofs) : null, roof = roof0 && far ? mix(roof0, '#a9bbd2', 0.42) : roof0;
    const top = HZ - h, night = p.phase === 'night', dusk = p.phase === 'dusk';
    const lamp = far ? '#d9b65c' : '#ffd86b', pane = mix(wall, '#10182c', 0.35);
    const chance = night ? 0.42 : dusk ? 0.2 : 0;
    p.r(x, top, w, h, wall);
    p.r(x + w - 2, top, 2, h, mix(wall, '#000000', 0.18));
    if (st.kind === 'tower') {
      const cap = r();
      if (cap < 0.3) p.r(x + 2, top - 3, w - 4, 3, wall);
      else if (cap < 0.5) p.r(x + (w >> 1), top - 7, 1, 7, wall);
      for (let wy = top + 3; wy < HZ - 2; wy += 3) {
        for (let wx = x + 2; wx < x + w - 2; wx += 2) {
          if (r() < chance) p.glow(wx, wy, 1, 1, lamp); else p.r(wx, wy, 1, 1, pane);
        }
      }
      return;
    }
    if (st.kind === 'roof') {
      const rh = 3 + Math.floor(r() * 2);
      for (let i = 0; i < rh; i++) p.r(x - 1 + i, top - i - 1, w + 2 - 2 * i, 1, roof);
      if (r() < 0.5) p.r(x + 2, top - rh - 2, 2, 3, mix(wall, '#000000', 0.3));
    } else if (st.kind === 'gable') {
      p.r(x + 1, top - 2, w - 2, 2, wall); p.r(x + 2, top - 4, w - 4, 2, wall); p.r(x + 3, top - 5, w - 6, 1, wall);
      p.r(x + (w >> 1), top - 3, 1, 2, '#f1e8cf');
    } else {
      p.r(x, top - 1, 2, 1, wall); p.r(x + w - 2, top - 1, 2, 1, wall);
      if (r() < 0.25) p.dome(x + (w >> 1), top, 3, wall);
    }
    for (let wy = top + 3; wy < HZ - 3; wy += 5) {
      for (let wx = x + 2; wx < x + w - 3; wx += 4) {
        if (r() < chance) p.glow(wx, wy, 2, 2, lamp); else p.r(wx, wy, 2, 2, pane);
      }
    }
  }

  function paintSkyline(p, a, r, far) {
    const lx = a.lx || 205;
    let x = -6 - Math.floor(r() * 8);
    while (x < W + 4) {
      const st = STYLE[a.style === 'mixed' ? (r() < 0.45 ? 'modern' : 'old') : a.style];
      const narrow = st.kind === 'gable';
      const w = (narrow ? 8 : 11) + Math.floor(r() * (narrow ? 4 : 13));
      let h = far ? (st.h[0] + r() * (st.h[1] - st.h[0])) * (a.far || 1) : 7 + r() * (st.near - 7);
      const off = Math.abs(x + w / 2 - lx);
      if (far && off < 40) h *= 0.55;
      if (!far && off < 46) h = Math.min(h, 9);      // keep the landmark in view
      building(p, st, x, w, Math.max(5, Math.round(h)), r, far);
      x += w + (st.kind === 'tower' || narrow ? 0 : Math.floor(r() * 3));
    }
  }

  /* ---------- landmarks ---------- */
  function tiers(p, x, base, n, w0, w1, body, roof, bh) {
    let y = base;
    for (let i = 0; i < n; i++) {
      const w = Math.round(w0 + (w1 - w0) * (n === 1 ? 0 : i / (n - 1))), rw = w + 8;
      p.r(x - (w >> 1), y - bh, w, bh, body);
      p.r(x - (w >> 1), y - bh, w, 1, mix(body, '#000000', 0.35));
      p.r(x - (rw >> 1), y - bh - 2, rw, 2, roof);
      p.r(x - (rw >> 1) - 1, y - bh - 3, 2, 1, roof);
      p.r(x - (rw >> 1) + rw - 1, y - bh - 3, 2, 1, roof);
      p.r(x - (w >> 1) + 1, y - bh - 3, w - 2, 1, roof);
      y -= bh + 3;
    }
    return y;
  }
  function needle(p, x, base, h, col) {
    const py = base - Math.round(h * 0.74);
    p.r(x - 2, base - Math.round(h * 0.5), 5, Math.round(h * 0.5), col);
    p.r(x - 1, base - h, 3, h, col);
    p.r(x - 5, py, 11, 4, col); p.r(x - 4, py - 2, 9, 2, col); p.r(x - 3, py + 4, 7, 1, col);
    p.r(x, base - h - 12, 1, 12, col);
    if (p.phase === 'day') p.r(x - 5, py + 1, 11, 1, '#39465c');
    else { p.glow(x - 5, py + 1, 11, 1, '#ffd86b'); p.glow(x, base - h - 13, 1, 1, '#ff6b5e'); }
  }
  function sail(p, x, base, w, h, dir) {
    for (let i = 0; i < h; i++) {
      const span = Math.max(1, Math.round(w * Math.sqrt(1 - Math.pow(i / h, 2)))), y = base - i - 1;
      p.r(dir > 0 ? x : x - span, y, span, 1, '#f4f1e6');
      p.r(dir > 0 ? x + span - 1 : x - span, y, 1, 1, '#c8c2b0');
    }
  }
  function archBridge(p, cx, half, rise, col) {
    const deck = HZ - 9, pier = mix(col, '#c9b48a', 0.5);
    for (let dx = -half; dx <= half; dx++) {
      const top = deck - Math.round(rise * (1 - Math.pow(dx / half, 2)));
      p.r(cx + dx, top, 1, 2, col);
      if (dx % 4 === 0) p.r(cx + dx, top, 1, deck - top, col);
    }
    p.r(cx - half - 12, deck, 2 * half + 24, 2, col);
    p.r(cx - half - 4, deck - 8, 5, 17, pier); p.r(cx + half, deck - 8, 5, 17, pier);
  }
  function onion(p, x, base, rad, col, stripe) {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.round(Math.sqrt(rad * rad - dy * dy) * (dy > 0 ? 0.8 : 1));
      p.r(x - w, base - rad + dy, 2 * w + 1, 1, stripe && (dy + rad) % 3 === 0 ? stripe : col);
    }
    p.r(x - 1, base - 2 * rad - 2, 3, 2, col);
    p.r(x, base - 2 * rad - 6, 1, 4, '#d9b84a');
  }

  const LM = {
    lattice(p, x) {
      const c = '#59524a', hi = '#756c60';
      for (let i = 0; i < 72; i++) {
        const w = Math.round(1 + 15 * Math.pow(1 - i / 72, 2.4)), y = HZ - i - 1;
        if (i < 44) {
          p.r(x - w, y, 2, 1, c); p.r(x + w - 1, y, 2, 1, c);
          if (i % 5 === 2) p.r(x - w, y, 2 * w + 1, 1, hi);
        } else p.r(x - w, y, 2 * w + 1, 1, c);
      }
      p.r(x - 12, HZ - 20, 25, 2, c); p.r(x - 6, HZ - 43, 13, 2, c); p.r(x, HZ - 82, 1, 10, c);
      if (p.phase !== 'day') p.glow(x, HZ - 83, 1, 1, '#ff6b5e');
    },
    pagoda(p, x) {
      p.r(x - 16, HZ - 3, 32, 3, '#8f8a80');
      const y = tiers(p, x, HZ - 3, 5, 22, 10, '#b5352d', '#353a45', 6);
      p.r(x, y - 9, 1, 9, '#c9a227'); p.r(x - 1, y - 5, 3, 1, '#c9a227');
    },
    heaven(p, x) {
      p.r(x - 34, HZ - 3, 68, 3, '#e9e4d6'); p.r(x - 28, HZ - 6, 56, 3, '#ddd7c7'); p.r(x - 22, HZ - 9, 44, 3, '#e9e4d6');
      const y = tiers(p, x, HZ - 9, 3, 36, 18, '#a23a2e', '#2f5d9a', 6);
      p.tri(x, y + 1, 10, 7, '#2f5d9a', '#244a7d');
      p.r(x - 1, y - 9, 2, 3, '#d9a441');
    },
    palace(p, x) {
      p.hump(x + 78, HZ, 46, 36, '#4f6a55');
      needle(p, x + 78, HZ - 36, 30, '#cfd6de');
      p.r(x - 30, HZ - 14, 60, 14, '#9a958a');
      p.r(x - 4, HZ - 9, 9, 9, '#3a3630'); p.dome(x, HZ - 9, 4, '#3a3630');
      tiers(p, x, HZ - 14, 2, 52, 40, '#a8483a', '#3d4654', 6);
    },
    laketower(p, x) {
      for (let dx = -18; dx <= 18; dx++) p.r(x - 62 + dx, HZ - 3 - Math.round(6 * (1 - Math.pow(dx / 18, 2))), 1, 2, '#c9372e');
      p.r(x - 13, HZ - 3, 26, 3, '#8f8a80');
      const y = tiers(p, x, HZ - 3, 3, 20, 10, '#d8cdb0', '#6a6a5c', 7);
      p.r(x, y - 7, 1, 7, '#55504a'); p.r(x + 1, y - 7, 4, 3, '#d93a2e');
    },
    pyramids(p, x) {
      p.tri(x - 62, HZ, 30, 34, '#dcb673', '#b58a4e');
      p.tri(x, HZ, 46, 54, '#e2bd7a', '#b98f52');
      p.tri(x + 52, HZ, 20, 22, '#dcb673', '#b58a4e');
      p.r(x - 112, HZ - 6, 17, 6, '#cfa866'); p.r(x - 99, HZ - 12, 5, 7, '#cfa866'); p.r(x - 100, HZ - 11, 7, 3, '#c29a58');
    },
    steps(p, x) {
      for (let s = 0; s < 5; s++) p.r(x - 30 + s * 5, HZ - (s + 1) * 7, 60 - s * 10, 7, s % 2 ? '#a89474' : '#b8a482');
      p.r(x - 4, HZ - 35, 8, 35, '#cdbb98');
      p.r(x - 7, HZ - 43, 14, 8, '#9a8666'); p.r(x - 2, HZ - 41, 4, 6, '#3a3026');
    },
    sugarloaf(p, x) {
      p.hump(x - 150, HZ, 44, 60, '#4f6a55', 0.9);
      p.r(x - 150, HZ - 69, 1, 9, '#f1ede0'); p.r(x - 154, HZ - 67, 9, 1, '#f1ede0');
      p.hump(x - 36, HZ, 26, 30, '#516252');
      p.hump(x, HZ, 21, 66, '#5a6b5c', 0.55);
      p.line(x - 36, HZ - 30, x - 2, HZ - 64, '#22262c', 2);
      p.r(x - 21, HZ - 44, 3, 2, '#e7b648');
    },
    opera(p, x) {
      archBridge(p, x - 114, 46, 22, '#4a4f58');
      p.r(x - 36, HZ - 5, 78, 5, '#b9a98f');
      [[-30, 13, 18], [-16, 16, 25], [0, 18, 31]].forEach(s => sail(p, x + s[0], HZ - 5, s[1], s[2], 1));
      [[38, 10, 13], [28, 8, 9]].forEach(s => sail(p, x + s[0], HZ - 5, s[1], s[2], -1));
    },
    savanna(p, x) {
      FLORA.acacia(p, x - 44, HZ, () => 0.9);
      FLORA.acacia(p, x + 50, HZ, () => 0.5);
    },
    gate(p, x) {
      const st = '#c9a56b', dk = '#6a5233';
      p.r(x - 22, HZ - 34, 45, 34, st);
      p.r(x - 6, HZ - 22, 13, 22, dk); p.dome(x, HZ - 22, 6, dk);
      p.r(x - 18, HZ - 14, 6, 14, dk); p.r(x + 13, HZ - 14, 6, 14, dk);
      p.dome(x, HZ - 34, 8, '#b8935a'); p.r(x, HZ - 46, 1, 4, '#b8935a');
      [-22, -12, 9, 19].forEach(dx => { p.r(x + dx, HZ - 41, 4, 7, st); p.dome(x + dx + 2, HZ - 41, 2, '#b8935a'); });
    },
    onion(p, x) {
      const wall = '#a8483a';
      p.r(x - 30, HZ - 10, 61, 10, '#8f3d32');
      [[-22, 26, '#3f8f5a', '#e8d27a'], [-11, 36, '#c9463a', '#f0ead6'], [11, 34, '#3f6fb5', '#f0ead6'], [22, 24, '#d9a441', '#3f8f5a']].forEach(t => {
        p.r(x + t[0] - 4, HZ - t[1], 9, t[1], wall); p.r(x + t[0] - 4, HZ - t[1] + 2, 9, 1, '#f0ead6');
        onion(p, x + t[0], HZ - t[1], 5, t[2], t[3]);
      });
      p.r(x - 5, HZ - 40, 11, 40, wall); p.r(x - 5, HZ - 38, 11, 1, '#f0ead6');
      p.tri(x, HZ - 40, 6, 22, wall, '#8a3a2e');
      onion(p, x, HZ - 62, 2, '#d9a441');
    },
    deco(p, x) {
      [[-28, 14, 50, '#6a7690'], [0, 16, 70, '#7d8aa6'], [26, 12, 42, '#5d6984']].forEach(t => {
        const l = x + t[0] - (t[1] >> 1), top = HZ - t[2];
        p.r(l, top, t[1], t[2], t[3]);
        p.r(l + 2, top - 6, t[1] - 4, 6, t[3]); p.r(l + 4, top - 11, t[1] - 8, 5, t[3]);
        p.r(x + t[0], top - 22, 1, 11, t[3]);
        for (let wy = top + 2; wy < HZ - 2; wy += 3) {
          for (let wx = l + 2; wx < l + t[1] - 2; wx += 2) {
            if (p.phase !== 'day' && (wx * 7 + wy * 13) % 5 < 2) p.glow(wx, wy, 1, 1, '#ffd86b');
            else p.r(wx, wy, 1, 1, '#3d4862');
          }
        }
      });
    },
    needle(p, x) { needle(p, x, HZ, 74, '#c9cfd8'); },
    windmill(p, x) {
      for (let i = 0; i < 27; i++) { const w = Math.round(7 - i * 0.13); p.r(x - w, HZ - i - 1, 2 * w + 1, 1, '#6b4a3a'); }
      p.r(x - 1, HZ - 8, 3, 8, '#2f241c'); p.r(x - 4, HZ - 31, 9, 4, '#3d3a36');
      for (let k = 1; k <= 18; k++) {
        const t = k > 5 ? 2 : 1;
        p.r(x + k, HZ - 29 - k, t, 1, '#e9e2cf'); p.r(x - k, HZ - 29 + k, t, 1, '#e9e2cf');
        p.r(x - k, HZ - 29 - k, 1, t, '#e9e2cf'); p.r(x + k, HZ - 29 + k, 1, t, '#e9e2cf');
      }
    },
    stupa(p, x) {
      const flags = ['#3f6fb5', '#f4f1e6', '#c9463a', '#3f8f5a', '#e7b648'];
      p.r(x - 30, HZ - 6, 61, 6, '#e9e4d6');
      p.dome(x, HZ - 6, 22, '#f4f1e6');
      p.r(x - 5, HZ - 36, 11, 8, '#d9a441'); p.r(x - 3, HZ - 33, 2, 1, '#2b3a8a'); p.r(x + 2, HZ - 33, 2, 1, '#2b3a8a');
      for (let i = 0; i < 13; i++) { const w = Math.round(5 - i * 0.35); p.r(x - w, HZ - 37 - i, 2 * w + 1, 1, i % 2 ? '#c9952f' : '#d9a441'); }
      p.r(x - 2, HZ - 51, 5, 1, '#d9a441'); p.r(x, HZ - 55, 1, 4, '#d9a441');
      [-1, 1].forEach(s => { for (let k = 2; k < 58; k += 3) p.r(x + s * k, HZ - 50 + Math.round(k * 0.72), 2, 2, flags[(k / 3 | 0) % 5]); });
    },
    prang(p, x) {
      const spire = (cx, h, w0) => {
        for (let i = 0; i < h; i++) {
          const w = Math.round(1 + w0 * Math.pow(1 - i / h, 1.6) + (i % 6 < 2 ? 1 : 0));
          p.r(cx - w, HZ - i - 1, 2 * w + 1, 1, i % 6 < 2 ? '#efe6cd' : '#cfc3a5');
        }
        p.r(cx, HZ - h - 6, 1, 6, '#d9a441');
      };
      p.r(x - 36, HZ - 5, 73, 5, '#d8cdb0');
      [-28, 28].forEach(dx => spire(x + dx, 28, 5));
      spire(x, 62, 12);
    },
    minaret(p, x) {
      const c = '#c57e52';
      p.r(x + 7, HZ - 14, 42, 14, '#cf8d60'); p.r(x + 7, HZ - 16, 42, 2, '#3f8f8a');
      p.r(x - 6, HZ - 52, 13, 52, c); p.r(x - 6, HZ - 46, 13, 2, '#3f8f8a');
      p.r(x - 7, HZ - 54, 15, 2, c); [-7, -3, 1, 5].forEach(dx => p.r(x + dx, HZ - 56, 2, 2, c));
      p.r(x - 3, HZ - 64, 7, 10, c); p.dome(x, HZ - 64, 3, c); p.r(x, HZ - 73, 1, 6, '#d9a441');
      p.r(x - 1, HZ - 36, 3, 6, '#7a4a30'); p.r(x - 1, HZ - 24, 3, 6, '#7a4a30');
    },
    church(p, x) {
      p.r(x - 3, HZ - 60, 7, 60, '#cfd3d8');
      for (let k = 1; k <= 9; k++) {
        const h = Math.round(56 - k * 5.5), col = k % 2 ? '#bfc5cc' : '#cfd3d8';
        p.r(x - 3 - k * 3, HZ - h, 3, h, col); p.r(x + 1 + k * 3, HZ - h, 3, h, col);
      }
      p.r(x, HZ - 67, 1, 7, '#cfd3d8'); p.r(x - 1, HZ - 65, 3, 1, '#cfd3d8');
      p.r(x - 1, HZ - 50, 3, 4, '#39465c');
    },
    capitol(p, x) {
      p.r(x - 40, HZ - 16, 81, 16, '#e6dcc6');
      for (let k = 0; k < 20; k++) p.r(x - 38 + k * 4, HZ - 14, 1, 12, '#b9ad93');
      p.r(x - 12, HZ - 22, 25, 22, '#ece3cf'); p.tri(x, HZ - 22, 13, 5, '#ece3cf', '#d9cdb2');
      p.r(x - 8, HZ - 38, 17, 12, '#ddd2ba');
      for (let dy = 0; dy < 15; dy++) { const w = Math.round(9 * Math.sqrt(1 - Math.pow(dy / 15, 2))); p.r(x - w, HZ - 39 - dy, 2 * w + 1, 1, '#d9cdb2'); }
      p.r(x - 2, HZ - 58, 5, 5, '#ece3cf'); p.r(x, HZ - 63, 1, 5, '#d9a441');
    },
    obelisk(p, x) {
      p.r(x - 9, HZ - 4, 19, 4, '#cfc9b8');
      for (let i = 0; i < 56; i++) { const w = i < 30 ? 3 : 2; p.r(x - w, HZ - 4 - i - 1, w + 1, 1, '#f1ede0'); p.r(x + 1, HZ - 4 - i - 1, w, 1, '#d5cfbd'); }
      p.tri(x + 0.5, HZ - 60, 3, 6, '#f1ede0', '#d5cfbd');
    },
    trio(p, x) {
      [-20, 0, 20].forEach(dx => {
        p.r(x + dx - 5, HZ - 52, 11, 52, '#8fa3bd');
        for (let wy = HZ - 49; wy < HZ - 2; wy += 3) {
          if (p.phase === 'day') p.r(x + dx - 4, wy, 9, 1, '#6c82a0');
          else for (let wx = x + dx - 4; wx < x + dx + 5; wx += 2) p.glow(wx, wy, 1, 1, (wx + wy) % 3 ? '#ffd86b' : '#56698a');
        }
      });
      p.r(x - 30, HZ - 57, 66, 4, '#cfd8e3'); p.r(x + 34, HZ - 58, 6, 3, '#cfd8e3');
      for (let k = 0; k < 9; k++) p.r(x - 26 + k * 7, HZ - 59, 3, 2, '#3f8f5a');
      [-62, -50, 58].forEach(dx => {
        p.r(x + dx, HZ - 22, 2, 22, '#7a5a7a'); p.r(x + dx - 5, HZ - 25, 12, 3, '#b06aa0'); p.r(x + dx - 3, HZ - 27, 8, 2, '#b06aa0');
        if (p.phase !== 'day') p.glow(x + dx - 5, HZ - 24, 12, 1, '#ff9be0');
      });
    },
    cathedral(p, x) {
      p.r(x - 14, HZ - 26, 29, 26, '#e3c98f'); p.tri(x + 0.5, HZ - 26, 10, 6, '#e3c98f', '#cdb47c');
      [-24, 15].forEach(dx => {
        p.r(x + dx, HZ - 40, 10, 40, '#d9bd82'); p.dome(x + dx + 5, HZ - 40, 4, '#b8935a');
        p.r(x + dx + 5, HZ - 50, 1, 6, '#6a4a2a'); p.r(x + dx + 4, HZ - 48, 3, 1, '#6a4a2a');
        p.r(x + dx + 3, HZ - 34, 4, 6, '#6a4a2a');
      });
      p.r(x - 3, HZ - 12, 7, 12, '#6a4a2a'); p.disc(x, HZ - 19, 2, '#6a4a2a');
    },
    spires(p, x) {
      p.r(x - 4, HZ - 30, 9, 30, '#b5764a');
      for (let i = 0; i < 40; i++) { const w = Math.round(3 * (1 - i / 40)); p.r(x - w, HZ - 31 - i, 2 * w + 1, 1, '#2f3a3a'); }
      p.r(x + 76, HZ - 48, 9, 48, '#9a5a3c'); p.r(x + 75, HZ - 52, 11, 4, '#3f7a6a');
      p.r(x + 80, HZ - 60, 1, 8, '#d9a441'); p.glow(x + 79, HZ - 61, 3, 1, '#ffd86b');
      p.r(x + 85, HZ - 22, 46, 22, '#a8634a');
      for (let k = 0; k < 9; k++) p.r(x + 88 + k * 5, HZ - 16, 2, 8, '#5d3a2c');
    },
    parthenon(p, x) {
      p.hump(x, HZ, 62, 38, '#8a8266', 0.35);
      const y = HZ - 37;
      p.r(x - 21, y - 2, 43, 2, '#e9e2cf');
      for (let k = 0; k < 8; k++) p.r(x - 20 + Math.round(k * 5.55), y - 14, 2, 12, '#efe9da');
      p.r(x - 21, y - 17, 43, 3, '#e9e2cf');
      p.tri(x + 0.5, y - 17, 21, 6, '#efe9da', '#d9d2bf');
    },
    colosseum(p, x) {
      const tops = {};
      for (let dx = -38; dx <= 38; dx++) {
        const t = dx / 38;
        let top = 30 * (0.72 + 0.28 * Math.sqrt(1 - t * t));
        if (dx > 6) top *= 0.72;
        tops[dx] = top;
        p.r(x + dx, HZ - top, 1, top, dx > 6 ? '#bfa57c' : '#c9ae84');
      }
      for (let tier = 0; tier < 3; tier++) {
        for (let dx = -34; dx <= 34; dx += 5) {
          const ay = 6 + tier * 8;
          if (tops[dx] > ay + 3) { p.r(x + dx, HZ - ay, 2, 5, '#6f5a3e'); p.r(x + dx, HZ - ay - 1, 2, 1, '#8a7250'); }
        }
      }
    },
    mosque(p, x) {
      p.r(x - 26, HZ - 18, 53, 18, '#b9b0a2');
      p.dome(x - 20, HZ - 18, 8, '#8f97a6'); p.dome(x + 20, HZ - 18, 8, '#8f97a6');
      p.r(x - 12, HZ - 24, 25, 6, '#b9b0a2'); p.dome(x, HZ - 24, 14, '#8f97a6');
      p.r(x, HZ - 43, 1, 5, '#d9a441');
      [-42, -33, 33, 42].forEach(dx => {
        p.r(x + dx, HZ - 54, 2, 54, '#d6cfc2'); p.r(x + dx - 1, HZ - 38, 4, 1, '#d6cfc2');
        p.r(x + dx, HZ - 60, 1, 6, '#6f7786');
      });
      for (let k = 0; k < 8; k++) p.r(x - 23 + k * 6, HZ - 12, 2, 5, '#6f675c');
    },
    clock(p, x) {
      const st = '#b89b62', dk = '#7d6a42';
      p.r(x + 6, HZ - 22, 72, 22, st);
      for (let k = 0; k < 17; k++) p.r(x + 8 + k * 4, HZ - 18, 1, 9, dk);
      for (let k = 0; k < 7; k++) p.r(x + 10 + k * 10, HZ - 28, 2, 6, st);
      p.r(x + 72, HZ - 40, 9, 40, st); p.tri(x + 76.5, HZ - 40, 5, 8, '#4a4f5a', '#3a3f4a');
      p.r(x - 5, HZ - 58, 11, 58, st); p.r(x - 6, HZ - 44, 13, 1, dk); p.r(x - 6, HZ - 58, 13, 1, dk);
      if (p.phase === 'day') p.disc(x, HZ - 51, 3, '#f5efd8'); else p.disc(x, HZ - 51, 3, '#fff2a8', true);
      p.glow(x, HZ - 53, 1, 3, '#222222'); p.glow(x, HZ - 51, 2, 1, '#222222');
      p.tri(x + 0.5, HZ - 58, 6, 12, '#4a4f5a', '#3a3f4a'); p.r(x, HZ - 75, 1, 5, '#d9a441');
    },
    lighthouse(p, x) {
      p.r(x - 3, HZ - 24, 7, 24, '#f1ede0'); p.r(x - 3, HZ - 18, 7, 3, '#c9463a'); p.r(x - 3, HZ - 9, 7, 3, '#c9463a');
      p.r(x - 4, HZ - 26, 9, 2, '#3a3a3a'); p.r(x - 2, HZ - 32, 5, 2, '#c9463a'); p.r(x, HZ - 34, 1, 2, '#3a3a3a');
      if (p.phase === 'day') p.r(x - 2, HZ - 30, 5, 4, '#cfe8ff');
      else {
        p.glow(x - 2, HZ - 30, 5, 4, '#fff2a8');
        p.glow(x - 46, HZ - 29, 44, 2, 'rgba(255,242,168,0.28)'); p.glow(x - 70, HZ - 30, 26, 4, 'rgba(255,242,168,0.14)');
      }
    },
    cable(p, x) {
      const c = '#cfd6de';
      p.r(x - 76, HZ - 11, 152, 2, '#8a94a3');
      for (let k = -4; k <= 4; k++) p.r(x + k * 18 - 1, HZ - 9, 2, 9, '#8a94a3');
      for (let k = 1; k <= 6; k++) { p.line(x, HZ - 54 + k * 3, x - k * 12, HZ - 11, c); p.line(x, HZ - 54 + k * 3, x + k * 12, HZ - 11, c); }
      p.r(x - 1, HZ - 58, 3, 58, c);
      if (p.phase !== 'day') p.glow(x, HZ - 59, 1, 1, '#ff6b5e');
    }
  };

  /* ---------- trees ---------- */
  const FLORA = {
    palm(p, x, y, r) {
      const h = 16 + Math.floor(r() * 8), g = '#2f7d4b';
      for (let i = 0; i < h; i++) p.r(x + Math.round(Math.sin(i / h * 1.3) * 3), y - i, 2, 1, '#6b4a2f');
      const tx = x + 3, ty = y - h;
      [[-8, 1, 4], [-6, 0, 5], [-4, -1, 4], [-1, -2, 4], [2, -1, 4], [3, 0, 5], [6, 1, 4]].forEach(f => p.r(tx + f[0], ty + f[1], f[2], 1, g));
      p.r(tx - 9, ty + 2, 2, 2, g); p.r(tx + 9, ty + 2, 2, 2, g); p.r(tx - 1, ty - 1, 3, 3, g);
    },
    round(p, x, y, r, leaf, hi) {
      const h = 7 + Math.floor(r() * 4);
      p.r(x, y - h, 2, h, '#5a4332');
      p.disc(x + 1, y - h - 3, 5, leaf || '#3f7d4a');
      p.r(x - 2, y - h - 6, 3, 2, hi || '#5a9a5c');
    },
    blossom(p, x, y, r) { FLORA.round(p, x, y, r, '#e79ab8', '#f7c6d8'); },
    jacaranda(p, x, y, r) { FLORA.round(p, x, y, r, '#8f6cc0', '#b79be0'); },
    conifer(p, x, y, r) {
      const h = 14 + Math.floor(r() * 8);
      p.r(x, y - 3, 1, 3, '#4a3828');
      for (let i = 0; i < h; i++) { const w = Math.round((h - i) / h * 4); p.r(x - w, y - 3 - i, 2 * w + 1, 1, i % 4 === 3 ? '#2a5540' : '#1f4433'); }
    },
    umbrella(p, x, y, r) {
      const h = 16 + Math.floor(r() * 6);
      p.r(x, y - h, 2, h, '#5a4332');
      p.r(x - 7, y - h - 3, 16, 3, '#2e5d3a'); p.r(x - 5, y - h - 5, 12, 2, '#2e5d3a'); p.r(x - 4, y - h, 10, 1, '#244a2e');
    },
    acacia(p, x, y, r) {
      const h = 12 + Math.floor(r() * 6);
      p.r(x, y - h, 2, h, '#5a4332'); p.r(x - 3, y - h, 8, 1, '#5a4332');
      p.r(x - 10, y - h - 3, 22, 3, '#557d3a'); p.r(x - 7, y - h - 5, 16, 2, '#557d3a');
    },
    cactus(p, x, y, r) {
      const h = 9 + Math.floor(r() * 5), g = '#3f7a4a';
      p.r(x, y - h, 3, h, g);
      p.r(x - 3, y - h + 5, 3, 2, g); p.r(x - 3, y - h + 2, 2, 3, g);
      p.r(x + 3, y - h + 7, 3, 2, g); p.r(x + 4, y - h + 4, 2, 3, g);
    }
  };

  /* ---------- foreground ---------- */
  function lamp(p, x, y) {
    p.r(x, y - 15, 1, 15, '#2a2a33'); p.r(x - 1, y - 16, 3, 1, '#2a2a33');
    if (p.phase === 'day') { p.r(x - 1, y - 15, 3, 2, '#d8d2b8'); return; }
    p.glow(x - 1, y - 15, 3, 2, '#ffe9a0');
    p.glow(x - 2, y - 13, 5, 1, 'rgba(255,220,130,0.35)');
    p.glow(x - 3, y - 12, 7, 1, 'rgba(255,220,130,0.18)');
  }
  function sailboat(p, x, y, big) {
    const s = big ? 9 : 6, m = x + (s >> 1) + 1;
    p.r(x, y, s + 3, 2, '#e9e2cf'); p.r(x + 1, y + 2, s + 1, 1, '#8a5a3a');
    p.r(m, y - s, 1, s, '#3a3a3a');
    for (let i = 0; i < s - 1; i++) p.r(m + 1, y - s + i + 1, Math.ceil((i + 1) / 2), 1, '#ffffff');
  }
  function giraffe(p, x, y) {
    const c = '#d9a441', sp = '#8a5a2a';
    [0, 2, 7, 9].forEach(dx => p.r(x + dx, y - 9, 1, 9, c));
    p.r(x, y - 14, 10, 5, c); p.r(x - 1, y - 13, 1, 5, c);
    for (let i = 0; i < 13; i++) p.r(x + 9 + Math.round(i * 0.3), y - 14 - i, 2, 1, c);
    p.r(x + 12, y - 29, 5, 2, c); p.r(x + 13, y - 31, 1, 2, sp);
    p.r(x + 2, y - 13, 2, 1, sp); p.r(x + 6, y - 12, 2, 1, sp); p.r(x + 4, y - 11, 1, 1, sp);
    p.r(x + 10, y - 18, 1, 1, sp); p.r(x + 11, y - 22, 1, 1, sp);
  }
  function statue(p, x, y) {
    p.r(x - 10, y, 21, 3, '#7d8a6a'); p.r(x - 5, y - 6, 11, 6, '#9a8f7d'); p.r(x - 3, y - 14, 7, 8, '#b5a98f');
    p.r(x - 1, y - 24, 4, 10, '#5fae9a'); p.r(x, y - 27, 2, 3, '#5fae9a'); p.r(x - 1, y - 28, 4, 1, '#5fae9a');
    p.r(x + 2, y - 31, 1, 7, '#5fae9a');
    if (p.phase === 'day') p.r(x + 2, y - 33, 2, 2, '#e7b648'); else p.glow(x + 2, y - 33, 2, 2, '#ffd86b');
  }
  const FRONT = {
    savanna(p, a) { giraffe(p, (a.lx || 205) - 6, HZ + 15); },
    deco(p, a) { statue(p, (a.lx || 205) - 152, HZ + 12); }
  };

  function paintGround(p, a, r) {
    if (a.water) {
      const wc = '#2b6a9b';
      p.r(0, HZ, W, 3, '#877d6c');
      p.r(0, HZ + 3, W, H - HZ - 3, wc);
      p.r(0, HZ + 3, W, 1, mix(wc, '#000000', 0.25));
      for (let y = HZ + 6; y < H; y += 3) {
        const n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) p.r(r() * W, y + (i & 1), 5 + r() * 16, 1, mix(wc, '#ffffff', 0.22));
      }
      const boats = a.boats || 2;
      for (let i = 0; i < boats; i++) sailboat(p, 20 + r() * (W - 40), HZ + 16 + r() * 30, r() < 0.5);
      return;
    }
    const g = a.ground || '#6d665c';
    p.r(0, HZ, W, H - HZ, g);
    p.r(0, HZ, W, 2, mix(g, '#000000', 0.2));
    for (let i = 0; i < 40; i++) p.r(r() * W, HZ + 3 + r() * 15, 2, 1, mix(g, '#ffffff', 0.12));
    p.r(0, HZ + 20, W, 16, mix(g, '#1c1c24', 0.5));
    for (let x = 6; x < W; x += 22) p.r(x, HZ + 27, 9, 1, '#d9cfa8');
    for (let i = 0; i < 30; i++) p.r(r() * W, HZ + 38 + r() * 16, 2, 1, mix(g, '#000000', 0.15));
    for (let x = 30; x < W; x += 76) lamp(p, x, HZ + 19);
  }

  function paintFlora(p, a, r) {
    if (!a.flora) return;
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const x = Math.round(12 + r() * (W - 24)), y = Math.round(a.water ? HZ + 2 : HZ + 8 + r() * 8);
      if (Math.abs(x - (a.lx || 205)) < 24) continue;
      FLORA[a.flora](p, x, y, r);
    }
  }

  /* ---------- a whole city view ---------- */
  function scene(ctx, city, hour) {
    const a = city.art, seed = hashStr(city.id), phase = phaseOf(hour), p = new Painter(ctx, phase);
    paintSky(ctx, phase);
    paintLights(p, hour, rngFrom(seed + 1));
    if (a.aurora && phase === 'night') paintAurora(p, rngFrom(seed + 2));
    paintClouds(p, rngFrom(seed + 3));
    paintBackdrop(p, a, rngFrom(seed + 4));
    paintSkyline(p, a, rngFrom(seed + 5), true);
    if (LM[a.lm]) LM[a.lm](p, a.lx || 205, a);
    paintSkyline(p, a, rngFrom(seed + 6), false);
    paintGround(p, a, rngFrom(seed + 7));
    paintFlora(p, a, rngFrom(seed + 8));
    if (FRONT[a.lm]) FRONT[a.lm](p, a);
  }

  /* ---------- faces ---------- */
  const SKINS = ['#f2d3b1', '#e0ac84', '#c68958', '#a8703f', '#7c4f2a', '#5a3a20'];
  const HAIRS = ['#1d1a1a', '#3b2a1e', '#6a4326', '#a7743a', '#8c8c94', '#d8d2c4', '#7a2f22'];
  const CLOTHS = ['#3f5a8a', '#7a3f4a', '#3f7a62', '#6a5a8a', '#8a6a3a', '#4a4f5a'];
  const BACKS = {
    hotel: '#5a2f3a', cafe: '#5a4632', kiosk: '#3f4a5a', market: '#6a4a2a', station: '#2f4a5a', bank: '#2f5a4a',
    garage: '#4a4a52', harbor: '#2a4f6a', library: '#4a3a2a', museum: '#3a3550', embassy: '#3a4a3a', mug: '#3a3f4f'
  };

  function portrait(ctx, seed, type, opt) {
    const r = rngFrom(seed), o = opt || {}, bg = BACKS[type] || '#33405a';
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    R(0, 0, 40, 40, bg);
    for (let y = 3; y < 40; y += type === 'mug' ? 6 : 4) R(0, y, 40, 1, mix(bg, type === 'mug' ? '#ffffff' : '#000000', 0.16));
    const skin = pick(r, SKINS), shade = mix(skin, '#3a1f10', 0.28), hair = pick(r, HAIRS), cloth = pick(r, CLOTHS);
    const style = Math.floor(r() * 5), specs = r(), whisk = r();

    R(6, 31, 28, 9, cloth); R(9, 29, 22, 2, cloth);
    R(17, 25, 6, 6, shade);
    if (o.scarf) { R(11, 27, 18, 4, o.scarf); R(22, 30, 5, 8, o.scarf); R(11, 30, 18, 1, mix(o.scarf, '#000000', 0.25)); }
    else R(18, 30, 4, 3, mix(cloth, '#ffffff', 0.5));
    R(13, 9, 14, 17, skin); R(12, 11, 16, 13, skin);
    R(11, 16, 1, 4, shade); R(28, 16, 1, 4, shade);

    if (style === 0) { R(12, 7, 16, 5, hair); R(12, 11, 2, 4, hair); R(26, 11, 2, 4, hair); }
    else if (style === 1) { R(11, 7, 18, 5, hair); R(10, 10, 3, 17, hair); R(27, 10, 3, 17, hair); }
    else if (style === 2) { R(13, 8, 14, 2, hair); }
    else if (style === 3) { R(12, 7, 16, 5, hair); R(17, 3, 6, 5, hair); }
    else { for (let i = 0; i < 9; i++) R(11 + i * 2, 6 + (i % 2), 3, 5, hair); R(11, 10, 2, 5, hair); R(27, 10, 2, 5, hair); }

    if (type === 'station' || type === 'harbor' || type === 'museum') {
      const cap = type === 'museum' ? '#2a3350' : type === 'harbor' ? '#1f3a4a' : '#7a2f2f';
      R(11, 5, 18, 5, cap); R(10, 10, 20, 1, mix(cap, '#000000', 0.4)); R(18, 6, 4, 2, '#e7b648');
    } else if (type === 'hotel') { R(13, 4, 14, 5, '#8a2f3a'); R(13, 8, 14, 1, '#e7b648'); }
    else if (type === 'market') { R(7, 9, 26, 2, '#d9b56a'); R(13, 4, 14, 5, '#d9b56a'); R(13, 7, 14, 1, '#8a5a3a'); }
    else if (type === 'garage') { R(12, 7, 16, 4, '#c9463a'); R(27, 9, 4, 2, '#c9463a'); }
    else if (type === 'kiosk') { R(11, 6, 18, 3, '#5a5248'); R(9, 9, 13, 1, '#463f37'); }

    R(15, 14, 4, 1, hair); R(21, 14, 4, 1, hair);
    R(16, 16, 2, 2, '#16161d'); R(22, 16, 2, 2, '#16161d');
    if (specs < 0.3 || type === 'library') {
      const f = '#22222a';
      [14, 21].forEach(x => { R(x, 15, 6, 1, f); R(x, 18, 6, 1, f); R(x, 15, 1, 4, f); R(x + 5, 15, 1, 4, f); });
      R(19, 16, 3, 1, f);
    }
    R(19, 18, 2, 3, shade);
    if (whisk < 0.14) { R(13, 21, 14, 5, hair); R(17, 23, 6, 1, '#7a2f2f'); }
    else { R(17, 23, 6, 1, '#7a2f2f'); if (whisk < 0.32) R(16, 21, 8, 1, hair); }
  }

  function mugshot(ctx, suspect) {
    const scarf = MB.Engine.traitValue('scarf', suspect.traits.scarf).color;
    portrait(ctx, hashStr(suspect.id + 'mug'), 'mug', { scarf: scarf });
  }

  /* ---------- world map ---------- */
  const LAND = [
    // North and Central America
    [-168, 66, -162, 70, -150, 71, -140, 70, -128, 70, -115, 68, -100, 68, -95, 72, -85, 70, -82, 66, -88, 64, -94, 60, -93, 57, -85, 55, -80, 52, -79, 55, -77, 60, -78, 62, -72, 62, -65, 60, -62, 57, -56, 52, -60, 47, -65, 45, -70, 43, -74, 40, -76, 35, -81, 31, -80, 25, -82, 28, -84, 30, -90, 29, -97, 26, -98, 20, -95, 18, -91, 19, -87, 21, -88, 16, -84, 15, -83, 10, -80, 8, -77, 8, -78, 7, -83, 8, -86, 12, -92, 15, -97, 16, -105, 20, -110, 23, -112, 29, -115, 31, -117, 33, -121, 36, -124, 41, -124, 48, -130, 54, -135, 58, -145, 60, -152, 58, -160, 56, -165, 60],
    // Greenland and the Arctic islands
    [-55, 60, -44, 60, -40, 65, -22, 70, -20, 76, -28, 80, -62, 80, -70, 77, -56, 70, -52, 65],
    [-68, 62.5, -62, 66.5, -68, 70, -78, 73.5, -88, 73.5, -85, 70, -78, 68, -75, 65],
    [-118, 73, -105, 73.5, -100, 70, -110, 69, -118, 71],
    [-95, 80, -65, 80, -75, 76.5, -90, 76.5],
    [-59, 48, -56, 51.5, -53, 47],
    // South America
    [-77, 8, -72, 12, -62, 10, -52, 5, -50, 0, -44, -2, -35, -6, -37, -12, -39, -18, -42, -23, -48, -26, -53, -33, -57, -36, -62, -39, -65, -45, -68, -52, -67, -55, -72, -54, -75, -48, -73, -40, -72, -30, -70, -18, -76, -14, -81, -5, -80, 0, -78, 3],
    // Europe and Asia
    [-9, 37, -9, 43, -2, 43.5, -1, 46, -4, 48, 0, 49.5, 4, 52, 8, 54, 8, 57, 10, 57.5, 10, 54, 14, 54, 19, 54.5, 21, 57, 24, 58, 24, 59.5, 30, 60, 23, 60, 21, 61, 21, 63, 25, 65.5, 22, 65.8, 17, 62, 18, 60, 16, 56.5, 13, 55.5, 11, 58, 8, 58, 5, 60, 5, 62, 10, 64, 14, 68, 20, 70, 26, 71, 31, 70, 41, 67, 40, 64.5, 44, 66, 47, 68, 55, 68.5, 60, 69, 68, 69, 73, 72, 80, 73, 90, 75.5, 105, 77.5, 113, 74, 130, 71.5, 140, 73, 160, 70, 170, 70, 180, 68.5, 180, 65, 178, 62, 170, 60, 163, 58, 162, 55, 156, 51, 156, 57, 155, 59, 143, 59, 135, 54.5, 141, 52, 140, 48, 133, 43, 129, 41, 129.5, 36, 127, 34.5, 126, 37, 125, 39.5, 121, 39, 122, 37, 119, 35, 121, 32, 122, 29, 119, 25, 114, 22, 110, 21, 108, 21.5, 106, 19, 108, 15.5, 109, 12, 106, 9, 104, 10, 100, 13.5, 99, 10, 103, 2, 104, 1.3, 101, 3, 98, 8, 98, 13, 97, 16.5, 94, 16, 94, 19, 91, 22, 89, 22, 86.5, 20, 82, 16, 80, 13.5, 80, 10, 77.5, 8, 76, 10, 73, 16, 72.5, 21, 70, 21, 67, 24, 62, 25, 57, 25.5, 59.5, 22.5, 55, 17, 52, 16, 45, 12.5, 43, 13, 42.5, 16, 39, 21, 35, 28, 34.5, 29.5, 34.3, 31.3, 36, 36, 30, 36.5, 27, 37, 26.5, 39.5, 29, 41, 33, 42, 38, 41, 41.5, 41.5, 39, 44, 37, 45, 38, 47, 35, 46, 33, 46, 33.5, 44.5, 31, 46.5, 29, 45, 28, 43, 28, 41.5, 26, 40.8, 23.5, 40, 23, 38, 22.5, 36.5, 21, 38, 19.5, 40.5, 19, 42, 15, 44.5, 13.5, 45.5, 12.5, 44, 16, 41.5, 18.5, 40, 16.5, 39, 16, 38, 15.5, 40, 12.5, 41.7, 10.3, 43.5, 8.8, 44.4, 6, 43, 3, 43.3, 3, 41.8, 0, 40, -0.5, 38, -2, 36.8, -5.5, 36],
    // Africa
    [32.5, 31.3, 34.2, 31.3, 34.4, 29.6, 34, 27, 35.5, 24, 37, 21, 38, 18, 40, 15, 43, 12, 43.5, 11.5, 51, 12, 48, 5, 44, 1.5, 41, -2, 39.5, -5, 39, -8, 40.5, -11, 40.5, -15, 36, -19, 35, -24, 32.5, -26, 31, -29.5, 27, -34, 20, -35, 18.3, -34, 18, -32, 15, -27, 12, -18, 13.5, -12, 12, -5, 9, -1, 9.5, 4, 6, 4.5, 3, 6.3, -4, 5, -8, 4.5, -13, 8.5, -17, 14.5, -16, 20, -17, 21, -13, 27.5, -10, 30, -9.5, 33, -6, 35.8, -2, 35, 3, 37, 10, 37, 11, 34, 15, 32.5, 20, 31, 20, 33, 25, 32, 29, 31],
    [49.5, -12, 50.5, -16, 47, -25, 44, -25, 43.5, -21, 44.5, -16, 48, -13],
    // Islands of Europe
    [-5.5, 50, 1, 51, 1.5, 53, -1.5, 55, -2, 57.5, -3, 58.6, -5, 58.5, -6, 56, -3, 54, -4.5, 53, -5, 51.7],
    [-10, 52, -6, 52, -6, 55, -8, 55.2, -10, 54],
    [-24, 65.5, -22, 64, -18, 63.4, -14, 64.5, -15, 66, -20, 66.3],
    [52, 71, 56, 74, 67, 77, 60, 73],
    [12.5, 38, 15.5, 38.2, 15, 36.7],
    [8.2, 41, 9.7, 41, 9.5, 39.1, 8.5, 39],
    // Islands of Asia
    [130, 31.5, 131, 33.5, 135, 34, 137, 34.7, 140, 35.3, 141, 38, 141.5, 41, 140, 41, 139.5, 38.5, 136.5, 37, 133, 35.5, 131, 34, 129.5, 33],
    [140, 42, 141.5, 43, 141.7, 45.3, 145, 44, 145.3, 43, 143, 42],
    [142, 46, 143, 50, 142.5, 54, 143.5, 50, 143.2, 46.5],
    [120, 23, 121.5, 25, 121, 22],
    [120, 18, 122, 18.5, 124, 13, 121, 13.5, 120, 15],
    [122, 7.5, 126, 9, 126, 6.5, 124, 6],
    [109, 1.5, 113, 3.5, 117, 7, 119, 5, 117.5, 1, 116, -4, 110, -3],
    [95, 5.5, 98, 3.5, 104, -2, 106, -6, 104.5, -6, 100, -2, 95.5, 4],
    [105.5, -6.5, 110, -6.8, 114.5, -7.5, 114, -8.5, 106, -7.5],
    [119.5, 0.5, 125, 1.5, 121, -1, 123, -5, 120, -5.5, 119, -3],
    [131, -1, 135, -3.5, 141, -2.5, 146, -5.5, 150.5, -10.5, 147, -10, 143, -8.5, 138, -8, 133, -4, 131, -1.5],
    [80, 9.8, 81.8, 7.5, 80.5, 6, 79.8, 8],
    // Australia and New Zealand
    [114, -22, 113.5, -26, 115, -34, 118, -35, 124, -33, 129, -31.5, 134, -32.5, 138, -35, 140, -38, 146, -39, 150, -37.5, 153, -30, 153, -25, 146, -19, 145, -15, 142.5, -10.8, 141, -16, 139, -17.5, 136, -15, 136.5, -12, 131, -11.5, 129, -15, 125, -14, 122, -18],
    [145, -41, 148, -41, 147.5, -43.5, 146, -43.5],
    [172.7, -34.5, 175.5, -36.5, 178.5, -37.7, 177, -39.5, 175.3, -41.6, 173.8, -39.3, 174.7, -37.5],
    [172.7, -40.6, 174.3, -41.8, 171, -45, 168.3, -46.6, 166.5, -45.8, 170, -43],
    // Caribbean
    [-85, 22, -80, 23.2, -75, 20.7, -74.2, 20.1, -77.5, 19.9, -82, 22.4],
    [-74.4, 19.8, -70, 19.9, -68.4, 18.6, -71.5, 17.7, -74.4, 18.4]
  ];
  const LAKES = [
    [47, 45, 51, 46.5, 53, 45, 51, 42, 53.5, 40.5, 53.5, 37, 50, 37, 49, 40, 47, 43],
    [-92, 46.7, -88, 48.7, -84.5, 46.8, -87, 46.4],
    [-88, 45.8, -85.2, 45.8, -86.3, 41.7, -87.8, 41.7],
    [-84.3, 46, -80, 45, -79.5, 43.3, -76.3, 44, -76.5, 43.3, -79, 42.6, -83, 41.5, -83.3, 43.5],
    [32, 0.5, 34.5, 0.3, 34, -2.5, 32, -2.5]
  ];
  const SANDS = [[10, 23, 27, 8], [47, 22, 11, 8], [131, -25, 13, 6], [94, 41, 15, 4]];   // centre lon, lat, radii

  let baseCanvas = null;
  function trace(c, poly) {
    c.beginPath();
    for (let i = 0; i < poly.length; i += 2) {
      const x = poly[i] + 180, y = 80 - poly[i + 1];
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath();
    c.fill();
  }
  function baseMap() {
    if (baseCanvas) return baseCanvas;
    const mask = document.createElement('canvas');
    mask.width = MW; mask.height = MH;
    const m = mask.getContext('2d');
    m.fillStyle = '#ffffff';
    LAND.forEach(poly => trace(m, poly));
    m.globalCompositeOperation = 'destination-out';
    LAKES.forEach(poly => trace(m, poly));
    const a = m.getImageData(0, 0, MW, MH).data;
    const isLand = (x, y) => x >= 0 && x < MW && y >= 0 && y < MH && a[(y * MW + x) * 4 + 3] > 110;

    const out = document.createElement('canvas');
    out.width = MW; out.height = MH;
    const c = out.getContext('2d');
    c.fillStyle = '#0f1f3d';
    c.fillRect(0, 0, MW, MH);
    c.fillStyle = '#17294c';
    for (let lon = 0; lon < MW; lon += 30) for (let y = 0; y < MH; y += 2) c.fillRect(lon, y, 1, 1);
    for (let lat = 20; lat < MH; lat += 20) for (let x = 0; x < MW; x += 2) c.fillRect(x, lat, 1, 1);
    c.fillStyle = '#22386a';
    for (let x = 0; x < MW; x += 2) c.fillRect(x, 80, 1, 1);          // the Equator
    for (let y = 0; y < MH; y += 2) c.fillRect(180, y, 1, 1);         // the prime meridian

    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        if (!isLand(x, y)) { if (isLand(x, y - 1)) { c.fillStyle = '#0a1630'; c.fillRect(x, y, 1, 1); } continue; }
        const lon = x - 180, lat = 80 - y;
        let col = '#2f7f68';
        if (lat > 66 || (lon > -60 && lon < -18 && lat > 59)) col = '#c3d1df';
        else {
          const dry = Math.min.apply(null, SANDS.map(s => Math.pow((lon - s[0]) / s[2], 2) + Math.pow((lat - s[1]) / s[3], 2)));
          if (dry < 0.7 || (dry < 1 && (x + y) % 2 === 0)) col = '#b59d62';
          else if ((x + y) % 2 === 0) col = '#34886f';
        }
        if (!isLand(x, y + 1)) col = mix(col, '#000000', 0.28);
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
    baseCanvas = out;
    return out;
  }

  const mapXY = c => ({ x: (c.lon + 180) / 360, y: (80 - c.lat) / 140 });
  function along(a, b, t) {
    let d = b.lon - a.lon;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    const lon = a.lon + d * t, lat = a.lat + (b.lat - a.lat) * t;
    const lift = Math.sin(Math.PI * t) * Math.min(14, 2 + Math.abs(d) * 0.09);
    return { x: (((lon + 180) % 360) + 360) % 360, y: 80 - lat - lift };
  }
  function route(ctx, a, b, col, gap) {
    ctx.fillStyle = col;
    for (let i = 0; i <= 120; i++) {
      if (i % gap) continue;
      const q = along(a, b, i / 120);
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }
  }
  function mark(ctx, c, col) {
    const x = Math.round(c.lon + 180), y = Math.round(80 - c.lat);
    ctx.fillStyle = '#060a14'; ctx.fillRect(x - 2, y - 2, 5, 5);
    ctx.fillStyle = col; ctx.fillRect(x - 1, y - 1, 3, 3);
  }
  function paintMap(ctx, o) {
    ctx.drawImage(baseMap(), 0, 0);
    if (!o || !o.from) return;
    const dests = o.dests || [];
    dests.forEach(d => { if (!o.sel || d.id !== o.sel.id) route(ctx, o.from, d, '#5f86c4', 4); });
    if (o.sel) route(ctx, o.from, o.sel, '#ffb62e', o.plane == null ? 2 : 1);
    dests.forEach(d => mark(ctx, d, o.sel && d.id === o.sel.id ? '#ffb62e' : '#e8ecf6'));
    mark(ctx, o.from, '#35d0ba');
    if (o.sel && o.plane != null) {
      const q = along(o.from, o.sel, o.plane), x = Math.round(q.x), y = Math.round(q.y);
      ctx.fillStyle = '#060a14'; ctx.fillRect(x - 3, y - 1, 7, 3); ctx.fillRect(x - 1, y - 3, 3, 7);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5);
    }
  }
  function paintTitle(ctx, t) {
    ctx.drawImage(baseMap(), 0, 0);
    const x = Math.floor((t * 46) % MW);
    for (let k = 0; k < 22; k++) {
      ctx.fillStyle = 'rgba(255,182,46,' + (0.55 * (1 - k / 22)).toFixed(3) + ')';
      ctx.fillRect((((x - k) % MW) + MW) % MW, 0, 1, MH);
    }
    MB.CITIES.forEach(c => {
      const cx = Math.round(c.lon + 180), cy = Math.round(80 - c.lat), d = (((x - cx) % MW) + MW) % MW;
      ctx.fillStyle = d < 50 ? '#ffe9a8' : '#7fa0d6';
      if (d < 14) ctx.fillRect(cx - 1, cy - 1, 3, 3); else ctx.fillRect(cx, cy, 1, 1);
    });
  }

  MB.Art = {
    scene: scene, portrait: portrait, mugshot: mugshot, map: paintMap, mapXY: mapXY,
    title: paintTitle, phaseOf: phaseOf
  };
})(window.MB = window.MB || {});
