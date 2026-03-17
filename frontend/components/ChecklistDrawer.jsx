import React from 'react';

export default function ChecklistDrawer({ checkpoints }) {
  // TODO: Render checklist of workflow steps
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <h4>Workflow Checklist</h4>
      <pre>{JSON.stringify(checkpoints, null, 2)}</pre>
    </div>
  );
}
