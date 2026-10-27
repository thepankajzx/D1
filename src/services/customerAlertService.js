/**
 * Service to notify administrator via Google Apps Script Webhook
 * whenever a new customer registers / signs up on D1 (App or Web).
 */

export async function sendNewCustomerAlert(userData = {}) {
  const WEBHOOK_URL = import.meta.env.VITE_CUSTOMER_ALERT_WEBHOOK_URL;
  const SECRET = import.meta.env.VITE_CUSTOMER_ALERT_SECRET;

  if (!WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Crucial to avoid CORS errors with Google Apps Script
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        ...(SECRET ? { secret: SECRET } : {}),
        name: userData.name || "New Customer",
        email: userData.email || "Not Provided",
        uid: userData.uid || "Not Provided",
        extra: userData.extra || "App Signup"
      }),
    });
  } catch {
    // Fail silently in production
  }
}
