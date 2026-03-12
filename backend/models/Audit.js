import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    resource: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Audit", auditSchema);
