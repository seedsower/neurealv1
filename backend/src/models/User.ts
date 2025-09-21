import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '../types';

const UserSchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  totalStaked: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalWinnings: {
    type: Number,
    default: 0,
    min: 0,
  },
  winStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxWinStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPredictions: {
    type: Number,
    default: 0,
    min: 0,
  },
  correctPredictions: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

UserSchema.index({ totalWinnings: -1 });
UserSchema.index({ winStreak: -1 });
UserSchema.index({ createdAt: -1 });

UserSchema.virtual('winRate').get(function(this: Document & IUser) {
  return this.totalPredictions > 0 ? (this.correctPredictions / this.totalPredictions) * 100 : 0;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export const UserModel = mongoose.model<Document & IUser>('User', UserSchema);