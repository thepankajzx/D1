const fs = require('fs');

// Fix AuthContext.jsx
let authContent = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');
authContent = authContent.replace(
  /<div className="min-h-screen flex items-center justify-center bg-surface">[\s\S]*?<div className="flex flex-col items-center gap-4">[\s\S]*?<Icon name="sync" className=" animate-spin text-4xl text-primary" \/>[\s\S]*?<span className="font-label-md text-on-surface-variant">Loading Definite\.\.\.<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
  '<div className="min-h-screen bg-background"></div>'
);
fs.writeFileSync('src/contexts/AuthContext.jsx', authContent);

// Fix App.jsx
let appContent = fs.readFileSync('src/App.jsx', 'utf8');
appContent = appContent.replace(
  /<div className="flex min-h-screen items-center justify-center text-primary bg-background">[\s\S]*?<Icon name="sync" className=" animate-spin text-4xl" \/>[\s\S]*?<\/div>/m,
  '<div className="min-h-screen bg-background"></div>'
);

// Make Analytics lazy loaded
appContent = appContent.replace(
  /import Analytics from '\.\/pages\/Analytics';/m,
  "const Analytics = lazy(() => import('./pages/Analytics'));"
);

fs.writeFileSync('src/App.jsx', appContent);
