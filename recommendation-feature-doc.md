# E-Commerce Recommendation Feature Documentation

## Overview
This document describes the backend recommendation feature for the Client-Backend Node.js/Express/MongoDB e-commerce platform. It covers how user and guest interactions are tracked, how recommendations are generated, and how the system integrates with the rest of the backend.

---


## 1. Interaction Tracking
- All product interactions (view, purchase, cart, rating) are recorded in the `Interaction` collection.
- Each interaction includes: `userId` (for logged-in users), `productId`, `type`, and `timestamp`. For guests, only `productId`, `type`, and `timestamp` are set; the unique `_id` (interactionId) is returned to the frontend.
- Deduplication logic prevents rapid repeated interactions (DoS/spam protection).
- For guests, store the returned `interactionId` in localStorage. If the user interacts from multiple devices, each device will have its own interactionId(s).
- When the user logs in, collect all interactionIds from all devices (e.g., via backend sync or user input) and associate them with the userId. This allows merging all guest interactions into the user's history for unified recommendations.

**Example Schema:**
```js
const InteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional for guests
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  type: { type: String, enum: ["view", "purchase", "cart", "rating"] },
  timestamp: { type: Date, default: Date.now },
});
```

---


## 2. Recommendation API
- Endpoint: `GET /api/recommendations?userId=...` or `?interactionId=...` or `?interactionIds=...` (comma-separated)
- For logged-in users, uses both content-based and collaborative filtering.
- For guests, uses only content-based filtering.
- If a user logs in after interacting as a guest on multiple devices, send all relevant `interactionIds` to the backend to merge their histories for recommendations.

**Example Controller:**
```js
export const getRecommendations = async (req, res, next) => {
  const { userId, interactionId, interactionIds } = req.query;
  let interactions = [];
  if (userId) {
    interactions = await Interaction.find({ userId });
  } else if (interactionId) {
    const interaction = await Interaction.findById(interactionId);
    if (interaction) interactions = [interaction];
  } else if (interactionIds) {
    const ids = interactionIds.split(',');
    interactions = await Interaction.find({ _id: { $in: ids } });
  } else {
    return res.status(400).json({ error: "No user or interaction ID(s) provided" });
  }

  const interactedProductIds = interactions.map(i => i.productId);
  const interactedProducts = await Product.find({ _id: { $in: interactedProductIds } });
  const categories = [...new Set(interactedProducts.map(p => p.category))];
  let recommended = await Product.find({
    category: { $in: categories },
    _id: { $nin: interactedProductIds },
  }).limit(10);

  if (userId) {
    const similarUsers = await Interaction.find({
      productId: { $in: interactedProductIds },
      userId: { $ne: userId },
    }).distinct("userId");
    const collaborativeInteractions = await Interaction.find({
      userId: { $in: similarUsers },
      productId: { $nin: interactedProductIds },
    });
    const collaborativeProductIds = [...new Set(collaborativeInteractions.map(i => i.productId.toString()))];
    const collaborativeProducts = await Product.find({ _id: { $in: collaborativeProductIds } }).limit(10);
    const allRecommended = [
      ...recommended,
      ...collaborativeProducts.filter(p => !recommended.some(r => r._id.toString() === p._id.toString())),
    ];
    recommended = allRecommended.slice(0, 10);
  }
  res.json({ recommended });
};
```

---

## 3. Data Flow Diagram
```
[User/Guest]
    |
    | 1. Interacts with Product (view, cart, purchase, rating)
    v
[Frontend]
    |
    | 2. Sends POST /api/interactions
    v
[Backend]
    |
    | 3. Stores Interaction
    v
[Recommendation Engine]
    |
    | 4. Reads Interactions
    v
[Generates Recommendations]
    |
    | 5. Returns to Frontend
    v
[User/Guest Sees Recommendations]
```

---

## 4. Guest vs. Logged-In User Handling

| User Type   | Tracking Method         | Recommendation Logic         | ID Used      |
|-------------|------------------------|-----------------------------|--------------|
| Logged-in   | DB (userId)            | Hybrid (content + collab)   | userId       |
| Guest       | localStorage (interactionId(s)) | Content-based only          | interactionId(s) |
| Merged User | DB (userId) + all guest interactionIds | Hybrid (all interactions merged) | userId + interactionIds |

---

## 5. Best Practices
- Deduplication: Prevent rapid repeated interactions to avoid spam.
- Rate Limiting: Use middleware to limit requests per IP/user.
- Security: Validate all incoming data.
- Extensibility: Modularize recommendation logic for future upgrades.

---

## 6. Summary
- The recommendation feature uses interaction data to suggest products.
- It supports both logged-in and guest users.
- Recommendations are generated using content-based and collaborative filtering.
- The data flow is simple and robust.
