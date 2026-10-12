import { BRAND, GROUPS, LINENS, CATEGORIES, FACILITIES, PHOTO_BACKUPS, photoUrl, photoSrcset } from './catalog.js';
import { initCloth } from './cloth.js';
import { initMotion } from './motion.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const linenById = Object.fromEntries(LINENS.map((p) => [p.id, p]));
const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const groupById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

let motion = null;

/* ---------- Images ---------- */

function img(key, alt, { sizes = '(min-width: 1100px) 25vw, 50vw', w = 700, cls = '', eager = false } = {}) {
  const src = photoUrl(key, w);
  if (!src) return '';
  const srcset = photoSrcset(key);
  const backup = PHOTO_BACKUPS[key] ? ` data-backup="${esc(key)}"` : '';
  return `<img src="${src}"${srcset ? ` srcset="${srcset}" sizes="${sizes}"` : ''} alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${cls ? ` class="${cls}"` : ''}${backup}>`;
}

document.addEventListener('error', (e) => {
  const el = e.target;
  if (el.tagName !== 'IMG') return;
  const key = el.dataset.backup;
  if (key && !el.dataset.triedBackup && PHOTO_BACKUPS[key]) {
    el.dataset.triedBackup = '1';
    el.removeAttribute('srcset');
    el.src = `${PHOTO_BACKUPS[key]}?auto=format&fit=crop&w=800&q=70`;
  }
}, true);

/* ---------- Inquiry list (kept in this browser only) ---------- */

const STORE_KEY = 'micah-angela-inquiry-v1';

function loadList() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string') : [];
  } catch (_) {
    return [];
  }
}

function describe(id) {
  if (id.startsWith('cat:')) {
    const c = categoryById[id.slice(4)];
    return c ? { id, name: c.name, kind: 'Beyond linens' } : null;
  }
  const p = linenById[id];
  return p ? { id, name: p.name, kind: groupById[p.group].long } : null;
}

const inquiry = {
  items: loadList(),
  has(id) {
    return this.items.some((i) => i.id === id);
  },
  toggle(id) {
    const entry = describe(id);
    if (!entry) return null;
    if (this.has(id)) {
      this.items = this.items.filter((i) => i.id !== id);
      this.changed();
      return false;
    }
    this.items.push(entry);
    this.changed();
    return true;
  },
  remove(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.changed();
  },
  clear() {
    this.items = [];
    this.changed();
  },
  changed() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.items));
    } catch (_) { /* private mode: the list still works for this visit */ }
    renderInquiry();
  },
};

function addButtonLabel(id, added) {
  if (added) return `${icon('i-check')}Added`;
  return id.startsWith('cat:') ? `${icon('i-plus')}Ask about this` : `${icon('i-plus')}Add to inquiry`;
}

