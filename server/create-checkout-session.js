import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Map product IDs to Stripe price IDs
const PRICE_MAP = {
  chips: "price_123",
  gummies: "price_456",
  cookies: "price_789",
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    const items = req.body.items || [];

    const line_items = items.map((item) => ({
      price: PRICE_MAP[item.id],
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to create session" });
  }
});

export default app;