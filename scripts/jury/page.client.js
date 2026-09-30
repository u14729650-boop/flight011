/* In-browser SQL for the jury page: SQLite (sql.js) with the site's schema and sample data. */
(function () {
  var data = JSON.parse(document.getElementById('data').textContent);
  var engineEl = document.getElementById('engine');
  var SECRET = /^(scrypt\$|[0-9a-f]{64}$)/;
  var MONEY = /(price|amount|total|revenue|value)$/i;
  var db = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function cell(col, v) {
    if (v === null || v === undefined) return '<span class="nul">NULL</span>';
    if (typeof v === 'string' && SECRET.test(v)) return '<span class="mask">•••• hidden</span>';
    if (typeof v === 'number' && MONEY.test(col)) return '₹' + v.toLocaleString('en-IN');
    return esc(v);
  }
  function table(cols, rows) {
    if (!rows.length) return '<p class="res-empty">No rows.</p>';
    var h = '<div class="res-scroll"><table><thead><tr>';
    cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr>';
      cols.forEach(function (c, i) {
        var v = r[i];
        h += '<td class="' + (typeof v === 'number' ? 'num' : '') + '">' + cell(c, v) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div><p class="res-meta">' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + '</p>';
  }

  /** Runs every statement in `sql`; returns HTML for SELECT results and change counts. */
  function runSql(sql) {
    var out = '';
    try {
      var it = db.iterateStatements(sql);
      for (var stmt of it) {
        var cols = stmt.getColumnNames();
        if (cols.length) {
          var rows = [];
          while (stmt.step()) rows.push(stmt.get());
          out += table(cols, rows);
        } else {
          stmt.step();
          var n = db.getRowsModified();
          var verb = /^\s*insert/i.test(stmt.getSQL()) ? 'inserted' : /^\s*delete/i.test(stmt.getSQL()) ? 'deleted' : 'changed';
          out += '<p class="res-ok">✓ ' + n + ' row' + (n === 1 ? '' : 's') + ' ' + verb + '</p>';
        }
        stmt.free();
      }
    } catch (e) {
      var msg = String(e && e.message ? e.message : e);
      if (/FOREIGN KEY/i.test(msg)) msg += ' — run the earlier step first.';
      if (/UNIQUE constraint/i.test(msg)) msg += ' — this step has already been run. Use “Reset sample data” to start again.';
      out += '<p class="res-err">' + esc(msg) + '</p>';
    }
    return out || '<p class="res-empty">Done.</p>';
  }

  function load() {
    db = new SQL.Database();
    db.exec(data.schema);
    db.exec(data.sample);
  }

  var SQL = null;
  var raw = atob(document.getElementById('wasm').textContent.trim());
  var bytes = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  initSqlJs({ wasmBinary: bytes })
    .then(function (lib) {
      SQL = lib;
      window.SQL = lib;
      load();
      engineEl.textContent = 'Running in this page';
      engineEl.className = 'engine ok';
    })
    .catch(function (e) {
      engineEl.textContent = 'Could not start';
      engineEl.className = 'engine bad';
      console.error(e);
    });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button.run[data-step]');
    if (!btn || !db) return;
    var step = data.steps[btn.dataset.step];
    var box = document.querySelector('[data-result="' + btn.dataset.step + '"]');
    var html = runSql(step.sql);
    if (step.check && html.indexOf('res-err') === -1) html += '<p class="res-label">Table after this step</p>' + runSql(step.check);
    box.innerHTML = html;
  });

  var input = document.getElementById('sql-input');
  var out = document.getElementById('console-result');
  function runConsole() {
    if (!db) return;
    out.innerHTML = runSql(input.value);
  }
  document.getElementById('console-run').addEventListener('click', runConsole);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runConsole(); }
  });
  document.getElementById('reset').addEventListener('click', function () {
    if (!SQL) return;
    db.close();
    load();
    out.innerHTML = '<p class="res-ok">✓ Sample data restored</p>';
    document.querySelectorAll('#actions [data-result]').forEach(function (b) {
      b.innerHTML = '<p class="res-empty">Press “Run on sample data” to execute these statements.</p>';
    });
  });
})();
