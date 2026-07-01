import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will intelligently add dark mode classes if they don't exist yet
      
      const replacements = [
        { regex: /bg-white/g, add: 'dark:bg-zinc-900' },
        { regex: /bg-gray-50/g, add: 'dark:bg-zinc-800' },
        { regex: /bg-zinc-50/g, add: 'dark:bg-zinc-800' },
        
        { regex: /border-gray-100/g, add: 'dark:border-zinc-800' },
        { regex: /border-gray-200/g, add: 'dark:border-zinc-700' },
        { regex: /border-gray-300/g, add: 'dark:border-zinc-600' },
        
        { regex: /text-gray-950/g, add: 'dark:text-zinc-50' },
        { regex: /text-gray-900/g, add: 'dark:text-zinc-100' },
        { regex: /text-gray-800/g, add: 'dark:text-zinc-200' },
        { regex: /text-gray-700/g, add: 'dark:text-zinc-300' },
        { regex: /text-gray-600/g, add: 'dark:text-zinc-400' },
        { regex: /text-gray-500/g, add: 'dark:text-zinc-400' },
        
        { regex: /hover:bg-gray-50/g, add: 'dark:hover:bg-zinc-800' },
        { regex: /hover:bg-gray-100/g, add: 'dark:hover:bg-zinc-700' },
        
        { regex: /hover:text-gray-900/g, add: 'dark:hover:text-zinc-100' },
      ];

      let modified = content;
      
      // Only replace if it doesn't already have dark: variants for that specific token
      // We can do a simpler replacement: find 'foo' and if it's not followed by ' dark:foo_dark', add it.
      
      for (const { regex, add } of replacements) {
        // Find all matches of the class
        modified = modified.replace(regex, (match, offset, string) => {
          // Check if the 'add' class is already somewhat near the match (e.g. existing dark mode)
          // To be safe, we just check if string contains the 'add' class within like 200 characters next to it
          // Actually, if we just do "class1 dark:class2", we can check if `add` is in the same line
          const lineStart = string.lastIndexOf('\n', offset);
          const lineEnd = string.indexOf('\n', offset);
          const line = string.slice(lineStart === -1 ? 0 : lineStart, lineEnd === -1 ? string.length : lineEnd);
          
          if (!line.includes(add)) {
            return `${match} ${add}`;
          }
          return match;
        });
      }

      if (content !== modified) {
        fs.writeFileSync(fullPath, modified, 'utf8');
      }
    }
  }
}

processDirectory('./src');
console.log('Dark mode classes added.');
