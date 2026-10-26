import { Capacitor, registerPlugin } from '@capacitor/core';

// Reference to native D1 system plugin
const D1NativeNotifications = registerPlugin('D1NativeNotifications');

/**
 * Universal external URL launcher for web and Capacitor native Android/iOS.
 * Ensures external links (WhatsApp channels, Instagram profiles, etc.)
 * open in the device's native app or default system browser cleanly.
 */
export const openExternalUrl = async (url, e) => {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  if (!url) return;

  const cleanUrl = url.trim();

  try {
    if (Capacitor.isNativePlatform()) {
      try {
        await D1NativeNotifications.openUrl({ url: cleanUrl });
        return;
      } catch (nativeErr) {
        console.warn('Native openUrl plugin failed, falling back:', nativeErr);
      }
    }

    // Web fallback / desktop browser or if native plugin call threw
    const newWindow = window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = cleanUrl;
    }
  } catch (err) {
    console.error('Error opening external url:', err);
    try {
      window.location.href = cleanUrl;
    } catch (ignore) {}
  }
};

export default openExternalUrl;
