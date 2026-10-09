(() => {
'use strict';
/* =====================================================================
   IPL Match Intelligence · dashboard
   Data: DATA (columnar arrays exported from v_match, v_team_innings,
   v_player_match). Every number below is recomputed for the filter slice
   using the same rules as the SQL scripts 05-07.
   ===================================================================== */
const D = DATA, M = D.matches, I = D.innings, P = D.pm;
const NM = M.season.length, NI = I.m.length, NP = P.m.length;
const SEASON_MIN = 2008, SEASON_MAX = 2024;
const $ = (s, el = document) => el.querySelector(s);

// innings index per match ---------------------------------------------------
const inn1 = new Int32Array(NM).fill(-1), inn2 = new Int32Array(NM).fill(-1);
for (let i = 0; i < NI; i++) (I.inn[i] === 1 ? inn1 : inn2)[I.m[i]] = i;

// state + URL hash ------------------------------------------------------------
const state = { from: SEASON_MIN, to: SEASON_MAX, team: -1, ground: -1 };
const views = {};               // card id -> 'chart' | 'table'
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const f = +h.get('from'), t = +h.get('to');
  if (f >= SEASON_MIN && f <= SEASON_MAX) state.from = f;
  if (t >= SEASON_MIN && t <= SEASON_MAX) state.to = t;
  if (state.from > state.to) [state.from, state.to] = [state.to, state.from];
  const team = D.abbr.indexOf(h.get('team') || ''); state.team = team;
  const g = D.grounds.indexOf(h.get('ground') || ''); state.ground = g;
}
function writeHash() {
  const h = new URLSearchParams();
  if (state.from !== SEASON_MIN) h.set('from', state.from);
  if (state.to !== SEASON_MAX) h.set('to', state.to);
  if (state.team >= 0) h.set('team', D.abbr[state.team]);
  if (state.ground >= 0) h.set('ground', D.grounds[state.ground]);
  const s = h.toString();
  history.replaceState(null, '', s ? '#' + s : location.pathname + location.search);
}

// helpers ---------------------------------------------------------------------
const fmt0 = v => v == null || !isFinite(v) ? '–' : Math.round(v).toLocaleString('en-US');
const fmt1 = v => v == null || !isFinite(v) ? '–' : (Math.round(v * 10) / 10).toFixed(1);
const fmt2 = v => v == null || !isFinite(v) ? '–' : (Math.round(v * 100) / 100).toFixed(2);
const pct = v => v == null || !isFinite(v) ? '–' : (Math.round(v * 1000) / 10).toFixed(1) + '%';
const pct0 = v => v == null || !isFinite(v) ? '–' : Math.round(v * 100) + '%';
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const seasonsInRange = () => { const a = []; for (let s = state.from; s <= state.to; s++) a.push(s); return a; };
const teamName = t => D.teams[t], teamAbbr = t => D.abbr[t];
const groundLabel = g => D.grounds[g] + ', ' + D.cities[g];
const rangeLabel = () => state.from === state.to ? String(state.from) : state.from + '–' + state.to;

function inSeason(m) { const s = M.season[m]; return s >= state.from && s <= state.to; }
function matchOk(m, useTeam = true, useGround = true) {
  if (!inSeason(m)) return false;
  if (useGround && state.ground >= 0 && M.ground[m] !== state.ground) return false;
  if (useTeam && state.team >= 0 && M.t1[m] !== state.team && M.t2[m] !== state.team) return false;
  return true;
}
const innWon = i => M.winner[I.m[i]] === I.bat[i];

/* =====================================================================
   Computations (mirror sql/05, 06, 07)
   ===================================================================== */
function compute() {
  const C = {};
  const seasons = seasonsInRange();
  const team = state.team;

  // match slice -------------------------------------------------------------
  let played = 0, decided = 0, chaseWins = 0, tossWins = 0, field = 0, tWins = 0, tLoss = 0;
  for (let m = 0; m < NM; m++) {
    if (!matchOk(m)) continue;
    played++;
    if (!M.decided[m]) continue;
    decided++;
    chaseWins += M.chase[m];
    tossWins += M.toss[m] === M.winner[m] ? 1 : 0;
    field += M.field[m];
    if (team >= 0) { if (M.winner[m] === team) tWins++; else tLoss++; }
  }
  C.played = played; C.decided = decided;
  C.chasePct = decided ? chaseWins / decided : null;
  C.tossPct = decided ? tossWins / decided : null;
  C.fieldPct = decided ? field / decided : null;
  C.teamW = tWins; C.teamL = tLoss;

  // first innings (par score) -----------------------------------------------
  // league = ground filter only; team = team batting first
  const parL = new Map(), parT = new Map();
  seasons.forEach(s => { parL.set(s, { n: 0, runs: 0, c200: 0 }); parT.set(s, { n: 0, runs: 0, c200: 0 }); });
  let fN = 0, fRuns = 0, f200 = 0;
  for (let m = 0; m < NM; m++) {
    if (!M.decided[m] || !matchOk(m, false, true)) continue;
    const i = inn1[m]; if (i < 0) continue;
    const r = I.runs[i], a = parL.get(M.season[m]);
    a.n++; a.runs += r; a.c200 += r >= 200 ? 1 : 0;
    if (team < 0 || I.bat[i] === team) {
      fN++; fRuns += r; f200 += r >= 200 ? 1 : 0;
      if (team >= 0) { const b = parT.get(M.season[m]); b.n++; b.runs += r; b.c200 += r >= 200 ? 1 : 0; }
    }
  }
  C.par = { seasons, league: parL, team: parT };
  C.parAvg = fN ? fRuns / fN : null; C.par200 = fN ? f200 / fN : null; C.parN = fN;

  // innings-level (Q1, Q3, Q4): decided, batting team = selected team -------
  const ppB = ['under 40', '40–49', '50–59', '60+'];
  const ppCell = () => ppB.map(() => ({ n: 0, w: 0 }));
  const pp = [ppCell(), ppCell()];
  const wihB = ['7+ in hand', '5–6 in hand', '4 or fewer'];
  const wih = wihB.map(() => ({ n: 0, w: 0, death: 0, deathB: 0, runs: 0 }));
  const prof = [0, 1].map(() => [0, 1].map(() => ({ n: 0, pp: 0, mid: 0, death: 0, runs: 0 }))); // [role][won]
  for (let i = 0; i < NI; i++) {
    const m = I.m[i];
    if (!M.decided[m] || !matchOk(m)) continue;
    if (team >= 0 && I.bat[i] !== team) continue;
    const role = I.inn[i] - 1, won = innWon(i) ? 1 : 0;
    const b = I.pp[i] < 40 ? 0 : I.pp[i] < 50 ? 1 : I.pp[i] < 60 ? 2 : 3;
    pp[role][b].n++; pp[role][b].w += won;
    const p = prof[role][won]; p.n++; p.pp += I.pp[i]; p.mid += I.mid[i]; p.death += I.death[i]; p.runs += I.runs[i];
    if (role === 0) {
      const h = 10 - I.ppw[i] - I.midw[i];
      const k = h >= 7 ? 0 : h >= 5 ? 1 : 2;
      const c = wih[k]; c.n++; c.w += won; c.death += I.death[i]; c.deathB += I.deathb[i]; c.runs += I.runs[i];
    }
  }
  C.pp = { buckets: ppB, cells: pp };
  C.wih = { buckets: wihB, cells: wih };
  C.prof = prof;

  // toss by season (Q6) ------------------------------------------------------
  const toss = new Map(); seasons.forEach(s => toss.set(s, { n: 0, toss: 0, chase: 0, field: 0 }));
  for (let m = 0; m < NM; m++) {
    if (!M.decided[m] || !matchOk(m)) continue;
    const a = toss.get(M.season[m]); a.n++;
    a.toss += M.toss[m] === M.winner[m] ? 1 : 0; a.chase += M.chase[m]; a.field += M.field[m];
  }
  C.toss = toss;

  // venues (Q7): decided, not D/L; team filter applies, ground filter -> highlight
  const ven = new Map();
  for (let m = 0; m < NM; m++) {
    if (!M.decided[m] || M.dl[m] || !matchOk(m, true, false)) continue;
    const g = M.ground[m];
    if (!ven.has(g)) ven.set(g, { g, n: 0, chase: 0, first: 0 });
    const v = ven.get(g); v.n++; v.chase += M.chase[m]; v.first += inn1[m] >= 0 ? I.runs[inn1[m]] : 0;
  }
  let vs = [...ven.values()];
  let minN = 3;
  for (const t of [20, 15, 10, 8, 5, 3]) { if (vs.filter(v => v.n >= t).length >= 6) { minN = t; break; } }
  C.venueMin = minN;
  const top = vs.filter(v => v.n >= minN).sort((a, b) => b.n - a.n).slice(0, 16);
  if (state.ground >= 0 && ven.has(state.ground) && !top.some(v => v.g === state.ground)) top.push(ven.get(state.ground));
  C.venues = top.map(v => ({ ...v, rate: v.chase / v.n, avgFirst: v.first / v.n }))
    .sort((a, b) => b.rate - a.rate || b.n - a.n);

  // teams: ground filter applies, team filter -> highlight -------------------
  const tm = D.teams.map((_, t) => ({ t, n: 0, w: 0 }));
  for (let m = 0; m < NM; m++) {
    if (!M.decided[m] || !matchOk(m, false, true)) continue;
    for (const t of [M.t1[m], M.t2[m]]) { tm[t].n++; if (M.winner[m] === t) tm[t].w++; }
  }
  C.teams = tm.filter(x => x.n >= 5 || x.t === team).map(x => ({ ...x, rate: x.n ? x.w / x.n : 0 }))
    .sort((a, b) => b.rate - a.rate || b.n - a.n);

  // players (Q8, Q9) ---------------------------------------------------------
  // league baseline: every player in the season + ground slice (all teams)
  const minBalls = 100 * seasons.length;
  const bat = new Map(), bowl = new Map();
  let lgRuns = 0, lgBalls = 0, lgRc = 0, lgBb = 0;
  for (let r = 0; r < NP; r++) {
    const m = P.m[r];
    if (!matchOk(m, false, true)) continue;
    const isBowl = P.bowl[r] === 1;
    if (isBowl) { lgRc += P.rc[r]; lgBb += P.balls[r]; } else { lgRuns += P.runs[r]; lgBalls += P.balls[r]; }
    if (team >= 0 && P.team[r] !== team) continue;
    const map = isBowl ? bowl : bat, p = P.p[r];
    let a = map.get(p);
    if (!a) map.set(p, a = { p, n: 0, runs: 0, balls: 0, outs: 0, rw: 0, db: 0, dr: 0, wk: 0, rc: 0, dots: 0, ww: 0 });
    a.n++; a.balls += P.balls[r]; a.db += P.db[r]; a.dr += P.dr[r];
    if (isBowl) { a.wk += P.wk[r]; a.rc += P.rc[r]; a.dots += P.dots[r]; if (P.won[r]) a.ww += P.wk[r]; }
    else { a.runs += P.runs[r]; a.outs += P.outs[r]; if (P.won[r]) a.rw += P.runs[r]; }
  }
  const lgSR = lgBalls ? lgRuns * 100 / lgBalls : 0, lgEcon = lgBb ? lgRc * 6 / lgBb : 0;
  // same order as the SQL: impact rounded as displayed, then player name
  const byImpact = dp => (a, b) => { const k = 10 ** dp, d = Math.round(b.impact * k) - Math.round(a.impact * k);
    return d || (D.players[a.p] < D.players[b.p] ? -1 : 1); };
  C.batters = [...bat.values()].filter(a => a.balls >= minBalls && a.balls > 0).map(a => {
    const sr = a.runs * 100 / a.balls;
    return { ...a, sr, avg: a.outs ? a.runs / a.outs : null, dsr: a.db ? a.dr * 100 / a.db : null,
      winShare: a.runs ? a.rw / a.runs : null,
      impact: (0.6 * a.runs / a.n + 0.4 * a.rw / a.n) * sr / lgSR };
  }).sort(byImpact(1));
  C.bowlers = [...bowl.values()].filter(a => a.balls >= minBalls && a.balls > 0).map(a => {
    const econ = a.rc * 6 / a.balls;
    return { ...a, econ, dEcon: a.db ? a.dr * 6 / a.db : null, dotPct: a.dots / a.balls,
      impact: 2 * a.wk / a.n + 1.5 * a.ww / a.n + (lgEcon - econ) };
  }).sort(byImpact(2));
  C.minBalls = minBalls; C.lgSR = lgSR; C.lgEcon = lgEcon;
  return C;
}

/* =====================================================================
   SVG + tooltip primitives
   ===================================================================== */
const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}
function T(parent, x, y, text, cls, anchor = 'start', extra = {}) {
  const t = S('text', { x, y, class: cls, 'text-anchor': anchor, ...extra }, parent);
  t.textContent = text; return t;
}
function niceTicks(lo, hi, count = 5) {
  if (hi === lo) { hi = lo + 1; }
  const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / mag;
  const step = (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag;
  const t = []; for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 1e6; v += step) t.push(+v.toFixed(6));
  return t;
}
// column with a 4px rounded data-end, square at the baseline
function colPath(x, y, w, h) {
  if (h <= 0.5) return `M${x},${y + h}H${x + w}`;
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
// horizontal bar from x0 to x1 (either direction), rounded at x1
function hPath(x0, x1, y, h) {
  const len = Math.abs(x1 - x0); if (len < 0.5) return `M${x0},${y}V${y + h}`;
  const r = Math.min(4, len, h / 2), d = x1 > x0 ? 1 : -1;
  return `M${x0},${y}H${x1 - d * r}Q${x1},${y} ${x1},${y + r}V${y + h - r}Q${x1},${y + h} ${x1 - d * r},${y + h}H${x0}Z`;
}

const tip = $('#tip');
function tipShow(pt, spec) {
  tip.replaceChildren();
  if (spec.title) { const d = document.createElement('div'); d.className = 't-title'; d.textContent = spec.title; tip.appendChild(d); }
  for (const r of spec.rows || []) {
    const row = document.createElement('div'); row.className = 't-row';
    if (r.color) { const k = document.createElement('span'); k.className = 't-key'; k.style.background = r.color; row.appendChild(k); }
    const b = document.createElement('b'); b.textContent = r.value; row.appendChild(b);
    if (r.label) { const i = document.createElement('i'); i.textContent = r.label; row.appendChild(i); }
    tip.appendChild(row);
  }
  for (const n of [].concat(spec.note || [])) { const d = document.createElement('div'); d.className = 't-note'; d.textContent = n; tip.appendChild(d); }
  tip.classList.add('on');
  const w = tip.offsetWidth, h = tip.offsetHeight, vw = innerWidth, vh = innerHeight;
  let x = pt.x + 14, y = pt.y - h - 10;
  if (x + w > vw - 8) x = pt.x - w - 14;
  if (x < 8) x = 8;
  if (y < 8) y = pt.y + 16;
  if (y + h > vh - 8) y = vh - h - 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function tipHide() { tip.classList.remove('on'); }
function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 4 }; }
// make a mark hoverable / focusable with its own tooltip
function bindTip(hit, specFn, onClick) {
  hit.setAttribute('tabindex', '0');
  hit.addEventListener('pointermove', e => tipShow({ x: e.clientX, y: e.clientY }, specFn()));
  hit.addEventListener('pointerleave', tipHide);
  hit.addEventListener('focus', () => tipShow(centerOf(hit), specFn()));
  hit.addEventListener('blur', tipHide);
  if (onClick) {
    hit.addEventListener('click', onClick);
    hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
  }
}

