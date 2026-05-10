/**
 * Loads data/theme.json and applies copy + design tokens to the page.
 * Brand marquee logos come from data/brand-icons-manifest.json — regenerate with:
 *   node scripts/sync-brand-icons.mjs
 * Serve the repo root over HTTP (e.g. python -m http.server) so fetch paths work.
 */
(function () {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function isGmailAddress(email) {
    return /@gmail\.com$/i.test(email || '') || /@googlemail\.com$/i.test(email || '');
  }

  /**
   * Audit CTA: Gmail web compose (reliable in browser) or mailto: (desktop client).
   * theme.ctaSection.auditButton.composeProvider: "gmail" | "mailto" — if omitted, gmail is used for @gmail.com / @googlemail.com addresses.
   */
  function buildAuditComposeLink(email, ab) {
    const subject =
      ab.subject != null && String(ab.subject).length ? String(ab.subject) : '';
    const bodyText =
      ab.body != null
        ? ab.body
        : 'Hi,\n\nRequest a free audit for our business -----';
    let mode = ab.composeProvider;
    if (mode == null || mode === '') {
      mode = isGmailAddress(email) ? 'gmail' : 'mailto';
    }
    if (mode === 'gmail') {
      const u = new URL('https://mail.google.com/mail/');
      u.searchParams.set('view', 'cm');
      u.searchParams.set('fs', '1');
      u.searchParams.set('to', email);
      if (subject) u.searchParams.set('su', subject);
      u.searchParams.set('body', bodyText);
      return { href: u.toString(), newTab: true };
    }
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    params.set('body', bodyText);
    const q = params.toString();
    return { href: 'mailto:' + email + (q ? '?' + q : ''), newTab: false };
  }

  function setRichKicker(el, k) {
    if (!el) return;
    if (typeof k === 'string') {
      el.textContent = k;
      return;
    }
    if (k && k.em != null) {
      el.innerHTML =
        escapeHtml(k.before || '') +
        '<em>' +
        escapeHtml(k.em) +
        '</em>' +
        escapeHtml(k.after || '');
    }
  }

  function applyDesign(t) {
    const root = document.documentElement;
    const c = t.colors;
    const cv = c && c.cssVariableNames;
    if (c && cv) {
      Object.keys(cv).forEach((key) => {
        const val = c[key];
        if (typeof val === 'string' && cv[key]) root.style.setProperty(cv[key], val);
      });
    }
    const L = t.layout;
    if (L) {
      if (L.layoutMax) root.style.setProperty('--layout-max', L.layoutMax);
      if (L.layoutMaxWide) root.style.setProperty('--layout-max-wide', L.layoutMaxWide);
      if (L.layoutPadX) root.style.setProperty('--layout-pad-x', L.layoutPadX);
      if (L.sectionY) root.style.setProperty('--section-y', L.sectionY);
      if (L.blockGap) root.style.setProperty('--block-gap', L.blockGap);
      if (L.heroColGap) root.style.setProperty('--hero-col-gap', L.heroColGap);
    }
    const R = t.radiiAndMotion;
    if (R) {
      if (R.radiusSm) root.style.setProperty('--radius-sm', R.radiusSm);
      if (R.radiusMd) root.style.setProperty('--radius-md', R.radiusMd);
      if (R.easeOut) root.style.setProperty('--ease-out', R.easeOut);
    }
    const B = t.buttons;
    if (B) {
      if (B.height) root.style.setProperty('--btn-height', B.height);
      if (B.padX) root.style.setProperty('--btn-pad-x', B.padX);
      if (B.fontSize) root.style.setProperty('--btn-font-size', B.fontSize);
      if (B.fontWeight != null) root.style.setProperty('--btn-font-weight', String(B.fontWeight));
      if (B.tracking) root.style.setProperty('--btn-tracking', B.tracking);
    }
    const ty = t.typography;
    if (ty) {
      if (ty.googleFontsHref) {
        const link = document.querySelector('link[href*="fonts.googleapis.com"]');
        if (link) link.href = ty.googleFontsHref;
      }
      if (ty.css) {
        Object.keys(ty.css).forEach((prop) => {
          root.style.setProperty(prop, ty.css[prop]);
        });
      }
    }
  }

  function applySiteMeta(t) {
    if (t.site) {
      if (t.site.title) document.title = t.site.title;
      if (t.site.lang) document.documentElement.lang = t.site.lang;
    }
  }

  function applyBrand(t) {
    const b = t.brand;
    if (!b) return;
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo && b.navLogo != null) navLogo.textContent = b.navLogo;
    const drawerName = document.querySelector('.nav-drawer__name');
    if (drawerName && b.navLogo != null) drawerName.textContent = b.navLogo;
    const drawerSub = document.querySelector('.nav-drawer__subtitle');
    if (drawerSub && b.roleShort != null) {
      const t = String(b.roleShort).trim();
      drawerSub.textContent = t.length > 96 ? t.slice(0, 93).trim() + '…' : t;
    }
    const h1 = document.querySelector('.hero h1');
    if (h1 && b.heroH1) {
      const h = b.heroH1;
      h1.innerHTML =
        escapeHtml(h.line1.before) +
        '<em>' +
        escapeHtml(h.line1.emphasis) +
        '</em><br>' +
        escapeHtml(h.line2.before) +
        '<em>' +
        escapeHtml(h.line2.emphasis) +
        '</em>';
    }
    const role = document.querySelector('.hero-role');
    if (role && b.roleShort != null) role.textContent = b.roleShort;
    const desc = document.querySelector('.hero-desc');
    if (desc && b.heroDesc != null) desc.textContent = b.heroDesc;
    const hbName = document.querySelector('.hb-name');
    if (hbName && b.photoBadge && b.photoBadge.name != null) hbName.textContent = b.photoBadge.name;
    const hbRole = document.querySelector('.hb-role');
    if (hbRole && b.photoBadge && b.photoBadge.role != null) hbRole.textContent = b.photoBadge.role;
    const pills = document.querySelectorAll('.hb-pill');
    if (b.photoBadge && b.photoBadge.pills) {
      b.photoBadge.pills.forEach((text, i) => {
        if (pills[i]) pills[i].textContent = text;
      });
    }
  }

  function applyHeroEyebrow(t) {
    const e = t.heroEyebrow;
    if (!e) return;
    const lead = document.querySelector('.hero-eyebrow-lead');
    if (lead && e.lead != null) lead.textContent = e.lead;
    const chips = document.querySelectorAll('.hero-eyebrow .hero-eyebrow-chip');
    if (e.locationChip != null && chips[0]) chips[0].textContent = e.locationChip;
    if (e.stat && chips[1]) {
      chips[1].innerHTML =
        escapeHtml(e.stat.value) +
        ' <span class="hero-eyebrow-chip-note">' +
        escapeHtml(e.stat.note) +
        '</span>';
    }
  }

  function faviconTypeForPath(path) {
    const lower = String(path || '').toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    if (lower.endsWith('.ico')) return 'image/x-icon';
    return 'image/jpeg';
  }

  function setFaviconFromPath(path) {
    if (!path) return;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = faviconTypeForPath(path);
    link.href = path;
  }

  function applyAssets(t) {
    const a = t.assets && t.assets.heroPhoto;
    if (!a) return;
    const img = document.querySelector('.hero-photo');
    if (img) {
      if (a.path) img.src = a.path;
      if (a.alt != null) img.alt = a.alt;
    }
    if (a.path) setFaviconFromPath(a.path);
  }

  function applyNavigation(t) {
    const nav = t.navigation;
    if (!nav || !nav.items) return;
    document.querySelectorAll('.nav-links').forEach((group) => {
      const links = group.querySelectorAll('a');
      nav.items.forEach((item, i) => {
        if (!links[i]) return;
        if (item.label != null) links[i].textContent = item.label;
        if (item.href != null) links[i].href = item.href;
      });
    });
  }

  function applyHeroButtons(t) {
    const c = t.heroCtas;
    if (!c) return;
    const primary = document.querySelector('.hero-btns .btn-primary');
    const secondary = document.querySelector('.hero-btns .btn-secondary');
    if (primary && c.primary) {
      if (c.primary.label != null) primary.textContent = c.primary.label;
      if (c.primary.href != null) primary.href = c.primary.href;
    }
    if (secondary && c.secondary) {
      if (c.secondary.label != null) secondary.textContent = c.secondary.label;
      if (c.secondary.href != null) secondary.href = c.secondary.href;
    }
  }

  function applyStats(t) {
    const s = t.stats;
    if (!s) return;
    const sec = document.querySelector('.stats-section');
    if (sec && s.sectionAriaLabel != null) sec.setAttribute('aria-label', s.sectionAriaLabel);
    const items = document.querySelectorAll('.stats-bar .stat-item');
    if (!s.items) return;
    s.items.forEach((row, i) => {
      const box = items[i];
      if (!box) return;
      const v = box.querySelector('.stat-val');
      const l = box.querySelector('.stat-label');
      if (v && row.value != null) v.textContent = row.value;
      if (l && row.label != null) l.textContent = row.label;
    });
  }

  function applyStackSection(t) {
    const s = t.stackSection;
    if (!s) return;
    const section = document.querySelector('.tools-section');
    if (!section) return;
    const label = section.querySelector('.section-label');
    const kicker = section.querySelector('.section-kicker');
    if (label && s.label != null) label.textContent = s.label;
    setRichKicker(kicker, s.kicker);
  }

  function applyTools(t) {
    const tools = t.tools;
    if (!tools || !tools.groups) return;
    const groups = document.querySelectorAll('.tools-grid .tool-group');
    tools.groups.forEach((g, gi) => {
      const groupEl = groups[gi];
      if (!groupEl) return;
      const tg = groupEl.querySelector('.tg-label');
      if (tg && g.label != null) tg.textContent = g.label;
      const items = groupEl.querySelectorAll('.tool-item');
      (g.items || []).forEach((item, ii) => {
        const row = items[ii];
        if (!row) return;
        const name = row.querySelector('.tool-name');
        const sub = row.querySelector('.tool-sub');
        if (name && item.name != null) name.textContent = item.name;
        if (sub && item.sub != null) sub.textContent = item.sub;
      });
    });
  }

  function applyFeaturedCase(t) {
    const f = t.featuredCase;
    if (!f) return;
    const section = document.querySelector('.featured');
    if (!section) return;
    const sl = section.querySelector('.section-label');
    const kicker = section.querySelector('.section-kicker');
    if (sl && f.sectionLabel != null) sl.textContent = f.sectionLabel;
    setRichKicker(kicker, f.kicker);
    const card = section.querySelector('.featured-card');
    if (!card) return;
    const badge = card.querySelector('.feat-badge');
    if (badge && f.badge != null) badge.textContent = f.badge;
    const brandTag = card.querySelector('.brand-tag');
    if (brandTag && f.brandTag != null) {
      brandTag.innerHTML = '<span class="dot"></span> ' + escapeHtml(f.brandTag);
    }
    const cat = card.querySelector('.case-cat');
    if (cat && f.caseCat != null) cat.textContent = f.caseCat;
    const title = card.querySelector('.case-title');
    if (title && f.title != null) title.textContent = f.title;
    const desc = card.querySelector('.case-desc');
    if (desc && f.description != null) desc.textContent = f.description;
    const caseLink = card.querySelector('.featured-case-link');
    if (caseLink) {
      if (f.caseStudyUrl) {
        caseLink.href = f.caseStudyUrl;
        caseLink.removeAttribute('hidden');
      }
      if (f.caseStudyLinkLabel != null) caseLink.textContent = f.caseStudyLinkLabel;
      if (!f.caseStudyUrl) caseLink.setAttribute('hidden', '');
    }
    const blks = card.querySelectorAll('.feat-left .blk');
    (f.blocks || []).forEach((b, i) => {
      const el = blks[i];
      if (!el) return;
      const lbl = el.querySelector('.blk-lbl');
      const p = el.querySelector('p');
      if (lbl && b.label != null) lbl.textContent = b.label;
      if (p && b.body != null) p.textContent = b.body;
    });
    const mboxes = card.querySelectorAll('.metric-box');
    (f.metrics || []).forEach((m, i) => {
      const box = mboxes[i];
      if (!box) return;
      const val = box.querySelector('.metric-val');
      const lbl = box.querySelector('.metric-lbl');
      const base = box.querySelector('.metric-base');
      if (val && m.value != null) val.textContent = m.value;
      if (lbl && m.label != null) lbl.textContent = m.label;
      if (base && m.base != null) base.textContent = m.base;
    });
    const tlItems = card.querySelectorAll('.timeline .tl-item');
    (f.timeline || []).forEach((row, i) => {
      const item = tlItems[i];
      if (!item) return;
      const tag = item.querySelector('.tl-tag');
      const text = item.querySelector('.tl-text');
      if (tag && row.tag != null) tag.textContent = row.tag;
      if (text && row.html != null) text.innerHTML = row.html;
    });
    const qt = card.querySelector('.qt');
    const qa = card.querySelector('.qa');
    if (f.quote) {
      if (qt && f.quote.text != null) qt.textContent = f.quote.text;
      if (qa && f.quote.attribution != null) qa.textContent = f.quote.attribution;
    }
    applyDashboardProof(card, f.dashboardProof);
  }

  function applyDashboardProof(card, dp) {
    const wrap = card.querySelector('.feat-proof');
    if (!wrap) return;
    if (!dp || typeof dp !== 'object') {
      wrap.setAttribute('hidden', '');
      return;
    }
    const hasSpreadsheet =
      dp.dataSpreadsheetUrl != null && String(dp.dataSpreadsheetUrl).trim() !== '';
    if (!hasSpreadsheet) {
      wrap.setAttribute('hidden', '');
      return;
    }
    wrap.removeAttribute('hidden');
    const dataA = wrap.querySelector('.feat-proof-data');
    if (dataA) {
      if (dp.dataSpreadsheetUrl) {
        dataA.href = dp.dataSpreadsheetUrl;
        dataA.removeAttribute('hidden');
      } else {
        dataA.setAttribute('hidden', '');
      }
      if (dp.dataSpreadsheetLabel != null) {
        const lab = dataA.querySelector('.feat-proof-data__label');
        if (lab) lab.textContent = dp.dataSpreadsheetLabel;
        else dataA.textContent = dp.dataSpreadsheetLabel;
      }
      const hintEl = dataA.querySelector('.feat-proof-data__hint');
      if (hintEl && dp.dataSpreadsheetHint != null) hintEl.textContent = dp.dataSpreadsheetHint;
      const ctaLbl = dataA.querySelector('.feat-proof-data__cta-text');
      if (ctaLbl && dp.dataSpreadsheetCtaLabel != null) ctaLbl.textContent = dp.dataSpreadsheetCtaLabel;
      const a11y = [dp.dataSpreadsheetLabel, dp.dataSpreadsheetHint].filter(Boolean).join('. ');
      if (a11y) dataA.setAttribute('aria-label', a11y);
    }
    const vid = wrap.querySelector('.feat-proof-video');
    if (vid && dp.videoUrl != null && String(dp.videoUrl).trim() !== '') {
      vid.src = String(dp.videoUrl);
      if (dp.videoTitle != null) vid.setAttribute('title', String(dp.videoTitle));
    }
  }

  function applyMoreWins(t) {
    const m = t.moreWins;
    if (!m) return;
    const section = document.querySelector('.cases-section');
    if (!section) return;
    const sl = section.querySelector('.section-label');
    const kicker = section.querySelector('.section-kicker');
    if (sl && m.sectionLabel != null) sl.textContent = m.sectionLabel;
    setRichKicker(kicker, m.kicker);
    const cards = section.querySelectorAll('.cases-grid .case-card');
    (m.cards || []).forEach((c, i) => {
      const card = cards[i];
      if (!card) return;
      const num = card.querySelector('.cc-num');
      const ind = card.querySelector('.cc-ind');
      const title = card.querySelector('.cc-title');
      const desc = card.querySelector('.cc-desc');
      if (num && c.num != null) num.textContent = c.num;
      if (ind && c.industry != null) ind.textContent = c.industry;
      if (title && c.title != null) title.textContent = c.title;
      if (desc && c.description != null) desc.textContent = c.description;
      const rows = card.querySelectorAll('.cc-row');
      (c.metrics || []).forEach((r, ri) => {
        const row = rows[ri];
        if (!row) return;
        const lbl = row.querySelector('.cc-lbl');
        const val = row.querySelector('.cc-val');
        if (lbl && r.label != null) lbl.textContent = r.label;
        if (val && r.value != null) val.textContent = r.value;
      });
    });
  }

  function applyFrameworks(t) {
    const fw = t.frameworks;
    if (!fw) return;
    const section = document.querySelector('.frameworks');
    if (!section) return;
    const sl = section.querySelector('.section-label');
    const kicker = section.querySelector('.section-kicker');
    if (sl && fw.sectionLabel != null) sl.textContent = fw.sectionLabel;
    setRichKicker(kicker, fw.kicker);
    const cards = section.querySelectorAll('.fw-card');
    (fw.cards || []).forEach((c, i) => {
      const card = cards[i];
      if (!card) return;
      const badge = card.querySelector('.fw-badge');
      const title = card.querySelector('.fw-title');
      const desc = card.querySelector('.fw-desc');
      if (badge && c.badge != null) badge.textContent = c.badge;
      if (title && c.title != null) title.textContent = c.title;
      if (desc && c.description != null) desc.textContent = c.description;
      const tagWrap = card.querySelector('.fw-tags');
      if (tagWrap && c.tags) {
        tagWrap.innerHTML = c.tags.map((tag) => '<span class="fw-tag">' + escapeHtml(tag) + '</span>').join('');
      }
    });
  }

  function applyBring(t) {
    const b = t.bring;
    if (!b) return;
    const section = document.querySelector('.bring-section');
    if (!section) return;
    const sl = section.querySelector('.section-label');
    const kicker = section.querySelector('.section-kicker');
    if (sl && b.sectionLabel != null) sl.textContent = b.sectionLabel;
    setRichKicker(kicker, b.kicker);
    const cards = section.querySelectorAll('.bring-card');
    (b.cards || []).forEach((c, i) => {
      const card = cards[i];
      if (!card) return;
      const icon = card.querySelector('.bring-icon-wrap');
      const title = card.querySelector('.bring-title');
      const desc = card.querySelector('.bring-desc');
      if (icon) {
        if (c.iconUrl != null && String(c.iconUrl).trim() !== '') {
          const src = escapeHtml(String(c.iconUrl).trim());
          icon.innerHTML =
            '<img class="bring-icon-img" src="' +
            src +
            '" alt="" width="44" height="44" loading="lazy" decoding="async" />';
        } else if (c.icon != null) {
          icon.textContent = c.icon;
        }
      }
      if (title && c.title != null) title.textContent = c.title;
      if (desc && c.description != null) desc.textContent = c.description;
    });
  }

  function applyProcessPipeline(t) {
    const p = t.processSection;
    if (!p || !p.pipeline) return;
    const words = p.pipeline.words;
    const scale = p.pipeline.scaleWord;
    if (!words || !scale) return;
    const arrow =
      '<span class="process-pipeline__sep" aria-hidden="true"><svg class="process-pipeline__arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m10 6 6 6-6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    const flow = document.querySelector('.process-pipeline__flow');
    if (!flow) return;
    const parts = [];
    words.forEach((w, i) => {
      parts.push('<span class="process-pipeline__word">' + escapeHtml(w) + '</span>');
      if (i < words.length - 1) parts.push(arrow);
    });
    parts.push(arrow);
    parts.push('<em class="process-pipeline__scale">' + escapeHtml(scale) + '</em>');
    flow.innerHTML = parts.join('');
  }

  function applyProcessSteps(t) {
    const p = t.processSection;
    if (!p) return;
    const section = document.querySelector('.process');
    if (!section) return;
    const sl = section.querySelector('.process-head .section-label');
    if (sl && p.sectionLabel != null) sl.textContent = p.sectionLabel;
    const steps = section.querySelectorAll('.process-grid .ps');
    (p.steps || []).forEach((s, i) => {
      const box = steps[i];
      if (!box) return;
      const num = box.querySelector('.ps-num');
      const title = box.querySelector('.ps-title');
      const desc = box.querySelector('.ps-desc');
      if (num && s.num != null) num.textContent = s.num;
      if (title && s.title != null) title.textContent = s.title;
      if (desc && s.description != null) desc.textContent = s.description;
    });
  }

  function applyCtaContact(t) {
    const c = t.ctaSection;
    const contact = t.contact;
    if (!c && !contact) return;
    const section = document.querySelector('.cta-section');
    if (!section) return;
    const title = section.querySelector('.cta-title');
    if (title && c && c.title) {
      title.innerHTML =
        escapeHtml(c.title.before) +
        '<em>' +
        escapeHtml(c.title.em) +
        '</em>' +
        escapeHtml(c.title.after);
    }
    const sub = section.querySelector('.cta-sub');
    if (sub && c && c.subtitle != null) sub.textContent = c.subtitle;
    const card = section.querySelector('.cta-contact');
    if (!card) return;
    const cardLabel = card.querySelector('.cta-contact-label');
    if (cardLabel && c && c.contactsCardLabel != null) {
      const ic = cardLabel.querySelector('.cta-contact-label-ic');
      while (cardLabel.firstChild) cardLabel.removeChild(cardLabel.firstChild);
      if (ic) cardLabel.appendChild(ic);
      cardLabel.appendChild(document.createTextNode(' ' + c.contactsCardLabel));
    }
    const auditBtn = card.querySelector('.cta-btn');
    if (auditBtn && c && c.auditButton) {
      if (c.auditButton.label != null) {
        const ic = auditBtn.querySelector('.cta-btn-ic');
        while (auditBtn.firstChild) auditBtn.removeChild(auditBtn.firstChild);
        if (ic) auditBtn.appendChild(ic);
        auditBtn.appendChild(document.createTextNode(c.auditButton.label));
      }
      if (contact && contact.email) {
        const link = buildAuditComposeLink(contact.email, c.auditButton);
        auditBtn.href = link.href;
        if (link.newTab) {
          auditBtn.target = '_blank';
          auditBtn.rel = 'noopener noreferrer';
        } else {
          auditBtn.removeAttribute('target');
          auditBtn.removeAttribute('rel');
        }
      }
    }
    const rows = card.querySelectorAll('.cta-contact-row');
    if (contact && rows[0]) {
      rows[0].href = 'tel:' + contact.phoneTel;
      const v0 = rows[0].querySelector('.cta-contact-v');
      if (v0 && contact.phoneDisplay != null) v0.textContent = contact.phoneDisplay;
      if (contact.phoneCopyToast != null) {
        rows[0].dataset.copyToast = contact.phoneCopyToast;
      } else {
        rows[0].removeAttribute('data-copy-toast');
      }
      if (contact.phoneCopyAriaLabel != null) {
        rows[0].setAttribute('aria-label', contact.phoneCopyAriaLabel);
      } else {
        rows[0].setAttribute('aria-label', 'Copy phone number to clipboard');
      }
    }
    if (contact && rows[1]) {
      rows[1].href = 'mailto:' + contact.email;
      const v1 = rows[1].querySelector('.cta-contact-v');
      if (v1 && contact.email != null) v1.textContent = contact.email;
    }
    if (contact && rows[2]) {
      rows[2].href = contact.linkedinUrl || '#';
      const v2 = rows[2].querySelector('.cta-contact-v');
      if (v2 && contact.linkedinCtaLabel != null) v2.textContent = contact.linkedinCtaLabel;
    }
  }

  function applyContactLabels(t) {
    const labels = t.ctaSection && t.ctaSection.contactRowLabels;
    if (!labels) return;
    const rows = document.querySelectorAll('.cta-contact .cta-contact-row');
    const keys = ['phone', 'email', 'linkedin'];
    keys.forEach((key, i) => {
      const row = rows[i];
      if (!row || labels[key] == null) return;
      const kEl = row.querySelector('.cta-contact-k');
      if (kEl) kEl.textContent = labels[key];
    });
  }

  function applyFooter(t) {
    const f = t.footer;
    if (!f) return;
    const ps = document.querySelectorAll('footer p');
    if (ps[0] && f.line1 != null) ps[0].textContent = f.line1;
    const quote = document.querySelector('footer .footer-quote');
    if (quote && f.quote != null) quote.textContent = f.quote;
  }

  function markThemeReady() {
    document.documentElement.classList.add('theme-ready');
    window.dispatchEvent(new CustomEvent('portfolio:theme-ready'));
  }

  function themeJsonUrl() {
    if (
      typeof window.__THEME_JSON_PATH__ === 'string' &&
      window.__THEME_JSON_PATH__.length
    ) {
      return window.__THEME_JSON_PATH__;
    }
    return 'data/theme.json';
  }

  function brandIconsManifestUrl() {
    if (
      typeof window.__BRAND_ICONS_MANIFEST_PATH__ === 'string' &&
      window.__BRAND_ICONS_MANIFEST_PATH__.length
    ) {
      return window.__BRAND_ICONS_MANIFEST_PATH__;
    }
    const page = document.documentElement.getAttribute('data-page');
    if (page === 'excel-data') {
      return '../data/brand-icons-manifest.json';
    }
    return 'data/brand-icons-manifest.json';
  }

  /** Builds marquee lists from data/brand-icons-manifest.json (sync script output). */
  function injectBrandRibbon(manifest) {
    const track = document.querySelector('.brand-ribbon__track');
    if (!track) return;
    const icons =
      manifest &&
      Array.isArray(manifest.icons) &&
      manifest.icons.length
        ? manifest.icons
        : null;
    if (!icons) return;
    const items = icons
      .map(function (src) {
        const s = String(src).trim();
        if (!s.length) return '';
        return (
          '<li><img src="' +
          escapeHtml(s) +
          '" alt="" width="160" height="64" loading="lazy" decoding="async"></li>'
        );
      })
      .filter(Boolean)
      .join('');
    if (!items.length) return;
    track.innerHTML =
      '<ul class="brand-ribbon__list" role="list">' +
      items +
      '</ul><ul class="brand-ribbon__list" role="presentation" aria-hidden="true">' +
      items +
      '</ul>';
  }

  function applyPortfolioSubpageNav(t) {
    const nav = t.navigation;
    if (!nav || !nav.items) return;
    document.querySelectorAll('.nav-links').forEach((group) => {
      const links = group.querySelectorAll('a');
      nav.items.forEach((item, i) => {
        if (!links[i]) return;
        if (item.label != null) links[i].textContent = item.label;
        const hash =
          item.href != null && String(item.href).startsWith('#')
            ? String(item.href)
            : '';
        links[i].href = '../index.html' + hash;
      });
    });
  }

  function applyExcelSubpage(theme) {
    applyPortfolioSubpageNav(theme);
    const logo = document.querySelector('.nav-logo');
    if (logo && theme.brand && theme.brand.navLogo != null) {
      logo.textContent = theme.brand.navLogo;
    }
    const drawerName = document.querySelector('.nav-drawer__name');
    if (drawerName && theme.brand && theme.brand.navLogo != null) {
      drawerName.textContent = theme.brand.navLogo;
    }
    const drawerSub = document.querySelector('.nav-drawer__subtitle');
    if (drawerSub && theme.brand && theme.brand.roleShort != null) {
      const t = String(theme.brand.roleShort).trim();
      drawerSub.textContent = t.length > 96 ? t.slice(0, 93).trim() + '…' : t;
    }
    const photo = theme.assets && theme.assets.heroPhoto;
    if (photo && photo.path) {
      const p = String(photo.path).replace(/^\//, '');
      setFaviconFromPath(p.indexOf('../') === 0 ? p : '../' + p);
    }
    if (theme.site && theme.site.lang) {
      document.documentElement.lang = theme.site.lang;
    }
    const excelUrl =
      typeof window.__EXCEL_DATA_PATH__ === 'string' &&
      window.__EXCEL_DATA_PATH__.length
        ? window.__EXCEL_DATA_PATH__
        : '../data/excel-data.json';
    fetch(excelUrl, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(excelUrl + ' HTTP ' + r.status);
        return r.json();
      })
      .then((data) => {
        if (typeof window.initExcelDataPage === 'function') {
          window.initExcelDataPage(data);
        }
      })
      .catch((e) => {
        console.error('[excel-data]', e);
      })
      .finally(() => {
        markThemeReady();
      });
  }

  function applyTheme(theme, brandManifest) {
    applyDesign(theme);
    const page = document.documentElement.getAttribute('data-page');
    if (page === 'excel-data') {
      applyExcelSubpage(theme);
      return;
    }
    applySiteMeta(theme);
    applyBrand(theme);
    applyHeroEyebrow(theme);
    applyAssets(theme);
    applyNavigation(theme);
    applyHeroButtons(theme);
    applyStats(theme);
    applyStackSection(theme);
    applyTools(theme);
    applyFeaturedCase(theme);
    applyMoreWins(theme);
    applyFrameworks(theme);
    applyBring(theme);
    applyProcessPipeline(theme);
    applyProcessSteps(theme);
    injectBrandRibbon(brandManifest);
    applyCtaContact(theme);
    applyContactLabels(theme);
    applyFooter(theme);
    markThemeReady();
  }

  function showThemeError(msg) {
    console.error('[theme]', msg);
    markThemeReady();
  }

  function init() {
    const themeUrl = themeJsonUrl();
    const manifestUrl = brandIconsManifestUrl();
    Promise.all([
      fetch(themeUrl, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(themeUrl + ' HTTP ' + r.status);
        return r.json();
      }),
      fetch(manifestUrl, { cache: 'no-store' })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .catch(function () {
          return null;
        }),
    ])
      .then(function (pair) {
        applyTheme(pair[0], pair[1]);
      })
      .catch((e) => {
        showThemeError(
          e.message +
            ' — Serve the repo root over HTTP (e.g. python3 -m http.server) so the theme JSON path can load.'
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
