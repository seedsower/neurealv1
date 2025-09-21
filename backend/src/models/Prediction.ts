import mongoose, { Schema, Document } from 'mongoose';
import { Prediction as IPrediction } from '../types';

const PredictionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roundId: {
    type: Number,
    required: true,
    index: true,
  },
  direction: {
    type: String,
    enum: ['up', 'down'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 100, // Minimum 100 NEURAL tokens
    max: 100000, // Maximum 100k NEURAL tokens
  },
  amountUSD: {
    type: Number,
    required: true,
    min: 0,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  blockNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'claimable', 'claimed', 'lost'],
    default: 'pending',
    index: true,
  },
  winningAmount: {
    type: Number,
    min: 0,
  },
  claimTxHash: {
    type: String,
  },
  emergencyWithdrawn: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

PredictionSchema.index({ userId: 1, roundId: 1 });
PredictionSchema.index({ status: 1, createdAt: -1 });
PredictionSchema.index({ roundId: 1, direction: 1 });

export const PredictionModel = mongoose.model<Document & IPrediction>('Prediction', PredictionSchema);