import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Use Google DNS
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://smartbus:Rajan#7452@cluster0.vd2ruyc.mongodb.net/?appName=Cluster0';

const userSchema = new mongoose.Schema({
  status: { type: String, default: 'Active' }
});

const User = mongoose.model('User', userSchema);

async function updateUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany({ status: 'Pending' }, { status: 'Active' });
    console.log(`Successfully updated ${result.modifiedCount} users to 'Active'.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

updateUsers();
