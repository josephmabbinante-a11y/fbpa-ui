import express from "express";
import Audit from "../models/Audit.js";
import { auditValidators, validate } from "../middleware/validators.js";

const router = express.Router();

// GET all audits
router.get("/", async (req, res) => {
  try {
    const audits = await Audit.find();
    res.json({ audits, count: audits.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET audit by ID
router.get("/:id", async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ error: "Audit not found" });
    }
    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Create new audit log
router.post("/", auditValidators, validate, async (req, res) => {
  try {
    const { userId, action, resource, details } = req.body;

    const newAudit = new Audit({
      userId,
      action,
      resource,
      details: details || {},
      timestamp: new Date()
    });

    await newAudit.save();
    res.status(201).json(newAudit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update audit
router.put("/:id", auditValidators, validate, async (req, res) => {
  try {
    const { userId, action, resource, details } = req.body;

    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      { userId, action, resource, details },
      { new: true, runValidators: true }
    );

    if (!audit) {
      return res.status(404).json({ error: "Audit not found" });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Remove audit
router.delete("/:id", async (req, res) => {
  try {
    const audit = await Audit.findByIdAndDelete(req.params.id);

    if (!audit) {
      return res.status(404).json({ error: "Audit not found" });
    }

    res.json({ message: "Audit deleted", deletedAudit: audit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
