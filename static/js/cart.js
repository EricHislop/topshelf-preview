(() => {
  const S = window.SILLAGE || {};
  const KEY = "sillage-bag";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => "$" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);

  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { bag = []; }

  const product = (slug) => (S.products || []).find((p) => p.slug === slug);
  const priceFor = (item) => {
    const p = product(item.slug);
    if (!p) return 0;
    return item.size === 5 ? p.p5 : item.size === 10 ? p.p10 : p.p15;
  };
  const count = () => bag.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => bag.reduce((n, i) => n + priceFor(i) * i.qty, 0);
  const lineName = (i) => (product(i.slug) || {}).name || i.slug;

  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {}
  }

  function add(slug, size, qty = 1) {
    const found = bag.find((i) => i.slug === slug && i.size === size);
    if (found) found.qty = Math.min(20, found.qty + qty);
    else bag.push({ slug, size, qty });
    store();
    paint();
    open();
  }

  function setQty(slug, size, qty) {
    const i = bag.find((x) => x.slug === slug && x.size === size);
    if (!i) return;
    i.qty = qty;
    if (i.qty < 1) bag = bag.filter((x) => !(x.slug === slug && x.size === size));
    store();
    paint();
  }

  function remove(slug, size) {
    bag = bag.filter((i) => !(i.slug === slug && i.size === size));
    store();
    paint();
  }

  /* ---------- header count ---------- */
  function paintCount() {
    const n = count();
    $$("[data-bag-count]").forEach((el) => { el.textContent = n; });
    $$(".bag-btn").forEach((el) => el.classList.toggle("has-items", n > 0));
  }

  /* ---------- drawer ---------- */
  const drawer = $("[data-bag]");

  function open() {
    if (!drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    document.body.classList.add("no-scroll");
    const first = $(".bag-x", drawer);
    if (first) first.focus({ preventScroll: true });
  }

  function close() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { drawer.hidden = true; }, 240);
  }

  /* ---------- bag rendering ---------- */
  function paintBag() {
    const box = $("[data-bag-items]");
    if (!box) return;
    if (!bag.length) {
      box.innerHTML = '<div class="bag-empty"><p>Nothing in the bag yet.</p>' +
        '<a class="btn btn-ghost" href="' + (S.shop || "/shop/") + '">Browse the collection</a></div>';
    } else {
      box.innerHTML = bag.map((i) => {
        const p = product(i.slug) || { name: i.slug, image: "", family: "" };
        const unit = priceFor(i);
        return '<div class="bag-line">' +
          '<img class="bag-thumb" src="' + (S.home || "/") + 'img/' + (p.image || "hero.webp") + '" alt="" loading="lazy">' +
          '<div class="bag-meta">' +
            '<p class="bag-fam">' + (p.family || "") + '</p>' +
            '<p class="bag-name">' + p.name + '</p>' +
            '<p class="bag-size">' + i.size + 'ml · ' + money(unit) + '</p>' +
            '<div class="bag-qty" role="group" aria-label="Quantity">' +
              '<button type="button" data-qty="-1" data-slug="' + i.slug + '" data-size="' + i.size + '" aria-label="Less">−</button>' +
              '<span>' + i.qty + '</span>' +
              '<button type="button" data-qty="1" data-slug="' + i.slug + '" data-size="' + i.size + '" aria-label="More">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="bag-right">' +
            '<strong>' + money(unit * i.qty) + '</strong>' +
            '<button class="bag-remove" type="button" data-remove data-slug="' + i.slug + '" data-size="' + i.size + '">Remove</button>' +
          '</div>' +
        '</div>';
      }).join("");
    }

    const total = subtotal();
    const t = $("[data-bag-total]");
    if (t) t.textContent = money(total);
    const ship = $("[data-bag-ship]");
    if (ship) {
      if (!bag.length) ship.textContent = "";
      else if (total >= (S.freeOver || 120)) ship.textContent = "Free shipping unlocked.";
      else ship.textContent = money((S.freeOver || 120) - total) + " away from free shipping.";
    }
    const co = $("[data-bag-checkout]");
    if (co) {
      co.classList.toggle("is-off", !bag.length);
      co.setAttribute("aria-disabled", bag.length ? "false" : "true");
    }
    paintCheckout();
  }

  function paint() { paintCount(); paintBag(); }

  /* ---------- add buttons on cards / product pages ---------- */
  document.addEventListener("click", (e) => {
    const sizeBtn = e.target.closest("[data-size]");
    if (sizeBtn && !sizeBtn.closest(".bag")) {
      const holder = sizeBtn.closest(".card-buy, .buy");
      if (holder) {
        $$("[data-size]", holder).forEach((b) => b.classList.toggle("is-on", b === sizeBtn));
        const addBtn = $("[data-add]", holder);
        if (addBtn) {
          const slug = holder.dataset.product;
          const size = Number(sizeBtn.dataset.size);
          const p = product(slug);
          const price = p ? (size === 5 ? p.p5 : size === 10 ? p.p10 : p.p15) : Number(sizeBtn.dataset.price || 0);
          addBtn.innerHTML = "Add · " + money(price);
        }
      }
      return;
    }

    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      const holder = addBtn.closest(".card-buy, .buy");
      const slug = holder.dataset.product;
      const on = $("[data-size].is-on", holder) || $("[data-size]", holder);
      const size = on ? Number(on.dataset.size) : 5;
      const qtyEl = $("[data-qty-input]", holder);
      add(slug, size, qtyEl ? Math.max(1, Number(qtyEl.value) || 1) : 1);
      return;
    }

    if (e.target.closest("[data-bag-open]")) { open(); return; }
    if (e.target.closest("[data-bag-close]")) { close(); return; }

    const step = e.target.closest("[data-step]");
    if (step) {
      const input = $("[data-qty-input]", step.closest(".buy, .card-buy") || document);
      if (input) {
        const next = Math.min(20, Math.max(1, (Number(input.value) || 1) + Number(step.dataset.step)));
        input.value = next;
      }
      return;
    }

    const q = e.target.closest("[data-qty]");
    if (q && q.closest(".bag")) {
      const i = bag.find((x) => x.slug === q.dataset.slug && x.size === Number(q.dataset.size));
      if (i) setQty(i.slug, i.size, i.qty + Number(q.dataset.qty));
      return;
    }
    const rm = e.target.closest("[data-remove]");
    if (rm) { remove(rm.dataset.slug, Number(rm.dataset.size)); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && !drawer.hidden) close();
  });

  /* ---------- checkout ---------- */
  function paintCheckout() {
    const list = $("[data-co-items]");
    if (!list) return;
    if (!bag.length) {
      list.innerHTML = '<p class="co-empty">Your bag is empty. <a href="' + (S.shop || "/shop/") + '">Shop the collection</a>.</p>';
      const f = $("[data-co-form]");
      if (f) f.setAttribute("hidden", "hidden");
      const tot = $("[data-co-total]");
      if (tot) tot.textContent = "$0";
      return;
    }
    const f = $("[data-co-form]");
    if (f) f.removeAttribute("hidden");
    list.innerHTML = bag.map((i) => {
      const p = product(i.slug) || { name: i.slug, image: "" };
      const unit = priceFor(i);
      return '<div class="co-line">' +
        '<img src="' + (S.home || "/") + 'img/' + (p.image || "hero.webp") + '" alt="" loading="lazy">' +
        '<div><p class="co-name">' + p.name + '</p><p class="co-sub">' + i.size + 'ml × ' + i.qty + '</p></div>' +
        '<strong>' + money(unit * i.qty) + '</strong>' +
      '</div>';
    }).join("");

    const sub = subtotal();
    const ship = sub >= (S.freeOver || 120) ? 0 : 7;
    const set = (sel, v) => { const el = $(sel); if (el) el.textContent = money(v); };
    set("[data-co-sub]", sub);
    set("[data-co-ship]", ship);
    set("[data-co-total]", sub + ship);
  }

  const form = $("[data-co-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!bag.length) return;
      const data = new FormData(form);
      const get = (k) => (data.get(k) || "").toString().trim();
      let bad = null;
      ["name", "email", "address", "city", "postcode"].forEach((k) => {
        if (!get(k)) { if (!bad) bad = k; }
      });
      const email = get("email");
      if (!bad && (!email.includes("@") || !email.split("@")[1] || !email.split("@")[1].includes("."))) bad = "email";
      if (bad) {
        const el = form.querySelector('[name="' + bad + '"]');
        if (el) {
          el.classList.add("is-bad");
          el.focus({ preventScroll: false });
          const msg = $("[data-co-error]");
          if (msg) {
            msg.textContent = bad === "email"
              ? "Check that email address."
              : "Fill in the highlighted field.";
            msg.hidden = false;
          }
        }
        return;
      }

      const ref = "SLG-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      const total = $("[data-co-total]").textContent;
      const lines = bag.map((i) => lineName(i) + " " + i.size + "ml × " + i.qty).join("<br>");
      const done = $("[data-co-done]");
      if (done) {
        done.innerHTML =
          '<p class="eyebrow">Order ' + ref + '</p>' +
          '<h2>That is held for you.</h2>' +
          '<p>We have your details, ' + get("name").split(" ")[0] + '. In the real shop this is where the card would be taken and the parcel posted.</p>' +
          '<div class="co-recap"><p>' + lines + '</p><p class="co-recap-total">' + total + ' incl. shipping</p></div>' +
          '<p class="co-note">This is a preview. Nothing has been charged and no order has been sent.</p>' +
          '<a class="btn btn-ghost" href="' + (S.shop || "/shop/") + '">Back to the collection</a>';
        done.hidden = false;
        form.hidden = true;
        const summary = $("[data-co-summary]");
        if (summary) summary.hidden = true;
        bag = [];
        store();
        paintCount();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    form.addEventListener("input", (e) => {
      if (e.target.classList.contains("is-bad")) e.target.classList.remove("is-bad");
    });
  }

  paint();
})();
