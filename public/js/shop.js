// Stripe publishable key (real)
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q";

let cart = [];
let stripe;
let elements;
let cardElement;

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

function addToCart(id, name, price) {
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

function showBubble(message) {
  bubbleText.textContent = message;
  bubblePopup.classList.add("show");
  setTimeout(() => {
    bubblePopup.classList.remove("show");
  }, 1200);
}

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

document.querySelectorAll(".card").forEach((card) => {
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = parseFloat(card.dataset.price);

  const button = card.querySelector(".add-to-cart");
  button.addEventListener("click", () => addToCart(id, name, price));
});

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

document.addEventListener("DOMContentLoaded", () => {
  initStripe();
  renderCart();
});