import mongoose, { Schema, Document } from 'mongoose';
import { Round as IRound } from '../types';

const RoundSchema = new Schema({
  roundId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
    index: true,
  },
  startPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  endPrice: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'resolved'],
    default: 'active',
    index: true,
  },
  totalUpStake: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalDownStake: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalStakers: {
    type: Number,
    default: 0,
    min: 0,
  },
  upStakers: {
    type: Number,
    default: 0,
    min: 0,
  },
  downStakers: {
    type: Number,
    default: 0,
    min: 0,
  },
  winningDirection: {
    type: String,
    enum: ['up', 'down'],
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

RoundSchema.index({ status: 1, endTime: 1 });
RoundSchema.index({ roundId: -1 });

RoundSchema.virtual('totalStake').get(function(this: Document & IRound) {
  return this.totalUpStake + this.totalDownStake;
});

RoundSchema.virtual('upPercentage').get(function(this: Document & IRound) {
  const total = this.totalUpStake + this.totalDownStake;
  return total > 0 ? (this.totalUpStake / total) * 100 : 50;
});

RoundSchema.virtual('downPercentage').get(function(this: Document & IRound) {
  const total = this.totalUpStake + this.totalDownStake;
  return total > 0 ? (this.totalDownStake / total) * 100 : 50;
});

RoundSchema.set('toJSON', { virtuals: true });
RoundSchema.set('toObject', { virtuals: true });

export const RoundModel = mongoose.model<Document & IRound>('Round', RoundSchema);