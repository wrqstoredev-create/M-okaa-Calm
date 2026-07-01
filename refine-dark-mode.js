import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // The custom dark text colors might be gray-200. Let's make it text-white as requested for text-black/gray-950/gray-900.
  modified = modified.replace(/dark:text-gray-200/g, 'dark:text-white');
  modified = modified.replace(/dark:bg-\[#1a1d24\]/g, 'dark:bg-gray-800');
  
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
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src');
console.log('Update complete');
