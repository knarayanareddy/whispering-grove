/* Cloud: account-less cloud saves and leaderboards through the Next.js API (/api/save, /api/scores). Fails silently offline. */
(function (G) {
  const TOKEN_KEY = 'whisperingGrove.token';
  function token() {
    try { let t = localStorage.getItem(TOKEN_KEY); if (!t) { t = 'wg' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(TOKEN_KEY, t); } return t; } catch (e) { return 'anon'; }
  }
  const api = (path, opts) => fetch(path, opts).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  G.Cloud = {
    token: token,
    name: function () { return 'Wren-' + token().slice(-4).toUpperCase(); },
    save: function (data) { return api('/api/save', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: token(), data: data }) }); },
    load: function () { return api('/api/save?token=' + encodeURIComponent(token())); },
    submit: function (board, value) { return api('/api/scores', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: token(), name: this.name(), board: board, value: value, diff: G.Diff ? G.Diff.cur.name : '' }) }); },
    board: function (board) { return api('/api/scores?board=' + encodeURIComponent(board)).then((r) => (r && r.rows) || []); }
  };
})(window.Game = window.Game || {});