/* ---------- grouped column chart --------------------------------------- */
function columnChart(el, o) {
  const W = Math.max(280, el.clientWidth), H = o.height || 230;
  const m = { l: 40, r: 8, t: 20, b: o.subLabels ? 44 : 28 };
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria }, null);
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const ymax = o.yMax || Math.max(1, ...o.series.flatMap(s => s.values.filter(v => v != null)));
  const ticks = o.ticks || niceTicks(0, ymax, 4);
  const top = ticks[ticks.length - 1];
  const y = v => m.t + ph - (v / top) * ph;
  for (const t of ticks) {
    S('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: t === 0 ? css('--baseline') : css('--grid'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, svg);
    T(svg, m.l - 6, y(t) + 3.5, o.yFmt ? o.yFmt(t) : t, 'ax', 'end');
  }
  if (o.ref != null) {
    S('line', { x1: m.l, x2: W - m.r, y1: y(o.ref), y2: y(o.ref), stroke: css('--baseline'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, svg);
  }
  const nC = o.cats.length, nS = o.series.length, band = pw / nC;
  const bw = Math.min(24, (band * 0.62 - 2 * (nS - 1)) / nS), gw = bw * nS + 2 * (nS - 1);
  o.cats.forEach((c, ci) => {
    const cx = m.l + band * ci + band / 2;
    T(svg, cx, H - m.b + 16, c, 'ax-cat', 'middle');
    if (o.subLabels) T(svg, cx, H - m.b + 31, o.subLabels[ci], 'lbl-2', 'middle');
    o.series.forEach((s, si) => {
      const v = s.values[ci]; if (v == null) return;
      const x = cx - gw / 2 + si * (bw + 2), yy = y(v);
      const hit = S('rect', { class: 'hit', x: x - 3, y: m.t, width: bw + 6, height: ph, 'aria-label': `${s.name}, ${c}: ${o.valFmt(v)}` }, svg);
      S('path', { class: 'mark', d: colPath(x, yy, bw, y(0) - yy), fill: s.color, opacity: s.faded && s.faded[ci] ? 0.45 : null }, svg);
      bindTip(hit, () => o.tip(ci, si));
      if (o.label && o.label(si, ci)) T(svg, x + bw / 2, yy - 6, o.valFmt(v), 'lbl', 'middle');
    });
  });
  el.replaceChildren(svg);
}

/* ---------- line chart with crosshair ----------------------------------- */
function lineChart(el, o) {
  const W = Math.max(280, el.clientWidth), H = o.height || 230;
  const m = { l: 40, r: o.endLabels ? 46 : 12, t: 16, b: 28 };
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria }, null);
  const pw = W - m.l - m.r, ph = H - m.t - m.b, xs = o.xs, n = xs.length;
  const vals = o.series.flatMap(s => s.values.filter(v => v != null));
  if (o.ref != null) vals.push(o.ref);
  if (!vals.length) { el.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty', textContent: 'No matches in this selection' })); return; }
  let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.12 || 5;
  const ticks = niceTicks(o.floor != null ? Math.max(o.floor, lo - pad) : lo - pad, o.ceil != null ? Math.min(o.ceil, hi + pad) : hi + pad, 4);
  const t0 = ticks[0], t1 = ticks[ticks.length - 1];
  const y = v => m.t + ph - (v - t0) / (t1 - t0) * ph;
  const x = i => n === 1 ? m.l + pw / 2 : m.l + (pw * i) / (n - 1);
  for (const t of ticks) {
    S('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), stroke: css('--grid'), 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, svg);
    T(svg, m.l - 6, y(t) + 3.5, o.yFmt(t), 'ax', 'end');
  }
  if (o.ref != null) {
    S('line', { x1: m.l, x2: W - m.r, y1: y(o.ref), y2: y(o.ref), stroke: css('--baseline'), 'stroke-width': 1.5, 'shape-rendering': 'crispEdges' }, svg);
  }
  const every = n > 1 ? Math.max(1, Math.ceil(40 / (pw / (n - 1)))) : 1;
  xs.forEach((xv, i) => { if ((i % every === 0 && n - 1 - i >= every) || i === n - 1) T(svg, x(i), H - m.b + 16, o.xFmt ? o.xFmt(xv) : xv, 'ax', 'middle'); });
  const surf = css('--surface-1');
  const ends = [];
  o.series.forEach(s => {
    const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]);
    let d = '', pen = false;
    pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); pen = true; });
    if (s.area && n > 1) {
      const valid = pts.filter(Boolean);
      if (valid.length > 1) S('path', { d: d + `L${valid[valid.length - 1][0]},${y(t0)}L${valid[0][0]},${y(t0)}Z`, fill: s.color, opacity: 0.1 }, svg);
    }
    S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    pts.forEach(p => { if (p && (n === 1 || pts.filter(Boolean).length === 1)) S('circle', { cx: p[0], cy: p[1], r: 4, fill: s.color, stroke: surf, 'stroke-width': 2 }, svg); });
    let li = -1; for (let i = n - 1; i >= 0; i--) if (pts[i]) { li = i; break; }
    if (li >= 0) {
      S('circle', { cx: pts[li][0], cy: pts[li][1], r: 4, fill: s.color, stroke: surf, 'stroke-width': 2 }, svg);
      ends.push({ y: pts[li][1], x: pts[li][0], text: o.valFmt(s.values[li]) });
    }
  });
  // end labels only when they don't collide (never stacked / nudged)
  if (o.endLabels) {
    const collide = ends.some((a, i) => ends.some((b, j) => j > i && Math.abs(a.y - b.y) < 13));
    if (!collide) ends.forEach(e => T(svg, e.x + 8, e.y + 4, e.text, 'lbl'));
  }
  // crosshair layer
  const cross = S('line', { y1: m.t, y2: m.t + ph, stroke: css('--axis-text'), 'stroke-width': 1, opacity: 0 }, svg);
  const dots = o.series.map(s => S('circle', { r: 4, fill: s.color, stroke: surf, 'stroke-width': 2, opacity: 0 }, svg));
  const ov = S('rect', { x: m.l - 10, y: m.t, width: pw + 20, height: ph, fill: 'transparent', tabindex: 0, 'aria-label': o.aria + '. Use arrow keys to step through seasons.' }, svg);
  let cur = n - 1;
  const show = (i, pt) => {
    cur = i;
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
    o.series.forEach((s, si) => {
      const v = s.values[i];
      if (v == null) { dots[si].setAttribute('opacity', 0); return; }
      dots[si].setAttribute('cx', x(i)); dots[si].setAttribute('cy', y(v)); dots[si].setAttribute('opacity', 1);
    });
    const r = svg.getBoundingClientRect(), k = r.width / W;
    tipShow(pt || { x: r.left + x(i) * k, y: r.top + m.t * k + 20 }, o.tip(i));
  };
  const hide = () => { cross.setAttribute('opacity', 0); dots.forEach(d => d.setAttribute('opacity', 0)); tipHide(); };
  ov.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), k = W / r.width, px = (e.clientX - r.left) * k;
    const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((px - m.l) / pw * (n - 1))));
    show(i, { x: e.clientX, y: e.clientY });
  });
  ov.addEventListener('pointerleave', hide);
  ov.addEventListener('focus', () => show(cur));
  ov.addEventListener('blur', hide);
  ov.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.max(0, cur - 1)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(n - 1, cur + 1)); }
  });
  el.replaceChildren(svg);
}

