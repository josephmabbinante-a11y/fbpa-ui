// Example: Integrating Load Lifecycle FSM in Node/Express backend
import express from 'express';
import { transitionState, autoFallbackReauction, FSMException } from './loadLifecycleFSM';

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
// Example: Integrating Load Lifecycle FSM in Node/Express backend
import express from 'express';
import { transitionState, autoFallbackReauction, FSMException } from './loadLifecycleFSM';

const router = express.Router();

// Example in-memory store
const loads: Record<string, { id: string; state: string }> = {};

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
  const load = loads[id];
  if (!load) return res.status(404).json({ error: 'Load not found' });
  try {
    load.state = transitionState(load.state, event);
    res.json(load);
  } catch (err) {
    if (err instanceof FSMException) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal error' });
  }
});

// Auto-fallback re-auction endpoint
router.post('/load/:id/reauction', (req, res) => {
  const { id } = req.params;
  const load = loads[id];
  if (!load) return res.status(404).json({ error: 'Load not found' });
  try {
    load.state = autoFallbackReauction(load.state);
    res.json(load);
  } catch (err) {
    if (err instanceof FSMException) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
