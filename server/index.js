// Entry point for the fbpa-server workspace.
// This imports/executes the actual Express server at ./server/index.js (server/server/index.js).
// The nested path exists because the original server/ folder was moved into server/server/
// during the monorepo restructure; the outer server/ is the workspace root.
import './server/index.js';