/* ---------- horizontal bars (plain or diverging around a centre) -------- */
function hbarChart(el, o) {
  const W = Math.max(280, el.clientWidth), rowH = 26, barH = 14;
  const lw = Math.min(o.labelW || 190, W * 0.42);
  const m = { l: lw, r: 44, t: 8, b: 24 };
  const H = m.t + m.b + rowH * o.rows.length;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria }, null);
  const pw = W - m.l - m.r;
  const [d0, d1] = o.domain;
  const x = v => m.l + (v - d0) / (d1 - d0) * pw;
  for (const t of o.ticks) {
    S('line', { x1: x(t), x2: x(t), y1: m.t, y2: H - m.b, stroke: t === o.base ? css('--baseline') : css('--grid'), 'stroke-width': t === o.base ? 1.5 : 1, 'shape-rendering': 'crispEdges' }, svg);
    T(svg, x(t), H - m.b + 15, o.tickFmt(t), 'ax', 'middle');
  }
  o.rows.forEach((r, i) => {
    const yy = m.t + i * rowH, by = yy + (rowH - barH) / 2;
    const lab = T(svg, m.l - 10, yy + rowH / 2 + 4, r.label, r.sel ? 'facet' : 'ax-cat', 'end');
    const hit = S('rect', { class: 'hit', x: 0, y: yy, width: W, height: rowH, 'aria-label': r.aria }, svg);
    S('path', { class: 'mark', d: hPath(x(o.base), x(r.value), by, barH), fill: r.color }, svg);
    const end = x(r.value), right = r.value >= o.base;
    T(svg, right ? end + 6 : end - 6, by + barH - 3, r.valueText, 'lbl', right ? 'start' : 'end');
    bindTip(hit, () => o.tip(i), o.onClick ? () => o.onClick(i) : null);
  });
  el.replaceChildren(svg);
  // shorten labels that overflow the label column
  svg.querySelectorAll('text.ax-cat, text.facet').forEach(t => {
    let s = t.textContent;
    while (t.getComputedTextLength() > lw - 14 && s.length > 4) { s = s.slice(0, -2); t.textContent = s + '…'; }
  });
}

