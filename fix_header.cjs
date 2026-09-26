const fs = require('fs');
let content = fs.readFileSync('Header_clean.tsx', 'utf8');

// 1. Add loading
content = content.replace('const { user, profile, signOut }          = useAuth();', 'const { user, profile, signOut, loading } = useAuth();');

// 2. Hide RoboCoins
content = content.replace('className="flex items-center gap-1 md:gap-1.5 bg-amber-50 border', 'className="hidden sm:flex items-center gap-1 md:gap-1.5 bg-amber-50 border');

// 3. Hide Favorites
content = content.replace('<div className="relative" ref={favoritesRef}>', '<div className="relative hidden sm:block" ref={favoritesRef}>');

// 4. Hide My Orders
content = content.replace('className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:shadow-[0_0_15px_rgba(255,32,64,0.15)] transition-all duration-200 shadow-sm relative group"', 'className="hidden sm:flex w-9 h-9 md:w-12 md:h-12 items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/8 hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:shadow-[0_0_15px_rgba(255,32,64,0.15)] transition-all duration-200 shadow-sm relative group"');

// 5. Update Profile Block (avatar size, skeleton, min-w-0)
content = content.replace('<div className="text-right hidden sm:block">', '<div className="text-right hidden sm:block min-w-0">');

content = content.replace('{profile?.avatar_url && profile.avatar_url !== \'\' ? (\r\n                      <div className="relative">\r\n                        <img\r\n                          src={profile.avatar_url}\r\n                          alt="Profile"\r\n                          className="w-9 h-9 rounded-full', '{profile?.avatar_url && profile.avatar_url !== \'\' ? (\n                      <div className="relative shrink-0 flex-none w-10 h-10 min-w-[40px] min-h-[40px]">\n                        <img\n                          src={profile.avatar_url}\n                          alt="Profile"\n                          className="w-10 h-10 rounded-full');
// If it uses \n instead of \r\n
content = content.replace('{profile?.avatar_url && profile.avatar_url !== \'\' ? (\n                      <div className="relative">\n                        <img\n                          src={profile.avatar_url}\n                          alt="Profile"\n                          className="w-9 h-9 rounded-full', '{profile?.avatar_url && profile.avatar_url !== \'\' ? (\n                      <div className="relative shrink-0 flex-none w-10 h-10 min-w-[40px] min-h-[40px]">\n                        <img\n                          src={profile.avatar_url}\n                          alt="Profile"\n                          className="w-10 h-10 rounded-full');

content = content.replace('<div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:bg-red-200 transition-all">', '<div className="w-10 h-10 shrink-0 flex-none min-w-[40px] min-h-[40px] rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:bg-red-200 transition-all">');

// 6. Add Skeleton condition
content = content.replace('{user ? (', '{loading ? (\n              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1d24]/50 p-1.5 pr-2 rounded-xl border border-gray-100 dark:border-gray-800/50 h-[52px] animate-pulse">\n                <div className="hidden sm:flex flex-col gap-1.5 items-end flex-1 mr-1 w-16">\n                  <div className="w-10 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />\n                  <div className="w-14 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />\n                </div>\n                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />\n              </div>\n            ) : user ? (');

fs.writeFileSync('src/components/Header.tsx', content, 'utf8');
console.log('Restored and fixed Header.tsx successfully!');
