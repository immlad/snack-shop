// ====== STRIPE CONFIG ======
const STRIPE_PUBLISHABLE_KEY = "pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q";

// ====== STATE ======
let cart = [];
let stripe;
let elements;
let cardElement;

// ====== DOM ======
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const drawerClose = document.getElementById("drawerClose");
const backdrop = document.getElementById("backdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const payButton = document.getElementById("payButton");
const cardErrors = document.getElementById("card-errors");

// ====== INIT STRIPE ======
function initStripe() {
  stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  elements = stripe.elements();
  cardElement = elements.create("card");
  cardElement.mount("#card-element");
}

// ====== CART ======
function addToCart(id, name, price) {
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.quantity++;
  else cart.push({ id, name, price, quantity: 1 });
  renderCart();
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <div>${item.name} — $${item.price} × ${item.quantity}</div>
    `;
    cartItemsEl.appendChild(row);

    total += item.price * item.quantity;
    count += item.quantity;
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartCountEl.textContent = count;
}

// ====== OPEN/CLOSE DRAWER ======
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

// ====== ADD TO CART BUTTONS ======
document.querySelectorAll(".card").forEach((card) => {
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = parseFloat(card.dataset.price);

  card.querySelector(".add-to-cart").addEventListener("click", () => {
    addToCart(id, name, price);
  });
});

// ====== PAYMENT ======
payButton.addEventListener("click", async () => {
  cardErrors.textContent = "";

  if (!cart.length) {
    cardErrors.textContent = "Your cart is empty.";
    return;
  }

  payButton.disabled = true;
  payButton.textContent = "Processing...";

  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart }),
  });

  const data = await res.json();
  const clientSecret = data.clientSecret;

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement },
  });

  if (result.error) {
    cardErrors.textContent = result.error.message;
    payButton.disabled = false;
    payButton.textContent = "Pay with card";
    return;
  }

  payButton.textContent = "Paid!";
});

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  initStripe();
  renderCart();
});