
/**
 * Developer Console Identity
 */
export const logDevBrand = () => {
  if (typeof window === 'undefined') return;

  const args = [
    '%cdevwhite\n' +
    '%c  ⚡ Abdulrahman Fullstack Developer  \n' +
    '%c ',

    // devwhite Style
    'color: #fff; font-size: 60px; font-weight: 900; font-family: Impact, sans-serif; text-shadow: 3px 0px #00ffff, -3px 0px #ff00ff; letter-spacing: 2px; padding-bottom: 20px;',
    
    // Developer name
    'background: #11141e; color: #ffeb3b; font-size: 14px; font-family: monospace; font-weight: bold; padding: 10px 0; border-left: 5px solid #00ffff; border-right: 5px solid #ff00ff;',
    
    // Bottom border connector
    'background: #11141e; padding: 5px 0; border-left: 5px solid #00ffff; border-right: 5px solid #ff00ff; border-bottom: 5px solid #ff00ff;'
  ];

  console.log(...args);
};
