import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  route: { type: String, required: true },
  driver: { type: String, required: true },
  capacity: { type: Number, default: 50 },
  lat: { type: Number, default: 28.6139 },
  lng: { type: Number, default: 77.2090 },
  status: { type: String, default: 'Active' },
  eta: { type: String, default: '' },
  internalId: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const Bus = mongoose.model('Bus', busSchema);
export default Bus;
