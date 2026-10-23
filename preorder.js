/* ============================================================
   whybit. — preorder.js
   The pre-order form on the home page. Talks to worker/index.js:
     GET  /api/preorder/status  → units left
     POST /api/preorder         → reserve
   No payment happens here; it only records a free reservation.
   ============================================================ */
(function () {
  'use strict';
  var form = document.getElementById('po-form');
  if (!form) return;
  var fields = document.getElementById('po-fields');
  var msg = document.getElementById('po-msg');
  var btn = document.getElementById('po-submit');
  var leftEl = document.getElementById('po-left'), capEl = document.getElementById('po-cap');
  var fill = document.getElementById('po-fill'), stateEl = document.getElementById('po-state');
  var open = false, left = 20;

  function show(kind, html) {
    msg.hidden = false;
    msg.className = 'po-msg ' + kind;
    msg.innerHTML = html;
  }
  function meter(s) {
    left = s.left; leftEl.textContent = s.left; capEl.textContent = s.cap;
    fill.style.width = Math.min(100, (s.reserved / s.cap) * 100) + '%';
    stateEl.textContent = !s.open ? 'opening soon' : s.left > 0 ? 'reservations open' : 'waitlist open';
    btn.textContent = s.open && s.left === 0 ? 'join the waitlist →' : 'reserve mine →';
  }
  function setOpen(isOpen) {
    open = isOpen;
    fields.disabled = !isOpen;
    form.classList.toggle('is-closed', !isOpen);
    if (!isOpen) show('info', '<b>reservations open soon.</b> the form goes live in a few days — check back, or say hi on <a href="https://www.instagram.com/whybit.in/" target="_blank" rel="noopener">instagram</a>.');
  }

  fetch('/api/preorder/status', { headers: { accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (s) { meter(s); setOpen(!!s.open); if (s.open) msg.hidden = true; })
    .catch(function () { meter({ open: false, cap: 20, reserved: 0, left: 20 }); setOpen(false); });

  function fieldError(name, text) {
    var input = form.elements[name]; if (!input) return;
    var box = input.closest('.po-field'); if (!box) return;
    box.classList.toggle('bad', !!text);
    box.querySelector('small').textContent = text || '';
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!open) return;
    ['name', 'email', 'phone', 'city', 'pincode', 'qty'].forEach(function (n) { fieldError(n, ''); });
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    btn.disabled = true; btn.textContent = 'reserving…';
    fetch('/api/preorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        var j = res.body;
        if (j.ok) {
          fields.disabled = true;
          if (typeof j.left === 'number') meter({ open: true, cap: Number(capEl.textContent) || 20, reserved: (Number(capEl.textContent) || 20) - j.left, left: j.left });
          if (j.already) show('ok', '<b>you\'re already on the list.</b> we have a reservation for this email — we\'ll be in touch.');
          else if (j.status === 'waitlist') show('ok', '<b>you\'re on the waitlist.</b> all twenty are reserved; you\'re next in line for the following batch. we\'ll email you.');
          else show('ok', '<b>reserved.</b> one lun-e rc is held for you. we\'ll email you the price and shipping date — nothing to pay until then.');
          btn.textContent = 'done ✓';
          return;
        }
        if (j.fields) Object.keys(j.fields).forEach(function (n) { fieldError(n, j.fields[n]); });
        show('err', '<b>' + (j.error || 'that didn\'t go through') + '.</b>');
        btn.disabled = false; btn.textContent = left === 0 ? 'join the waitlist →' : 'reserve mine →';
      })
      .catch(function () {
        show('err', '<b>couldn\'t reach the server.</b> check your connection and try again.');
        btn.disabled = false; btn.textContent = 'reserve mine →';
      });
  });
})();
