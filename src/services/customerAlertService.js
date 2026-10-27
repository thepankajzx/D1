/**
 * Service to notify administrator via Google Apps Script Webhook
 * whenever a new customer registers / signs up on D1 (App or Web).
 */

export async function sendNewCustomerAlert(userData = {}) {
  const WEBHOOK_URL = import.meta.env.VITE_CUSTOMER_ALERT_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbxImVbXFvf8RhdRiIbaDUU1bPZKDBnxBy9IjSvzzcJncwQl0pFabw_GZtjvdnLqOm6u/exec";
  const SECRET = import.meta.env.VITE_CUSTOMER_ALERT_SECRET || "merafirebase_secret_123";

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Crucial to avoid CORS errors with Google Apps Script
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret: SECRET,
        name: userData.name || "New Customer",
        email: userData.email || "Not Provided",
        uid: userData.uid || "Not Provided",
        extra: userData.extra || "App Signup"
      }),
    });
  } catch (error) {
    // Fail silently so the user's signup flow is never interrupted
    console.error("Failed to send new customer alert:", error);
  }
}
