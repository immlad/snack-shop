import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const items = req.body.items || [];

    const PRICE_MAP = {
      chips: "price_123",
      gummies: "price_456",
      cookies: "price_789",
    };

    const line_items = items.map((item) => ({
      price: PRICE_MAP[item.id],
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}