const fs = require('fs');
let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const startIndex = content.indexOf('{/* ?? Banned Banner');
if (startIndex !== -1) {
  const before = content.substring(0, startIndex);
  const heroIndex = content.indexOf('<div className="relative bg-gradient-to-bl');
  const after = content.substring(heroIndex);

  const newBanner = `        {/* ── Banned Banner ── */}
        {profile?.is_banned && (
          <div className="bg-red-600 text-white p-4">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="shrink-0" />
                <div>
                  <h3 className="font-black text-lg">عفواً، تم حظر حسابك</h3>
                  <p className="text-sm font-bold opacity-90">
                    لا يمكنك إتمام أي طلبات شراء جديدة في الوقت الحالي. يمكنك تصفح الموقع ومراجعة طلباتك السابقة.
                  </p>
                </div>
              </div>
              <a 
                href="https://wa.me/201557957800"
                target="_blank" 
                rel="noreferrer"
                className="shrink-0 bg-white text-red-600 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-red-50 transition-colors shadow-sm"
              >
                تحدث مع الدعم الفني
              </a>
            </div>
          </div>
        )}

        {/* ── Hero Header ── */}
        `;
  
  content = before + newBanner + after;
  fs.writeFileSync('src/pages/Profile.tsx', content, 'utf8');
  console.log('Fixed!');
} else {
  console.log('Could not find banner section');
}
