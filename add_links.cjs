const fs = require('fs');

let checkoutContent = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const regex = /<button\s+onClick=\{\(\) => \{ setTermsAccepted\(true\); setShowTermsModal\(false\); \}\}\s+className=\"w-full bg-red-700[^>]+>\s*قرأت وأوافق على جميع الشروط ✓\s*<\/button>/s;

const replacement = `<a
                  href="https://www.mokaa3.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-black py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-sm mb-3 border border-blue-200 dark:border-blue-500/20"
                >
                  اقرأ الشروط والأحكام بالكامل
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-700/20"
                >
                  قرأت وأوافق على جميع الشروط ✓
                </button>`;

checkoutContent = checkoutContent.replace(regex, replacement);

fs.writeFileSync('src/pages/Checkout.tsx', checkoutContent, 'utf8');
console.log('Fixed terms link with regex!');
