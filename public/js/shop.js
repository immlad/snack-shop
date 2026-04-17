// ====== CONFIG ======
const STRIPE_PUBLISHABLE_KEY = "pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q"; // <-- REPLACE with your real pk_ key

// ====== STATE ======
let cart = [];
let stripe;
let elements;
let cardElement;

// ====== DOM ELEMENTS ======
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const backdrop = document.getElementById("backdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const bubblePopup = document.getElementById("bubblePopup");
const bubbleText = document.getElementById("bubbleText");
const payButton = document.getElementById("payButton");
const cardErrors = document.getElementById("card-errors");

// ====== INIT STRIPE ELEMENTS ======
function initStripe() {
  stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  elements = stripe.elements();
  cardElement = elements.create("card", {
    style: {
      base: {
        fontSize: "16px",
        color: "#333",
        "::placeholder": { color: "#999" },
      },
    },
  });
  cardElement.mount("#card-element");
}

// ====== CART LOGIC ======
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
      <div class="cart-item-main">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          $${item.price.toFixed(2)} × ${item.quantity}
        </div>
      </div>
      <div class="cart-item-total">
        $${itemTotal.toFixed(2)}
      </div>
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

// ====== SIDE CART OPEN/CLOSE ======
cartButton.addEventListener("click", () => {
  cartDrawer.classList.add("open");
  backdrop.style.display = "block";
});

closeCart.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  backdrop.style.display = "none";
});

backdrop.addEventListener("click", () => {
  cartDrawer.classList.remove("open");
  backdrop.style.display = "none";
});

// ====== ADD-TO-CART BUTTONS ======
document.querySelectorAll(".card").forEach((card) => {
  const id = card.getAttribute("data-id");
  const name = card.getAttribute("data-name");
  const price = parseFloat(card.getAttribute("data-price"));

  const button = card.querySelector(".add-to-cart");
  button.addEventListener("click", () => {
    addToCart(id, name, price);
  });
});

// ====== STRIPE PAYMENT FLOW (ELEMENTS) ======
payButton.addEventListener("click", async () => {
  cardErrors.textContent = "";

  if (!cart.length) {
    cardErrors.textContent = "Your cart is empty.";
    return;
  }

  payButton.disabled = true;
  payButton.textContent = "Processing...";

  try {
    // Call backend to create PaymentIntent
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Payment failed");
    }

    const clientSecret = data.clientSecret;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (result.error) {
      cardErrors.textContent = result.error.message || "Payment failed.";
      payButton.disabled = false;
      payButton.textContent = "Pay with card";
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      // Clear cart
      cart = [];
      renderCart();
      cardErrors.textContent = "Payment successful! 🎉";
      payButton.textContent = "Paid";
      payButton.disabled = true;
    }
  } catch (err) {
    console.error(err);
    cardErrors.textContent = err.message || "Something went wrong.";
    payButton.disabled = false;
    payButton.textContent = "Pay with card";
  }
});

// ====== ON LOAD ======
document.addEventListener("DOMContentLoaded", () => {
  initStripe();
  renderCart();
});