function renderInquiry() {
  const n = inquiry.items.length;
  const itemsText = `${n} ${n === 1 ? 'item' : 'items'}`;

  $$('[data-count]').forEach((el) => {
    const changed = el.textContent !== String(n);
    el.textContent = String(n);
    el.classList.toggle('has-items', n > 0);
    if (changed && n > 0) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
  $$('[data-count-inline]').forEach((el) => { el.textContent = String(n); });
  $$('[data-count-text]').forEach((el) => { el.textContent = `(${itemsText})`; });
  $$('[data-inquiry-opener]').forEach((el) => {
    el.setAttribute('aria-label', n ? `Open your inquiry list, ${itemsText}` : 'Open your inquiry list');
  });

  $$('[data-add]').forEach((btn) => {
    const id = btn.dataset.add;
    const added = inquiry.has(id);
    btn.setAttribute('aria-pressed', String(added));
    if (btn.classList.contains('add-fab')) {
      const name = describe(id)?.name || '';
      btn.setAttribute('aria-label', added ? `Remove ${name} from your inquiry list` : `Add ${name} to your inquiry list`);
      btn.innerHTML = icon(added ? 'i-check' : 'i-plus');
    } else {
      btn.innerHTML = addButtonLabel(id, added);
    }
  });

  const chips = $('[data-chips]');
  if (chips) {
    chips.innerHTML = n
      ? inquiry.items.map((i) => `<span class="list-chip">${esc(i.name)}<button type="button" data-remove="${esc(i.id)}" aria-label="Remove ${esc(i.name)}">${icon('i-close')}</button></span>`).join('')
      : `<p class="text-[0.9rem] text-slate">Nothing added yet. Tap + on any linen, or "Ask about this" on a category.</p>`;
  }

  const list = $('[data-inquiry-items]');
  if (list) {
    list.innerHTML = n
      ? `<ul class="grid gap-2">${inquiry.items.map((i) => `
          <li class="flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3">
            <div class="min-w-0">
              <p class="truncate font-display text-[1.05rem] font-semibold tracking-tight">${esc(i.name)}</p>
              <p class="font-mono text-[0.72rem] uppercase tracking-[0.08em] text-slate">${esc(i.kind)}</p>
            </div>
            <button type="button" class="list-btn shrink-0" data-remove="${esc(i.id)}" aria-label="Remove ${esc(i.name)}">${icon('i-close')}</button>
          </li>`).join('')}</ul>
        <button type="button" class="mt-4 text-[0.9rem] font-medium text-cobalt underline-offset-4 hover:underline" data-clear>Clear the list</button>`
      : `<div class="grid place-items-center gap-3 rounded-2xl bg-mist px-6 py-14 text-center">
          ${icon('i-list', 'h-9 w-9 text-slate')}
          <p class="max-w-[17rem] text-[0.95rem] text-slate">Your list is empty. Tap + on any linen, or "Ask about this" on a category.</p>
          <a class="btn btn-ghost mt-1" href="#linens">Browse linens</a>
        </div>`;
  }

  $('[data-float]')?.classList.toggle('is-on', n > 0 && window.scrollY > window.innerHeight * 0.7);
}

/* ---------- Toast ---------- */

let toastTimer;
function toast(message) {
  const el = $('[data-toast]');
  if (!el) return;
  $('span', el).textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

/* ---------- Dialogs ---------- */

function openDialog(dlg, opener) {
  if (!dlg || dlg.open) return;
  dlg._opener = opener || document.activeElement;
  dlg.showModal();
  motion?.stop();
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('is-open')));
  if (dlg.id === 'dlg-menu' && window.gsap && !reduce) {
    window.gsap.from($$('.menu-links li', dlg), { y: 40, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
  }
}

function closeDialog(dlg, { restoreFocus = true } = {}) {
  return new Promise((resolve) => {
    if (!dlg || !dlg.open || dlg._closing) return resolve();
    dlg._closing = true;
    dlg.classList.remove('is-open');
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      dlg._closing = false;
      dlg.close();
      if (!$$('dialog[open]').length) {
        document.documentElement.style.overflow = '';
        motion?.start();
      }
      if (restoreFocus && dlg._opener && document.contains(dlg._opener)) dlg._opener.focus({ preventScroll: true });
      resolve();
    };
    if (reduce) return done();
    dlg.addEventListener('transitionend', function onEnd(e) {
      if (e.target !== dlg) return;
      dlg.removeEventListener('transitionend', onEnd);
      done();
    });
    setTimeout(done, 650);
  });
}

$$('dialog').forEach((dlg) => {
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog(dlg);
  });
  dlg.addEventListener('click', (e) => {
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeDialog(dlg);
  });
});

async function leaveDialogs() {
  await Promise.all($$('dialog[open]').map((d) => closeDialog(d, { restoreFocus: false })));
}

/* ---------- Rendering ---------- */

function renderBento() {
  const wrap = $('[data-bento]');
  if (!wrap) return;
  const cls = { hospital: 'tile-hospital', hotel: 'tile-hotel', events: 'tile-events' };
  wrap.innerHTML = FACILITIES.map((f) => `
    <a href="#linens" data-filter="${f.filter}" class="tile ${cls[f.id] || ''}">
      ${img(f.photo, f.name, { sizes: '(min-width: 768px) 50vw, 100vw', w: f.id === 'hospital' ? 1200 : 900 })}
      ${f.tag ? `<span class="tile-tag">${esc(f.tag)}</span>` : ''}
      <span class="tile-card">
        <span>
          <span class="tile-title block">${esc(f.name)}</span>
          <span class="tile-text block">${esc(f.short || f.text)}</span>
        </span>
        <span class="tile-go">${icon('i-arrow-up')}</span>
      </span>
    </a>`).join('') + `
    <a href="#inquire" class="tile tile-cta">
      <span class="tile-title block text-white">Already have a list?</span>
      <span class="flex items-end justify-between gap-4">
        <span class="tile-text block">Send it over and we'll quote everything in one go.</span>
        <span class="tile-go">${icon('i-arrow-up')}</span>
      </span>
    </a>`;
}

