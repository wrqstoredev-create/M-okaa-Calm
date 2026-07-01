import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;

  // We find 'bg-white' and maybe a following 'dark:bg-xxx', then replace it with 'bg-white dark:bg-[#1a1d24]'
  // We use word boundaries \b.
  // Wait, the regex `\bbg-white\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?` will match "bg-white" and optionally " dark:bg-zinc-900".
  
  modified = modified.replace(/\bbg-white\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-white dark:bg-[#1a1d24]');
  modified = modified.replace(/\bbg-gray-50\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-gray-50 dark:bg-gray-800');
  modified = modified.replace(/\bbg-gray-100\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-gray-100 dark:bg-gray-700');
  modified = modified.replace(/\bbg-zinc-50\b(?:\s+dark:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'bg-zinc-50 dark:bg-gray-800');

  modified = modified.replace(/\btext-gray-950\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-950 dark:text-white');
  modified = modified.replace(/\btext-gray-900\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-900 dark:text-gray-200');
  modified = modified.replace(/\btext-zinc-900\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-zinc-900 dark:text-gray-200');
  modified = modified.replace(/\btext-gray-800\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-800 dark:text-gray-200');
  modified = modified.replace(/\btext-gray-700\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-700 dark:text-gray-300');
  modified = modified.replace(/\btext-gray-600\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-600 dark:text-gray-400');
  modified = modified.replace(/\btext-gray-500\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-gray-500 dark:text-gray-400');
  modified = modified.replace(/\btext-black\b(?:\s+dark:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'text-black dark:text-white');

  modified = modified.replace(/\bborder-gray-100\b(?:\s+dark:border-[a-zA-Z0-9#\-\[\]]+)?/g, 'border-gray-100 dark:border-gray-700');
  modified = modified.replace(/\bborder-gray-200\b(?:\s+dark:border-[a-zA-Z0-9#\-\[\]]+)?/g, 'border-gray-200 dark:border-gray-700');
  modified = modified.replace(/\bborder-gray-300\b(?:\s+dark:border-[a-zA-Z0-9#\-\[\]]+)?/g, 'border-gray-300 dark:border-gray-600');

  modified = modified.replace(/\bhover:bg-gray-50\b(?:\s+dark:hover:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'hover:bg-gray-50 dark:hover:bg-gray-700');
  modified = modified.replace(/\bhover:bg-gray-100\b(?:\s+dark:hover:bg-[a-zA-Z0-9#\-\[\]]+)?/g, 'hover:bg-gray-100 dark:hover:bg-gray-600');
  modified = modified.replace(/\bhover:text-gray-900\b(?:\s+dark:hover:text-[a-zA-Z0-9#\-\[\]]+)?/g, 'hover:text-gray-900 dark:hover:text-white');

  // Specific for backgrounds that are `bg-white` but are not changing? Like inputs:
  modified = modified.replace(/\bplaceholder-gray-400\b(?:\s+dark:placeholder-[a-zA-Z0-9#\-\[\]]+)?/g, 'placeholder-gray-400 dark:placeholder-gray-500');
  modified = modified.replace(/\bplaceholder-gray-500\b(?:\s+dark:placeholder-[a-zA-Z0-9#\-\[\]]+)?/g, 'placeholder-gray-500 dark:placeholder-gray-400');

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
