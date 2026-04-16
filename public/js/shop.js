// Replace with your real Stripe publishable key
const stripe = Stripe("pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q");

const cart = {};
const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const closeCart = document.getElementById("closeCart");
const backdrop = document.getElementById("backdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const checkoutButton = document.getElementById("checkoutButton");
const bubblePopup = document.getElementById("bubblePopup");
const bubbleText = document.getElementById("bubbleText");

let bubbleTimeout = null;

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function showBubble(message) {
  bubbleText.textContent = message;
  bubblePopup.classList.add("show");
  clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    bubblePopup.classList.remove("show");
  }, 1600);
}

function openCart() {
  cartDrawer.classList.add("open");
  backdrop.classList.add("show");
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  backdrop.classList.remove("show");
}

function updateCartUI() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  Object.values(cart).forEach((item) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;
    count += item.qty;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item-main">
        <span>${item.name}</span>
        <div class="cart-item-qty">
          <button data-id="${item.id}" data-action="dec">−</button>
          <span>${item.qty}</span>
          <button data-id="${item.id}" data-action="inc">+</button>
        </div>
      </div>
      <div>
        <div>${formatPrice(lineTotal)}</div>
        <button data-id="${item.id}" data-action="remove">Remove</button>
      </div>
    `;

    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = formatPrice(total);
  cartCountEl.textContent = count;
}

function addToCartFromCard(cardEl) {
  const id = cardEl.dataset.id;
  const name = cardEl.dataset.name;
  const price = parseFloat(cardEl.dataset.price);

  if (!cart[id]) {
    cart[id] = { id, name, price, qty: 0 };
  }
  cart[id].qty += 1;

  updateCartUI();
  showBubble(`${name} added to cart`);
}

// Add to cart
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    addToCartFromCard(card);
  });
});

// Open/close cart
cartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
backdrop.addEventListener("click", closeCartDrawer);

// Cart item actions
cartItemsEl.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  if (!action || !id || !cart[id]) return;

  if (action === "inc") {
    cart[id].qty += 1;
  } else if (action === "dec") {
    cart[id].qty = Math.max(1, cart[id].qty - 1);
  } else if (action === "remove") {
    delete cart[id];
  }

  updateCartUI();
});

// Checkout ONLY on button click (no auto-popup)
checkoutButton.addEventListener("click", async () => {
  const items = Object.values(cart).map((item) => ({
    id: item.id,
    quantity: item.qty,
  }));

  if (!items.length) {
    showBubble("Your cart is empty");
    return;
  }

  try {
    const res = await fetch("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    if (!data.id) {
      console.error("No session id returned", data);
      showBubble("Checkout error");
      return;
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId: data.id,
    });

    if (error) {
      console.error(error);
      showBubble("Stripe error");
    }
  } catch (err) {
    console.error(err);
    showBubble("Network error");
  }
});