/* ---------- table view --------------------------------------------------- */
function tableView(el, spec) {
  const wrap = document.createElement('div'); wrap.className = 'tbl-wrap';
  const tb = document.createElement('table');
  const thead = tb.createTHead().insertRow();
  spec.cols.forEach(c => { const th = document.createElement('th'); th.textContent = c.h; if (c.num) th.className = 'num'; thead.appendChild(th); });
  const body = tb.createTBody();
  spec.rows.forEach((r, ri) => {
    const tr = body.insertRow(); if (spec.sel && spec.sel[ri]) tr.className = 'sel';
    r.forEach((v, ci) => {
      const td = tr.insertCell();
      if (v instanceof Node) td.appendChild(v); else td.textContent = v;
      if (spec.cols[ci].num) td.className = 'num';
    });
  });
  wrap.appendChild(tb); el.replaceChildren(wrap);
}
function legend(items) {
  const d = document.createElement('div'); d.className = 'legend';
  items.forEach(it => {
    const s = document.createElement('span'), k = document.createElement('i');
    k.className = it.line ? 'key-line' : 'key-rect'; k.style.background = it.color;
    s.appendChild(k); s.appendChild(document.createTextNode(it.label)); d.appendChild(s);
  });
  return d;
}

/* =====================================================================
   Cards
   ===================================================================== */
const teamTag = () => state.team >= 0 ? teamAbbr(state.team) : '';
const lowN = n => n < 10 ? `Small sample (${n})` : null;

