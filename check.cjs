const { execSync } = require('child_process');
const commits = execSync('git log --format="%h" -10').toString().trim().split('\n');
for (const commit of commits) {
  try {
    const content = execSync('git show ' + commit + ':src/pages/Checkout.tsx').toString('utf8');
    // mangled text has stuff like Ø¹Ù
    const mangled = content.match(/ط·/); 
    console.log(commit, 'mangled:', !!mangled);
  } catch (e) {
    console.log(commit, 'error reading file');
  }
}
