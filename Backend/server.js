/* global process */
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes.js';
import busRoutes from './routes/busRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';

import { Bus } from './models/Bus.js';
import { Driver } from './models/Driver.js';
import { User } from './models/User.js';
import { Route } from './models/Route.js';
import { Trip } from './models/Trip.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Use Google DNS

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// We mount the routes at the same path the frontend expects
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/schedules', scheduleRoutes);

// Special case for stats

app.get('/api/stats', async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'Active' });

    res.json({
      totalBuses,
      totalDrivers,
      totalUsers,
      activeBuses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount basic health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// One-time Seed Function
const seedDatabase = async () => {
  try {
    const busCount = await Bus.countDocuments();
    if (busCount === 0 && fs.existsSync(dbPath)) {
      console.log('Database empty, seeding from db.json...');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

      if (db.buses?.length > 0) await Bus.insertMany(db.buses);
      if (db.drivers?.length > 0) await Driver.insertMany(db.drivers);
      if (db.routes?.length > 0) await Route.insertMany(db.routes);
      if (db.users?.length > 0) await User.insertMany(db.users);
      if (db.trips?.length > 0) await Trip.insertMany(db.trips);
      if (db.schedules?.length > 0) Object.keys(import('./models/Schedule.js')).then(() => import('./models/Schedule.js').then(m => m.Schedule.insertMany(db.schedules).catch(() => { })));

      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://smartbus:Rajan123@cluster0.vd2ruyc.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    seedDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