const CARDS = [
{
  id: 'par',
  title: () => 'Par first-innings score by season',
  sub: () => state.team >= 0 ? `Average first-innings total when ${teamName(state.team)} bat first, against the league. Decided matches.` : 'Average first-innings total in decided matches. The target a batting-first side has to beat.',
  legend: () => state.team >= 0 ? [{ label: teamTag() + ' batting first', color: css('--series-1'), line: true }, { label: 'League', color: css('--deemph-line'), line: true }] : null,
  chart(el, C) {
    const s = C.par.seasons, L = s.map(x => C.par.league.get(x)), Tm = s.map(x => C.par.team.get(x));
    const lv = L.map(a => a.n ? a.runs / a.n : null), tv = Tm.map(a => a.n ? a.runs / a.n : null);
    const series = state.team >= 0
      ? [{ name: 'League', color: css('--deemph-line'), values: lv }, { name: teamTag(), color: css('--series-1'), values: tv }]
      : [{ name: 'League', color: css('--series-1'), values: lv, area: true }];
    lineChart(el, {
      aria: 'Line chart of average first-innings score by season', xs: s, series, valFmt: fmt0, yFmt: v => v, endLabels: true,
      tip: i => ({
        title: String(s[i]),
        rows: [...(state.team >= 0 ? [{ color: css('--series-1'), value: fmt1(tv[i]), label: teamTag() + ` (${Tm[i].n} inns)` }] : []),
          { color: state.team >= 0 ? css('--deemph-line') : css('--series-1'), value: fmt1(lv[i]), label: `League (${L[i].n} matches)` }],
        note: L[i].n ? `200+ totals: ${pct0(L[i].c200 / L[i].n)} of first innings` : null,
      }),
    });
  },
  table(C) {
    const s = C.par.seasons;
    const cols = [{ h: 'Season' }, { h: 'Matches', num: 1 }, { h: 'Avg 1st innings', num: 1 }, { h: '200+ share', num: 1 }];
    if (state.team >= 0) cols.push({ h: teamTag() + ' inns', num: 1 }, { h: teamTag() + ' avg', num: 1 });
    return { cols, rows: s.map(x => { const a = C.par.league.get(x), b = C.par.team.get(x);
      const r = [x, a.n, fmt1(a.n ? a.runs / a.n : null), pct(a.n ? a.c200 / a.n : null)];
      if (state.team >= 0) r.push(b.n, fmt1(b.n ? b.runs / b.n : null)); return r; }) };
  },
  takeaway(C) {
    const s = C.par.seasons.filter(x => C.par.league.get(x).n);
    if (s.length < 2) return null;
    const a = C.par.league.get(s[0]), b = C.par.league.get(s[s.length - 1]);
    const d = b.runs / b.n - a.runs / a.n;
    return [`League par moved `, [(d >= 0 ? '+' : '') + fmt0(d) + ' runs'], ` from ${s[0]} to ${s[s.length - 1]} (${fmt0(a.runs / a.n)} → ${fmt0(b.runs / b.n)}).`];
  },
},
{
  id: 'pp',
  title: () => 'Win % by powerplay runs',
  sub: C => `Runs scored in overs 1–6, ${state.team >= 0 ? teamName(state.team) + ' innings' : 'all innings'} in decided matches. Line at 50%.` + (C.pp.cells.flat().some(c => c.n > 0 && c.n < 10) ? ' Faded columns: fewer than 10 innings.' : ''),
  legend: () => [{ label: 'Batting first', color: css('--series-1') }, { label: 'Chasing', color: css('--series-2') }],
  chart(el, C) {
    const cells = C.pp.cells, names = ['Batting first', 'Chasing'], cols = [css('--series-1'), css('--series-2')];
    columnChart(el, {
      aria: 'Grouped column chart of win percentage by powerplay runs', cats: C.pp.buckets, yMax: 100, ticks: [0, 25, 50, 75, 100], ref: 50,
      yFmt: v => v + '%', valFmt: v => Math.round(v) + '%',
      series: [0, 1].map(r => ({ name: names[r], color: cols[r], values: cells[r].map(c => c.n ? 100 * c.w / c.n : null), faded: cells[r].map(c => c.n < 10) })),
      label: (si, ci) => ci === 0 || ci === 3,
      tip: (ci, si) => { const c = cells[si][ci]; return { title: `${names[si]} · ${C.pp.buckets[ci]} in the powerplay`, rows: [{ color: cols[si], value: pct(c.w / c.n), label: 'win rate' }], note: [`${c.w} wins from ${c.n} innings`, lowN(c.n)].filter(Boolean) }; },
    });
  },
  table(C) {
    return { cols: [{ h: 'Powerplay runs' }, { h: 'Bat first inns', num: 1 }, { h: 'Bat first win %', num: 1 }, { h: 'Chasing inns', num: 1 }, { h: 'Chasing win %', num: 1 }],
      rows: C.pp.buckets.map((b, i) => { const a = C.pp.cells[0][i], c = C.pp.cells[1][i]; return [b, a.n, pct(a.n ? a.w / a.n : null), c.n, pct(c.n ? c.w / c.n : null)]; }) };
  },
  takeaway(C) {
    const a = C.pp.cells[0][3], c = C.pp.cells[1][3], a0 = C.pp.cells[0][0], c0 = C.pp.cells[1][0];
    if (!a.n || !c.n) return null;
    return ['60+ in the powerplay wins ', [pct0(a.w / a.n)], ' batting first and ', [pct0(c.w / c.n)], ' chasing; under 40 wins ', pct0(a0.n ? a0.w / a0.n : null) + ' and ' + pct0(c0.n ? c0.w / c0.n : null) + '.'];
  },
},
{
  id: 'phase',
  title: () => 'Winners vs losers: runs by phase',
  sub: () => `Average runs per phase, ${state.team >= 0 ? teamName(state.team) + ' innings' : 'all innings'} in decided matches. Batting first and chasing kept apart.`,
  legend: () => [{ label: 'Won, batting first', color: css('--series-1') }, { label: 'Won, chasing', color: css('--series-2') }, { label: 'Lost', color: css('--deemph') }],
  chart(el, C) {
    const wrap = document.createElement('div'); wrap.style.display = 'grid'; wrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))'; wrap.style.gap = '8px';
    el.replaceChildren(wrap);
    const hosts = [0, 1].map(() => { const f = document.createElement('div'), h = document.createElement('div'), c = document.createElement('div');
      h.style.cssText = 'font-size:12.5px;font-weight:650;margin:4px 0 0 40px'; f.append(h, c); wrap.appendChild(f); return { h, c }; });
    const phases = ['Powerplay', 'Middle', 'Death'], keys = ['pp', 'mid', 'death'], names = ['Batting first', 'Chasing'];
    const max = Math.max(1, ...[0, 1].flatMap(r => [0, 1].flatMap(w => keys.map(k => C.prof[r][w].n ? C.prof[r][w][k] / C.prof[r][w].n : 0))));
    const ticks = niceTicks(0, max, 4);
    [0, 1].forEach(r => {
      const { h, c } = hosts[r]; h.textContent = names[r];
      const won = C.prof[r][1], lost = C.prof[r][0];
      columnChart(c, {
        aria: `${names[r]}: average runs by phase, winners vs losers`, cats: phases, ticks, height: 200, yFmt: v => v, valFmt: fmt1,
        series: [{ name: 'Won', color: r ? css('--series-2') : css('--series-1'), values: keys.map(k => won.n ? won[k] / won.n : null) },
                 { name: 'Lost', color: css('--deemph'), values: keys.map(k => lost.n ? lost[k] / lost.n : null) }],
        label: (si, ci) => ci === 2 && si === 0,
        tip: (ci, si) => { const g = si ? lost : won; return { title: `${names[r]} · ${phases[ci]}`, rows: [{ color: si ? css('--deemph') : (r ? css('--series-2') : css('--series-1')), value: fmt1(g[keys[ci]] / g.n), label: (si ? 'lost' : 'won') + ' · avg runs' }], note: [`${g.n} innings · avg total ${fmt1(g.runs / g.n)}`, lowN(g.n)].filter(Boolean) }; },
      });
    });
  },
  table(C) {
    const rows = [];
    [['Batting first', 0], ['Chasing', 1]].forEach(([n, r]) => [1, 0].forEach(w => { const g = C.prof[r][w];
      rows.push([n, w ? 'Won' : 'Lost', g.n, fmt1(g.runs / g.n), fmt1(g.pp / g.n), fmt1(g.mid / g.n), fmt1(g.death / g.n)]); }));
    return { cols: [{ h: 'Innings' }, { h: 'Result' }, { h: 'Innings', num: 1 }, { h: 'Avg total', num: 1 }, { h: 'Powerplay', num: 1 }, { h: 'Middle', num: 1 }, { h: 'Death', num: 1 }], rows };
  },
  takeaway(C) {
    const w = C.prof[1][1], l = C.prof[1][0];
    if (!w.n || !l.n) return null;
    return ['Winning chases score ', [fmt1(w.death / w.n)], ' at the death against ', fmt1(l.death / l.n), ' for losing ones: the chase is usually over before over 20.'];
  },
},
{
  id: 'wih',
  title: () => 'Wickets in hand after 15 overs',
  sub: C => `Batting first${state.team >= 0 ? ', ' + teamName(state.team) : ''}, decided matches. Win % by wickets left; death-over run rate below each column.` + (C.wih.cells.some(c => c.n > 0 && c.n < 10) ? ' Faded columns: fewer than 10 innings.' : ''),
  legend: () => null,
  chart(el, C) {
    const cells = C.wih.cells;
    columnChart(el, {
      aria: 'Column chart of win percentage by wickets in hand after 15 overs', cats: C.wih.buckets, yMax: 100, ticks: [0, 25, 50, 75, 100], ref: 50,
      yFmt: v => v + '%', valFmt: v => Math.round(v) + '%',
      subLabels: cells.map(c => c.deathB ? fmt1(c.death * 6 / c.deathB) + ' rpo at death' : '–'),
      series: [{ name: 'Win %', color: css('--series-1'), values: cells.map(c => c.n ? 100 * c.w / c.n : null), faded: cells.map(c => c.n < 10) }],
      label: () => true,
      tip: ci => { const c = cells[ci]; return { title: `Batting first · ${C.wih.buckets[ci]} after 15 overs`, rows: [{ color: css('--series-1'), value: pct(c.w / c.n), label: 'win rate' }, { value: fmt2(c.death * 6 / c.deathB), label: 'death run rate' }, { value: fmt1(c.runs / c.n), label: 'avg total' }], note: [`${c.n} innings`, lowN(c.n)].filter(Boolean) }; },
    });
  },
  table(C) {
    return { cols: [{ h: 'Wickets in hand' }, { h: 'Innings', num: 1 }, { h: 'Avg death runs', num: 1 }, { h: 'Death run rate', num: 1 }, { h: 'Avg total', num: 1 }, { h: 'Win %', num: 1 }],
      rows: C.wih.buckets.map((b, i) => { const c = C.wih.cells[i]; return [b, c.n, fmt1(c.death / c.n), fmt2(c.death * 6 / c.deathB), fmt1(c.runs / c.n), pct(c.n ? c.w / c.n : null)]; }) };
  },
  takeaway(C) {
    const a = C.wih.cells[0], c = C.wih.cells[2];
    if (!a.n || !c.n) return null;
    return ['7+ wickets in hand wins ', [pct0(a.w / a.n)], '; 4 or fewer wins ', [pct0(c.w / c.n)], '.'];
  },
},
{
  id: 'venue',
  title: () => 'Grounds: chase or bat first?',
  sub: C => `Chasing side's win % by ground (D/L excluded${state.team >= 0 ? ', ' + teamAbbr(state.team) + ' matches' : ''}), grounds with ${C.venueMin}+ matches. Click a ground to filter.`,
  legend: () => [{ label: 'Chase (55%+)', color: css('--series-2') }, { label: 'Neutral', color: css('--deemph') }, { label: 'Bat first (45% or less)', color: css('--series-1') }],
  chart(el, C) {
    if (!C.venues.length) { el.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty', textContent: 'No grounds in this selection' })); return; }
    const call = r => r >= 0.55 ? 'Chase' : r <= 0.45 ? 'Bat first' : 'Neutral';
    const col = r => r >= 0.55 ? css('--series-2') : r <= 0.45 ? css('--series-1') : css('--deemph');
    const narrow = el.clientWidth < 520;
    hbarChart(el, {
      aria: 'Diverging bar chart of chasing win percentage by ground, centred on 50%', domain: [0, 100], base: 50, ticks: [0, 25, 50, 75, 100], tickFmt: v => v + '%',
      labelW: narrow ? 130 : 230,
      rows: C.venues.map(v => ({ label: narrow ? D.grounds[v.g].replace(/ (Stadium|Cricket Stadium|International Cricket Stadium)$/, '') : D.grounds[v.g], value: 100 * v.rate, valueText: pct(v.rate), color: col(v.rate), sel: v.g === state.ground,
        aria: `${D.grounds[v.g]}: chasing side wins ${pct(v.rate)} of ${v.n} matches` })),
      tip: i => { const v = C.venues[i]; return { title: groundLabel(v.g), rows: [{ color: col(v.rate), value: pct(v.rate), label: 'chasing side wins' }, { value: fmt1(v.avgFirst), label: 'avg first innings' }], note: [`${v.n} matches · call: ${call(v.rate)}`, v.g === state.ground ? 'Selected · click to clear' : 'Click to filter to this ground'] }; },
      onClick: i => { const g = C.venues[i].g; state.ground = state.ground === g ? -1 : g; update(); },
    });
  },
  table(C) {
    const call = r => r >= 0.55 ? 'Chase' : r <= 0.45 ? 'Bat first' : 'Neutral';
    return { cols: [{ h: 'Ground' }, { h: 'City' }, { h: 'Matches', num: 1 }, { h: 'Avg 1st innings', num: 1 }, { h: 'Chase win %', num: 1 }, { h: 'Toss call' }],
      rows: C.venues.map(v => [D.grounds[v.g], D.cities[v.g], v.n, fmt1(v.avgFirst), pct(v.rate), call(v.rate)]), sel: C.venues.map(v => v.g === state.ground) };
  },
  takeaway(C) {
    const v = C.venues; if (v.length < 2) return null;
    return ['Most chase-friendly: ', [D.grounds[v[0].g]], ` (${pct(v[0].rate)}). Best for batting first: `, [D.grounds[v[v.length - 1].g]], ` (${pct(v[v.length - 1].rate)}).`];
  },
},
{
  id: 'teams',
  title: () => 'Win % by franchise',
  sub: () => `Decided matches${state.ground >= 0 ? ' at ' + D.grounds[state.ground] : ''}, ${rangeLabel()}; franchises with 5+ matches. Click a team to filter.`,
  legend: () => null,
  chart(el, C) {
    if (!C.teams.length) { el.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty', textContent: 'No matches in this selection' })); return; }
    const narrow = el.clientWidth < 520;
    hbarChart(el, {
      aria: 'Bar chart of win percentage by franchise', domain: [0, 100], base: 0, ticks: [0, 25, 50, 75, 100], tickFmt: v => v + '%', labelW: narrow ? 70 : 200,
      rows: C.teams.map(t => ({ label: narrow ? teamAbbr(t.t) : teamName(t.t), value: 100 * t.rate, valueText: pct0(t.rate),
        color: state.team < 0 || state.team === t.t ? css('--series-1') : css('--deemph'), sel: t.t === state.team,
        aria: `${teamName(t.t)}: ${t.w} wins from ${t.n} decided matches` })),
      tip: i => { const t = C.teams[i]; return { title: teamName(t.t), rows: [{ color: css('--series-1'), value: pct(t.rate), label: 'win rate' }], note: [`${t.w} won · ${t.n - t.w} lost`, t.t === state.team ? 'Selected · click to clear' : 'Click to filter to this team'] }; },
      onClick: i => { const t = C.teams[i].t; state.team = state.team === t ? -1 : t; update(); },
    });
  },
  table(C) {
    return { cols: [{ h: 'Franchise' }, { h: 'Matches', num: 1 }, { h: 'Won', num: 1 }, { h: 'Lost', num: 1 }, { h: 'Win %', num: 1 }],
      rows: C.teams.map(t => [teamName(t.t), t.n, t.w, t.n - t.w, pct(t.rate)]), sel: C.teams.map(t => t.t === state.team) };
  },
  takeaway: () => null,
},
{
  id: 'toss',
  wide: true,
  title: () => 'Toss and chase by season',
  sub: () => `Share of decided matches won by the toss winner and by the side batting second${state.team >= 0 ? ' (' + teamAbbr(state.team) + ' matches)' : ''}. Line at 50%.`,
  legend: () => [{ label: 'Toss winner wins', color: css('--series-3'), line: true }, { label: 'Chasing side wins', color: css('--series-2'), line: true }],
  chart(el, C) {
    const s = [...C.toss.keys()], a = s.map(x => C.toss.get(x));
    const tv = a.map(r => r.n ? 100 * r.toss / r.n : null), cv = a.map(r => r.n ? 100 * r.chase / r.n : null);
    lineChart(el, {
      aria: 'Line chart of toss-winner and chasing-side win percentage by season', xs: s, height: 220, ref: 50, floor: 0, ceil: 100,
      series: [{ name: 'Toss winner', color: css('--series-3'), values: tv }, { name: 'Chasing side', color: css('--series-2'), values: cv }],
      yFmt: v => v + '%', valFmt: v => Math.round(v) + '%', endLabels: true,
      tip: i => ({ title: `${s[i]} · ${a[i].n} decided matches`,
        rows: [{ color: css('--series-3'), value: pct(tv[i] / 100), label: 'toss winner wins' }, { color: css('--series-2'), value: pct(cv[i] / 100), label: 'chasing side wins' }],
        note: a[i].n ? `${pct0(a[i].field / a[i].n)} of toss winners chose to field` : null }),
    });
  },
  table(C) {
    return { cols: [{ h: 'Season' }, { h: 'Decided', num: 1 }, { h: 'Toss winners fielding', num: 1 }, { h: 'Toss winner win %', num: 1 }, { h: 'Chasing side win %', num: 1 }],
      rows: [...C.toss.entries()].map(([s, r]) => [s, r.n, pct(r.n ? r.field / r.n : null), pct(r.n ? r.toss / r.n : null), pct(r.n ? r.chase / r.n : null)]) };
  },
  takeaway(C) {
    if (!C.decided) return null;
    return [`Across ${rangeLabel()}, toss winners won `, [pct0(C.tossPct)], ' and chasing sides ', [pct0(C.chasePct)], ` while ${pct0(C.fieldPct)} of toss winners chose to field.`];
  },
},
{
  id: 'bat',
  kind: 'table',
  title: () => 'Batting shortlist',
  sub: C => `Top 10 by batting impact, ${rangeLabel()}${state.team >= 0 ? ', for ' + teamName(state.team) : ''}${state.ground >= 0 ? ', at ' + D.grounds[state.ground] : ''}; min ${fmt0(C.minBalls)} balls faced. League strike rate ${fmt1(C.lgSR)}.`,
  table(C) {
    const top = C.batters.slice(0, 10), mx = Math.max(1e-9, ...top.map(b => b.impact));
    return { cols: [{ h: '#', num: 1 }, { h: 'Player' }, { h: 'Inns', num: 1 }, { h: 'Runs', num: 1 }, { h: 'SR', num: 1 }, { h: 'Death SR', num: 1 }, { h: 'Runs in wins', num: 1 }, { h: 'Impact', num: 1 }],
      rows: top.map((b, i) => [i + 1, D.players[b.p], b.n, fmt0(b.runs), fmt1(b.sr), fmt1(b.dsr), pct0(b.winShare), impBar(b.impact, mx, fmt1)]), empty: 'No batter reaches the minimum balls in this selection' };
  },
  note: 'Impact = (0.6 × runs per innings + 0.4 × runs per innings in wins) × strike rate ÷ league strike rate.',
},
{
  id: 'bowl',
  kind: 'table',
  title: () => 'Bowling shortlist',
  sub: C => `Top 10 by bowling impact, ${rangeLabel()}${state.team >= 0 ? ', for ' + teamName(state.team) : ''}${state.ground >= 0 ? ', at ' + D.grounds[state.ground] : ''}; min ${fmt0(C.minBalls)} balls bowled. League economy ${fmt2(C.lgEcon)}.`,
  table(C) {
    const top = C.bowlers.slice(0, 10), mx = Math.max(1e-9, ...top.map(b => b.impact));
    return { cols: [{ h: '#', num: 1 }, { h: 'Player' }, { h: 'M', num: 1 }, { h: 'Wkts', num: 1 }, { h: 'Econ', num: 1 }, { h: 'Death econ', num: 1 }, { h: 'Dot %', num: 1 }, { h: 'Impact', num: 1 }],
      rows: top.map((b, i) => [i + 1, D.players[b.p], b.n, b.wk, fmt2(b.econ), fmt2(b.dEcon), pct0(b.dotPct), impBar(b.impact, mx, fmt2)]), empty: 'No bowler reaches the minimum balls in this selection' };
  },
  note: 'Impact = 2 × wickets per match + 1.5 × wickets per match in wins + (league economy − bowler economy).',
},
];

function impBar(v, mx, f) {
  const d = document.createElement('div'); d.className = 'imp';
  const t = document.createElement('span'); t.textContent = f(v);
  const tr = document.createElement('span'); tr.className = 'imp-track';
  const b = document.createElement('span'); b.className = 'imp-bar'; b.style.width = Math.max(2, 90 * Math.max(0, v) / mx) + 'px';
  tr.appendChild(b); d.append(t, tr); return d;
}

/* =====================================================================
   Layout + render
   ===================================================================== */
const grid = $('#grid');
const cardEls = {};
CARDS.forEach(c => {
  const card = document.createElement('section'); card.className = 'card' + (c.wide ? ' wide' : ''); card.id = 'card-' + c.id;
  const head = document.createElement('div'); head.className = 'card-head';
  const hw = document.createElement('div');
  const h2 = document.createElement('h2'), sub = document.createElement('p'); sub.className = 'sub';
  hw.append(h2, sub); head.appendChild(hw);
  let btn = null;
  if (c.kind !== 'table') {
    btn = document.createElement('button'); btn.className = 'btn view-toggle'; btn.type = 'button'; btn.textContent = 'Table';
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => { views[c.id] = views[c.id] === 'table' ? 'chart' : 'table'; renderCard(c, lastC); });
    head.appendChild(btn);
  }
  const lg = document.createElement('div'), body = document.createElement('div'); body.className = 'chart';
  const tk = document.createElement('p'); tk.className = 'takeaway';
  card.append(head, lg, body, tk);
  grid.appendChild(card);
  cardEls[c.id] = { card, h2, sub, btn, lg, body, tk };
  views[c.id] = c.kind === 'table' ? 'table' : 'chart';
});

