const fs = require('fs');

try {
  let content = fs.readFileSync('src/components/HeroBanners.tsx', 'utf8');
  content = content.replace(
    'className="w-full h-full opacity-60 md:opacity-100 mix-blend-overlay md:mix-blend-normal"',
    'className="w-full h-full opacity-90 md:opacity-100 mix-blend-normal"'
  );
  
  // Also let's lessen the scanlines opacity on mobile so it's not too aggressive
  content = content.replace(
    'className="absolute inset-0 z-[1] pointer-events-none scanlines opacity-0 dark:opacity-100"',
    'className="absolute inset-0 z-[1] pointer-events-none scanlines opacity-0 dark:opacity-50 md:dark:opacity-100"'
  );
  
  fs.writeFileSync('src/components/HeroBanners.tsx', content, 'utf8');
  console.log('Fixed HeroBanners.tsx successfully');
} catch (err) {
  console.error('Error:', err.message);
}
