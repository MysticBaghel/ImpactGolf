import mongoose, { Schema, Document, Model } from "mongoose";

// Mirrors Stripe subscription events — source of truth for billing history
export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: "monthly" | "annual";
  status: "active" | "inactive" | "cancelled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  // Price in pence (used for prize pool & charity calculations)
  amountPence: number;
  currency: string; // e.g. "gbp"
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    plan: { type: String, enum: ["monthly", "annual"], required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "cancelled", "past_due"],
      default: "active",
      index: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelledAt: { type: Date },
    amountPence: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "gbp" },
  },
  { timestamps: true }
);

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