let activeFilter = 'all';
let showAll = false;
const PREVIEW = 8;

function renderFilters() {
  const wrap = $('[data-filters]');
  if (!wrap) return;
  const opts = [{ id: 'all', label: 'All', count: LINENS.length }, ...GROUPS.map((g) => ({ ...g, count: LINENS.filter((p) => p.group === g.id).length }))];
  wrap.insertAdjacentHTML('beforeend', opts.map((g) => `
    <button type="button" class="tab" data-filter-btn="${g.id}" aria-pressed="${g.id === activeFilter}">${esc(g.label)}<span class="tab-count">${g.count}</span></button>`).join(''));
}

function moveIndicator() {
  const ind = $('[data-tabs-indicator]');
  const btn = $(`[data-filter-btn="${activeFilter}"]`);
  if (!ind || !btn) return;
  ind.style.width = `${btn.offsetWidth}px`;
  ind.style.transform = `translateX(${btn.offsetLeft}px)`;
}

function renderLinens() {
  const grid = $('[data-linen-grid]');
  if (!grid) return;
  grid.innerHTML = LINENS.map((p) => {
    const added = inquiry.has(p.id);
    const hospital = p.group === 'hospital';
    return `
      <article class="card" data-group="${p.group}" data-flip-id="${p.id}">
        <div class="card-media">
          ${img(p.photo, p.name)}
          <span class="chip${hospital ? ' chip-hospital' : ''}">${esc(groupById[p.group].label)}</span>
          <button type="button" class="card-hit" data-quick="${p.id}" aria-label="View details: ${esc(p.name)}"></button>
          <button type="button" class="add-fab" data-add="${p.id}" aria-pressed="${added}" aria-label="${added ? 'Remove' : 'Add'} ${esc(p.name)} ${added ? 'from' : 'to'} your inquiry list">${icon(added ? 'i-check' : 'i-plus')}</button>
        </div>
        <div class="card-body">
          <h3 class="card-title"><button type="button" data-quick="${p.id}">${esc(p.name)}</button></h3>
          <p class="card-spec">${esc(p.spec)}</p>
        </div>
      </article>`;
  }).join('');
}

function applyFilter(animate) {
  const grid = $('[data-linen-grid]');
  if (!grid) return;
  const cards = $$('.card', grid);
  const Flip = window.Flip;
  const useFlip = animate && Flip && window.gsap && !reduce;
  if (useFlip) motion?.revealAllCards();
  const state = useFlip ? Flip.getState(cards) : null;

  const matches = (c) => activeFilter === 'all' || c.dataset.group === activeFilter;
  const total = cards.filter(matches).length;
  let shown = 0;
  cards.forEach((c) => {
    const ok = matches(c) && (activeFilter !== 'all' || showAll || shown < PREVIEW);
    if (ok) shown++;
    c.hidden = !ok;
  });

  const more = $('[data-show-all]');
  if (more) {
    more.hidden = !(activeFilter === 'all' && total > PREVIEW);
    more.textContent = showAll ? 'Show fewer' : `Show all ${total} linens`;
  }
  $$('[data-filter-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filterBtn === activeFilter)));
  moveIndicator();
  const status = $('[data-filter-status]');
  if (status) status.textContent = `Showing ${shown} ${activeFilter === 'all' ? 'linens' : groupById[activeFilter].long.toLowerCase()}`;

  // The grid changed height, so every scroll-driven position below it moved.
  const refresh = () => window.ScrollTrigger && window.ScrollTrigger.refresh();
  if (state) {
    Flip.from(state, {
      duration: 0.75,
      ease: 'expo.inOut',
      absolute: true,
      onEnter: (els) => window.gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04, delay: 0.15 }),
      onLeave: (els) => window.gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.3, ease: 'power2.in' }),
      onComplete: refresh,
    });
  } else if (animate) {
    refresh();
  }
}

