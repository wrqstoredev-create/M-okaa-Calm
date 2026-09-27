const { execSync } = require('child_process');
const fs = require('fs');

try {
  let content = execSync('git show 5f48b4c:src/components/SupportChat.tsx').toString('utf8');
  content = content.replace('z-[9999]', 'z-40');
  fs.writeFileSync('src/components/SupportChat.tsx', content, 'utf8');
  console.log('Fixed SupportChat.tsx successfully');
} catch (err) {
  console.error('Error:', err.message);
}
