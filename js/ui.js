/* Meridian Bureau: screens and input. */
(function (MB) {
  'use strict';

  const E = MB.Engine, Art = MB.Art, Snd = MB.Audio;
  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.prototype.slice.call((root || document).querySelectorAll(s));
  const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let profile = E.loadProfile();
  let S = null;            // the case in progress
  let pickId = null;       // destination chosen on the map
  let flying = false;
  let stopTyping = null;   // finishes the message being typed
  let titleTimer = null;
  let sceneCtx = null, mapCtx = null;

  /* ---------- small helpers ---------- */
  function el(tag, props, kids) {
    const n = document.createElement(tag);
    Object.keys(props || {}).forEach(k => {
      const v = props[k];
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(c => n.append(c));
    return n;
  }
  const pad = n => (n < 10 ? '00' : n < 100 ? '0' : '') + n;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const hours = n => n + (n === 1 ? ' hour' : ' hours');
  const alias = s => s.name + ', alias “' + s.code + '”';
  const whereIs = c => (c.name === c.country ? c.name : c.name + ', ' + c.country);
  function coords(c) {
    return Math.abs(c.lat).toFixed(1) + '°' + (c.lat >= 0 ? 'N' : 'S') + ' ' +
      Math.abs(c.lon).toFixed(1) + '°' + (c.lon >= 0 ? 'E' : 'W');
  }

  /* ---------- the wire: typed messages ---------- */
  function finishTyping() { if (stopTyping) stopTyping(); }

  function say(m) {
    finishTyping();
    const box = $('#wire-body');
    const node = el('div', { class: 'msg ' + (m.tone || 'sys') });
    if (m.face) {
      const cv = el('canvas', { class: 'face', width: 40, height: 40, 'aria-hidden': 'true' });
      Art.portrait(cv.getContext('2d'), m.face.seed, m.face.type);
      node.append(cv);
    }
    const body = el('div', { class: 'msg-body' });
    if (m.who) body.append(el('div', { class: 'msg-who', text: m.who }));
    const p = el('p');
    body.append(p);
    node.append(body);
    box.append(node);
    box.scrollTop = box.scrollHeight;

    return new Promise(resolve => {
      if (still) { p.textContent = m.text; resolve(); return; }
      let i = 0;
      const timer = setInterval(() => {
        i = Math.min(m.text.length, i + 2);
        p.textContent = m.text.slice(0, i);
        box.scrollTop = box.scrollHeight;
        Snd.play('tick');
        if (i >= m.text.length) done();
      }, 16);
      function done() {
        clearInterval(timer);
        stopTyping = null;
        p.textContent = m.text;
        box.scrollTop = box.scrollHeight;
        resolve();
      }
      stopTyping = done;
    });
  }

  /* ---------- modal ---------- */
  function openModal(o) {
    const d = $('#modal');
    d.className = o.tone || '';
    $('#modal-stamp').textContent = o.stamp || '';
    $('#modal-title').textContent = o.title;
    const face = $('#modal-face');
    face.hidden = !o.suspect;
    if (o.suspect) Art.mugshot(face.getContext('2d'), o.suspect);
    $('#modal-body').replaceChildren.apply($('#modal-body'), o.body.map(t => el('p', { text: t })));
    const acts = $('#modal-actions');
    acts.replaceChildren();
    o.actions.forEach(a => acts.append(el('button', {
      type: 'button', class: 'btn' + (a.primary ? ' primary' : ''),
      onclick: () => { d.close(); a.run(); }
    }, [a.label])));
    if (!d.open) d.showModal();
    const first = $('button', acts);
    if (first) first.focus();
  }

  /* ---------- front desk ---------- */
  function showTitle() {
    finishTyping();
    S = null;
    $('#game').hidden = true;
    $('#title').hidden = false;
    const played = profile.caseNo > 0;
    $('#agent-name').value = profile.name;
    $('#title-status').textContent = played
      ? E.rank(profile).title + (profile.name ? ' ' + profile.name : '') + ': ' + profile.solved + ' closed, ' +
        profile.failed + ' gone cold. Ring members in custody: ' + profile.captured.length + ' of ' + MB.SUSPECTS.length + '.'
      : 'No file on record. New tracers start as trainees.';
    $('#btn-start').textContent = played ? 'Take the next case' : 'Open your first case';
    $('#btn-reset').hidden = !played;

    const ctx = $('#title-map').getContext('2d'), t0 = Date.now();
    clearInterval(titleTimer);
    Art.title(ctx, 0);
    if (!still) titleTimer = setInterval(() => Art.title(ctx, (Date.now() - t0) / 1000), 70);
  }

  function beginCase() {
    clearInterval(titleTimer);
    finishTyping();
    S = E.newCase(profile);
    pickId = null;
    flying = false;
    $('#wire-body').replaceChildren();
    $('#dossier-msg').textContent = '';
    $('#atlas-q').value = '';
    $('#atlas-only').checked = false;
    $('#title').hidden = true;
    $('#game').hidden = false;
    setTab('leads');
    renderAll();

    const start = E.here(S);
    openModal({
      stamp: 'Priority wire',
      title: 'Case ' + pad(S.caseNo) + ': ' + start.name,
      body: [
        'Stolen overnight in ' + whereIs(start) + ': ' + S.loot +
          '. A single black-and-white feather was left behind, the calling card of the Magpie Ring.',
        'Pick up the trail in ' + start.name + '. Question witnesses, follow the thief from city to city, and work out which member of the Ring you are chasing. You cannot make an arrest without a warrant.',
        'The trail goes cold in ' + S.budget + ' hours.'
      ],
      actions: [{
        label: 'Take the case', primary: true,
        run: () => {
          Snd.play('click');
          say({ text: 'File open. Start with LEADS. When you know where the thief went, open the MAP. Build your case in the DOSSIER. If a clue stumps you, look it up in the ATLAS.' });
        }
      }]
    });
  }

  /* ---------- rendering ---------- */
  function renderHeader() {
    $('#stat-case').textContent = 'Case ' + pad(S.caseNo);
    $('#stat-rank').textContent = S.rankTitle;
    $('#stat-local').textContent = E.clockText(S) + ' local';
    $('#stat-hours').textContent = Math.max(0, S.hoursLeft);
    const f = Math.max(0, Math.min(1, S.hoursLeft / S.budget)), fill = $('#fuse-fill');
    fill.style.width = (f * 100).toFixed(1) + '%';
    fill.classList.toggle('low', f < 0.25);
    const w = $('#stat-warrant');
    w.textContent = S.warrant ? 'Warrant: ' + E.suspect(S.warrant).code : 'No warrant';
    w.classList.toggle('on', !!S.warrant);
  }

  function renderScene() {
    const c = E.here(S);
    Art.scene(sceneCtx, c, E.localHour(S));
    $('#scene').setAttribute('aria-label', 'View of ' + c.name);
    $('#city-name').textContent = c.name;
    $('#city-sub').textContent = c.country + ' · ' + coords(c);
    $('#city-blurb').textContent = c.blurb;
  }

  function renderLeads() {
    const box = $('#leads');
    box.replaceChildren();
    E.places(S).forEach((p, i) => {
      box.append(el('button', {
        type: 'button', class: 'lead' + (p.seen ? ' seen' : ''), disabled: !!S.over || flying,
        onclick: () => onLead(i)
      }, [
        el('span', { class: 'lead-name', text: p.name }),
        el('span', { class: 'lead-who', text: 'Talk to the ' + p.who }),
        el('span', { class: 'lead-cost', text: p.seen ? 'Heard. Read again' : hours(p.cost) })
      ]));
    });
  }

  // Labels sit to the right of a pin unless that would run off the map or cover a neighbour.
  function crowded(c, others) {
    const a = Art.mapXY(c);
    return others.some(o => {
      if (o.id === c.id) return false;
      const b = Art.mapXY(o), dx = b.x - a.x;
      return Math.abs(b.y - a.y) < 0.06 && (dx > 0 || (dx === 0 && o.id > c.id)) && dx < 0.16;
    });
  }

  function pin(c, cls, fn, flip) {
    const xy = Art.mapXY(c);
    const n = el(fn ? 'button' : 'div', {
      class: 'pin ' + cls + (flip || xy.x > 0.82 ? ' left' : '') + (xy.y < 0.14 ? ' low' : ''),
      style: 'left:' + (xy.x * 100).toFixed(2) + '%;top:' + (xy.y * 100).toFixed(2) + '%'
    }, [el('i'), el('span', { text: c.name })]);
    if (fn) { n.type = 'button'; n.addEventListener('click', fn); }
    return n;
  }

  function choose(id) {
    if (flying || S.over) return;
    pickId = pickId === id ? null : id;
    Snd.play('click');
    renderMap();
  }

  function renderMap() {
    const from = E.here(S), opts = E.options(S);
    if (pickId && !opts.some(o => o.city.id === pickId)) pickId = null;
    const sel = pickId ? E.city(pickId) : null;
    Art.map(mapCtx, { from: from, dests: opts.map(o => o.city), sel: sel });

    const pins = $('#pins'), shown = [from].concat(opts.map(o => o.city));
    pins.replaceChildren(pin(from, 'here', null, crowded(from, shown)));
    opts.forEach(o => pins.append(pin(o.city, 'dest' + (o.city.id === pickId ? ' sel' : ''),
      () => choose(o.city.id), crowded(o.city, shown))));

    const list = $('#dest-list');
    list.replaceChildren();
    opts.forEach(o => {
      const on = o.city.id === pickId;
      list.append(el('button', {
        type: 'button', class: 'dest' + (on ? ' sel' : ''), 'aria-pressed': String(on),
        disabled: flying || !!S.over, onclick: () => choose(o.city.id)
      }, [
        el('span', { class: 'dest-name', text: o.city.name }),
        el('span', { class: 'dest-sub', text: o.city.country }),
        el('span', { class: 'dest-time', text: o.hours + ' h' })
      ]));
    });
    const go = $('#btn-fly');
    go.disabled = !sel || flying || !!S.over;
    go.textContent = sel ? 'Board flight to ' + sel.name : 'Choose a destination';
  }

  function renderDossier() {
    const box = $('#traits');
    box.replaceChildren();
    MB.TRAITS.forEach(t => {
      const chips = el('div', { class: 'chips', role: 'group', 'aria-label': t.label });
      [{ id: null, label: 'Unknown' }].concat(t.values).forEach(v => {
        const on = S.filters[t.key] === v.id;
        chips.append(el('button', {
          type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': String(on), disabled: !!S.over,
          onclick: () => {
            const res = E.setFilter(S, t.key, v.id);
            Snd.play('click');
            $('#dossier-msg').textContent = res.revoked ? 'Warrant withdrawn: the evidence no longer fits.' : '';
            renderDossier();
            renderHeader();
          }
        }, [v.label]));
      });
      box.append(el('div', { class: 'trait' }, [el('span', { class: 'trait-label', text: t.label }), chips]));
    });

    const fit = E.matches(S).map(s => s.id);
    $('#match-status').textContent = S.warrant
      ? 'Warrant on file for ' + alias(E.suspect(S.warrant)) + '.'
      : fit.length === 1 ? 'One suspect fits the evidence.' : fit.length + ' suspects fit the evidence.';
    $('#btn-warrant').disabled = !!S.over || !!S.warrant;

    const grid = $('#suspects');
    grid.replaceChildren();
    MB.SUSPECTS.forEach(s => {
      const jailed = S.jailed.indexOf(s.id) >= 0;
      const cv = el('canvas', { class: 'face', width: 40, height: 40, 'aria-hidden': 'true' });
      Art.mugshot(cv.getContext('2d'), s);
      const facts = el('ul', { class: 'facts' });
      MB.TRAITS.forEach(t => facts.append(el('li', {}, [
        el('span', { text: t.label }), el('b', { text: E.traitValue(t.key, s.traits[t.key]).label })
      ])));
      const state = jailed ? ' jailed' : fit.indexOf(s.id) < 0 ? ' out' : '';
      const head = el('div', { class: 'suspect-head' }, [cv, el('div', {}, [
        el('div', { class: 'code', text: s.code }), el('div', { class: 'real', text: s.name })
      ])]);
      const card = el('article', { class: 'suspect' + state + (S.warrant === s.id ? ' wanted' : '') }, [
        head, el('p', { class: 'bio', text: s.bio }), facts
      ]);
      if (jailed) card.append(el('div', { class: 'tag-jail', text: 'In custody' }));
      if (S.warrant === s.id) card.append(el('div', { class: 'tag-wanted', text: 'Warrant issued' }));
      grid.append(card);
    });
  }

  function renderNotebook() {
    const box = $('#notes');
    box.replaceChildren();
    if (!S.notes.length) {
      box.append(el('p', { class: 'empty', text: 'Nothing yet. Go and ask some questions.' }));
      return;
    }
    let last = null;
    S.notes.forEach(n => {
      if (n.city !== last) { box.append(el('h3', { text: E.city(n.city).name })); last = n.city; }
      box.append(el('div', { class: 'note ' + n.kind }, [
        el('div', { class: 'note-head', text: n.place + ' · ' + n.who + ' · ' + n.when }),
        el('p', { text: n.text })
      ]));
    });
  }

  function renderAtlas() {
    const q = $('#atlas-q').value.trim().toLowerCase(), only = $('#atlas-only').checked;
    const board = E.options(S).map(o => o.city.id);
    const box = $('#atlas');
    box.replaceChildren();
    MB.CITIES.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
      const listed = board.indexOf(c.id) >= 0;
      if (only && !listed) return;
      const flag = cap(c.flag.replace(/^an? /, ''));
      if (q && [c.name, c.country, c.currency, c.languages, flag, c.known].join(' ').toLowerCase().indexOf(q) < 0) return;
      const rows = el('dl', {});
      [['Currency', c.currency], ['Language', c.languages], ['Flag', flag], ['Known for', c.known]].forEach(r => {
        rows.append(el('dt', { text: r[0] }), el('dd', { text: r[1] }));
      });
      const head = el('h3', {}, [c.name, el('span', { text: c.country })]);
      const card = el('article', { class: 'place' + (listed ? ' listed' : '') }, [head, rows]);
      if (listed) card.append(el('div', { class: 'tag-board', text: 'On the departures board' }));
      box.append(card);
    });
    if (!box.children.length) box.append(el('p', { class: 'empty', text: 'Nothing in the atlas matches that.' }));
  }

  function renderAll() {
    renderHeader(); renderScene(); renderLeads(); renderMap(); renderDossier(); renderNotebook(); renderAtlas();
  }

  function setTab(name) {
    $$('.tabs [role=tab]').forEach(b => {
      const on = b.dataset.tab === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    $$('.panel').forEach(p => { p.hidden = p.id !== 'panel-' + name; });
  }

  /* ---------- actions ---------- */
  function onLead(i) {
    if (!S || S.over || flying) return;
    const game = S, r = E.investigate(S, i);
    if (!r) return;
    Snd.play(r.repeat ? 'click' : r.kind === 'clue' ? 'clue' : r.kind === 'deny' ? 'deny' : 'alert');
    renderHeader(); renderScene(); renderLeads(); renderNotebook();
    say({
      tone: r.kind === 'clue' ? 'witness' : r.kind === 'deny' ? 'deny' : 'alert',
      who: r.place.name + ' · ' + r.place.who,
      text: r.text,
      face: r.kind === 'late' ? null : r.face
    }).then(() => { if (S === game && S.over) endCase(); });
  }

  function fly() {
    if (!S || S.over || flying || !pickId) return;
    const game = S, from = E.here(S), to = E.city(pickId);
    flying = true;
    finishTyping();
    Snd.play('fly');
    renderMap();
    renderLeads();
    $('#pins').replaceChildren(pin(from, 'here'), pin(to, 'dest sel'));

    const span = still ? 250 : 1700, t0 = Date.now();
    const timer = setInterval(() => {
      if (S !== game) { clearInterval(timer); return; }
      const t = Math.min(1, (Date.now() - t0) / span);
      Art.map(mapCtx, { from: from, dests: [to], sel: to, plane: t });
      if (t < 1) return;
      clearInterval(timer);
      const trip = E.travel(S, to.id);
      pickId = null;
      flying = false;
      Snd.play('land');
      renderAll();
      setTab('leads');
      say({
        text: hours(trip.hours) + ' in the air. Touchdown in ' + whereIs(to) + '. ' + E.clockText(S) + ' local time.'
      }).then(() => { if (S === game && S.over) endCase(); });
    }, 30);
  }

  function askWarrant() {
    if (!S || S.over) return;
    const res = E.requestWarrant(S), msg = $('#dossier-msg');
    if (res.ok) {
      Snd.play('stamp');
      msg.textContent = 'Signed and sealed.';
      say({ tone: 'alert', text: 'Greenwich confirms a warrant for ' + alias(res.suspect) + '. Now find them.' });
    } else {
      Snd.play('deny');
      msg.textContent = res.count === 0
        ? 'Nobody in the files fits that description. Check your evidence.'
        : 'No judge will sign that: ' + res.count + ' suspects still fit. Narrow it down.';
    }
    renderDossier();
    renderHeader();
  }

  function endCase() {
    if (!S || !S.over || S.closed) return;
    const o = S.over, who = E.suspect(S.culprit);
    const first = E.city(S.trail[0]), last = E.city(S.trail[S.trail.length - 1]);
    const said = k => E.traitValue(k, who.traits[k]).say;
    const res = E.finish(profile, S);
    const body = [];
    let stamp, title;

    if (o.win) {
      Snd.play('win');
      stamp = 'Case closed';
      title = who.code + ' is in custody';
      body.push('Behind the door at the ' + o.place + ' in ' + last.name + ' you find ' + alias(who) + ', humming ' +
        said('tune') + ' with ' + said('pet') + ' keeping watch. The warrant holds.');
      body.push('You recover ' + S.loot + ', which will be on the next flight home to ' + first.name +
        '. You had ' + hours(S.hoursLeft) + ' to spare.');
      body.push(res.ringBroken
        ? 'That was the last of them. All ten members of the Magpie Ring are behind bars. Then again, magpies always come back.'
        : 'Ring members in custody: ' + res.custody + ' of ' + MB.SUSPECTS.length + '.');
      if (res.promoted) body.push('Greenwich is pleased. You are promoted to ' + res.promoted + '. Expect longer trails and less time to spare.');
    } else {
      Snd.play('lose');
      if (o.reason === 'time') {
        stamp = 'Trail gone cold';
        title = 'Out of time';
        body.push('The clock runs out in ' + E.here(S).name + '. Somewhere ahead of you, ' + alias(who) + ', slips away with ' + S.loot + '.');
      } else if (o.reason === 'nowarrant') {
        stamp = 'No warrant';
        title = 'So close';
        body.push('Behind the door at the ' + o.place + ' sits ' + alias(who) + ', sharing ' + said('snack') + ' with ' +
          said('pet') + '. Without a warrant, the local police can only shrug. ' + who.code + ' tips a hat and strolls out past you.');
      } else {
        stamp = 'Wrong warrant';
        title = 'The wrong name';
        body.push('Your warrant names ' + E.suspect(S.warrant).name + '. The person behind the door at the ' + o.place +
          ' is ' + alias(who) + '. A lawyer appears from nowhere, and ' + who.code + ' walks free.');
      }
      body.push('The trail ran: ' + S.trail.map(id => E.city(id).name).join(' → ') + '.');
      body.push('Greenwich will have another case for you.');
    }
    renderHeader(); renderLeads(); renderMap(); renderDossier();
    openModal({
      tone: o.win ? 'win' : 'lose', stamp: stamp, title: title, body: body, suspect: who,
      actions: [
        { label: 'Next case', primary: true, run: beginCase },
        { label: 'Front desk', run: showTitle }
      ]
    });
  }

  /* ---------- wiring ---------- */
  function syncSound() {
    const b = $('#btn-sound'), on = !Snd.isMuted();
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Sound on' : 'Sound off';
  }

  function init() {
    sceneCtx = $('#scene').getContext('2d');
    mapCtx = $('#map').getContext('2d');

    $('#start-form').addEventListener('submit', e => {
      e.preventDefault();
      profile.name = $('#agent-name').value.trim().slice(0, 18);
      E.saveProfile(profile);
      Snd.unlock();
      Snd.play('start');
      beginCase();
    });
    $('#btn-reset').addEventListener('click', () => {
      openModal({
        stamp: 'Records office', title: 'Erase your file?',
        body: ['Your rank, your closed cases and every Ring member you have caught will be wiped. This cannot be undone.'],
        actions: [
          { label: 'Keep my file', primary: true, run: () => {} },
          { label: 'Erase it', run: () => { profile = E.resetProfile(); showTitle(); } }
        ]
      });
    });

    $$('.tabs [role=tab]').forEach(b => b.addEventListener('click', () => { Snd.play('click'); setTab(b.dataset.tab); }));
    $('.tabs').addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = $$('.tabs [role=tab]'), at = tabs.indexOf(document.activeElement);
      if (at < 0) return;
      const next = tabs[(at + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      setTab(next.dataset.tab);
      next.focus();
      e.preventDefault();
    });

    $('#btn-fly').addEventListener('click', fly);
    $('#btn-warrant').addEventListener('click', askWarrant);
    $('#atlas-q').addEventListener('input', () => { if (S) renderAtlas(); });
    $('#atlas-only').addEventListener('change', () => { if (S) renderAtlas(); });
    $('#wire-body').addEventListener('click', finishTyping);
    $('#modal').addEventListener('cancel', e => e.preventDefault());

    $('#btn-sound').addEventListener('click', () => {
      Snd.setMuted(!Snd.isMuted());
      syncSound();
      Snd.play('click');
    });
    $('#btn-quit').addEventListener('click', () => {
      if (!S || S.over) { showTitle(); return; }
      openModal({
        stamp: 'Front desk', title: 'Close this file?',
        body: ['The case will be handed to another tracer. It will not count against you.'],
        actions: [
          { label: 'Keep working', primary: true, run: () => {} },
          { label: 'Close the file', run: showTitle }
        ]
      });
    });

    syncSound();
    showTitle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.MB = window.MB || {});