function setFilter(id) {
  activeFilter = id === 'all' || groupById[id] ? id : 'all';
  showAll = false;
  applyFilter(true);
}

function renderBeyond() {
  const list = $('[data-beyond-list]');
  if (!list) return;
  const big = new Set(['stages', 'dance-floors']);
  list.innerHTML = CATEGORIES.map((c) => `
    <li>
      <button type="button" class="beyond-row" data-category="${c.id}" data-preview="${esc(photoUrl(c.photo, 520))}">
        <span class="row-thumb">${img(c.photo, '', { sizes: '64px', w: 160 })}</span>
        <span class="row-name">${esc(c.name)}${big.has(c.id) ? '<span class="row-tag">Big items</span>' : ''}</span>
        <span class="row-blurb">${esc(c.blurb)}</span>
        <span class="row-count">${c.items.length} examples</span>
        <span class="row-go">${icon('i-arrow-up')}</span>
      </button>
    </li>`).join('');
}

function renderFeaturePhotos() {
  $$('[data-feature-photo]').forEach((el) => {
    const key = el.dataset.featurePhoto;
    el.insertAdjacentHTML('afterbegin', img(key, 'Rolls of white fabric', { sizes: '(min-width: 1024px) 55vw, 100vw', w: 1400 }));
  });
}

function renderFooter() {
  const fl = $('[data-footer-linens]');
  if (fl) fl.innerHTML = GROUPS.map((g) => `<li><a href="#linens" data-filter="${g.id}">${esc(g.long)}</a></li>`).join('');
  const fb = $('[data-footer-beyond]');
  if (fb) fb.innerHTML = CATEGORIES.slice(0, 6).map((c) => `<li><button type="button" class="text-left" data-category="${c.id}">${esc(c.name)}</button></li>`).join('');
}

/* ---------- Detail views ---------- */

function openQuick(id, opener) {
  const p = linenById[id];
  const dlg = $('#dlg-quick');
  if (!p || !dlg) return;
  const added = inquiry.has(p.id);
  const hospital = p.group === 'hospital';
  $('[data-quick-body]', dlg).innerHTML = `
    <div class="relative min-h-[17rem] bg-mist md:min-h-[34rem]">
      ${img(p.photo, p.name, { sizes: '(min-width: 768px) 30rem, 100vw', w: 1000, eager: true, cls: 'absolute inset-0 h-full w-full object-cover' })}
    </div>
    <div class="flex flex-col p-6 sm:p-10">
      <div class="flex items-start justify-between gap-4">
        <span class="pill-tag${hospital ? ' pill-tag-hospital' : ''}">${esc(groupById[p.group].long)}</span>
        <button type="button" class="list-btn -mt-2 -mr-2" data-close aria-label="Close details">${icon('i-close')}</button>
      </div>
      <h2 id="quick-title" class="mt-5 font-display text-[2rem] font-bold leading-none tracking-tight">${esc(p.name)}</h2>
      <p class="mt-4 text-slate">${esc(p.about)}</p>
      <dl class="mt-7 border-t border-line">
        ${Object.entries(p.details).map(([k, v]) => `
          <div class="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-line py-3 text-[0.95rem]">
            <dt class="pt-0.5 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-slate">${esc(k)}</dt>
            <dd>${esc(v)}</dd>
          </div>`).join('')}
      </dl>
      <div class="mt-8 flex flex-wrap gap-3">
        <button type="button" class="btn btn-primary btn-lg" data-add="${p.id}" aria-pressed="${added}">${addButtonLabel(p.id, added)}</button>
        <a class="btn btn-ghost btn-lg" href="${esc(BRAND.messenger)}" target="_blank" rel="noopener">${icon('i-chat')}Ask on Messenger</a>
      </div>
      <p class="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-slate">Sample specs · Ask us for exact sizes and minimums</p>
    </div>`;
  openDialog(dlg, opener);
}

