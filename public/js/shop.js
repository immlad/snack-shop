// Stripe key
const stripe = Stripe("pk_test_51TKoZeRnU7ZNOlrMW7uwp2xMnmnY6jlLvbkfMHe2SjmrlA7fv8bSPWCwewsrvOKWJOIgWLcEl9CdcAhfJ4MaEh3l00uFsqyZ0Q");

// Cart state
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

function showBubble(msg) {
  bubbleText.textContent = msg;
  bubblePopup.classList.add("show");
  clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    bubblePopup.classList.remove("show");
  }, 1500);
}

function openCart() {
  cartDrawer.classList.add("open");
  backdrop.classList.add("show");
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  backdrop.classList.remove("show");
}

// Prevent closing when clicking inside
cartDrawer.addEventListener("click", (e) => e.stopPropagation());

// Clicking outside closes it
backdrop.addEventListener("click", closeCartDrawer);

// Add to cart
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    if (!cart[id]) cart[id] = { id, name, price, qty: 0 };
    cart[id].qty++;

    updateCartUI();
    showBubble(`${name} added to cart`);
  });
});

// Update UI
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
        <div>$${lineTotal.toFixed(2)}</div>
        <button data-id="${item.id}" data-action="remove">Remove</button>
      </div>
    `;

    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  cartCountEl.textContent = count;
}

// Fix button actions inside cart
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (!action || !id || !cart[id]) return;

  if (action === "inc") cart[id].qty++;
  if (action === "dec") cart[id].qty = Math.max(1, cart[id].qty - 1);
  if (action === "remove") delete cart[id];

  updateCartUI();
});

// Checkout
checkoutButton.addEventListener("click", async () => {
  const items = Object.values(cart).map((item) => ({
    id: item.id,
    quantity: item.qty,
  }));

  if (!items.length) {
    showBubble("Your cart is empty");
    return;
  }

  const res = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (data.id) {
    stripe.redirectToCheckout({ sessionId: data.id });
  }
});
