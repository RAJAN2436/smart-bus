import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  start: { type: String, required: true },
  dest: { type: String, required: true },
  stops: { type: Number, required: true },
  distance: { type: String, required: true },
  time: { type: String, required: true },
  stopNames: [{ type: String }],
  schedule: [{ type: String }],
  startLat: { type: Number, default: 28.6139 },
  startLng: { type: Number, default: 77.2090 },
  destLat: { type: Number, default: 28.7041 },
  destLng: { type: Number, default: 77.1025 },
  internalId: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const Route = mongoose.model('Route', routeSchema);
export default Route;
