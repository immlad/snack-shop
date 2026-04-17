const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY env var");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const items = req.body.items || [];

    // Prices in cents
    const PRICE_MAP = {
      "mini-takis": 100, // $1.00
      arizona: 200,      // $2.00
      needoh: 1000,      // $10.00
    };

    let amount = 0;

    items.forEach((item) => {
      const unit = PRICE_MAP[item.id];
      if (!unit) {
        throw new Error(`No price mapping for item id: ${item.id}`);
      }
      amount += unit * item.quantity;
    });

    if (amount <= 0) {
      return res.status(400).json({ error: "Cart is empty or invalid." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error in create-payment-intent:", err);
    return res.status(500).json({ error: "Server error" });
  }
};