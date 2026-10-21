/**
 * Service Worker Registration & Update Management for Definite
 */

let deferredPrompt = null;
const installPromptListeners = new Set();

export function registerSW() {
  if (typeof window === 'undefined') return;

  // Listen for beforeinstallprompt event (Android / Chromium Desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPromptListeners.forEach(listener => listener(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installPromptListeners.forEach(listener => listener(false));
    console.log('[PWA] Definite was successfully installed!');
  });

  // Only register service worker in supported browsers and secure contexts
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          // Check for service worker updates periodically
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000); // Every 1 hour

          // Check for update on page visibility change
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update().catch(() => {});
            }
          });

          // Handle incoming service worker update
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update is available
                  console.log('[PWA] New version of Definite is available.');
                  // Dispatch custom event if any UI wants to show an update banner
                  window.dispatchEvent(new CustomEvent('definite:pwa-update-available', {
                    detail: { registration }
                  }));
                } else {
                  // Content is cached for offline use
                  console.log('[PWA] App is ready for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });

      // Reload controller change gracefully
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // Optionally reload or let user reload
        }
      });
    });
  }
}

/**
 * Prompt user to install the PWA (if supported by browser)
 */
export async function promptInstall() {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installPromptListeners.forEach(listener => listener(false));
  return { outcome };
}

/**
 * Check if the PWA can currently be installed via prompt
 */
export function isInstallable() {
  return deferredPrompt !== null;
}

/**
 * Subscribe to installability changes
 */
export function onInstallableChange(callback) {
  installPromptListeners.add(callback);
  callback(deferredPrompt !== null);
  return () => installPromptListeners.delete(callback);
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}
