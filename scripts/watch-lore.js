const fs = require('fs');
const path = require('path');
const { syncLore } = require('./sync-lore');

const LORE_SRC_DIR = 'C:\\Users\\ellul\\Documents\\decked-out\\lore';
const DEBOUNCE_MS = 2000;

console.log('\n========================================================');
console.log('  🌌 DECKED OUT — AUTOMATIC LORE SYNCHRONIZER');
console.log('========================================================');
console.log(`Watching directory for changes:`);
console.log(`📁 ${LORE_SRC_DIR}\n`);

if (!fs.existsSync(LORE_SRC_DIR)) {
  console.error(`[ERROR] Directory does not exist: ${LORE_SRC_DIR}`);
  process.exit(1);
}

// Perform an initial sync on launch to ensure everything is in sync
console.log('Running initial sync check...');
syncLore(true);

let debounceTimer = null;
let changedFiles = new Set();

try {
  const watcher = fs.watch(LORE_SRC_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Filter out temporary files (e.g. from editors like .tmp, ~$, etc.)
    if (filename.startsWith('.') || filename.endsWith('.tmp') || filename.endsWith('~')) {
      return;
    }

    changedFiles.add(filename);
    console.log(`[${new Date().toLocaleTimeString()}] 📝 File ${eventType}: ${filename}`);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}] ⚡ Changes settled in [${Array.from(changedFiles).join(', ')}]. Starting sync...`);
      changedFiles.clear();
      syncLore(true);
      console.log(`\n👀 Watching for further changes in ${LORE_SRC_DIR}...\n`);
    }, DEBOUNCE_MS);
  });

  console.log(`\n✅ Watcher is active! Whenever you save a file in:`);
  console.log(`   ${LORE_SRC_DIR}`);
  console.log(`The website will automatically update and deploy to GitHub Pages.`);
  console.log(`(Press Ctrl+C to stop the watcher)\n`);

  // Handle termination gracefully
  process.on('SIGINT', () => {
    console.log('\nStopping watcher. Goodbye!');
    watcher.close();
    process.exit(0);
  });
} catch (err) {
  console.error('[ERROR] Failed to start file watcher:', err.message);
}
