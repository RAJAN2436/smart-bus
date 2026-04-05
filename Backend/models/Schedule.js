import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  bus: { type: String, required: true },
  route: { type: String, required: true },
  departure: { type: String, required: true },
  arrival: { type: String, required: true },
  status: { type: String, default: 'Confirmed' }
}, { timestamps: true });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
