/* ============================================================
   whybit. — preorder.js
   Used on /preorder/ (the form) and on the home page (the
   units-left meter only). Talks to worker/index.js:
     GET  /api/preorder/status  → units left + kits and prices
     POST /api/preorder         → reserve
   No payment happens here; it only records a free reservation.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('po-form');
  var fields = $('po-fields'), msg = $('po-msg'), btn = $('po-submit');
  var leftEl = $('po-left'), capEl = $('po-cap'), fill = $('po-fill'), stateEl = $('po-state');
  var totalEl = $('po-total');
  var open = false, left = 20, cap = 20, kits = {};

  var inr = function (n) {
    try { return '₹' + Number(n).toLocaleString('en-IN'); } catch (e) { return '₹' + n; }
  };

  function show(kind, html) {
    if (!msg) return;
    msg.hidden = false;
    msg.className = 'po-msg ' + kind;
    msg.innerHTML = html;
  }

  function meter(s) {
    left = s.left; cap = s.cap;
    if (leftEl) leftEl.textContent = s.left;
    if (capEl) capEl.textContent = s.cap;
    if (fill) fill.style.width = Math.min(100, (s.reserved / s.cap) * 100) + '%';
    if (stateEl) stateEl.textContent = !s.open ? 'opening soon' : s.left > 0 ? 'reservations open' : 'waitlist open';
    setButton();
  }

  // ---- products: prices from the worker, selection drives the button + total ----
  // the rover is always in; ticking "add connect" makes it the bundle
  function selectedKit() {
    if (!form) return null;
    var id = form.elements.addon && form.elements.addon.checked ? 'lun-e-rc-connect' : 'lun-e-rc-kit';
    form.elements.kit.value = id;
    return id;
  }
  function kitUsesRovers(id) { return !kits[id] || kits[id].rovers > 0; }

  function setButton() {
    if (!btn || btn.dataset.done) return;
    var id = selectedKit();
    btn.textContent = open && left === 0 && kitUsesRovers(id) ? 'join the waitlist →' : 'reserve mine →';
  }

  function showPrices(list) {
    (list || []).forEach(function (k) {
      kits[k.id] = k;
      document.querySelectorAll('[data-price="' + k.id + '"]').forEach(function (el) {
        el.textContent = typeof k.price === 'number' ? inr(k.price) : 'price announced soon';
        el.classList.toggle('is-set', typeof k.price === 'number');
      });
    });
    var base = kits['lun-e-rc-kit'], both = kits['lun-e-rc-connect'];
    if (base && both && typeof base.price === 'number' && typeof both.price === 'number') {
      document.querySelectorAll('[data-addon-price]').forEach(function (el) { el.textContent = '+ ' + inr(both.price - base.price); });
    }
    updateTotal();
  }

  function updateTotal() {
    if (!totalEl || !form) return;
    var k = kits[selectedKit()], qty = Number(form.elements.qty.value) || 1;
    if (k && typeof k.price === 'number') {
      totalEl.hidden = false;
      totalEl.innerHTML = '<span>' + k.name + (qty > 1 ? ' × ' + qty : '') + '</span><b>' + inr(k.price * qty) + '</b>';
    } else {
      totalEl.hidden = true;
    }
  }

  function setOpen(isOpen) {
    open = isOpen;
    if (!form) return;
    fields.disabled = !isOpen;
    form.classList.toggle('is-closed', !isOpen);
    if (!isOpen) show('info', '<b>reservations open soon.</b> the form goes live in a few days — check back, or say hi on <a href="https://www.instagram.com/whybit.in/" target="_blank" rel="noopener">instagram</a>.');
    else if (msg) msg.hidden = true;
  }

  fetch('/api/preorder/status', { headers: { accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (s) { showPrices(s.kits); meter(s); setOpen(!!s.open); })
    .catch(function () { meter({ open: false, cap: 20, reserved: 0, left: 20 }); setOpen(false); });

  if (!form) return;  // home page: meter only

  // /preorder/?kit=lun-e-rc-connect (or ?kit=connect) ticks the connect add-on
  var want = new URLSearchParams(location.search).get('kit');
  if ((want === 'lun-e-rc-connect' || want === 'connect') && form.elements.addon) form.elements.addon.checked = true;
  selectedKit();
  form.addEventListener('change', function (e) {
    if (e.target.name === 'addon' || e.target.name === 'qty') { setButton(); updateTotal(); }
  });

  function fieldError(name, text) {
    var input = form.elements[name]; if (!input) return;
    var box = input.closest ? input.closest('.po-field') : null;
    if (!box && input.length) box = input[0].closest('.po-field');
    if (!box) return;
    box.classList.toggle('bad', !!text);
    var small = box.querySelector('small'); if (small) small.textContent = text || '';
    if (input.setAttribute) input.setAttribute('aria-invalid', text ? 'true' : 'false');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!open) return;
    ['name', 'email', 'phone', 'city', 'pincode', 'qty', 'kit'].forEach(function (n) { fieldError(n, ''); });
    var data = {};
    selectedKit();
    new FormData(form).forEach(function (v, k) { if (k !== 'addon') data[k] = v; });
    btn.disabled = true; btn.textContent = 'reserving…';
    fetch('/api/preorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        var j = res.body;
        if (j.ok) {
          fields.disabled = true;
          if (typeof j.left === 'number') meter({ open: true, cap: cap, reserved: cap - j.left, left: j.left });
          var k = kits[data.kit], name = k ? k.name : 'your order';
          if (j.already) show('ok', '<b>you\'re already on the list.</b> we have a reservation for this email — we\'ll be in touch. want to change it? reply to our email or <a href="/contact/">get in touch</a>.');
          else if (j.status === 'waitlist') show('ok', '<b>you\'re on the waitlist.</b> all ' + cap + ' rovers in the first batch are reserved; you\'re next in line for the following batch. we\'ll email you.');
          else show('ok', '<b>reserved.</b> your ' + name + ' is held for you. we\'ll email you to confirm the shipping date — nothing to pay until then.');
          btn.dataset.done = '1';
          btn.textContent = 'done ✓';
          return;
        }
        if (j.fields) Object.keys(j.fields).forEach(function (n) { fieldError(n, j.fields[n]); });
        show('err', '<b>' + (j.error || 'that didn\'t go through') + '.</b>');
        btn.disabled = false; setButton();
      })
      .catch(function () {
        show('err', '<b>couldn\'t reach the server.</b> check your connection and try again.');
        btn.disabled = false; setButton();
      });
  });
})();
