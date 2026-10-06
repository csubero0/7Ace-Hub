/*
 * 7ACE Hub — account + cloud sync
 * One small module shared by the hub and every app. Apps stay offline-first:
 * data always lives in the browser; when signed in it is merged with the copy
 * stored in the user's account (Supabase) so phone and computer match.
 *
 * The URL and key below are PUBLIC by design. Privacy comes from the
 * Row Level Security rules in the database, not from hiding these values.
 */
(function () {
  'use strict';

  var CFG = window.ACE_SYNC_CONFIG || {
    url: 'https://cgxrgktljgbaoeniasph.supabase.co',
    key: 'sb_publishable_mg0E6Y_iXkfo6Tn8x7oBZA_chK19qV9'
  };
  var OWNER_KEY = '7ace_sync_owner';
  var DIRTY_PREFIX = '7ace_sync_dirty_';

  var S = {
    client: null, user: null, adapters: {}, seq: {},
    status: 'out',          // out | syncing | synced | error | nolib
    msg: '', last: 0,
    syncing: false, again: false, timer: null,
    mode: 'in', recovery: false, busy: false, notice: ''
  };

  /* ---------- helpers ---------- */
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort()
      .map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  }
  function isDirty(app) { return localStorage.getItem(DIRTY_PREFIX + app) === '1'; }
  function anyDirty() { return Object.keys(S.adapters).some(isDirty); }
  function setDirty(app, on) { if (on) localStorage.setItem(DIRTY_PREFIX + app, '1'); else localStorage.removeItem(DIRTY_PREFIX + app); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined) return;
      if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ---------- syncing ---------- */
  function syncApp(app, tries) {
    var ad = S.adapters[app];
    if (!ad || !S.user || !S.client) return Promise.resolve(false);
    tries = tries || 0;
    var uid = S.user.id;
    var seqAtStart = S.seq[app] || 0;
    return S.client.from('user_data').select('data,updated_at')
      .eq('user_id', uid).eq('app', app).maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        var row = res.data;
        var remote = row && row.data ? row.data : null;
        var local = ad.read();
        var merged = remote ? ad.merge(local, remote) : ad.normalize(local);
        var ms = stable(merged);
        var localChanged = ms !== stable(ad.normalize(local));
        if (localChanged) ad.write(merged);
        var needPush = !row || ms !== stable(ad.normalize(remote));
        var q = null;
        if (needPush) {
          q = !row
            ? S.client.from('user_data').insert({ user_id: uid, app: app, data: merged }).select('updated_at')
            : S.client.from('user_data').update({ data: merged })
                .eq('user_id', uid).eq('app', app).eq('updated_at', row.updated_at).select('updated_at');
        }
        return Promise.resolve(q).then(function (r) {
          if (r && r.error) {
            if (r.error.code === '23505' && tries < 3) return syncApp(app, tries + 1);
            throw r.error;
          }
          if (r && Array.isArray(r.data) && r.data.length === 0) {
            if (tries < 3) return syncApp(app, tries + 1);   // someone else wrote first: merge again
            throw new Error('Sync conflict, will retry');
          }
          if (localChanged && ad.onApplied) ad.onApplied();
          if ((S.seq[app] || 0) === seqAtStart) setDirty(app, false);
          return true;
        });
      });
  }

  function syncAll() {
    if (!S.user || !S.client) return Promise.resolve();
    if (S.syncing) { S.again = true; return Promise.resolve(); }
    S.syncing = true; S.status = 'syncing'; render();
    var apps = Object.keys(S.adapters), chain = Promise.resolve();
    apps.forEach(function (a) { chain = chain.then(function () { return syncApp(a); }); });
    return chain.then(function () {
      S.status = 'synced'; S.msg = ''; S.last = Date.now();
    }).catch(function (e) {
      S.status = 'error';
      S.msg = (e && e.message) ? e.message : 'Could not reach the server';
    }).then(function () {
      S.syncing = false; render();
      if (S.again) { S.again = false; return syncAll(); }
    });
  }

  function touch(app) {
    S.seq[app] = (S.seq[app] || 0) + 1;
    setDirty(app, true);
    if (!S.user) return;
    clearTimeout(S.timer);
    S.timer = setTimeout(syncAll, 1200);
  }

  function register(app, adapter) {
    S.adapters[app] = adapter;
    if (S.user) { clearTimeout(S.timer); S.timer = setTimeout(syncAll, 300); }
  }

  /* ---------- accounts ---------- */
  function resetAllLocal() {
    Object.keys(S.adapters).forEach(function (a) {
      try { S.adapters[a].reset(); if (S.adapters[a].onApplied) S.adapters[a].onApplied(); } catch (e) {}
      setDirty(a, false);
    });
  }

  function handleOwner(u) {
    var owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== u.id) resetAllLocal();     // another person's data was on this device
    localStorage.setItem(OWNER_KEY, u.id);
  }

  function setUser(u) {
    if (u && S.user && u.id === S.user.id) { S.user = u; render(); return; }
    S.user = u || null;
    if (!S.user) { S.status = 'out'; S.msg = ''; S.notice = ''; S.mode = 'in'; render(); return; }
    handleOwner(S.user);
    render();
    syncAll();
  }

  function signOut() {
    if (anyDirty() && !window.confirm('Some changes have not synced yet and will be lost on this device if you sign out. Sign out anyway?')) return;
    S.busy = true; render();
    S.client.auth.signOut().then(function () {
      localStorage.removeItem(OWNER_KEY);
      resetAllLocal();
      S.busy = false; S.notice = ''; S.mode = 'in'; closePanel(); setUser(null);
    });
  }

  // Used by an app's own "Reset" button: wipe this device only, keep the cloud copy.
  function localReset() {
    localStorage.removeItem(OWNER_KEY);
    Object.keys(S.adapters).forEach(function (a) { setDirty(a, false); });
    if (S.client && S.user) { S.client.auth.signOut({ scope: 'local' }).then(function () { setUser(null); }); }
  }

  function submitAuth(email, password, newPassword) {
    S.busy = true; S.notice = ''; S.msg = ''; render();
    var p;
    if (S.recovery) p = S.client.auth.updateUser({ password: newPassword });
    else if (S.mode === 'up') p = S.client.auth.signUp({ email: email, password: password });
    else p = S.client.auth.signInWithPassword({ email: email, password: password });
    return p.then(function (res) {
      S.busy = false;
      if (res.error) { S.msg = friendly(res.error); render(); return; }
      if (S.recovery) { S.recovery = false; S.notice = 'Password updated.'; render(); return; }
      if (S.mode === 'up' && !(res.data && res.data.session)) {
        S.notice = 'Check your email to confirm your account, then sign in.'; S.mode = 'in';
      }
      render();
    }).catch(function (e) { S.busy = false; S.msg = friendly(e); render(); });
  }

  function forgot(email) {
    if (!email) { S.msg = 'Type your email first.'; render(); return; }
    S.busy = true; render();
    S.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/index.html' }).then(function (res) {
      S.busy = false;
      if (res.error) S.msg = friendly(res.error); else { S.msg = ''; S.notice = 'If that email has an account, a reset link is on its way.'; }
      render();
    });
  }

  function friendly(e) {
    var m = (e && e.message) || 'Something went wrong';
    if (/invalid login/i.test(m)) return 'Wrong email or password.';
    if (/already registered|already been registered/i.test(m)) return 'That email already has an account. Try signing in.';
    if (/password.*(least|short|weak)/i.test(m)) return 'Choose a longer password (at least 6 characters).';
    if (/failed to fetch|network/i.test(m)) return 'No connection. Try again when you are online.';
    return m;
  }

  /* ---------- UI ---------- */
  var ui = {};
  var CSS = '' +
    '#ace-sync-btn{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,30,30,.5);background:#121214;color:#f5f3ee;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.55);padding:0;transition:.15s}' +
    '#ace-sync-btn:hover{border-color:#ff1e1e;transform:translateY(-1px)}' +
    '#ace-sync-btn svg{width:22px;height:22px}' +
    '#ace-sync-btn i{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;border:2px solid #121214;background:#6b6b73}' +
    '#ace-sync-btn.synced i{background:#2fd27a}#ace-sync-btn.syncing i{background:#f0b429}#ace-sync-btn.error i{background:#ff4a3d}' +
    '#ace-sync-panel{position:fixed;right:14px;bottom:calc(70px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(340px,calc(100vw - 28px));background:#101012;border:1px solid #2c2c32;border-radius:14px;padding:18px;color:#eee;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:none;box-shadow:0 18px 50px rgba(0,0,0,.6)}' +
    '#ace-sync-panel.open{display:block}' +
    '#ace-sync-panel h4{margin:0 0 4px;font-size:16px;color:#fff}' +
    '#ace-sync-panel p{margin:0 0 12px;color:#9a9aa3;font-size:13px}' +
    '#ace-sync-panel input{width:100%;box-sizing:border-box;margin:0 0 10px;padding:11px 12px;border-radius:9px;border:1px solid #2f2f36;background:#18181c;color:#fff;font-size:15px}' +
    '#ace-sync-panel input:focus{outline:none;border-color:#ff1e1e}' +
    '#ace-sync-panel .ace-btn{width:100%;padding:11px;border-radius:9px;border:0;background:#ff1e1e;color:#fff;font-weight:700;font-size:14px;cursor:pointer}' +
    '#ace-sync-panel .ace-btn[disabled]{opacity:.55;cursor:default}' +
    '#ace-sync-panel .ace-ghost{background:transparent;border:1px solid #2f2f36;color:#d7d7dc;margin-top:8px}' +
    '#ace-sync-panel .ace-tabs{display:flex;gap:6px;margin-bottom:12px}' +
    '#ace-sync-panel .ace-tabs button{flex:1;padding:8px;border-radius:8px;border:1px solid #2f2f36;background:transparent;color:#9a9aa3;font-size:13px;font-weight:600;cursor:pointer}' +
    '#ace-sync-panel .ace-tabs button.on{background:#1c1c21;color:#fff;border-color:#ff1e1e}' +
    '#ace-sync-panel .ace-err{color:#ff6a5e;font-size:13px;margin:0 0 10px}' +
    '#ace-sync-panel .ace-ok{color:#58d68d;font-size:13px;margin:0 0 10px}' +
    '#ace-sync-panel .ace-link{background:none;border:0;color:#9a9aa3;font-size:12px;text-decoration:underline;cursor:pointer;padding:6px 0 0}' +
    '#ace-sync-panel .ace-x{position:absolute;top:8px;right:12px;background:none;border:0;color:#777;font-size:20px;cursor:pointer}';

  function ensureUI() {
    if (ui.btn || !document.body) return;
    var st = el('style', { text: CSS }); document.head.appendChild(st);
    ui.btn = el('button', { id: 'ace-sync-btn', type: 'button', 'aria-label': 'Account and sync', onclick: togglePanel });
    ui.btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 8"/><path d="M12 12v8M9 17l3 3 3-3"/></svg><i></i>';
    ui.panel = el('div', { id: 'ace-sync-panel' });
    document.body.appendChild(ui.btn); document.body.appendChild(ui.panel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  }
  function togglePanel() { ui.panel.classList.toggle('open'); render(); }
  function openPanel() { ensureUI(); ui.panel.classList.add('open'); render(); }
  function closePanel() { if (ui.panel) ui.panel.classList.remove('open'); }

  function ago(t) {
    var s = Math.round((Date.now() - t) / 1000);
    if (s < 10) return 'just now'; if (s < 60) return s + 's ago';
    var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    return Math.round(m / 60) + ' h ago';
  }

  function render() {
    ensureUI(); if (!ui.btn) return;
    ui.btn.className = S.user ? S.status : '';
    ui.btn.title = S.user ? 'Account and sync' : 'Sign in to sync';
    if (!ui.panel.classList.contains('open')) return;
    var p = ui.panel; p.innerHTML = '';
    p.appendChild(el('button', { class: 'ace-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: closePanel }));

    if (S.status === 'nolib') {
      p.appendChild(el('h4', { text: 'Sync unavailable' }));
      p.appendChild(el('p', { text: 'The sync service could not load. Your data is still saved on this device.' }));
      return;
    }
    if (S.recovery) {
      p.appendChild(el('h4', { text: 'Choose a new password' }));
      var np = el('input', { type: 'password', placeholder: 'New password', autocomplete: 'new-password' });
      p.appendChild(np);
      if (S.msg) p.appendChild(el('div', { class: 'ace-err', text: S.msg }));
      p.appendChild(el('button', { class: 'ace-btn', type: 'button', text: S.busy ? 'Saving…' : 'Save password', onclick: function () { submitAuth('', '', np.value); } }));
      return;
    }
    if (S.user) {
      p.appendChild(el('h4', { text: 'Your account' }));
      p.appendChild(el('p', { text: S.user.email || 'Signed in' }));
      var line = S.status === 'syncing' ? 'Syncing…'
        : S.status === 'error' ? 'Saved on this device. Will retry. (' + S.msg + ')'
        : S.last ? 'Synced ' + ago(S.last) : 'Ready';
      p.appendChild(el(S.status === 'error' ? 'div' : 'p', S.status === 'error' ? { class: 'ace-err', text: line } : { text: line }));
      p.appendChild(el('button', { class: 'ace-btn', type: 'button', text: 'Sync now', onclick: function () { syncAll(); } }));
      p.appendChild(el('button', { class: 'ace-btn ace-ghost', type: 'button', text: 'Sign out', onclick: signOut }));
      p.appendChild(el('p', { style: 'margin:12px 0 0;font-size:12px', text: 'Signing out removes your data from this device. It stays safe in your account.' }));
      return;
    }
    p.appendChild(el('h4', { text: 'Sync your training' }));
    p.appendChild(el('p', { text: 'Sign in so your workouts follow you across your phone and computer.' }));
    var tabs = el('div', { class: 'ace-tabs' }, [
      el('button', { type: 'button', class: S.mode === 'in' ? 'on' : '', text: 'Sign in', onclick: function () { S.mode = 'in'; S.msg = ''; S.notice = ''; render(); } }),
      el('button', { type: 'button', class: S.mode === 'up' ? 'on' : '', text: 'Create account', onclick: function () { S.mode = 'up'; S.msg = ''; S.notice = ''; render(); } })
    ]);
    p.appendChild(tabs);
    var em = el('input', { type: 'email', placeholder: 'Email', autocomplete: 'email', value: S.email || '' });
    var pw = el('input', { type: 'password', placeholder: 'Password', autocomplete: S.mode === 'up' ? 'new-password' : 'current-password' });
    em.addEventListener('input', function () { S.email = em.value; });
    p.appendChild(em); p.appendChild(pw);
    if (S.msg) p.appendChild(el('div', { class: 'ace-err', text: S.msg }));
    if (S.notice) p.appendChild(el('div', { class: 'ace-ok', text: S.notice }));
    var go = function () { submitAuth(em.value.trim(), pw.value); };
    pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    p.appendChild(el('button', { class: 'ace-btn', type: 'button', text: S.busy ? 'Please wait…' : (S.mode === 'up' ? 'Create account' : 'Sign in'), onclick: go, disabled: S.busy ? 'disabled' : null }));
    if (S.mode === 'in') p.appendChild(el('button', { class: 'ace-link', type: 'button', text: 'Forgot password?', onclick: function () { forgot(em.value.trim()); } }));
    if (anyDirty() || Object.keys(S.adapters).length) p.appendChild(el('p', { style: 'margin:12px 0 0;font-size:12px', text: 'Anything already saved on this device will be added to your account.' }));
  }

  /* ---------- boot ---------- */
  function boot() {
    ensureUI();
    if (!window.supabase || !window.supabase.createClient) { S.status = 'nolib'; render(); return; }
    S.client = window.supabase.createClient(CFG.url, CFG.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ace-hub-auth' }
    });
    S.client.auth.onAuthStateChange(function (evt, session) {
      setTimeout(function () {                       // never call the client inside this callback directly
        if (evt === 'PASSWORD_RECOVERY') { S.recovery = true; openPanel(); }
        setUser(session ? session.user : null);
      }, 0);
    });
    S.client.auth.getSession().then(function (r) { setUser(r && r.data && r.data.session ? r.data.session.user : null); });

    document.addEventListener('visibilitychange', function () { if (!document.hidden) syncAll(); });
    window.addEventListener('online', syncAll);
    setInterval(function () { if (!document.hidden) syncAll(); }, 60000);
  }

  window.ACESync = { register: register, touch: touch, syncNow: syncAll, localReset: localReset, open: openPanel, _state: S };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
