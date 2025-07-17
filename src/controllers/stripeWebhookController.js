import Order from "../models/Order/OrderSchema.js";
import Product from "../models/Product/ProductSchema.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook verification failed:", error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💰 Payment succeeded. Metadata:", session.metadata);

    const cart = JSON.parse(session.metadata.cart || "[]");
    const userId = session.metadata.userId || null;
    const guestId = session.metadata.guestId || null;
    const guestInfo = JSON.parse(session.metadata.guestInfo || "{}");
    try {
      let totalAmount = 0;
      const orderItems = [];

      // 3. IMPROVED: Product validation
      for (const item of cart) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          console.error(`❌ Product not found with ID: ${item.product_id}`);
          continue;
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      await Order.create({
        items: orderItems,
        totalAmount,
        payment: {
          method: "Stripe",
          status: "Paid",
          transitionId: session.payment_intent,
        },
        buyer: userId || null,
        guestId: guestId || null,
        guestInfo: guestInfo || null,
        orderStatus: "Order Placed",
      });

      console.log("🎉 Order created successfully:", newOrder);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Order processing failed:", error);
      return res.status(500).json({
        error: "Failed to process order",
      });
    }
  }

  return res.status(200).json({ received: true });
};