function richText(el, parts) {
  el.replaceChildren();
  if (!parts) return;
  parts.forEach(p => {
    if (Array.isArray(p)) { const s = document.createElement('strong'); s.textContent = p[0]; el.appendChild(s); }
    else el.appendChild(document.createTextNode(p));
  });
}

let lastC = null;
function renderCard(c, C) {
  const e = cardEls[c.id];
  e.h2.textContent = c.title(C);
  e.sub.textContent = c.sub(C);
  const asTable = views[c.id] === 'table';
  if (e.btn) { e.btn.textContent = asTable ? 'Chart' : 'Table'; e.btn.setAttribute('aria-pressed', String(asTable)); }
  e.lg.replaceChildren();
  const lg = !asTable && c.legend ? c.legend(C) : null;
  if (lg) e.lg.appendChild(legend(lg));
  if (asTable) {
    const spec = c.table(C);
    if (!spec.rows.length) e.body.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty', textContent: spec.empty || 'No data in this selection' }));
    else tableView(e.body, spec);
  } else c.chart(e.body, C);
  if (c.note) richText(e.tk, [c.note]);
  else richText(e.tk, c.takeaway ? c.takeaway(C) : null);
}

function kpis(C) {
  const el = $('#kpis'); el.replaceChildren();
  const tile = (label, value, unit, note) => {
    const d = document.createElement('div'); d.className = 'tile';
    const l = document.createElement('div'); l.className = 'label'; l.textContent = label;
    const v = document.createElement('div'); v.className = 'value'; v.textContent = value;
    if (unit) { const s = document.createElement('small'); s.textContent = unit; v.appendChild(s); }
    const n = document.createElement('div'); n.className = 'note'; n.textContent = note;
    d.append(l, v, n); el.appendChild(d);
  };
  const tm = state.team >= 0;
  if (tm) tile(`${teamAbbr(state.team)} win rate`, C.decided ? String(Math.round(100 * C.teamW / C.decided)) : '–', C.decided ? '%' : '', `${C.teamW} won · ${C.teamL} lost`);
  else tile('Decided matches', fmt0(C.decided), '', `${fmt0(C.played)} played · ties and no-results excluded`);
  tile(tm ? `Par score, ${teamAbbr(state.team)} batting first` : 'Par first-innings score', fmt0(C.parAvg), '', `${fmt0(C.parN)} first innings`);
  tile('Totals of 200+', C.par200 == null ? '–' : String(Math.round(C.par200 * 100)), C.par200 == null ? '' : '%', 'share of those first innings');
  tile('Chasing side wins', C.chasePct == null ? '–' : String(Math.round(C.chasePct * 100)), C.chasePct == null ? '' : '%', 'of decided matches');
  tile('Toss winner wins', C.tossPct == null ? '–' : String(Math.round(C.tossPct * 100)), C.tossPct == null ? '' : '%', C.fieldPct == null ? '' : `${Math.round(C.fieldPct * 100)}% of toss winners field`);
}

