import { auth } from "./firebase";

export async function sendTelegramNotification(eventType: string, booking: any, payment?: any) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not authenticated, skipping Telegram notification.");
      return;
    }

    const idToken = await user.getIdToken();
    const response = await fetch("/api/telegram/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        eventType,
        booking,
        payment
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`Failed to send Telegram notification: ${errData.error || response.statusText}`);
    } else {
      console.log(`Telegram notification of type '${eventType}' successfully queued.`);
    }
  } catch (error) {
    console.error("Error in sendTelegramNotification:", error);
  }
}