function openCategory(id, opener) {
  const c = categoryById[id];
  const dlg = $('#dlg-category');
  if (!c || !dlg) return;
  const key = `cat:${c.id}`;
  const added = inquiry.has(key);
  $('[data-category-body]', dlg).innerHTML = `
    <div class="relative h-56 shrink-0 bg-mist sm:h-64">
      ${img(c.photo, c.name, { sizes: '28rem', w: 900, eager: true, cls: 'absolute inset-0 h-full w-full object-cover' })}
      <button type="button" class="list-btn absolute top-3 right-3 bg-white" data-close aria-label="Close category">${icon('i-close')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-7">
      <p class="label">Beyond linens</p>
      <h2 id="cat-title" class="mt-3 font-display text-[2rem] font-bold leading-none tracking-tight">${esc(c.name)}</h2>
      <p class="mt-3 text-slate">${esc(c.blurb)}</p>
      <ul class="mt-6 border-t border-line">
        ${c.items.map((item) => `<li class="flex items-center gap-3 border-b border-line py-3">${icon('i-check', 'h-4 w-4 shrink-0 text-cobalt')}${esc(item)}</li>`).join('')}
      </ul>
      <p class="mt-5 text-[0.95rem] text-slate">This is the short version. Ask for the full list and we'll send it with photos.</p>
    </div>
    <div class="border-t border-line p-6">
      <button type="button" class="btn btn-primary btn-lg w-full" data-add="${key}" aria-pressed="${added}">${addButtonLabel(key, added)}</button>
    </div>`;
  openDialog(dlg, opener);
}

/* ---------- Hospital bed highlight ---------- */

function hot(n) {
  $$('.bed-svg .layer').forEach((g) => g.classList.toggle('is-hot', g.dataset.layer === n));
  $$('[data-layer-list] .layer-item').forEach((b) => b.classList.toggle('is-hot', b.dataset.layer === n));
}

function setupDiagram() {
  const items = $$('[data-layer-list] .layer-item');
  items.forEach((b) => {
    b.addEventListener('mouseenter', () => hot(b.dataset.layer));
    b.addEventListener('focus', () => hot(b.dataset.layer));
    b.addEventListener('mouseleave', () => hot(null));
    b.addEventListener('blur', () => hot(null));
  });
  $$('.bed-svg .layer').forEach((g) => {
    g.addEventListener('mouseenter', () => hot(g.dataset.layer));
    g.addEventListener('mouseleave', () => hot(null));
    g.addEventListener('click', () => {
      const btn = items.find((b) => b.dataset.layer === g.dataset.layer);
      if (btn) openQuick(btn.dataset.quick, btn);
    });
  });
}

/* ---------- Inquiry form ---------- */

function inquiryMessage(data) {
  const lines = [`Hi ${BRAND.name},`, ''];
  [['Name', 'name'], ['Organization', 'organization'], ['Type', 'type'], ['Email', 'email'], ['Mobile', 'phone']].forEach(([label, key]) => {
    const v = String(data.get(key) || '').trim();
    if (v) lines.push(`${label}: ${v}`);
  });
  if (inquiry.items.length) {
    lines.push('', 'Items I\'m asking about:');
    inquiry.items.forEach((i) => lines.push(`- ${i.name} (${i.kind})`));
  }
  const msg = String(data.get('message') || '').trim();
  if (msg) lines.push('', 'Details:', msg);
  lines.push('', 'Thank you!');
  return lines.join('\n');
}

function setError(input, message) {
  const field = input.closest('.field');
  let note = $('.field-error', field);
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (!note) {
      note = document.createElement('p');
      note.className = 'field-error';
      note.id = `${input.id}-error`;
      field.appendChild(note);
    }
    note.textContent = message;
    input.setAttribute('aria-describedby', note.id);
  } else {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    note?.remove();
  }
}

function validate(form) {
  const checks = [
    ['f-name', (v) => (v ? '' : 'Add your name so we know who to reply to.')],
    ['f-org', (v) => (v ? '' : 'Add the hospital, hotel or company name.')],
    ['f-email', (v, el) => (!v ? 'Add an email so we can send the quote.' : el.validity.typeMismatch ? 'That email looks incomplete. Check the @ and the domain.' : '')],
  ];
  let first = null;
  checks.forEach(([id, rule]) => {
    const el = $(`#${id}`, form);
    const msg = rule(el.value.trim(), el);
    setError(el, msg);
    if (msg && !first) first = el;
  });
  if (first) first.focus();
  return !first;
}

