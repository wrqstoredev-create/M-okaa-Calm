import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content.replace(/dark:bg-\[#0f1115\] dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-zinc-800 dark:bg-zinc-800/g, 'dark:hover:bg-zinc-800');
  
  if (content !== modified) {
    fs.writeFileSync(filePath, modified, 'utf8');
  }
}

['src/pages/Login.tsx', 'src/pages/Home.tsx', 'src/pages/Store.tsx'].forEach(replaceInFile);
