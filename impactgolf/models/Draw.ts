import mongoose, { Schema, Document, Model } from "mongoose";

// PRD §06–07: Draw types, prize pool logic, jackpot rollover
export interface IDrawWinner {
  userId: mongoose.Types.ObjectId;
  matchType: "five" | "four" | "three";
  prizeAmountPence: number;
  verificationStatus: "pending" | "approved" | "rejected";
  proofUrl?: string;
  paidAt?: Date;
}

export interface IDraw extends Document {
  _id: mongoose.Types.ObjectId;
  // e.g. "2024-03" — one draw per calendar month
  period: string;
  status: "pending" | "running" | "completed" | "cancelled";
  drawMode: "random" | "algorithmic";

  // Prize pool breakdown (all in pence)
  totalPoolPence: number;
  jackpotPoolPence: number;   // 40% — rolls over if no 5-match
  fourMatchPoolPence: number; // 35%
  threeMatchPoolPence: number;// 25%
  charityPoolPence: number;   // total allocated to charities this period
  jackpotRolledOverPence: number; // carried in from previous month

  // Draw numbers drawn (the 5 numbers used in the draw)
  drawnNumbers: number[];

  // Winners (may be multiple per tier — split equally)
  winners: IDrawWinner[];

  eligibleSubscriberCount: number;
  runAt?: Date;
  publishedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId; // admin ref
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DrawWinnerSchema = new Schema<IDrawWinner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    matchType: { type: String, enum: ["five", "four", "three"], required: true },
    prizeAmountPence: { type: Number, required: true, min: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    proofUrl: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const DrawSchema = new Schema<IDraw>(
  {
    period: { type: String, required: true, unique: true }, // "YYYY-MM"
    status: {
      type: String,
      enum: ["pending", "running", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    drawMode: { type: String, enum: ["random", "algorithmic"], default: "random" },

    totalPoolPence: { type: Number, default: 0, min: 0 },
    jackpotPoolPence: { type: Number, default: 0, min: 0 },
    fourMatchPoolPence: { type: Number, default: 0, min: 0 },
    threeMatchPoolPence: { type: Number, default: 0, min: 0 },
    charityPoolPence: { type: Number, default: 0, min: 0 },
    jackpotRolledOverPence: { type: Number, default: 0, min: 0 },

    drawnNumbers: { type: [Number], default: [] },
    winners: { type: [DrawWinnerSchema], default: [] },

    eligibleSubscriberCount: { type: Number, default: 0 },
    runAt: { type: Date },
    publishedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

const Draw: Model<IDraw> =
  mongoose.models.Draw || mongoose.model<IDraw>("Draw", DrawSchema);

export default Draw;