function scopeLine(C) {
  const el = $('#scope'); el.replaceChildren();
  const parts = ['Showing ', [rangeLabel()], ' · ', [state.team >= 0 ? teamName(state.team) : 'all teams'], ' · ', [state.ground >= 0 ? groundLabel(state.ground) : 'all grounds'], ` · ${fmt0(C.decided)} decided matches`];
  richText(el, parts);
}

/* ---------- filters ---------------------------------------------------- */
const fromR = $('#fromR'), toR = $('#toR'), fill = $('#rangeFill'), out = $('#seasonOut');
const teamSel = $('#teamSel'), groundSel = $('#groundSel');
function opt(sel, v, t) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
opt(teamSel, -1, 'All teams');
D.teams.map((t, i) => i).sort((a, b) => D.teams[a] < D.teams[b] ? -1 : 1).forEach(i => opt(teamSel, i, `${D.teams[i]} (${D.abbr[i]})`));
opt(groundSel, -1, 'All grounds');
D.grounds.map((g, i) => i).sort((a, b) => D.grounds[a] < D.grounds[b] ? -1 : 1).forEach(i => opt(groundSel, i, groundLabel(i)));

function syncControls() {
  fromR.value = state.from; toR.value = state.to;
  const span = SEASON_MAX - SEASON_MIN;
  const a = (state.from - SEASON_MIN) / span, b = (state.to - SEASON_MIN) / span;
  fill.style.left = `calc(8px + (100% - 16px) * ${a})`; fill.style.width = `calc((100% - 16px) * ${b - a})`;
  out.textContent = state.from === state.to ? state.from : `${state.from} – ${state.to}`;
  teamSel.value = state.team; groundSel.value = state.ground;
  document.querySelectorAll('#presets .chip[data-from]').forEach(c => c.setAttribute('aria-pressed', String(+c.dataset.from === state.from && +c.dataset.to === state.to)));
}
fromR.addEventListener('input', () => { state.from = Math.min(+fromR.value, state.to); update(); });
toR.addEventListener('input', () => { state.to = Math.max(+toR.value, state.from); update(); });
// keep the thumb that can still move on top
fromR.addEventListener('pointerdown', () => { fromR.style.zIndex = 2; toR.style.zIndex = 1; });
toR.addEventListener('pointerdown', () => { toR.style.zIndex = 2; fromR.style.zIndex = 1; });
teamSel.addEventListener('change', () => { state.team = +teamSel.value; update(); });
groundSel.addEventListener('change', () => { state.ground = +groundSel.value; update(); });
document.querySelectorAll('#presets .chip[data-from]').forEach(c => c.addEventListener('click', () => { state.from = +c.dataset.from; state.to = +c.dataset.to; update(); }));
$('#resetBtn').addEventListener('click', () => { Object.assign(state, { from: SEASON_MIN, to: SEASON_MAX, team: -1, ground: -1 }); update(); });

/* ---------- theme ------------------------------------------------------- */
const themeBtn = $('#themeBtn');
let theme = 'auto';
try { theme = localStorage.getItem('ipl-theme') || 'auto'; } catch (e) {}
function applyTheme() {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  themeBtn.textContent = 'Theme: ' + theme;
}
themeBtn.addEventListener('click', () => {
  theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
  try { localStorage.setItem('ipl-theme', theme); } catch (e) {}
  applyTheme(); renderAll();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => renderAll());

/* ---------- main loop --------------------------------------------------- */
function renderAll() { if (!lastC) return; kpis(lastC); scopeLine(lastC); CARDS.forEach(c => renderCard(c, lastC)); }
function update() {
  tipHide();
  syncControls(); writeHash();
  lastC = compute();
  renderAll();
}
let rt = null, lastW = innerWidth;
addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(renderAll, 120); });
addEventListener('hashchange', () => { readHash(); update(); });
addEventListener('scroll', tipHide, { passive: true });

readHash(); applyTheme(); update();
window.__ipl = { state, compute, update };   // used by the build check
})();
