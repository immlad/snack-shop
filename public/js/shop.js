// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q";

// State
let cart = [];
let stock = {
  "mini-takis": 10,
  arizona: 10,
  needoh: 10,
};

let stripe;
let elements;
let cardElement;

// DOM
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const drawerClose = document.getElementById("drawerClose");
const backdrop = document.getElementById("backdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const bubblePopup = document.getElementById("bubblePopup");
const bubbleText = document.getElementById("bubbleText");
const payButton = document.getElementById("payButton");
const cardErrors = document.getElementById("card-errors");
const adminPanel = document.getElementById("adminPanel");
const adminToggle = document.getElementById("adminToggle");

// Stripe init
function initStripe() {
  stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  elements = stripe.elements();
  cardElement = elements.create("card", {
    style: {
      base: {
        fontSize: "16px",
        color: "#111827",
        "::placeholder": { color: "#9ca3af" },
      },
    },
  });
  cardElement.mount("#card-element");
}

// Cart
function addToCart(id, name, price) {
  if (stock[id] <= 0) {
    showBubble(`${name} is out of stock`);
    return;
  }

  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  renderCart();
  showBubble(`${name} added to cart`);
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item-row";
    row.innerHTML = `
      <div>
        <div>${item.name}</div>
        <div class="cart-item-meta">$${item.price.toFixed(2)} × ${item.quantity}</div>
      </div>
      <div>$${itemTotal.toFixed(2)}</div>
    `;
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartCountEl.textContent = count;
}

// Bubble
function showBubble(message) {
  bubbleText.textContent = message;
  bubblePopup.classList.add("show");
  setTimeout(() => {
    bubblePopup.classList.remove("show");
  }, 1200);
}

// Drawer
cartButton.addEventListener("click", () => {
  cartDrawer.classList.add("open");
  backdrop.style.display = "block";
});

drawerClose.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  backdrop.style.display = "none";
});

backdrop.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  backdrop.style.display = "none";
});

// Products
document.querySelectorAll(".product-card").forEach((card) => {
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = parseFloat(card.dataset.price);
  const button = card.querySelector(".add-to-cart");

  button.addEventListener("click", () => addToCart(id, name, price));
});

// Stock UI
function updateStockUI() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = card.dataset.id;
    const label = card.querySelector("[data-stock-label]");
    const button = card.querySelector(".add-to-cart");
    const qty = stock[id] ?? 0;

    if (qty > 0) {
      label.textContent = `In stock: ${qty}`;
      button.disabled = false;
    } else {
      label.textContent = "Out of stock";
      button.disabled = true;
    }
  });

  // Sync admin inputs
  const miniInput = document.getElementById("stock-mini-takis");
  const ariInput = document.getElementById("stock-arizona");
  const needohInput = document.getElementById("stock-needoh");
  if (miniInput) miniInput.value = stock["mini-takis"];
  if (ariInput) ariInput.value = stock["arizona"];
  if (needohInput) needohInput.value = stock["needoh"];
}

// Admin panel
adminToggle.addEventListener("click", () => {
  const isHidden = adminPanel.style.display === "none" || !adminPanel.style.display;
  adminPanel.style.display = isHidden ? "block" : "none";
});

document.querySelectorAll("[data-update-stock]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const row = btn.closest(".admin-row");
    const id = row.dataset.id;
    const input = row.querySelector(".admin-input");
    const value = parseInt(input.value, 10);

    if (!Number.isNaN(value) && value >= 0) {
      stock[id] = value;
      updateStockUI();
    }
  });
});

// Payment
payButton.addEventListener("click", async () => {
  cardErrors.textContent = "";

  if (!cart.length) {
    cardErrors.textContent = "Your cart is empty.";
    return;
  }

  payButton.disabled = true;
  payButton.textContent = "Processing...";

  try {
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });

    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || "Unable to start payment.");
    }

    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: { card: cardElement },
    });

    if (result.error) {
      cardErrors.textContent = result.error.message || "Payment failed.";
      payButton.disabled = false;
      payButton.textContent = "Pay with card";
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      cardErrors.textContent = "Payment successful!";
      cart = [];
      renderCart();
      payButton.textContent = "Paid";
      payButton.disabled = true;
    }
  } catch (err) {
    cardErrors.textContent = err.message || "Something went wrong.";
    payButton.disabled = false;
    payButton.textContent = "Pay with card";
  }
});

// Init
document.addEventListener("DOMContentLoaded", () => {
  initStripe();
  updateStockUI();
  renderCart();
  adminPanel.style.display = "none";
});