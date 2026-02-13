// js/entity.js
// ES module che espone initEntity(jsonPathOrUrl, opts) e fa l'auto-init se l'elemento <main> ha data-json
export async function initEntity(jsonPath = 'readme.json', opts = {}) {
  // opzioni di default
  const cfg = Object.assign({
    containerSelector: 'main.container',
    clickDelay: 360,
    noStore: true, // se true aggiunge cache: 'no-store'
  }, opts);

  const $ = s => document.querySelector(s);

  // load JSON
  async function loadJson(path) {
    const fetchOpts = cfg.noStore ? { cache: 'no-store' } : undefined;
    const res = await fetch(path, fetchOpts);
    if (!res.ok) throw new Error(`${path} non trovato: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // rendering helpers
  function setText(sel, text) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.textContent = text ?? '';
  }

  function renderStats(data) {
    const statsWrap = $('#stats-list');
    if (!statsWrap) return;
    statsWrap.innerHTML = '';
    for (const key of (data.statsOrder || [])) {
      if (!(key in (data.stats || {}))) continue;
      const row = document.createElement('div');
      row.className = 'stat';

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());

      const value = document.createElement('div');
      value.className = 'value';
      value.textContent = data.stats[key];

      row.append(label, value);
      statsWrap.appendChild(row);
    }
  }

  function renderAttacks(data) {
    const attacksGrid = $('#attacks-grid');
    if (!attacksGrid) return;
    attacksGrid.innerHTML = '';

    for (const group of (data.attacks || [])) {
      const col = document.createElement('div');
      col.className = 'attacks-col';

      const title = document.createElement('h3');
      title.className = 'attack-group-title';
      title.textContent = group.group;
      col.appendChild(title);

      for (const atk of (group.items || [])) {
        const box = document.createElement('div');
        box.className = 'attack';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = atk.name;

        const desc = document.createElement('div');
        desc.className = 'desc muted';
        desc.textContent = atk.desc || '';

        meta.append(name, desc);

        const numbers = document.createElement('div');
        numbers.className = 'numbers';

        if (atk.damage != null) {
          const dmg = document.createElement('div');
          dmg.className = 'dmg';
          dmg.textContent = `Danno: ${atk.damage}`;
          numbers.appendChild(dmg);
        }

        if (atk.energyCost != null) {
          const en = document.createElement('div');
          en.className = 'cost';
          en.textContent = `Energia: ${atk.energyCost}`;
          numbers.appendChild(en);
        }

        box.append(meta, numbers);
        col.appendChild(box);
      }

      attacksGrid.appendChild(col);
    }
  }

  function renderAbilities(data) {
    const abilitiesWrap = $('#abilities-wrap');
    if (!abilitiesWrap) return;
    abilitiesWrap.innerHTML = '';

    if ((data.abilities || []).length) {
      const title = document.createElement('h3');
      title.className = 'attack-group-title';
      title.textContent = 'Other Abilities';
      abilitiesWrap.appendChild(title);

      for (const ab of (data.abilities || [])) {
        const box = document.createElement('div');
        box.className = 'attack';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = ab.name;

        const desc = document.createElement('div');
        desc.className = 'desc muted';
        desc.textContent = ab.desc || '';

        meta.append(name, desc);

        const numbers = document.createElement('div');
        numbers.className = 'numbers';

        if (ab.effects) {
          if (ab.effects.healthPercent != null) {
            const h = document.createElement('div');
            h.className = 'dmg';
            h.textContent = `Health: +${ab.effects.healthPercent}%`;
            numbers.appendChild(h);
          }
          if (ab.effects.energyPercent != null) {
            const e = document.createElement('div');
            e.className = 'cost';
            e.textContent = `Energies: +${ab.effects.energyPercent}%`;
            numbers.appendChild(e);
          }
        } else if (ab.energyCost != null) {
          const en = document.createElement('div');
          en.className = 'cost';
          en.textContent = `Energia: ${ab.energyCost}`;
          numbers.appendChild(en);
        }

        box.append(meta, numbers);
        abilitiesWrap.appendChild(box);
      }
    }
  }

  // apply data to DOM
  function applyData(data) {
    // META
    if (data.meta) {
      setText('#entity-title', data.meta.entity);
      const human = document.querySelector('.entity-human');
      if (human) human.textContent = data.meta.humanName ?? '';
      const portrait = document.getElementById('portrait-img');
      if (portrait && data.meta.portrait) portrait.src = data.meta.portrait;
      if (data.meta.entity || data.meta.humanName) {
        document.title = `${data.meta.entity ?? ''} — ${data.meta.humanName ?? ''}`.trim();
      }
    }

    // LORE
    setText('#lore', data.lore || '');

    // STATS
    renderStats(data);

    // ATTACKS
    renderAttacks(data);

    // ABILITIES
    renderAbilities(data);
  }

  // clickable links fade-out handler (copied behaviour)
  function attachClickDelay() {
    const CLICK_DELAY = cfg.clickDelay;
    document.querySelectorAll('a.is-link, a.back-button').forEach(a=>{
      a.addEventListener('click', e=>{
        const href = a.getAttribute('href');
        if(!href || href.startsWith('#')) return;
        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(()=> location.href = href, CLICK_DELAY);
      });
    });
  }

  // orchestrazione
  try {
    const json = await loadJson(jsonPath);
    applyData(json);
    attachClickDelay();
    return { ok: true, data: json };
  } catch (err) {
    console.error('initEntity errore:', err);
    return { ok: false, error: err };
  }
}

// auto-init se il main ha data-json (comodo per più pagine)
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.container');
  if (!main) return;// js/entity.js
// ES module che: carica <jsonPath> (default 'readme.json'), popola il DOM secondo il markup
// e aggiunge il comportamento di fade sui link.
// Esporta initEntity(jsonPath, opts) per inizializzare manualmente; auto-init se <main data-json> è presente.

export async function initEntity(jsonPath = 'readme.json', opts = {}) {
  const cfg = Object.assign({
    containerSelector: 'main.container',
    clickDelay: 360,
    noStore: true
  }, opts);

  const $ = s => document.querySelector(s);

  async function loadJson(path) {
    const fetchOpts = cfg.noStore ? { cache: 'no-store' } : undefined;
    const res = await fetch(path, fetchOpts);
    if (!res.ok) throw new Error(`${path} non trovato: ${res.status} ${res.statusText}`);
    return res.json();
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = text ?? '';
  }

  function renderMeta(meta) {
    if (!meta) return;
    setText('#entity-title', meta.entity ?? '');
    const human = document.querySelector('.entity-human');
    if (human) human.textContent = meta.humanName ?? '';
    const portrait = document.getElementById('portrait-img');
    if (portrait) {
      portrait.src = meta.portrait ?? '';
      portrait.alt = `${meta.entity ?? meta.humanName ?? 'ritratto'}`;
    }
    if (meta.entity || meta.humanName) {
      document.title = `${meta.entity ?? ''} — ${meta.humanName ?? ''}`.trim();
    }
  }

  function renderLore(lore) {
    setText('#lore', lore || '');
  }

  function renderStats(data) {
    const statsWrap = $('#stats-list');
    if (!statsWrap) return;
    statsWrap.innerHTML = '';
    for (const key of (data.statsOrder || [])) {
      if (!(key in (data.stats || {}))) continue;

      const row = document.createElement('div');
      row.className = 'stat';

      const label = document.createElement('div');
      label.className = 'label';
      // Format key: camelCase -> "Camel Case"
      label.textContent = key.replace(/([A-Z])/g,' $1').replace(/^./, c => c.toUpperCase());

      const value = document.createElement('div');
      value.className = 'value';
      value.textContent = data.stats[key];

      row.append(label, value);
      statsWrap.appendChild(row);
    }
  }

  function renderAttacks(data) {
    const attacksGrid = $('#attacks-grid');
    if (!attacksGrid) return;
    attacksGrid.innerHTML = '';

    for (const group of (data.attacks || [])) {
      const col = document.createElement('div');
      col.className = 'attacks-col';

      const title = document.createElement('h3');
      title.className = 'attack-group-title';
      title.textContent = group.group ?? '';
      col.appendChild(title);

      for (const atk of (group.items || [])) {
        const box = document.createElement('div');
        box.className = 'attack';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = atk.name ?? '';

        const desc = document.createElement('div');
        desc.className = 'desc muted';
        desc.textContent = atk.desc || '';

        meta.append(name, desc);

        const numbers = document.createElement('div');
        numbers.className = 'numbers';

        if (atk.damage != null) {
          const dmg = document.createElement('div');
          dmg.className = 'dmg';
          dmg.textContent = `Danno: ${atk.damage}`;
          numbers.appendChild(dmg);
        }

        if (atk.energyCost != null) {
          const en = document.createElement('div');
          en.className = 'cost';
          en.textContent = `Energia: ${atk.energyCost}`;
          numbers.appendChild(en);
        }

        box.append(meta, numbers);
        col.appendChild(box);
      }

      attacksGrid.appendChild(col);
    }
  }

  function renderAbilities(data) {
    const abilitiesWrap = $('#abilities-wrap');
    if (!abilitiesWrap) return;
    abilitiesWrap.innerHTML = '';

    if ((data.abilities || []).length) {
      const title = document.createElement('h3');
      title.className = 'attack-group-title';
      title.textContent = 'Other Abilities';
      abilitiesWrap.appendChild(title);

      for (const ab of (data.abilities || [])) {
        const box = document.createElement('div');
        box.className = 'attack';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = ab.name ?? '';

        const desc = document.createElement('div');
        desc.className = 'desc muted';
        desc.textContent = ab.desc || '';

        meta.append(name, desc);

        const numbers = document.createElement('div');
        numbers.className = 'numbers';

        if (ab.effects) {
          if (ab.effects.healthPercent != null) {
            const h = document.createElement('div');
            h.className = 'dmg';
            h.textContent = `Health: +${ab.effects.healthPercent}%`;
            numbers.appendChild(h);
          }
          if (ab.effects.energyPercent != null) {
            const e = document.createElement('div');
            e.className = 'cost';
            e.textContent = `Energies: +${ab.effects.energyPercent}%`;
            numbers.appendChild(e);
          }
        } else if (ab.energyCost != null) {
          const en = document.createElement('div');
          en.className = 'cost';
          en.textContent = `Energia: ${ab.energyCost}`;
          numbers.appendChild(en);
        }

        box.append(meta, numbers);
        abilitiesWrap.appendChild(box);
      }
    }
  }

  function attachClickDelay() {
    const CLICK_DELAY = cfg.clickDelay;
    document.querySelectorAll('a.is-link, a.back-button').forEach(a=>{
      a.addEventListener('click', e=>{
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        document.body.classList.add('page-fade-out');
        setTimeout(()=> location.href = href, CLICK_DELAY);
      });
    });
  }

  try {
    const data = await loadJson(jsonPath);
    renderMeta(data.meta);
    renderLore(data.lore);
    renderStats(data);
    renderAttacks(data);
    renderAbilities(data);
    attachClickDelay();
    return { ok: true, data };
  } catch (err) {
    console.error('initEntity error:', err);
    return { ok: false, error: err };
  }
}

// Auto-init se <main class="container"> ha data-json (utile)
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.container');
  if (!main) return;
  const path = main.getAttribute('data-json') || 'readme.json';
  // evita doppio init
  if (!window.__entityAutoInitDone) {
    initEntity(path);
    window.__entityAutoInitDone = true;
  }
});

  const path = main.getAttribute('data-json') || 'readme.json';
  // evita doppio init se chiamato esplicitamente
  if (!window.__entityAutoInitDone) {
    initEntity(path);
    window.__entityAutoInitDone = true;
  }
});
