const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../apps/web/src/components/layout/AppShell.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add GuidedTourEngine import
if (!content.includes('GuidedTourEngine')) {
  content = content.replace(
    "import { LoginModal } from '../auth/LoginModal';",
    "import { LoginModal } from '../auth/LoginModal';\r\nimport { GuidedTourEngine } from '../onboarding/GuidedTourEngine';"
  );
}

// 2. Destructure activeTourTrack, dismissTour from useApp
if (!content.includes('activeTourTrack,')) {
  content = content.replace(
    "toggleTheme,\r\n  } = useApp();",
    "toggleTheme,\r\n    activeTourTrack,\r\n    dismissTour,\r\n  } = useApp();"
  );
}

// 3. Add data-tour="branch-context"
if (!content.includes('data-tour="branch-context"')) {
  content = content.replace(
    '<div className="relative hidden lg:flex items-center">',
    '<div className="relative hidden lg:flex items-center" data-tour="branch-context">'
  );
}

// 4. Add data-tour="search-bar"
if (!content.includes('data-tour="search-bar"')) {
  content = content.replace(
    '<button\r\n            onClick={() => setIsSearchOpen(true)}\r\n            className="hidden sm:flex',
    '<button\r\n            data-tour="search-bar"\r\n            onClick={() => setIsSearchOpen(true)}\r\n            className="hidden sm:flex'
  );
}

// 5. Add data-tour="quick-create"
if (!content.includes('data-tour="quick-create"')) {
  content = content.replace(
    '<button\r\n            onClick={() => setIsQuickCreateOpen(true)}\r\n            className="flex items-center gap-1.5 bg-gradient-to-r',
    '<button\r\n            data-tour="quick-create"\r\n            onClick={() => setIsQuickCreateOpen(true)}\r\n            className="flex items-center gap-1.5 bg-gradient-to-r'
  );
}

// 6. Add data-tour="notifications-bell"
if (!content.includes('data-tour="notifications-bell"')) {
  content = content.replace(
    '<button\r\n              onClick={() => setIsNotifOpen(!isNotifOpen)}\r\n              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition relative shrink-0"\r\n              aria-label="Notifications"',
    '<button\r\n              data-tour="notifications-bell"\r\n              onClick={() => setIsNotifOpen(!isNotifOpen)}\r\n              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition relative shrink-0"\r\n              aria-label="Notifications"'
  );
}

// 7. Add data-tour={`nav-${item.id}`} to desktop sidebar buttons
if (!content.includes('data-tour={`nav-${item.id}`}')) {
  content = content.replace(
    '<button\r\n                  key={item.id}\r\n                  onClick={() => handleNavClick(item.id)}',
    '<button\r\n                  key={item.id}\r\n                  data-tour={`nav-${item.id}`}\r\n                  onClick={() => handleNavClick(item.id)}'
  );
}

// 8. Render GuidedTourEngine when activeTourTrack is present
if (!content.includes('<GuidedTourEngine')) {
  content = content.replace(
    '<MobileQuickActionsMenu />\r\n    </div>',
    '<MobileQuickActionsMenu />\r\n      {activeTourTrack && (\r\n        <GuidedTourEngine\r\n          track={activeTourTrack}\r\n          onNavigate={(ws) => handleNavClick(ws)}\r\n          onDismiss={dismissTour}\r\n          onComplete={dismissTour}\r\n        />\r\n      )}\r\n    </div>'
  );
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated AppShell.tsx');
