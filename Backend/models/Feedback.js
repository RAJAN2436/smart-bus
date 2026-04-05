import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  type: { type: String, enum: ['Delay', 'Tracking Issue', 'App Bug', 'General Feedback', 'Other'], default: 'General Feedback' },
  message: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' },
  internalId: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