function setupForm() {
  const form = $('[data-inquiry-form]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(form)) return;
    const data = new FormData(form);
    const subject = `Inquiry from ${String(data.get('organization')).trim()} (${data.get('type')})`;
    window.location.href = `mailto:${BRAND.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiryMessage(data))}`;
    toast('Opening your email app');
  });
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });
  $('[data-copy-inquiry]', form)?.addEventListener('click', async () => {
    const text = inquiryMessage(new FormData(form));
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Copied. Paste it into Messenger or Viber.');
  });
}

/* ---------- Clicks (one delegated handler) ---------- */

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-open], [data-close], [data-quick], [data-category], [data-add], [data-remove], [data-clear], [data-filter], [data-filter-btn], [data-show-all], a[href^="#"]');
  if (!t) return;
  const inDialog = t.closest('dialog');

  if (t.matches('[data-add]')) {
    const added = inquiry.toggle(t.dataset.add);
    const entry = describe(t.dataset.add);
    if (entry) toast(added ? `${entry.name} added to your inquiry list` : `${entry.name} removed`);
    return;
  }
  if (t.matches('[data-remove]')) {
    inquiry.remove(t.dataset.remove);
    return;
  }
  if (t.matches('[data-clear]')) {
    inquiry.clear();
    return;
  }
  if (t.matches('[data-filter-btn]')) {
    setFilter(t.dataset.filterBtn);
    return;
  }
  if (t.matches('[data-show-all]')) {
    showAll = !showAll;
    applyFilter(true);
    return;
  }
  if (t.matches('[data-close]')) {
    if (inDialog) closeDialog(inDialog);
    return;
  }
  if (t.matches('[data-quick]')) {
    e.preventDefault();
    if (inDialog) await closeDialog(inDialog, { restoreFocus: false });
    openQuick(t.dataset.quick, inDialog ? null : t);
    return;
  }
  if (t.matches('[data-category]')) {
    e.preventDefault();
    if (inDialog) await closeDialog(inDialog, { restoreFocus: false });
    openCategory(t.dataset.category, inDialog ? null : t);
    return;
  }
  if (t.matches('[data-open]')) {
    e.preventDefault();
    if (inDialog) await closeDialog(inDialog, { restoreFocus: false });
    openDialog(document.getElementById(t.dataset.open), inDialog ? null : t);
    return;
  }
  if (t.matches('[data-filter]')) {
    e.preventDefault();
    if (inDialog) await leaveDialogs();
    setFilter(t.dataset.filter);
    motion?.scrollTo('#linens');
    return;
  }
  if (t.matches('a[href^="#"]')) {
    const hash = t.getAttribute('href');
    if (hash === '#') return;
    e.preventDefault();
    if (inDialog) await leaveDialogs();
    if (hash === '#top') {
      motion?.scrollTop();
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    motion?.scrollTo(hash);
    history.replaceState(null, '', hash);
  }
});

/* ---------- Boot ---------- */

function setupCloth() {
  const canvas = $('[data-cloth]');
  if (!canvas) return;
  const caption = $('[data-cloth-caption]');
  initCloth(canvas, {
    onGrab: () => caption?.classList.add('is-gone'),
  });
}

function preloadPreviews() {
  const urls = $$('[data-preview]').map((b) => b.dataset.preview).filter(Boolean);
  const go = () => {
    urls.forEach((u) => { const im = new Image(); im.src = u; });
    // Hidden catalog cards: start their photos now so filtering never shows blanks.
    $$('.card[hidden] img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 2500);
}

function boot() {
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  renderBento();
  renderFilters();
  renderLinens();
  renderBeyond();
  renderFeaturePhotos();
  renderFooter();
  applyFilter(false);
  renderInquiry();
  setupForm();
  setupDiagram();
  setupCloth();

  motion = initMotion({
    reduce,
    onBedStep: hot,
    onScroll: (y) => $('[data-float]')?.classList.toggle('is-on', inquiry.items.length > 0 && y > window.innerHeight * 0.7),
  });

  moveIndicator();
  if (document.fonts) document.fonts.ready.then(moveIndicator);
  window.addEventListener('resize', moveIndicator);
  preloadPreviews();

  if (location.hash && location.hash.length > 1) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  }
}

boot();
