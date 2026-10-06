/* 7ACE Hub — sync for apps that save into localStorage.
 *
 *   ACESync.keys('fuelos', { keys: ['7ace_fuelos_v1'], depth: 3 });
 *
 * It watches the chosen keys, records WHAT changed and WHEN, and merges with the
 * copy in the user's account piece by piece (newest change wins), so two devices
 * that log different days / items never overwrite each other.
 *
 *   keys   exact key names, or a RegExp, or a function(key) -> boolean
 *   depth  how deep to merge inside JSON values: 1 = whole value is one piece,
 *          2 = each top-level field is its own piece, 3 = one level further, ...
 */
(function () {
  'use strict';
  if (!window.ACESync) return;

  var SEP = '\u0001', DAY = 86400000, trackers = [];
  var _get = Storage.prototype.getItem, _set = Storage.prototype.setItem, _rem = Storage.prototype.removeItem;
  var interacted = false;

  document.addEventListener('input', function (e) { if (!e.target.closest || !e.target.closest('#ace-sync-panel')) interacted = true; }, true);
  document.addEventListener('change', function (e) { if (!e.target.closest || !e.target.closest('#ace-sync-panel')) interacted = true; }, true);

  function isPlain(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort()
      .map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }

  /* ---- break one stored value into independent "pieces" (leaves) ---- */
  function flatten(key, raw, depth) {
    var out = {};
    if (raw === null || raw === undefined) return out;
    var parsed, isJson = true;
    try { parsed = JSON.parse(raw); } catch (e) { isJson = false; }
    if (!isJson) { out[key] = { s: String(raw) }; return out; }
    (function walk(path, val, d) {
      if (d > 1 && isPlain(val) && Object.keys(val).length) {
        Object.keys(val).forEach(function (k) { walk(path + SEP + k, val[k], d - 1); });
      } else out[path] = { j: val };
    })(key, parsed, depth);
    return out;
  }
  function leafRaw(l) { return l.s !== undefined ? l.s : JSON.stringify(l.j); }

  function rebuild(key, leaves) {                       // leaves: {path: leaf} for ONE storage key
    var paths = Object.keys(leaves).sort(function (a, b) { return a.length - b.length; });
    if (!paths.length) return null;
    if (leaves[key]) return leafRaw(leaves[key]);
    var root = {};
    paths.forEach(function (p) {
      var parts = p.split(SEP).slice(1), cur = root;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!isPlain(cur[parts[i]])) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = leaves[p].j;
    });
    return JSON.stringify(root);
  }

  function keyOf(path) { return path.split(SEP)[0]; }

  /* ---- one tracked app ---- */
  function register(app, opts) {
    var T = { app: app, depth: opts.depth || 1, META: '7ace_sync_kmeta_' + app };
    var m = opts.keys;
    T.match = typeof m === 'function' ? m : m instanceof RegExp ? function (k) { return m.test(k); } : function (k) { return m.indexOf(k) !== -1; };
    T.exclude = opts.exclude || [];
    T.tracks = function (k) { return typeof k === 'string' && T.exclude.indexOf(k) === -1 && T.match(k); };
    T.meta = function () { try { var x = JSON.parse(_get.call(localStorage, T.META) || '{}'); return { t: x.t || {}, d: x.d || {} }; } catch (e) { return { t: {}, d: {} }; } };
    T.saveMeta = function (x) { _set.call(localStorage, T.META, JSON.stringify(x)); };
    trackers.push(T);

    function localKeys() {
      var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (T.tracks(k)) ks.push(k); }
      return ks;
    }
    function normalize(doc) {
      doc = doc || {}; var out = { v: 1, leaves: {} }, cut = Date.now() - 180 * DAY;
      Object.keys(doc.leaves || {}).forEach(function (p) { var l = doc.leaves[p]; if (l.d && l.t < cut) return; out.leaves[p] = l; });
      return out;
    }

    var adapter = {
      normalize: normalize,
      read: function () {
        var meta = T.meta(), leaves = {};
        localKeys().forEach(function (k) {
          var f = flatten(k, _get.call(localStorage, k), T.depth);
          Object.keys(f).forEach(function (p) { leaves[p] = { t: meta.t[p] || 0, j: f[p].j, s: f[p].s }; });
        });
        Object.keys(meta.d).forEach(function (p) { if (!leaves[p]) leaves[p] = { t: meta.d[p], d: 1 }; });
        return normalize({ leaves: leaves });
      },
      merge: function (a, b) {                         // a = this device, b = account
        a = normalize(a); b = normalize(b); var out = { v: 1, leaves: {} };
        var paths = {}; Object.keys(a.leaves).concat(Object.keys(b.leaves)).forEach(function (p) { paths[p] = 1; });
        Object.keys(paths).forEach(function (p) {
          var x = a.leaves[p], y = b.leaves[p];
          if (x && y) {
            if (x.t > y.t) out.leaves[p] = x; else if (y.t > x.t) out.leaves[p] = y;
            else out.leaves[p] = y;                    // tie: keep what is already in the account
          } else out.leaves[p] = x || y;
        });
        return normalize(out);
      },
      write: function (doc) {
        doc = normalize(doc); var changed = false, meta = { t: {}, d: {} }, byKey = {};
        Object.keys(doc.leaves).forEach(function (p) {
          var l = doc.leaves[p], k = keyOf(p); if (!T.tracks(k)) return;
          if (l.d) { meta.d[p] = l.t; return; }
          meta.t[p] = l.t; (byKey[k] = byKey[k] || {})[p] = l;
        });
        Object.keys(byKey).forEach(function (k) {
          var raw = rebuild(k, byKey[k]), cur = _get.call(localStorage, k);
          var same = cur !== null && (cur === raw || (function () { try { return stable(JSON.parse(cur)) === stable(JSON.parse(raw)); } catch (e) { return false; } })());
          if (!same) { _set.call(localStorage, k, raw); changed = true; }
        });
        localKeys().forEach(function (k) {                       // keys that were deleted elsewhere
          if (byKey[k]) return;
          var hasDel = Object.keys(meta.d).some(function (p) { return keyOf(p) === k; });
          if (hasDel) { _rem.call(localStorage, k); changed = true; }
        });
        T.saveMeta(meta);
        return changed;
      },
      reset: function () { localKeys().forEach(function (k) { _rem.call(localStorage, k); }); _rem.call(localStorage, T.META); },
      onApplied: function () {                          // pages hold their data in memory, so show the new data
        if (!interacted) {
          var last = Number(sessionStorage.getItem('ace_sync_reload') || 0);
          if (Date.now() - last > 20000) { sessionStorage.setItem('ace_sync_reload', String(Date.now())); location.reload(); return; }
        }
        toast();
      }
    };
    T.adapter = adapter;
    ACESync.register(app, adapter);
  }

  /* ---- notice when another device changed something while you're using the app ---- */
  var toastEl = null;
  function toast() {
    if (toastEl || !document.body) return;
    toastEl = document.createElement('div'); toastEl.setAttribute('data-ace-ui','1');
    toastEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:2147482999;background:#18181c;border:1px solid #ff1e1e;color:#fff;padding:10px 14px;border-radius:12px;font:14px system-ui,sans-serif;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.6)';
    var t = document.createElement('span'); t.textContent = 'Updated from another device.';
    var b = document.createElement('button'); b.textContent = 'Refresh'; b.style.cssText = 'background:#ff1e1e;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer';
    b.onclick = function () { location.reload(); };
    toastEl.appendChild(t); toastEl.appendChild(b); document.body.appendChild(toastEl);
  }

  /* ---- record changes the app makes (no changes to the app's own code) ---- */
  function stamp(T, key, oldRaw, newRaw) {
    var meta = T.meta(), now = Date.now();
    var o = flatten(key, oldRaw, T.depth), n = flatten(key, newRaw, T.depth);
    Object.keys(n).forEach(function (p) { if (!o[p] || stable(o[p]) !== stable(n[p])) { meta.t[p] = now; delete meta.d[p]; } });
    Object.keys(o).forEach(function (p) { if (!n[p]) { meta.d[p] = now; delete meta.t[p]; } });
    T.saveMeta(meta);
  }
  Storage.prototype.setItem = function (k, v) {
    if (this === localStorage) {
      var hits = trackers.filter(function (T) { return T.tracks(k); });
      if (hits.length) {
        var oldRaw = _get.call(localStorage, k), newRaw = String(v);
        if (oldRaw !== newRaw) { hits.forEach(function (T) { stamp(T, k, oldRaw, newRaw); }); _set.call(this, k, v); hits.forEach(function (T) { ACESync.touch(T.app); }); return; }
      }
    }
    return _set.apply(this, arguments);
  };
  Storage.prototype.removeItem = function (k) {
    if (this === localStorage) {
      var hits = trackers.filter(function (T) { return T.tracks(k); });
      if (hits.length && _get.call(localStorage, k) !== null) {
        var oldRaw = _get.call(localStorage, k);
        hits.forEach(function (T) { stamp(T, k, oldRaw, null); });
        _rem.call(this, k); hits.forEach(function (T) { ACESync.touch(T.app); }); return;
      }
    }
    return _rem.apply(this, arguments);
  };

  ACESync.keys = register;
})();
