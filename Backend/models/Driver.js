import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  license: { type: String, required: true },
  bus: { type: String, required: true },
  status: { type: String, default: 'Online' },
  internalId: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
