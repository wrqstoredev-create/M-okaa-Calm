const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace('const { user }         = useAuth();', `const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.is_banned) {
      navigate('/profile', { replace: true });
    }
  }, [profile, navigate]);`);

fs.writeFileSync('src/pages/Checkout.tsx', content, 'utf8');
console.log('Fixed Checkout.tsx!');
