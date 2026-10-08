/* Cloud sync for BodyControl OS.
 * Loaded after the page's own script, so it can use that script's globals.
 * It records every change made through the app's save functions and merges
 * per session, so phone and computer never overwrite each other's work. */
(function () {
  if (!window.ACESync) return;
  var APP = 'bodycontrol', META = '7ace_sync_meta_bodycontrol', TYPES = ['upper', 'power', 'conditioning'];
  var DAY = 86400000;

  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function meta() { var m = jget(META, {}); return { mod: m.mod || {}, deleted: m.deleted || {}, profileU: m.profileU || 0, customU: m.customU || {} }; }
  function saveMeta(m) { localStorage.setItem(META, JSON.stringify(m)); }
  function rawSessions() { var l = jget(STORAGE_KEY, []); return Array.isArray(l) ? l : []; }

  /* --- record changes made through the app's own save functions --- */
  var _ss = window.setSessions, _sp = window.setProfile, _sc = window.saveCustomEx;
  window.setSessions = function (list) {
    var m = meta(), now = Date.now(), keep = {};
    var prev = new Map(rawSessions().map(function (x) { return [String(x.id), JSON.stringify(x)]; }));
    list.forEach(function (x) {
      var k = String(x.id); keep[k] = 1;
      if (prev.get(k) !== JSON.stringify(x)) { m.mod[k] = now; delete m.deleted[k]; }
    });
    prev.forEach(function (v, k) { if (!keep[k]) { m.deleted[k] = now; delete m.mod[k]; } });
    saveMeta(m); _ss(list); ACESync.touch(APP);
  };
  window.setProfile = function (p) { var m = meta(); m.profileU = Date.now(); saveMeta(m); _sp(p); ACESync.touch(APP); };
  window.saveCustomEx = function (type, list) { var m = meta(); m.customU[type] = Date.now(); saveMeta(m); _sc(type, list); ACESync.touch(APP); };

  /* --- merge logic --- */
  function normalize(d) {
    d = d || {};
    var out = {
      v: 1, sessions: Array.isArray(d.sessions) ? d.sessions.slice() : [], mod: Object.assign({}, d.mod), deleted: {},
      profile: d.profile || {}, profileU: d.profileU || 0, custom: {}, customU: Object.assign({}, d.customU)
    };
    var cut = Date.now() - 365 * DAY;
    Object.keys(d.deleted || {}).forEach(function (k) { if (d.deleted[k] > cut) out.deleted[k] = d.deleted[k]; });
    TYPES.forEach(function (t) { out.custom[t] = Array.isArray((d.custom || {})[t]) ? d.custom[t] : []; });
    out.sessions.sort(function (a, b) { return (Number(a.id) || 0) - (Number(b.id) || 0); });
    var ids = {}; out.sessions.forEach(function (x) { ids[String(x.id)] = 1; });
    Object.keys(out.mod).forEach(function (k) { if (!ids[k]) delete out.mod[k]; });
    return out;
  }
  function stamp(d, id, sess) { return d.mod[id] || Date.parse(sess.updated || sess.created) || Number(id) || 0; }

  function merge(a, b) {
    a = normalize(a); b = normalize(b);
    var am = new Map(a.sessions.map(function (x) { return [String(x.id), x]; }));
    var bm = new Map(b.sessions.map(function (x) { return [String(x.id), x]; }));
    var ids = new Set([].concat(Array.from(am.keys()), Array.from(bm.keys()), Object.keys(a.deleted), Object.keys(b.deleted)));
    var out = { v: 1, sessions: [], mod: {}, deleted: {}, profile: {}, profileU: 0, custom: {}, customU: {} };
    ids.forEach(function (id) {
      var as = am.get(id), bs = bm.get(id);
      var at = as ? stamp(a, id, as) : 0, bt = bs ? stamp(b, id, bs) : 0;
      var dt = Math.max(a.deleted[id] || 0, b.deleted[id] || 0), st = Math.max(at, bt);
      if (dt && dt >= st) { out.deleted[id] = dt; return; }          // deleted after the last edit
      var pick = at >= bt ? as : bs; if (!pick) return;               // otherwise newest edit wins
      out.sessions.push(pick); out.mod[id] = st;
    });
    out.profile = a.profileU >= b.profileU ? a.profile : b.profile;
    out.profileU = Math.max(a.profileU, b.profileU);
    TYPES.forEach(function (t) {
      var au = a.customU[t] || 0, bu = b.customU[t] || 0;
      out.custom[t] = au >= bu ? a.custom[t] : b.custom[t]; out.customU[t] = Math.max(au, bu);
    });
    return normalize(out);
  }

  var adapter = {
    normalize: normalize, merge: merge,
    read: function () {
      var m = meta(), c = {}; TYPES.forEach(function (t) { c[t] = jget('7ace_custom_ex_' + t, []); });
      return { v: 1, sessions: rawSessions(), mod: m.mod, deleted: m.deleted, profile: jget(PROFILE_KEY, {}), profileU: m.profileU, custom: c, customU: m.customU };
    },
    write: function (d) {
      d = normalize(d);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d.sessions));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(d.profile));
      TYPES.forEach(function (t) { localStorage.setItem('7ace_custom_ex_' + t, JSON.stringify(d.custom[t])); });
      saveMeta({ mod: d.mod, deleted: d.deleted, profileU: d.profileU, customU: d.customU });
    },
    reset: function () {
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(META);
      TYPES.forEach(function (t) { localStorage.removeItem('7ace_custom_ex_' + t); });
    },
    onApplied: function () {                       // refresh what's on screen without wiping a half-filled workout
      try {
        var p = profile(); applyColor(p.color || '#ff1e1e');
        ['name', 'sport', 'age', 'weight'].forEach(function (k) { var e = byId('profile-' + k); if (e) e.value = p[k] || ''; });
        if (byId('profile-color')) byId('profile-color').value = p.color || '#ff1e1e';
        renderAll();
        var busy = editingId || (document.activeElement && document.activeElement.closest && document.activeElement.closest('#workoutForm')) || Array.prototype.some.call(document.querySelectorAll('#workoutForm input'), function (i) { return i.type !== 'checkbox' && i.value !== ''; });
        if (!busy) { renderWorkoutForm(); renderSuggestions(); }
      } catch (e) { console.warn('sync refresh', e); }
    }
  };
  ACESync.register(APP, adapter);
})();
