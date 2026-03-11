// Example: Integrating Load Lifecycle FSM in Node/Express backend
import express from 'express';
import { transitionState, autoFallbackReauction, FSMException } from './loadLifecycleFSM.js';

const router = express.Router();

// Example in-memory store
const loads = {};

// Create a new load
router.post('/load', (req, res) => {
  const id = Date.now().toString();
  loads[id] = { id, state: 'CREATED' };
  res.json(loads[id]);
});

// Transition load state
router.post('/load/:id/transition', (req, res) => {
  const { id } = req.params;
  const { event } = req.body;
  try {
    if (!loads[id]) throw new FSMException('Load not found');
    loads[id].state = transitionState(loads[id].state, event);
    res.json(loads[id]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fallback reauction
router.post('/load/:id/reauction', (req, res) => {
  const { id } = req.params;
  try {
    if (!loads[id]) throw new FSMException('Load not found');
    loads[id].state = autoFallbackReauction(loads[id].state);
    res.json(loads[id]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
