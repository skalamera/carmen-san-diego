/* Meridian Bureau: case generator and rules. No DOM in here, so it can be tested on its own. */
(function (MB) {
  'use strict';

  const CITY = {};
  MB.CITIES.forEach(c => { CITY[c.id] = c; });
  const SUSPECT = {};
  MB.SUSPECTS.forEach(s => { SUSPECT[s.id] = s; });
  const TRAIT = {};
  MB.TRAITS.forEach(t => { TRAIT[t.key] = t; });
  const SAVE_KEY = 'meridian-bureau-v1';
  const HOURS_PER_STOP = MB.TIER_COST.reduce((a, b) => a + b, 0);

  /* ---------- small helpers ---------- */
  function rngFrom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  const fill = (tpl, v) => tpl.replace('{v}', v);

  function distKm(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.pow(Math.sin(dLon / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  const flightHours = (a, b) => Math.max(2, Math.round(distKm(a, b) / 800));

  function rankIndex(solved) {
    let r = 0;
    MB.RANKS.forEach((k, i) => { if (solved >= k.min) r = i; });
    return r;
  }
  function traitValue(key, id) { return TRAIT[key].values.find(v => v.id === id); }

  /* ---------- saved profile ---------- */
  function blankProfile() {
    return { name: '', solved: 0, failed: 0, captured: [], caseNo: 0, lastStart: null, rings: 0 };
  }
  function loadProfile() {
    const p = blankProfile();
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.name === 'string') p.name = d.name.slice(0, 18);
        ['solved', 'failed', 'caseNo', 'rings'].forEach(k => { if (d[k] >= 0) p[k] = Math.floor(d[k]); });
        if (Array.isArray(d.captured)) p.captured = d.captured.filter(id => SUSPECT[id]);
        if (CITY[d.lastStart]) p.lastStart = d.lastStart;
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    return p;
  }
  function saveProfile(p) {
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
  }
  function resetProfile() {
    try { window.localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    return blankProfile();
  }

  /* ---------- building a case ---------- */
  function makePlaces(r, seed, city) {
    const mid = ['market', 'station', 'bank', 'garage'];
    if (city.art.water) mid.push('harbor');
    const tiers = [['hotel', 'cafe', 'kiosk'], mid, ['library', 'museum', 'embassy']];
    return tiers.map((opts, tier) => {
      const type = pick(r, opts), def = MB.PLACES[type];
      return {
        type: type, name: def.name, who: def.who, cost: MB.TIER_COST[tier],
        intro: pick(r, def.intro), face: (hashStr(city.id + type) ^ seed) >>> 0,
        kind: 'deny', trait: null, text: ''
      };
    });
  }

  function assignTopics(r, places, city, next) {
    const prefer = { bank: 'money', embassy: 'flag', library: 'tongue' };
    // Nobody changes money into the currency they already hold, or studies a language spoken here.
    const pool = ['flag', 'sight', 'sight'];
    if (city.moneyKey !== next.moneyKey) pool.push('money');
    if (city.languages.indexOf(next.tongue) < 0) pool.push('tongue');
    const left = shuffle(r, pool);
    const out = places.map(p => {
      const want = prefer[p.type], at = left.indexOf(want);
      if (at < 0) return null;
      left.splice(at, 1);
      return want;
    });
    return out.map(c => c || left.shift());
  }

  function newCase(profile, seedIn) {
    const seed = seedIn == null ? Math.floor(Math.random() * 4294967296) >>> 0 : seedIn >>> 0;
    const r = rngFrom(seed);
    const ri = rankIndex(profile.solved), rank = MB.RANKS[ri];

    const free = MB.SUSPECTS.filter(s => profile.captured.indexOf(s.id) < 0);
    const culprit = pick(r, free.length ? free : MB.SUSPECTS);

    // The trail: a chain of cities, each a real journey from the last.
    const trail = [pick(r, MB.CITIES.filter(c => c.id !== profile.lastStart))];
    while (trail.length < rank.trail) {
      const from = trail[trail.length - 1];
      trail.push(pick(r, MB.CITIES.filter(c => trail.indexOf(c) < 0 && distKm(from, c) >= 1500)));
    }
    const onTrail = {};
    trail.forEach(c => { onTrail[c.id] = true; });

    // Every trait surfaces somewhere before the last city.
    const order = shuffle(r, MB.TRAITS.map(t => t.key));
    const clueStops = trail.length - 1;
    const hints = trail.map(() => []);
    order.forEach((k, j) => { hints[j % clueStops].push(k); });
    for (let i = order.length; i < clueStops; i++) hints[i].push(pick(r, order));

    const stops = {};
    trail.forEach((c, i) => {
      const last = i === trail.length - 1;
      const next = last ? null : trail[i + 1];
      const places = makePlaces(r, seed, c);

      if (last) {
        const den = Math.floor(r() * places.length);
        const lines = shuffle(r, MB.LINES.close);
        places.forEach((p, j) => {
          if (j === den) {
            p.kind = 'hideout';
            p.text = 'The ' + p.who + ' says nothing at all, only nods toward a door at the back and walks away. Someone is on the other side of it.';
          } else {
            p.kind = 'close';
            p.text = lines.pop().replace(/\{who\}/g, p.who);
          }
        });
      } else {
        const topics = assignTopics(r, places, c, next);
        const sights = shuffle(r, next.sights);
        const said = places.map((p, j) => {
          const t = topics[j];
          const about = t === 'sight' ? sights.pop() : next[t];
          p.kind = 'clue';
          return [pick(r, MB.LINES.lead), fill(pick(r, MB.LINES[t]), about)];
        });
        // Details about the thief come out in the longer interviews first.
        hints[i].forEach((k, n) => {
          const j = places.length - 1 - n;
          said[j].push(fill(pick(r, MB.LINES.trait[k]), traitValue(k, culprit.traits[k]).say));
          places[j].trait = k;
        });
        places.forEach((p, j) => {
          p.text = p.intro + ' “' + said[j].filter(Boolean).join(' ') + '”';
        });
      }

      // Decoys never share a currency or language with the real destination,
      // so a clue always points at exactly one city on the board.
      const decoys = shuffle(r, MB.CITIES.filter(d =>
        !onTrail[d.id] && !(next && (d.moneyKey === next.moneyKey || d.langKey === next.langKey))
      )).slice(0, last ? 4 : 3);
      stops[c.id] = {
        places: places,
        options: shuffle(r, (last ? [] : [next]).concat(decoys)).map(x => x.id)
      };
    });

    let air = 0;
    for (let i = 0; i < trail.length - 1; i++) air += flightHours(trail[i], trail[i + 1]);
    const budget = air + trail.length * HOURS_PER_STOP + rank.slack;

    const start = trail[0];
    const clock = (((9 - start.utc) % 24) + 24) % 24 + 24; // 09:00 local on day one

    profile.caseNo += 1;
    profile.lastStart = start.id;
    saveProfile(profile);

    const filters = {};
    MB.TRAITS.forEach(t => { filters[t.key] = null; });

    return {
      seed: seed, caseNo: profile.caseNo, rank: ri, rankTitle: rank.title,
      culprit: culprit.id, loot: start.loot, trail: trail.map(c => c.id), stops: stops,
      idx: 0, pos: start.id, hoursLeft: budget, budget: budget, clock: clock,
      day0: Math.floor((clock + start.utc) / 24),
      seen: {}, notes: [], filters: filters, warrant: null, over: null, closed: false,
      jailed: profile.captured.slice()
    };
  }

  /* ---------- reading the state ---------- */
  const here = S => CITY[S.pos];
  const onTrail = S => S.pos === S.trail[S.idx];

  function stopHere(S) {
    if (!S.stops[S.pos]) {
      // A wrong turn: nobody here has seen anything.
      const c = CITY[S.pos], r = rngFrom((hashStr(c.id) ^ S.seed) >>> 0);
      const places = makePlaces(r, S.seed, c), lines = shuffle(r, MB.LINES.deny);
      places.forEach((p, i) => { p.kind = 'deny'; p.text = p.intro + ' “' + lines[i] + '”'; });
      S.stops[S.pos] = { places: places, options: null };
    }
    return S.stops[S.pos];
  }

  function places(S) {
    const seen = S.seen[S.pos] || [];
    return stopHere(S).places.map((p, i) => ({
      type: p.type, name: p.name, who: p.who, cost: p.cost, seen: !!seen[i]
    }));
  }

  function options(S) {
    const anchor = S.trail[S.idx], base = S.stops[anchor].options;
    const ids = onTrail(S) ? base : [anchor].concat(base.filter(id => id !== S.pos));
    const from = here(S);
    return ids.map(id => ({ city: CITY[id], hours: flightHours(from, CITY[id]) }));
  }

  function localHour(S) {
    return (((S.clock + here(S).utc) % 24) + 24) % 24;
  }
  function clockText(S) {
    const local = S.clock + here(S).utc;
    const day = Math.floor(local / 24) - S.day0 + 1;
    const h = localHour(S), hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return 'Day ' + day + ', ' + (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /* ---------- actions ---------- */
  function spend(S, hours) {
    S.hoursLeft -= hours;
    S.clock += hours;
  }
  function checkClock(S) {
    if (!S.over && S.hoursLeft <= 0) {
      S.hoursLeft = 0;
      S.over = { win: false, reason: 'time' };
    }
  }

  function investigate(S, i) {
    if (S.over) return null;
    const p = stopHere(S).places[i];
    if (!p) return null;
    const seen = S.seen[S.pos] || (S.seen[S.pos] = []);
    const out = { place: p, text: p.text, kind: p.kind, face: { seed: p.face, type: p.type }, repeat: !!seen[i] };
    if (seen[i]) return out;

    if (S.hoursLeft < p.cost) {
      // Not enough time left to finish the conversation.
      spend(S, S.hoursLeft);
      S.over = { win: false, reason: 'time' };
      out.kind = 'late';
      out.text = 'You are still waiting to speak to the ' + p.who + ' when the wire comes through from Greenwich: the trail has gone cold.';
      return out;
    }
    seen[i] = true;
    spend(S, p.cost);

    if (p.kind === 'hideout') {
      S.over = S.warrant === S.culprit ? { win: true, reason: 'caught', place: p.name }
        : { win: false, reason: S.warrant ? 'wrongwarrant' : 'nowarrant', place: p.name };
      return out;
    }
    S.notes.push({ city: S.pos, place: p.name, who: p.who, text: p.text, kind: p.kind, when: clockText(S) });
    checkClock(S);
    return out;
  }

  function travel(S, id) {
    if (S.over) return null;
    const opt = options(S).find(o => o.city.id === id);
    if (!opt) return null;
    spend(S, opt.hours);
    if (id === S.trail[S.idx + 1]) S.idx += 1;
    S.pos = id;
    checkClock(S);
    return { city: opt.city, hours: opt.hours };
  }

  /* ---------- the warrant ---------- */
  function matches(S) {
    return MB.SUSPECTS.filter(s =>
      S.jailed.indexOf(s.id) < 0 &&
      MB.TRAITS.every(t => !S.filters[t.key] || s.traits[t.key] === S.filters[t.key]));
  }
  function setFilter(S, key, value) {
    S.filters[key] = value || null;
    let revoked = false;
    if (S.warrant && !matches(S).some(s => s.id === S.warrant)) { S.warrant = null; revoked = true; }
    return { revoked: revoked };
  }
  function requestWarrant(S) {
    const m = matches(S);
    if (m.length === 1) { S.warrant = m[0].id; return { ok: true, suspect: m[0] }; }
    return { ok: false, count: m.length };
  }

  /* ---------- closing the file ---------- */
  function finish(profile, S) {
    if (S.closed || !S.over) return null;
    S.closed = true;
    const before = rankIndex(profile.solved);
    const out = { promoted: null, ringBroken: false, custody: profile.captured.length };
    if (S.over.win) {
      profile.solved += 1;
      if (profile.captured.indexOf(S.culprit) < 0) profile.captured.push(S.culprit);
      out.custody = profile.captured.length;
      if (profile.captured.length >= MB.SUSPECTS.length) {
        profile.captured = [];
        profile.rings += 1;
        out.ringBroken = true;
      }
      const after = rankIndex(profile.solved);
      if (after > before) out.promoted = MB.RANKS[after].title;
    } else {
      profile.failed += 1;
    }
    saveProfile(profile);
    return out;
  }

  MB.Engine = {
    newCase: newCase, here: here, onTrail: onTrail, places: places, options: options,
    localHour: localHour, clockText: clockText, investigate: investigate, travel: travel,
    matches: matches, setFilter: setFilter, requestWarrant: requestWarrant, finish: finish,
    loadProfile: loadProfile, saveProfile: saveProfile, resetProfile: resetProfile,
    rank: p => MB.RANKS[rankIndex(p.solved)],
    city: id => CITY[id], suspect: id => SUSPECT[id], traitValue: traitValue,
    flightHours: flightHours, distKm: distKm, rngFrom: rngFrom, hashStr: hashStr
  };
})(window.MB = window.MB || {});
