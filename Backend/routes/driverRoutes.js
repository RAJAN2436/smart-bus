import express from 'express';
import Driver from '../models/Driver.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Driver.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Driver.findOne({ id: req.params.id });
    if (item) res.json(item);
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newItem = await Driver.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Driver.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (updated) res.json(updated);
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Driver.findOneAndDelete({ id: req.params.id });
    if (deleted) res.json({ success: true });
    else res.status(404).json({ error: "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
