import express from 'express';
import Trip from '../models/Trip.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Trip.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newItem = await Trip.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Trip.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (updated) res.json(updated);
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Trip.findOneAndDelete({ id: req.params.id });
    if (deleted) res.json({ success: true });
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
