const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY env var");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const items = req.body.items || [];

    // FINAL PRICE MAP — using your real Stripe price IDs
    const PRICE_MAP = {
      "mini-takis": "price_1TNI9SRnU7ZNOlrMi3FsVXxW", // $1.00
      arizona: "price_1TNI9uRnU7ZNOlrMzaeCd8AH",      // $2.00
      needoh: "price_1TNI9iRnU7ZNOlrM4npQRx0j",        // $10.00
    };

    const line_items = items.map((item) => {
      const priceId = PRICE_MAP[item.id];

      if (!priceId) {
        throw new Error(`No price mapping for item id: ${item.id}`);
      }

      return {
        price: priceId,
        quantity: item.quantity,
      };
    });

    if (!line_items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Stripe error in create-checkout-session:", err);
    return res.status(500).json({ error: "Server error" });
  }
};