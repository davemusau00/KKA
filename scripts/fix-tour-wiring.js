const fs = require('fs');
const path = require('path');

// 1. Fix AppShell.tsx
const appShellPath = path.join(__dirname, '../apps/web/src/components/layout/AppShell.tsx');
let appShell = fs.readFileSync(appShellPath, 'utf8');
appShell = appShell.replace(
  /<GuidedTourEngine\s+track=\{activeTourTrack\}\s+onNavigate=\{.*?\}\s+onDismiss=\{.*?\}\s+onComplete=\{.*?\}\s*\/>/s,
  `<GuidedTourEngine\r\n          track={activeTourTrack}\r\n          onOpenWorkspace={(ws) => handleNavClick(ws)}\r\n          onClose={dismissTour}\r\n        />`
);
fs.writeFileSync(appShellPath, appShell, 'utf8');

// 2. Fix AppContext.tsx
const appContextPath = path.join(__dirname, '../apps/web/src/context/AppContext.tsx');
let appContext = fs.readFileSync(appContextPath, 'utf8');
appContext = appContext.replace(
  'activeWorkspace,\r\n        setActiveWorkspace,',
  'activeWorkspace,\r\n        setActiveWorkspace,\r\n        activeTourTrack,\r\n        startTour,\r\n        dismissTour,'
);
fs.writeFileSync(appContextPath, appContext, 'utf8');

console.log('Fixed AppShell.tsx and AppContext.tsx');
