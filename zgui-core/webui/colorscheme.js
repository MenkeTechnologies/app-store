// zgui-core/colorscheme.js — the canonical colorscheme system EXTRACTED from
// Audio-Haxor frontend/js/settings.js: the built-in schemes (dark + light variants), the
// 24 scheme CSS-var keys, the apply logic, and the custom-scheme BUILDER (hex pickers →
// auto-generated glow/dim rgba variants). Shared so the 14 apps stop drifting. Self-contained;
// host may pre-define window.prefs to override the localStorage-backed store.
(function () {
  'use strict';
  if (!window.prefs || typeof window.prefs.getItem !== 'function') {
    window.prefs = {
      getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
      setItem(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (_) {} },
      removeItem(k) { try { localStorage.removeItem(k); } catch (_) {} },
      getObject(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (_) { return f; } },
    };
  }
  const prefs = window.prefs;
  let _onApply = (name) => {};

  // ===== canonical data (Audio-Haxor settings.js 34–219) =====
const SCHEME_VAR_KEYS = [
    '--accent', '--accent-light', '--accent-glow',
    '--cyan', '--cyan-glow', '--cyan-dim',
    '--magenta', '--magenta-glow',
    '--green', '--green-bg',
    '--yellow', '--yellow-glow',
    '--orange', '--orange-bg',
    '--red',
    '--text', '--text-dim', '--text-muted',
    '--bg-primary', '--bg-secondary', '--bg-card', '--bg-hover',
    '--border', '--border-glow',
];
if (typeof window !== 'undefined') window.SCHEME_VAR_KEYS = SCHEME_VAR_KEYS;

const COLOR_SCHEMES = {
    cyberpunk: {
        label: 'Cyberpunk',
        desc: 'Hot pink + cyan neon (default)',
        vars: {
            '--accent': '#ff2a6d', '--accent-light': '#ff6b9d',
            '--accent-glow': 'rgba(255, 42, 109, 0.4)',
            '--cyan': '#05d9e8', '--cyan-glow': 'rgba(5, 217, 232, 0.4)',
            '--cyan-dim': 'rgba(5, 217, 232, 0.15)',
            '--magenta': '#d300c5', '--magenta-glow': 'rgba(211, 0, 197, 0.3)',
            '--green': '#39ff14', '--green-bg': 'rgba(57, 255, 20, 0.08)',
            '--yellow': '#f9f002', '--yellow-glow': 'rgba(249, 240, 2, 0.2)',
            '--orange': '#ff6b35', '--orange-bg': 'rgba(255, 107, 53, 0.1)',
            '--red': '#ff073a',
            '--text': '#e0f0ff', '--text-dim': '#7a8ba8', '--text-muted': '#3d4f6a',
            '--bg-primary': '#05050a', '--bg-secondary': '#0a0a14',
            '--bg-card': '#0d0d1a', '--bg-hover': '#12122a',
            '--border': '#1a1a3e', '--border-glow': '#2a1a4e',
        },
        lightVars: {
            '--accent': '#d6196e', '--accent-light': '#e84d8a',
            '--accent-glow': 'rgba(214, 25, 110, 0.15)',
            '--cyan': '#0891b2', '--cyan-glow': 'rgba(8, 145, 178, 0.2)',
            '--cyan-dim': 'rgba(8, 145, 178, 0.08)',
            '--magenta': '#a300a3', '--magenta-glow': 'rgba(163, 0, 163, 0.15)',
            '--green': '#15803d', '--green-bg': 'rgba(21, 128, 61, 0.08)',
            '--yellow': '#a16207', '--yellow-glow': 'rgba(161, 98, 7, 0.1)',
            '--orange': '#c2410c', '--orange-bg': 'rgba(194, 65, 12, 0.06)',
            '--red': '#dc2626',
            '--text': '#1e293b', '--text-dim': '#475569', '--text-muted': '#94a3b8',
            '--bg-primary': '#f0f2f5', '--bg-secondary': '#e4e7ec',
            '--bg-card': '#ffffff', '--bg-hover': '#f7f8fa',
            '--border': '#cbd5e1', '--border-glow': '#a5b4c8',
        }
    },
    midnight: {
        label: 'Midnight',
        desc: 'Deep blue + electric purple',
        vars: {
            '--accent': '#7c3aed', '--accent-light': '#a78bfa',
            '--accent-glow': 'rgba(124, 58, 237, 0.4)',
            '--cyan': '#38bdf8', '--cyan-glow': 'rgba(56, 189, 248, 0.4)',
            '--cyan-dim': 'rgba(56, 189, 248, 0.15)',
            '--magenta': '#6366f1', '--magenta-glow': 'rgba(99, 102, 241, 0.3)',
            '--green': '#34d399', '--green-bg': 'rgba(52, 211, 153, 0.08)',
            '--yellow': '#c084fc', '--yellow-glow': 'rgba(192, 132, 252, 0.2)',
            '--orange': '#818cf8', '--orange-bg': 'rgba(129, 140, 248, 0.1)',
            '--red': '#f472b6',
            '--text': '#e0e7ff', '--text-dim': '#94a3b8', '--text-muted': '#475569',
            '--bg-primary': '#050510', '--bg-secondary': '#0a0a1e',
            '--bg-card': '#0d0d28', '--bg-hover': '#141432',
            '--border': '#1e1e4a', '--border-glow': '#2e1e5a',
        },
        lightVars: {
            '--accent': '#6d28d9', '--accent-light': '#8b5cf6',
            '--accent-glow': 'rgba(109, 40, 217, 0.15)',
            '--cyan': '#0284c7', '--cyan-glow': 'rgba(2, 132, 199, 0.2)',
            '--cyan-dim': 'rgba(2, 132, 199, 0.08)',
            '--magenta': '#4f46e5', '--magenta-glow': 'rgba(79, 70, 229, 0.15)',
            '--green': '#059669', '--green-bg': 'rgba(5, 150, 105, 0.08)',
            '--yellow': '#7c3aed', '--yellow-glow': 'rgba(124, 58, 237, 0.1)',
            '--orange': '#6366f1', '--orange-bg': 'rgba(99, 102, 241, 0.06)',
            '--red': '#e11d48',
            '--text': '#1e1b4b', '--text-dim': '#4338ca', '--text-muted': '#a5b4fc',
            '--bg-primary': '#eef2ff', '--bg-secondary': '#e0e7ff',
            '--bg-card': '#ffffff', '--bg-hover': '#f5f3ff',
            '--border': '#c7d2fe', '--border-glow': '#a5b4fc',
        }
    },
    matrix: {
        label: 'Matrix',
        desc: 'Terminal green on black',
        vars: {
            '--accent': '#22c55e', '--accent-light': '#4ade80',
            '--accent-glow': 'rgba(34, 197, 94, 0.4)',
            '--cyan': '#39ff14', '--cyan-glow': 'rgba(57, 255, 20, 0.4)',
            '--cyan-dim': 'rgba(57, 255, 20, 0.15)',
            '--magenta': '#16a34a', '--magenta-glow': 'rgba(22, 163, 74, 0.3)',
            '--green': '#4ade80', '--green-bg': 'rgba(74, 222, 128, 0.08)',
            '--yellow': '#a3e635', '--yellow-glow': 'rgba(163, 230, 53, 0.2)',
            '--orange': '#86efac', '--orange-bg': 'rgba(134, 239, 172, 0.1)',
            '--red': '#ef4444',
            '--text': '#d1fae5', '--text-dim': '#6ee7b7', '--text-muted': '#365314',
            '--bg-primary': '#020a02', '--bg-secondary': '#061006',
            '--bg-card': '#081408', '--bg-hover': '#0e200e',
            '--border': '#1a3a1a', '--border-glow': '#1a4a1a',
        },
        lightVars: {
            '--accent': '#16a34a', '--accent-light': '#22c55e',
            '--accent-glow': 'rgba(22, 163, 74, 0.15)',
            '--cyan': '#15803d', '--cyan-glow': 'rgba(21, 128, 61, 0.2)',
            '--cyan-dim': 'rgba(21, 128, 61, 0.08)',
            '--magenta': '#166534', '--magenta-glow': 'rgba(22, 101, 52, 0.15)',
            '--green': '#22c55e', '--green-bg': 'rgba(34, 197, 94, 0.08)',
            '--yellow': '#65a30d', '--yellow-glow': 'rgba(101, 163, 13, 0.1)',
            '--orange': '#4ade80', '--orange-bg': 'rgba(74, 222, 128, 0.06)',
            '--red': '#dc2626',
            '--text': '#14532d', '--text-dim': '#166534', '--text-muted': '#86efac',
            '--bg-primary': '#f0fdf4', '--bg-secondary': '#dcfce7',
            '--bg-card': '#ffffff', '--bg-hover': '#f0fdf4',
            '--border': '#bbf7d0', '--border-glow': '#86efac',
        }
    },
    ember: {
        label: 'Ember',
        desc: 'Warm amber + orange tones',
        vars: {
            '--accent': '#f59e0b', '--accent-light': '#fbbf24',
            '--accent-glow': 'rgba(245, 158, 11, 0.4)',
            '--cyan': '#fb923c', '--cyan-glow': 'rgba(251, 146, 60, 0.4)',
            '--cyan-dim': 'rgba(251, 146, 60, 0.15)',
            '--magenta': '#ea580c', '--magenta-glow': 'rgba(234, 88, 12, 0.3)',
            '--green': '#84cc16', '--green-bg': 'rgba(132, 204, 22, 0.08)',
            '--yellow': '#fde047', '--yellow-glow': 'rgba(253, 224, 71, 0.2)',
            '--orange': '#f97316', '--orange-bg': 'rgba(249, 115, 22, 0.1)',
            '--red': '#dc2626',
            '--text': '#fef3c7', '--text-dim': '#d97706', '--text-muted': '#92400e',
            '--bg-primary': '#0a0502', '--bg-secondary': '#120a04',
            '--bg-card': '#1a0e06', '--bg-hover': '#24140a',
            '--border': '#3e2a1a', '--border-glow': '#4e3a1a',
        },
        lightVars: {
            '--accent': '#d97706', '--accent-light': '#f59e0b',
            '--accent-glow': 'rgba(217, 119, 6, 0.15)',
            '--cyan': '#ea580c', '--cyan-glow': 'rgba(234, 88, 12, 0.2)',
            '--cyan-dim': 'rgba(234, 88, 12, 0.08)',
            '--magenta': '#c2410c', '--magenta-glow': 'rgba(194, 65, 12, 0.15)',
            '--green': '#65a30d', '--green-bg': 'rgba(101, 163, 13, 0.08)',
            '--yellow': '#a16207', '--yellow-glow': 'rgba(161, 98, 7, 0.1)',
            '--orange': '#c2410c', '--orange-bg': 'rgba(194, 65, 12, 0.06)',
            '--red': '#dc2626',
            '--text': '#451a03', '--text-dim': '#92400e', '--text-muted': '#fbbf24',
            '--bg-primary': '#fffbeb', '--bg-secondary': '#fef3c7',
            '--bg-card': '#ffffff', '--bg-hover': '#fffbeb',
            '--border': '#fde68a', '--border-glow': '#fbbf24',
        }
    },
    arctic: {
        label: 'Arctic',
        desc: 'Cool whites + icy blue',
        vars: {
            '--accent': '#0ea5e9', '--accent-light': '#38bdf8',
            '--accent-glow': 'rgba(14, 165, 233, 0.4)',
            '--cyan': '#67e8f9', '--cyan-glow': 'rgba(103, 232, 249, 0.4)',
            '--cyan-dim': 'rgba(103, 232, 249, 0.15)',
            '--magenta': '#06b6d4', '--magenta-glow': 'rgba(6, 182, 212, 0.3)',
            '--green': '#2dd4bf', '--green-bg': 'rgba(45, 212, 191, 0.08)',
            '--yellow': '#a5f3fc', '--yellow-glow': 'rgba(165, 243, 252, 0.2)',
            '--orange': '#22d3ee', '--orange-bg': 'rgba(34, 211, 238, 0.1)',
            '--red': '#f43f5e',
            '--text': '#ecfeff', '--text-dim': '#a5f3fc', '--text-muted': '#155e75',
            '--bg-primary': '#020a0e', '--bg-secondary': '#041218',
            '--bg-card': '#061a22', '--bg-hover': '#0a2430',
            '--border': '#1a3a4e', '--border-glow': '#1a4a5e',
        },
        lightVars: {
            '--accent': '#0284c7', '--accent-light': '#0ea5e9',
            '--accent-glow': 'rgba(2, 132, 199, 0.15)',
            '--cyan': '#0891b2', '--cyan-glow': 'rgba(8, 145, 178, 0.2)',
            '--cyan-dim': 'rgba(8, 145, 178, 0.08)',
            '--magenta': '#0e7490', '--magenta-glow': 'rgba(14, 116, 144, 0.15)',
            '--green': '#0d9488', '--green-bg': 'rgba(13, 148, 136, 0.08)',
            '--yellow': '#155e75', '--yellow-glow': 'rgba(21, 94, 117, 0.1)',
            '--orange': '#06b6d4', '--orange-bg': 'rgba(6, 182, 212, 0.06)',
            '--red': '#e11d48',
            '--text': '#164e63', '--text-dim': '#0e7490', '--text-muted': '#a5f3fc',
            '--bg-primary': '#ecfeff', '--bg-secondary': '#cffafe',
            '--bg-card': '#ffffff', '--bg-hover': '#ecfeff',
            '--border': '#a5f3fc', '--border-glow': '#67e8f9',
        }
    },
    crimson: {
        label: 'Crimson',
        desc: 'Rose-red accent + teal highlight',
        vars: {
            '--accent': '#e11d48', '--accent-light': '#fb7185',
            '--accent-glow': 'rgba(225, 29, 72, 0.4)',
            '--cyan': '#2dd4bf', '--cyan-glow': 'rgba(45, 212, 191, 0.4)',
            '--cyan-dim': 'rgba(45, 212, 191, 0.15)',
            '--magenta': '#f43f5e', '--magenta-glow': 'rgba(244, 63, 94, 0.3)',
            '--green': '#22c55e', '--green-bg': 'rgba(34, 197, 94, 0.08)',
            '--yellow': '#fbbf24', '--yellow-glow': 'rgba(251, 191, 36, 0.2)',
            '--orange': '#fb923c', '--orange-bg': 'rgba(251, 146, 60, 0.1)',
            '--red': '#ff073a',
            '--text': '#ffe4e6', '--text-dim': '#b08a92', '--text-muted': '#6b4a52',
            '--bg-primary': '#0a0506', '--bg-secondary': '#140a0c',
            '--bg-card': '#1a0d10', '--bg-hover': '#2a1318',
            '--border': '#3e1a22', '--border-glow': '#4e2030',
        },
        lightVars: {
            '--accent': '#be123c', '--accent-light': '#e11d48',
            '--accent-glow': 'rgba(190, 18, 57, 0.15)',
            '--cyan': '#0d9488', '--cyan-glow': 'rgba(13, 148, 136, 0.2)',
            '--cyan-dim': 'rgba(13, 148, 136, 0.08)',
            '--magenta': '#be185d', '--magenta-glow': 'rgba(190, 24, 93, 0.15)',
            '--green': '#15803d', '--green-bg': 'rgba(21, 128, 61, 0.08)',
            '--yellow': '#a16207', '--yellow-glow': 'rgba(161, 98, 7, 0.1)',
            '--orange': '#c2410c', '--orange-bg': 'rgba(194, 65, 12, 0.06)',
            '--red': '#dc2626',
            '--text': '#1e293b', '--text-dim': '#475569', '--text-muted': '#94a3b8',
            '--bg-primary': '#faf0f1', '--bg-secondary': '#f2e4e6',
            '--bg-card': '#ffffff', '--bg-hover': '#fdf6f7',
            '--border': '#e0c5cb', '--border-glow': '#c8a5ad',
        }
    },
    toxic: {
        label: 'Toxic',
        desc: 'Acid-lime accent + magenta',
        vars: {
            '--accent': '#c6ff00', '--accent-light': '#e2ff6b',
            '--accent-glow': 'rgba(198, 255, 0, 0.4)',
            '--cyan': '#00e5ff', '--cyan-glow': 'rgba(0, 229, 255, 0.4)',
            '--cyan-dim': 'rgba(0, 229, 255, 0.15)',
            '--magenta': '#ff00aa', '--magenta-glow': 'rgba(255, 0, 170, 0.3)',
            '--green': '#39ff14', '--green-bg': 'rgba(57, 255, 20, 0.08)',
            '--yellow': '#f9f002', '--yellow-glow': 'rgba(249, 240, 2, 0.2)',
            '--orange': '#ff6b35', '--orange-bg': 'rgba(255, 107, 53, 0.1)',
            '--red': '#ff073a',
            '--text': '#e8ffd0', '--text-dim': '#8a9a6a', '--text-muted': '#4a5a32',
            '--bg-primary': '#07090a', '--bg-secondary': '#0c0f0a',
            '--bg-card': '#0f130c', '--bg-hover': '#161b10',
            '--border': '#2a3a1a', '--border-glow': '#3a4a20',
        },
        lightVars: {
            '--accent': '#5c8a00', '--accent-light': '#7cab1a',
            '--accent-glow': 'rgba(92, 138, 0, 0.15)',
            '--cyan': '#0891b2', '--cyan-glow': 'rgba(8, 145, 178, 0.2)',
            '--cyan-dim': 'rgba(8, 145, 178, 0.08)',
            '--magenta': '#a3006e', '--magenta-glow': 'rgba(163, 0, 110, 0.15)',
            '--green': '#15803d', '--green-bg': 'rgba(21, 128, 61, 0.08)',
            '--yellow': '#a16207', '--yellow-glow': 'rgba(161, 98, 7, 0.1)',
            '--orange': '#c2410c', '--orange-bg': 'rgba(194, 65, 12, 0.06)',
            '--red': '#dc2626',
            '--text': '#1e293b', '--text-dim': '#475569', '--text-muted': '#94a3b8',
            '--bg-primary': '#f3f7ec', '--bg-secondary': '#e7eedb',
            '--bg-card': '#ffffff', '--bg-hover': '#f8fbf2',
            '--border': '#d0dcc0', '--border-glow': '#b0c098',
        }
    },
    vapor: {
        label: 'Vapor',
        desc: 'Vaporwave pastel pink + cyan',
        vars: {
            '--accent': '#ff6ec7', '--accent-light': '#ff9fd8',
            '--accent-glow': 'rgba(255, 110, 199, 0.4)',
            '--cyan': '#72f1ff', '--cyan-glow': 'rgba(114, 241, 255, 0.4)',
            '--cyan-dim': 'rgba(114, 241, 255, 0.15)',
            '--magenta': '#c792ea', '--magenta-glow': 'rgba(199, 146, 234, 0.3)',
            '--green': '#5af2b0', '--green-bg': 'rgba(90, 242, 176, 0.08)',
            '--yellow': '#fff59d', '--yellow-glow': 'rgba(255, 245, 157, 0.2)',
            '--orange': '#ffb38a', '--orange-bg': 'rgba(255, 179, 138, 0.1)',
            '--red': '#ff6b8b',
            '--text': '#f0e6ff', '--text-dim': '#a99cc4', '--text-muted': '#6a5f86',
            '--bg-primary': '#0d0814', '--bg-secondary': '#140d1f',
            '--bg-card': '#1a1228', '--bg-hover': '#241836',
            '--border': '#2e2142', '--border-glow': '#3e2d56',
        },
        lightVars: {
            '--accent': '#d6469e', '--accent-light': '#ff6ec7',
            '--accent-glow': 'rgba(214, 70, 158, 0.15)',
            '--cyan': '#0e9bb0', '--cyan-glow': 'rgba(14, 155, 176, 0.2)',
            '--cyan-dim': 'rgba(14, 155, 176, 0.08)',
            '--magenta': '#8b5cf6', '--magenta-glow': 'rgba(139, 92, 246, 0.15)',
            '--green': '#10a37f', '--green-bg': 'rgba(16, 163, 127, 0.08)',
            '--yellow': '#b59000', '--yellow-glow': 'rgba(181, 144, 0, 0.1)',
            '--orange': '#d97757', '--orange-bg': 'rgba(217, 119, 87, 0.06)',
            '--red': '#e11d48',
            '--text': '#2a1e3a', '--text-dim': '#5a4a72', '--text-muted': '#9a8ab0',
            '--bg-primary': '#f7f0fb', '--bg-secondary': '#ede2f5',
            '--bg-card': '#ffffff', '--bg-hover': '#faf4fd',
            '--border': '#ddc9ec', '--border-glow': '#c4a8db',
        }
    },
};
  // ===== end canonical data =====

  // Apply a built-in scheme by id (dark/light per documentElement[data-theme]).
  function applyColorScheme(name) {
    const scheme = COLOR_SCHEMES[name];
    if (!scheme) return;
    prefs.setItem('colorScheme', name);
    prefs.removeItem('customSchemeVars');
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const vars = isLight && scheme.lightVars ? scheme.lightVars : scheme.vars;
    const root = document.documentElement.style;
    for (const key of SCHEME_VAR_KEYS) root.removeProperty(key);
    for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
    _onApply(name);
  }

  // hex → rgba (used by the custom-scheme builder for glow/dim variants).
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // The colorscheme BUILDER: from base hex picks, auto-generate the glow/dim/bg variants.
  function buildCustomScheme(pickerVars) {
    const vars = Object.assign({}, pickerVars);
    if (vars['--accent']) vars['--accent-glow'] = hexToRgba(vars['--accent'], 0.4);
    if (vars['--cyan']) { vars['--cyan-glow'] = hexToRgba(vars['--cyan'], 0.4); vars['--cyan-dim'] = hexToRgba(vars['--cyan'], 0.15); }
    if (vars['--magenta']) vars['--magenta-glow'] = hexToRgba(vars['--magenta'], 0.3);
    if (vars['--yellow']) vars['--yellow-glow'] = hexToRgba(vars['--yellow'], 0.2);
    if (vars['--green']) vars['--green-bg'] = hexToRgba(vars['--green'], 0.08);
    if (vars['--orange']) vars['--orange-bg'] = hexToRgba(vars['--orange'], 0.1);
    return vars;
  }

  function applyCustomVars(vars) {
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
  }

  // Apply an explicit var map (light-aware: bg/text/border deferred to [data-theme=light] CSS).
  function applySchemeVars(vars) {
    const root = document.documentElement.style;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const lightKeep = new Set(['--bg-primary', '--bg-secondary', '--bg-card', '--bg-hover', '--text', '--text-dim', '--text-muted', '--border', '--border-glow']);
    for (const key of SCHEME_VAR_KEYS) root.removeProperty(key);
    const filtered = isLight ? Object.fromEntries(Object.entries(vars).filter(([k]) => !lightKeep.has(k))) : vars;
    applyCustomVars(filtered);
  }

  function applyCustomScheme(pickerVars) {
    const vars = buildCustomScheme(pickerVars);
    prefs.setItem('colorScheme', 'custom');
    prefs.setItem('customSchemeVars', vars);
    applySchemeVars(vars);
    _onApply('custom');
    return vars;
  }

  function setLight(isLight) {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    const cur = prefs.getItem('colorScheme') || 'cyberpunk';
    if (cur === 'custom') applySchemeVars(prefs.getObject('customSchemeVars', {}));
    else applyColorScheme(cur);
  }

  // Restore the saved scheme on load.
  function load() {
    const cur = prefs.getItem('colorScheme') || 'cyberpunk';
    if (cur === 'custom') { const v = prefs.getObject('customSchemeVars', null); if (v) { applySchemeVars(v); return; } }
    applyColorScheme(cur);
  }

  // A scheme-switcher widget: a grid of buttons with colour dots; calls onChange(id).
  function buildSwitcher(onChange) {
    const grid = document.createElement('div');
    grid.className = 'zs-scheme-grid';
    const cur = prefs.getItem('colorScheme') || 'cyberpunk';
    const dots = ['--accent', '--cyan', '--magenta', '--green', '--yellow', '--orange', '--red', '--text'];
    Object.keys(COLOR_SCHEMES).forEach((id) => {
      const s = COLOR_SCHEMES[id];
      const btn = document.createElement('button');
      btn.className = 'zs-scheme-btn' + (id === cur ? ' active' : '');
      btn.dataset.scheme = id;
      const name = document.createElement('div'); name.className = 'zs-scheme-name'; name.textContent = s.label;
      const desc = document.createElement('div'); desc.className = 'zs-scheme-desc'; desc.textContent = s.desc;
      const row = document.createElement('div'); row.className = 'zs-scheme-dots';
      dots.forEach((k) => { const d = document.createElement('span'); d.className = 'zs-scheme-dot'; d.style.background = s.vars[k] || '#888'; row.appendChild(d); });
      btn.appendChild(name); btn.appendChild(desc); btn.appendChild(row);
      btn.addEventListener('click', () => {
        applyColorScheme(id);
        grid.querySelectorAll('.zs-scheme-btn').forEach((b) => b.classList.toggle('active', b === btn));
        if (typeof onChange === 'function') onChange(id);
      });
      grid.appendChild(btn);
    });
    return grid;
  }

  const esc = window.escapeHtml || ((s) => { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; });

  // The hex-pickable BASE tokens of a scheme (the glow/dim/bg variants are auto-derived by
  // buildCustomScheme, so they are NOT edited directly). Override via buildEditor({ keys }).
  const CUSTOM_EDIT_KEYS = ['--accent', '--cyan', '--magenta', '--green', '--yellow', '--orange', '--red',
    '--bg-primary', '--bg-secondary', '--bg-card', '--bg-hover', '--text', '--text-dim', '--text-muted', '--border'];

  // The base hex values to seed the editor from: the live custom scheme, else the active built-in.
  function currentBaseVars() {
    const cur = prefs.getItem('colorScheme') || 'cyberpunk';
    if (cur === 'custom' || cur.indexOf('custom-') === 0) return prefs.getObject('customSchemeVars', {});
    return (COLOR_SCHEMES[cur] || {}).vars || {};
  }
  function pickerMap(root) { const m = {}; root.querySelectorAll('.custom-color-input').forEach((i) => { m[i.dataset.var] = i.value; }); return m; }

  // The custom-scheme EDITOR: a swatch (<input type=color>) per base token. Editing any swatch rebuilds
  // the full scheme (auto glow/dim/bg) via buildCustomScheme, applies + persists it as 'custom', live.
  function buildEditor(container, opts) {
    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) return null;
    opts = opts || {};
    const keys = opts.keys || CUSTOM_EDIT_KEYS;
    const seed = currentBaseVars();
    host.classList.add('custom-color-grid');
    host.innerHTML = keys.map((k) => {
      const hex = (seed[k] && /^#[0-9a-fA-F]{6}$/.test(seed[k])) ? seed[k] : '#000000';
      return '<label class="custom-color-item"><span class="custom-color-label">' + esc(k.replace('--', '')) + '</span>'
        + '<input type="color" class="custom-color-input" data-var="' + esc(k) + '" value="' + hex + '"></label>';
    }).join('');
    host.addEventListener('input', (e) => {
      if (!e.target.closest || !e.target.closest('.custom-color-input')) return;
      const built = applyCustomScheme(pickerMap(host));
      if (typeof opts.onChange === 'function') opts.onChange(built);
    });
    return { el: host, read: () => buildCustomScheme(pickerMap(host)), reseed() { const s = currentBaseVars(); host.querySelectorAll('.custom-color-input').forEach((i) => { if (s[i.dataset.var]) i.value = s[i.dataset.var]; }); } };
  }

  // ── Named custom-scheme presets (save / load / delete / reorder) ──
  const PRESETS_KEY = 'customSchemePresets';
  function presets() { return prefs.getObject(PRESETS_KEY, []); }
  function savePreset(name, vars) {
    const ps = presets();
    ps.push({ name: name || ('Custom ' + (ps.length + 1)), vars: vars || prefs.getObject('customSchemeVars', {}) });
    prefs.setItem(PRESETS_KEY, ps);
    prefs.setItem('colorScheme', 'custom-' + (ps.length - 1));
    return ps.length - 1;
  }
  function loadPreset(idx) {
    const p = presets()[idx];
    if (!p) return null;
    prefs.setItem('colorScheme', 'custom-' + idx);
    prefs.setItem('customSchemeVars', p.vars);
    applySchemeVars(p.vars);
    _onApply('custom-' + idx);
    return p;
  }
  function deletePresets() { prefs.removeItem(PRESETS_KEY); }
  function reorderPresets(order) { const ps = presets(); prefs.setItem(PRESETS_KEY, (order || []).map((i) => ps[i]).filter(Boolean)); }

  // The saved-preset CHIPS: a 3-dot (accent/cyan/magenta) swatch + name per preset; click to load,
  // drag to reorder (via ZGui.drag when present). Returns { el, refresh } so the host can re-render.
  function buildPresetChips(container, opts) {
    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) return null;
    opts = opts || {};
    host.classList.add('custom-scheme-saved');
    function render() {
      const ps = presets(), cur = prefs.getItem('colorScheme') || '';
      host.innerHTML = ps.map((p, i) => {
        const active = cur === 'custom-' + i ? ' active' : '';
        const a = p.vars['--accent'] || '#ff2a6d', c = p.vars['--cyan'] || '#05d9e8', m = p.vars['--magenta'] || '#d300c5';
        return '<button class="custom-preset-chip' + active + '" data-idx="' + i + '" title="' + esc(p.name) + '">'
          + '<span class="custom-preset-chip-dots"><span class="custom-preset-chip-dot" style="background:' + esc(a) + '"></span>'
          + '<span class="custom-preset-chip-dot" style="background:' + esc(c) + '"></span>'
          + '<span class="custom-preset-chip-dot" style="background:' + esc(m) + '"></span></span>' + esc(p.name) + '</button>';
      }).join('');
      if (window.ZGui && window.ZGui.drag && typeof window.ZGui.drag.init === 'function') {
        window.ZGui.drag.init(host, '.custom-preset-chip', 'presetChipOrder', {
          direction: 'horizontal',
          getKey: (el) => el.textContent.trim(),
          onReorder: () => { reorderPresets([...host.querySelectorAll('.custom-preset-chip')].map((ch) => parseInt(ch.dataset.idx, 10))); render(); },
        });
      }
    }
    host.addEventListener('click', (e) => {
      const chip = e.target.closest('.custom-preset-chip');
      if (!chip) return;
      const idx = parseInt(chip.dataset.idx, 10);
      const p = loadPreset(idx);
      render();
      if (typeof opts.onLoad === 'function') opts.onLoad(idx, p);
    });
    render();
    return { el: host, refresh: render };
  }

  window.ZGui = window.ZGui || {};
  window.ZGui.colorscheme = {
    schemes: COLOR_SCHEMES, keys: SCHEME_VAR_KEYS,
    apply: applyColorScheme, applyVars: applySchemeVars, buildCustom: buildCustomScheme,
    applyCustom: applyCustomScheme, setLight, load, buildSwitcher, hexToRgba,
    buildEditor, buildPresetChips,
    presets, savePreset, loadPreset, deletePresets, reorderPresets,
    onApply(fn) { _onApply = typeof fn === 'function' ? fn : _onApply; },
  };
})();
