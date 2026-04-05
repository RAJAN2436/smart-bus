import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bus: { type: String, required: true },
  driver: { type: String, required: true },
  route: { type: String, required: true },
  start: { type: String, required: true },
  status: { type: String, default: 'Active' },
  progress: { type: Number, default: 0 },
  internalId: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
