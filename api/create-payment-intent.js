const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const items = req.body.items || [];

    const PRICE_MAP = {
      "mini-takis": 100,
      arizona: 200,
      needoh: 1000,
    };

    let amount = 0;
    items.forEach((item) => {
      amount += PRICE_MAP[item.id] * item.quantity;
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};