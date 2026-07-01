import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // Replace backgrounds
  // If it's a specific bg color without dark:, add it
  modified = modified.replace(/\bbg-white\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-white dark:bg-[#1a1d24]');
  modified = modified.replace(/\bbg-gray-50\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-gray-50 dark:bg-[#0f1115]');
  modified = modified.replace(/\bbg-zinc-50\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-zinc-50 dark:bg-[#0f1115]');
  modified = modified.replace(/\bbg-zinc-100\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-zinc-100 dark:bg-[#1a1d24]');
  modified = modified.replace(/\bbg-gray-100\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-gray-100 dark:bg-[#1a1d24]');
  modified = modified.replace(/\bbg-zinc-200\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-zinc-200 dark:bg-zinc-800');
  
  modified = modified.replace(/\bbg-[#fafafa]\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-[#fafafa] dark:bg-[#0f1115]');
  modified = modified.replace(/\bbg-[#f4f4f5]\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-[#f4f4f5] dark:bg-[#0f1115]');
  modified = modified.replace(/\bbg-[#f8f9fa]\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-[#f8f9fa] dark:bg-[#0f1115]');

  // Remove existing dark mode artifacts to avoid text-gray-900 text-white dark:text-white etc.
  
  if (content !== modified) {
    fs.writeFileSync(filePath, modified, 'utf8');
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src');
console.log('Deep dark mode update complete');
