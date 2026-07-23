(() => {
  "use strict";

  const config = window.WALLET_APP_CONFIG || {};
  const apiUrl = String(config.apiUrl || "").trim();
  const isConfigured = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(apiUrl);

  const form = document.querySelector("#walletForm");
  const orderNumber = document.querySelector("#orderNumber");
  const customerName = document.querySelector("#customerName");
  const product = document.querySelector("#product");
  const submitButton = document.querySelector("#submitButton");
  const refreshButton = document.querySelector("#refreshButton");
  const connectionStatus = document.querySelector("#connectionStatus");
  const numberPreview = document.querySelector("#numberPreview");
  const nextNumber = document.querySelector("#nextNumber");
  const recentOrders = document.querySelector("#recentOrders");
  const toast = document.querySelector("#toast");

  let products = [];

  function jsonp(action, params = {}) {
    return new Promise((resolve, reject) => {
      if (!isConfigured) {
        reject(new Error("Add your Apps Script URL to config.js."));
        return;
      }

      const callbackName = `walletCallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => finish(new Error("The request timed out.")), 15000);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      function finish(error, data) {
        cleanup();
        error ? reject(error) : resolve(data);
      }

      window[callbackName] = data => finish(null, data);
      script.onerror = () => finish(new Error("Could not connect to Google Sheets."));

      const query = new URLSearchParams({ action, callback: callbackName, ...params, _: Date.now() });
      script.src = `${apiUrl}?${query.toString()}`;
      document.body.appendChild(script);
    });
  }

  function setConnection(state, text) {
    connectionStatus.className = `connection ${state}`;
    connectionStatus.innerHTML = `<span></span>${text}`;
  }

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast show${isError ? " error" : ""}`;
    window.setTimeout(() => { toast.className = "toast"; }, 3500);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function updatePreview() {
    const selected = products.find(item => item.name === product.value);
    if (!selected) {
      numberPreview.hidden = true;
      return;
    }
    nextNumber.textContent = selected.nextNumber || "—";
    numberPreview.hidden = false;
  }

  function renderProducts(items) {
    products = items;
    product.innerHTML = '<option value="">Select an edition</option>' + items.map(item =>
      `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`
    ).join("");
    product.disabled = false;
    submitButton.disabled = false;
  }

  function renderRecent(items) {
    if (!items.length) {
      recentOrders.innerHTML = '<p class="empty-state">No registrations yet.</p>';
      return;
    }
    recentOrders.innerHTML = items.map(item => `
      <article class="record">
        <div class="record-number">${escapeHtml(item.walletNumber)}</div>
        <div>
          <h3>${escapeHtml(item.product)}</h3>
          <p>${escapeHtml(item.customerName)}</p>
        </div>
        <div class="record-order">#${escapeHtml(item.orderNumber)}</div>
      </article>`).join("");
  }

  async function loadData() {
    setConnection("", "Connecting");
    product.disabled = true;
    submitButton.disabled = true;
    try {
      const [productResult, recentResult] = await Promise.all([
        jsonp("getProducts"),
        jsonp("getRecentOrders", { limit: 5 })
      ]);
      if (!productResult.ok) throw new Error(productResult.error || "Could not load products.");
      if (!recentResult.ok) throw new Error(recentResult.error || "Could not load recent orders.");
      renderProducts(productResult.products || []);
      renderRecent(recentResult.orders || []);
      setConnection("online", "Sheet connected");
    } catch (error) {
      setConnection("error", "Not connected");
      product.innerHTML = '<option value="">Connection required</option>';
      recentOrders.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
      showToast(error.message, true);
    }
  }

  product.addEventListener("change", updatePreview);
  refreshButton.addEventListener("click", loadData);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = {
      orderNumber: orderNumber.value.trim(),
      customerName: customerName.value.trim(),
      product: product.value
    };

    if (!values.orderNumber || !values.customerName || !values.product) {
      showToast("Complete all three fields.", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.firstElementChild.textContent = "Registering…";

    try {
      const result = await jsonp("addOrder", values);
      if (!result.ok) throw new Error(result.error || "The wallet could not be registered.");
      showToast(`${result.product} #${result.walletNumber} registered.`);
      form.reset();
      numberPreview.hidden = true;
      await loadData();
      orderNumber.focus();
    } catch (error) {
      showToast(error.message, true);
      submitButton.disabled = false;
    } finally {
      submitButton.firstElementChild.textContent = "Register wallet";
    }
  });

  if (!isConfigured) {
    setConnection("error", "Setup required");
    recentOrders.innerHTML = '<p class="empty-state">Paste your Apps Script URL into config.js.</p>';
    product.innerHTML = '<option value="">Setup required</option>';
  } else {
    loadData();
  }
})();
