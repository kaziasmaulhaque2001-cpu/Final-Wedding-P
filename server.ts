import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini SDK with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Read Firebase Config
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  if (getApps().length === 0) {
    firebaseApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    firebaseApp = getApps()[0];
  }
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin initialization warning:", error);
}

const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
const firestoreDb = getFirestore(firebaseApp, dbId);

// --- Firestore REST API Fallbacks for Sandbox Permission Limitations ---

function parseFirestoreValue(value: any): any {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map((v: any) => parseFirestoreValue(v));
  }
  if ('mapValue' in value) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  if ('nullValue' in value) return null;
  return undefined;
}

function parseFirestoreFields(fields: any): any {
  const result: any = {};
  for (const key of Object.keys(fields)) {
    result[key] = parseFirestoreValue(fields[key]);
  }
  return result;
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue)
      }
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value)
      }
    };
  }
  return { nullValue: null };
}

function toFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      fields[key] = toFirestoreValue(obj[key]);
    }
  }
  return fields;
}

async function fetchSecureDocRest(uid: string, idToken: string): Promise<any> {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/telegram_secure/${uid}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${idToken}`
    }
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore REST error: ${response.status} - ${text}`);
  }
  
  const data: any = await response.json();
  return parseFirestoreFields(data.fields || {});
}

async function saveSecureDocRest(uid: string, fieldsObj: any, idToken: string): Promise<void> {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const keys = Object.keys(fieldsObj);
  const updateMaskParams = keys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/telegram_secure/${uid}?${updateMaskParams}`;
  
  const fields = toFirestoreFields(fieldsObj);
  const response = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore REST patch error: ${response.status} - ${text}`);
  }
}

async function logTelegramStatusRest(
  uid: string,
  eventType: string,
  status: 'success' | 'failed',
  recipientChatId: string,
  messagePreview: string,
  idToken: string,
  errorMessage?: string
) {
  try {
    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/telegram_logs`;
    
    const fieldsObj = {
      userId: uid,
      eventType,
      status,
      recipientChatId,
      messagePreview: messagePreview.substring(0, 150),
      errorMessage: errorMessage || null,
      timestamp: Date.now(),
    };
    
    const fields = toFirestoreFields(fieldsObj);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.warn(`Firestore REST logging warn: ${response.status} - ${text}`);
    }
  } catch (err) {
    console.error("Failed to write to telegram_logs via REST:", err);
  }
}

async function getTelegramSecureConfig(uid: string, idToken: string): Promise<any> {
  try {
    const docRef = firestoreDb.collection("telegram_secure").doc(uid);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      return snapshot.data();
    }
    return null;
  } catch (error: any) {
    if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("permissions") || error?.code === 7) {
      console.log(`Admin SDK PERMISSION_DENIED on telegram_secure, falling back to Firestore REST API...`);
      return await fetchSecureDocRest(uid, idToken);
    }
    throw error;
  }
}

async function saveTelegramSecureConfig(uid: string, data: any, idToken: string): Promise<void> {
  try {
    const docRef = firestoreDb.collection("telegram_secure").doc(uid);
    await docRef.set(data, { merge: true });
  } catch (error: any) {
    if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("permissions") || error?.code === 7) {
      console.log(`Admin SDK PERMISSION_DENIED on save, falling back to Firestore REST API...`);
      await saveSecureDocRest(uid, data, idToken);
    } else {
      throw error;
    }
  }
}

async function logTelegramStatusFallback(
  uid: string,
  eventType: string,
  status: 'success' | 'failed',
  recipientChatId: string,
  messagePreview: string,
  idToken: string | undefined,
  errorMessage?: string
) {
  try {
    await firestoreDb.collection("telegram_logs").add({
      userId: uid,
      eventType,
      status,
      recipientChatId,
      messagePreview: messagePreview.substring(0, 150),
      errorMessage: errorMessage || null,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    if (idToken && (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("permissions") || error?.code === 7)) {
      console.log(`Admin SDK PERMISSION_DENIED on logging, falling back to Firestore REST API...`);
      await logTelegramStatusRest(uid, eventType, status, recipientChatId, messagePreview, idToken, errorMessage);
    } else {
      console.error("Failed to write to telegram_logs:", error);
    }
  }
}

// --- Telegram Notification Helpers & Scheduler ---

async function sendTelegramWithRetry(botToken: string, chatId: string, message: string, maxRetries = 3): Promise<boolean> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        }),
      });
      const data: any = await response.json();
      if (response.ok && data.ok) {
        return true;
      }
      console.warn(`Telegram send attempt ${attempt + 1} failed: ${data.description}`);
    } catch (err: any) {
      console.error(`Telegram send attempt ${attempt + 1} encountered network error:`, err);
    }
    attempt++;
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function logTelegramStatus(
  uid: string,
  eventType: string,
  status: 'success' | 'failed',
  recipientChatId: string,
  messagePreview: string,
  errorMessage?: string
) {
  try {
    await firestoreDb.collection("telegram_logs").add({
      userId: uid,
      eventType,
      status,
      recipientChatId,
      messagePreview: messagePreview.substring(0, 150),
      errorMessage: errorMessage || null,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Failed to write to telegram_logs:", err);
  }
}

function formatEventSchedule(booking: any): string {
  let schedule = "";
  let hasEvent = false;

  if (booking?.events) {
    for (const key of Object.keys(booking.events)) {
      const ev = booking.events[key];
      if (ev && ev.enabled && ev.date) {
        const parts = ev.date.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ev.date;
        schedule += `• ${key} : ${formattedDate}\n`;
        hasEvent = true;
      }
    }
  }

  if (!hasEvent && booking?.weddingDate) {
    const parts = booking.weddingDate.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : booking.weddingDate;
    schedule += `• Wedding : ${formattedDate}\n`;
  }

  return schedule || "• No event schedule configured\n";
}

function getBookingType(booking: any): string {
  return booking?.bookingFor || booking?.type || "Wedding";
}

function constructTelegramMessage(eventType: string, booking: any, payment?: any): string {
  const clientName = booking?.clientName || "N/A";
  const bookingType = getBookingType(booking);
  const packageName = booking?.packageName || "N/A";
  const venue = booking?.venue || booking?.weddingLocation || "N/A";
  const notes = booking?.notes || booking?.specialNotes || "None";

  const packagePrice = booking?.packagePrice ?? booking?.totalAmount ?? 0;
  const discount = booking?.discount ?? 0;
  const netAmount = booking?.totalAmount ?? (packagePrice - discount);
  const totalPaid = booking?.paidAmount ?? 0;
  const pendingBalance = netAmount - totalPaid;
  const advanceAmount = booking?.advanceAmount ?? booking?.firstPayment ?? 0;

  let weddingDateStr = "N/A";
  if (booking?.weddingDate) {
    const parts = booking.weddingDate.split("-");
    weddingDateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : booking.weddingDate;
  }

  switch (eventType) {
    case 'New Booking':
    case 'Booking Created':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n✅ <b>NEW BOOKING CONFIRMED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📦 <b>Package:</b>\n${packageName}\n\n📅 <b>Event Schedule</b>\n${formatEventSchedule(booking)}\n💰 <b>Financials</b>\n• Package Price: ₹${packagePrice}\n• Discount: ₹${discount}\n• Net Amount: ₹${netAmount}\n• Advance Paid: ₹${advanceAmount}\n• Pending Balance: ₹${pendingBalance}\n\n📍 <b>Venue:</b>\n${venue}\n\n📝 <b>Special Notes:</b>\n${notes}`;

    case 'Booking Updated':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n⚠️ <b>BOOKING UPDATED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📦 <b>Package:</b>\n${packageName}\n\n📅 <b>Event Schedule</b>\n${formatEventSchedule(booking)}\n💰 <b>Financials</b>\n• Net Amount: ₹${netAmount}\n• Total Paid: ₹${totalPaid}\n• Pending Balance: ₹${pendingBalance}\n\n📍 <b>Venue:</b>\n${venue}\n\n📝 <b>Special Notes:</b>\n${notes}`;

    case 'Advance Payment Received':
    case 'Any Payment Received':
    case 'Payment Received': {
      const amountReceived = payment?.amount ?? 0;
      const paymentMethod = payment?.paymentMethod || "Other";
      let paymentDateStr = "N/A";
      if (payment?.date) {
        const parts = payment.date.split("-");
        paymentDateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : payment.date;
      }
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n💵 <b>PAYMENT RECEIVED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n💰 <b>Payment Details</b>\n• Amount Received: ₹${amountReceived}\n• Payment Date: ${paymentDateStr}\n• Method: ${paymentMethod}\n\n📊 <b>Updated Financials</b>\n• Net Amount: ₹${netAmount}\n• Total Paid: ₹${totalPaid}\n• Pending Balance: ₹${pendingBalance}`;
    }

    case 'Booking Cancelled':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n❌ <b>BOOKING CANCELLED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Event Date:</b>\n${weddingDateStr}\n\n⚠️ This booking has been marked as CANCELLED.`;

    case 'Project Completed':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n🎉 <b>PROJECT COMPLETED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n✅ This project has been marked as COMPLETED. All shoots finished!`;

    case 'Gallery Uploaded':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n🌐 <b>GALLERY UPLOADED SUCCESSFULLY</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n🎉 The online gallery has been uploaded!`;

    case 'Album Approved':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n🎉 <b>CLIENT ALBUM APPROVED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n✅ Client has reviewed and approved the album design!`;

    case 'Album Changes Requested':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n✏️ <b>CLIENT REQUESTED ALBUM CHANGES</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n⚠️ The client has requested changes to the album design. Please check client notes.`;

    case 'Album Design PDF Uploaded':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n📖 <b>ALBUM DESIGN PDF UPLOADED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n📥 Album design PDF has been uploaded and sent for client review.`;

    case 'Project Delivered':
    case 'Album Delivered':
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n📦 <b>PROJECT DELIVERED</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n💍 <b>Booking Type:</b>\n${bookingType}\n\n📅 <b>Wedding Date:</b>\n${weddingDateStr}\n\n🎉 Album and assets have been delivered to the client!`;

    default:
      return `📸 <b>ASMAUL PRODUCTION</b>\n\n🔔 <b>Studio Notification: ${eventType}</b>\n\n👤 <b>Client:</b>\n${clientName}\n\n🎉 <b>Event:</b>\n${packageName}\n\n📅 <b>Date:</b>\n${weddingDateStr}\n\n💰 <b>Total Amount:</b>\n₹${netAmount}\n\n💵 <b>Paid:</b>\n₹${totalPaid}\n\n📌 <b>Due:</b>\n₹${pendingBalance}\n\n📍 <b>Location:</b>\n${venue}`;
  }
}

async function processTelegramRemindersAndSummaries(db: any) {
  try {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(Date.now() + istOffset);
    const currentHourIST = istTime.getUTCHours();
    const todayStrIST = istTime.toISOString().split('T')[0];

    const bookingsSnapshot = await db.collection("bookings").get();
    if (bookingsSnapshot.empty) {
      return;
    }

    const bookings: any[] = [];
    bookingsSnapshot.forEach((doc: any) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    const bookingsByUser: Record<string, any[]> = {};
    for (const booking of bookings) {
      if (booking.userId) {
        if (!bookingsByUser[booking.userId]) {
          bookingsByUser[booking.userId] = [];
        }
        bookingsByUser[booking.userId].push(booking);
      }
    }

    for (const userId of Object.keys(bookingsByUser)) {
      const secureDoc = await db.collection("telegram_secure").doc(userId).get();
      if (!secureDoc.exists) continue;

      const secureData = secureDoc.data();
      if (!secureData?.enabled || !secureData?.botToken || !secureData?.chatId) continue;

      const { botToken, chatId } = secureData;
      const userBookings = bookingsByUser[userId];

      if (secureData.telegramReminderNotifications !== false) {
        for (const b of userBookings) {
          if (b.status === 'cancelled' || b.status === 'completed') continue;

          const eventsToCheck: Array<{ name: string; date: string; time?: string; location?: string }> = [];
          
          if (b.events) {
            for (const key of Object.keys(b.events)) {
              const ev = b.events[key];
              if (ev && ev.enabled && ev.date) {
                eventsToCheck.push({
                  name: key,
                  date: ev.date,
                  time: ev.time,
                  location: ev.location || ev.venue || b.venue
                });
              }
            }
          }

          if (eventsToCheck.length === 0 && b.weddingDate) {
            eventsToCheck.push({
              name: "Wedding",
              date: b.weddingDate,
              time: b.eventTime,
              location: b.venue
            });
          }

          for (const ev of eventsToCheck) {
            const [evYear, evMonth, evDay] = ev.date.split('-').map(Number);
            if (isNaN(evYear) || isNaN(evMonth) || isNaN(evDay)) continue;

            const evDateMidnight = new Date(evYear, evMonth - 1, evDay);
            const todayMidnight = new Date(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate());
            
            const diffTime = evDateMidnight.getTime() - todayMidnight.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            const allowedDays = [7, 5, 3, 1, 0];
            if (allowedDays.includes(diffDays)) {
              if (diffDays === 0 && currentHourIST < 8) {
                continue;
              }

              const reminderKey = `reminder_${b.id}_${ev.name.replace(/\s+/g, '_')}_${diffDays}days`;
              const reminderDocRef = db.collection("telegram_reminders").doc(reminderKey);
              const reminderDoc = await reminderDocRef.get();
              
              if (!reminderDoc.exists) {
                let message = "";
                const daysStr = diffDays === 0 ? "TODAY" : `${diffDays} days`;
                
                if (diffDays === 0) {
                  message = `📸 <b>ASMAUL PRODUCTION</b>\n\n🚨 <b>TODAY IS THE EVENT DAY!</b>\n\n👤 <b>Client:</b>\n${b.clientName || "N/A"}\n\n💍 <b>Event:</b>\n${ev.name}\n\n📅 <b>Date & Time:</b>\nToday (${ev.date.split('-').reverse().join('/')}) ${ev.time ? `@ ${ev.time}` : ''}\n\n📍 <b>Venue:</b>\n${ev.location || "N/A"}\n\n📝 <b>Special Notes:</b>\n${b.notes || "None"}`;
                } else {
                  message = `📸 <b>ASMAUL PRODUCTION</b>\n\n⏰ <b>UPCOMING EVENT REMINDER</b>\n(${daysStr} to go!)\n\n👤 <b>Client:</b>\n${b.clientName || "N/A"}\n\n💍 <b>Event:</b>\n${ev.name}\n\n📅 <b>Date & Time:</b>\n${ev.date.split('-').reverse().join('/')} ${ev.time ? `@ ${ev.time}` : ''}\n\n📍 <b>Venue:</b>\n${ev.location || "N/A"}\n\n📝 <b>Special Notes:</b>\n${b.notes || "None"}`;
                }

                const success = await sendTelegramWithRetry(botToken, chatId, message);
                if (success) {
                  await reminderDocRef.set({
                    sentAt: Date.now(),
                    bookingId: b.id,
                    eventType: ev.name,
                    diffDays,
                    userId
                  });
                  await logTelegramStatus(userId, `Event Reminder (${daysStr})`, 'success', chatId, message);
                } else {
                  await logTelegramStatus(userId, `Event Reminder (${daysStr})`, 'failed', chatId, message, "Failed after max retries");
                }
              }
            }
          }

          if (b.weddingDate && secureData.telegramPaymentNotifications !== false) {
            const [wYear, wMonth, wDay] = b.weddingDate.split('-').map(Number);
            if (!isNaN(wYear) && !isNaN(wMonth) && !isNaN(wDay)) {
              const wDateMidnight = new Date(wYear, wMonth - 1, wDay);
              const todayMidnight = new Date(istTime.getUTCFullYear(), istTime.getUTCMonth(), istTime.getUTCDate());
              const diffTime = wDateMidnight.getTime() - todayMidnight.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              const outstanding = (b.totalAmount || 0) - (b.paidAmount || 0);
              if (outstanding > 0 && (diffDays === 3 || diffDays === 1)) {
                const paymentDueKey = `payment_due_${b.id}_${diffDays}days`;
                const paymentDueDocRef = db.collection("telegram_reminders").doc(paymentDueKey);
                const paymentDueDoc = await paymentDueDocRef.get();

                if (!paymentDueDoc.exists) {
                  const message = `📸 <b>ASMAUL PRODUCTION</b>\n\n⚠️ <b>PAYMENT DUE REMINDER</b>\n(${diffDays} days before wedding)\n\n👤 <b>Client:</b>\n${b.clientName || "N/A"}\n\n💍 <b>Booking Type:</b>\n${getBookingType(b)}\n\n📅 <b>Event Date:</b>\n${b.weddingDate.split('-').reverse().join('/')}\n\n💰 <b>Financial Status</b>\n• Net Amount: ₹${b.totalAmount || 0}\n• Total Paid: ₹${b.paidAmount || 0}\n• Pending Balance: ₹${outstanding}\n\n📝 Please ensure to clear the outstanding balance. Thank you!`;
                  
                  const success = await sendTelegramWithRetry(botToken, chatId, message);
                  if (success) {
                    await paymentDueDocRef.set({
                      sentAt: Date.now(),
                      bookingId: b.id,
                      diffDays,
                      userId
                    });
                    await logTelegramStatus(userId, `Payment Due Reminder (${diffDays} days)`, 'success', chatId, message);
                  } else {
                    await logTelegramStatus(userId, `Payment Due Reminder (${diffDays} days)`, 'failed', chatId, message, "Failed after max retries");
                  }
                }
              }
            }
          }
        }
      }

      if (secureData.telegramDailySummary !== false && currentHourIST >= 8) {
        const summaryKey = `daily_summary_${userId}_${todayStrIST}`;
        const summaryDocRef = db.collection("telegram_reminders").doc(summaryKey);
        const summaryDoc = await summaryDocRef.get();

        if (!summaryDoc.exists) {
          let todaysEventsList = "";
          let tomorrowsEventsList = "";
          let pendingPaymentsList = "";
          let pendingAlbumApprovalsList = "";
          let pendingDeliveriesList = "";
          let totalBookingsToday = 0;

          const todayDateStr = todayStrIST;
          const tomorrowTime = new Date(istTime.getTime() + 24 * 60 * 60 * 1000);
          const tomorrowDateStr = tomorrowTime.toISOString().split('T')[0];

          for (const b of userBookings) {
            let hasEventToday = false;
            let hasEventTomorrow = false;
            let bookingEvents: string[] = [];

            if (b.events) {
              for (const key of Object.keys(b.events)) {
                const ev = b.events[key];
                if (ev && ev.enabled && ev.date) {
                  if (ev.date === todayDateStr) {
                    hasEventToday = true;
                    bookingEvents.push(`${key} @ ${ev.location || b.venue || "N/A"}`);
                  }
                  if (ev.date === tomorrowDateStr) {
                    hasEventTomorrow = true;
                  }
                }
              }
            } else if (b.weddingDate) {
              if (b.weddingDate === todayDateStr) {
                hasEventToday = true;
                bookingEvents.push(`Wedding @ ${b.venue || "N/A"}`);
              }
              if (b.weddingDate === tomorrowDateStr) {
                hasEventTomorrow = true;
              }
            }

            if (hasEventToday) {
              todaysEventsList += `• <b>${b.clientName}</b> - ${bookingEvents.join(', ')}\n`;
              totalBookingsToday++;
            }
            if (hasEventTomorrow) {
              tomorrowsEventsList += `• <b>${b.clientName}</b> - ${b.packageName}\n`;
            }

            const outstanding = (b.totalAmount || 0) - (b.paidAmount || 0);
            if (outstanding > 0 && b.status !== 'cancelled' && b.status !== 'completed') {
              pendingPaymentsList += `• <b>${b.clientName}</b>: ₹${outstanding} (Due)\n`;
            }

            if (b.status !== 'cancelled' && b.albumDesignStatus && ['Waiting for Client Review', 'Client Reviewing', 'Changes Requested'].includes(b.albumDesignStatus)) {
              pendingAlbumApprovalsList += `• <b>${b.clientName}</b> - Status: ${b.albumDesignStatus}\n`;
            }

            if (b.status === 'confirmed' || b.status === 'in_progress') {
              const deliveryPending = b.projectStatus !== 'Delivered' && b.albumDeliveryStatus !== 'Delivered';
              if (deliveryPending) {
                pendingDeliveriesList += `• <b>${b.clientName}</b> - Pkg: ${b.packageName}\n`;
              }
            }
          }

          todaysEventsList = todaysEventsList || "• No events today\n";
          tomorrowsEventsList = tomorrowsEventsList || "• No events tomorrow\n";
          pendingPaymentsList = pendingPaymentsList || "• No pending payments\n";
          pendingAlbumApprovalsList = pendingAlbumApprovalsList || "• No albums waiting review\n";
          pendingDeliveriesList = pendingDeliveriesList || "• No pending deliveries\n";

          const formattedISTDate = todayStrIST.split('-').reverse().join('/');
          const message = `📸 <b>ASMAUL PRODUCTION</b>\n\n📅 <b>DAILY SUMMARY (${formattedISTDate})</b>\n\n<b>Today's Events:</b>\n${todaysEventsList}\n<b>Tomorrow's Events:</b>\n${tomorrowsEventsList}\n💰 <b>Pending Payments:</b>\n${pendingPaymentsList}\n📖 <b>Pending Album Approvals:</b>\n${pendingAlbumApprovalsList}\n🚚 <b>Pending Deliveries:</b>\n${pendingDeliveriesList}\n📊 <b>Analytics Summary:</b>\n• Total Bookings Today: ${totalBookingsToday}`;

          const success = await sendTelegramWithRetry(botToken, chatId, message);
          if (success) {
            await summaryDocRef.set({
              sentAt: Date.now(),
              userId,
              date: todayStrIST
            });
            await logTelegramStatus(userId, `Daily Summary`, 'success', chatId, message);
          } else {
            await logTelegramStatus(userId, `Daily Summary`, 'failed', chatId, message, "Failed after max retries");
          }
        }
      }
    }
  } catch (error: any) {
    if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("permissions")) {
      console.warn("[Firebase Scheduler] Background reminders bypassed on server due to sandbox permission restrictions.");
    } else {
      console.error("Error running processTelegramRemindersAndSummaries:", error);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Auth Middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
      req.user = decodedToken;
      req.idToken = idToken;
      next();
    } catch (error) {
      console.error("Error verifying ID token:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini Chat endpoint
  app.post("/api/gemini/chat", authenticateUser, async (req: any, res) => {
    const { contents, systemInstruction } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction || "You are the Cinematic AI Copilot for Asmaul Production, a professional photography and videography studio management platform. Assist users with managing client bookings, payment tracking, photo album workflows, and crafting stunning client experiences. Keep answers highly professional, clean, and helpful."
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in Gemini chat:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Content Intelligence analyzer endpoint
  app.post("/api/gemini/analyze", authenticateUser, async (req: any, res) => {
    const { prompt, context } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: `Context Details:\n${JSON.stringify(context)}\n\nAction / Prompt Request:\n${prompt}` }] }
        ],
        config: {
          systemInstruction: "You are the Cinematic AI Copilot for Asmaul Production. Analyze the provided context meticulously, suggest enhancements or drafts, write professional customer emails, create Telegram templates, and provide concise, elegant output."
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in Gemini analysis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Telegram Secure Config (checks if token is set, but masks it)
  app.get("/api/telegram/config", authenticateUser, async (req: any, res) => {
    const uid = req.user.uid;
    const idToken = req.idToken;
    try {
      const data = await getTelegramSecureConfig(uid, idToken);
      if (data) {
        return res.json({
          enabled: data?.enabled ?? false,
          chatId: data?.chatId ?? "",
          hasBotToken: !!data?.botToken,
          telegramBookingNotifications: data?.telegramBookingNotifications ?? true,
          telegramPaymentNotifications: data?.telegramPaymentNotifications ?? true,
          telegramReminderNotifications: data?.telegramReminderNotifications ?? true,
          telegramAlbumNotifications: data?.telegramAlbumNotifications ?? true,
          telegramDeliveryNotifications: data?.telegramDeliveryNotifications ?? true,
          telegramDailySummary: data?.telegramDailySummary ?? true,
        });
      }
      return res.json({
        enabled: false,
        chatId: "",
        hasBotToken: false,
        telegramBookingNotifications: true,
        telegramPaymentNotifications: true,
        telegramReminderNotifications: true,
        telegramAlbumNotifications: true,
        telegramDeliveryNotifications: true,
        telegramDailySummary: true,
      });
    } catch (error: any) {
      console.error("Error fetching secure telegram config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save Telegram Secure Config
  app.post("/api/telegram/save", authenticateUser, async (req: any, res) => {
    const uid = req.user.uid;
    const idToken = req.idToken;
    const {
      enabled,
      botToken,
      chatId,
      telegramBookingNotifications,
      telegramPaymentNotifications,
      telegramReminderNotifications,
      telegramAlbumNotifications,
      telegramDeliveryNotifications,
      telegramDailySummary,
    } = req.body;

    try {
      const existingData = (await getTelegramSecureConfig(uid, idToken)) || {};

      const updatedData: any = {
        enabled: enabled ?? existingData?.enabled ?? false,
        chatId: chatId ?? existingData?.chatId ?? "",
        telegramBookingNotifications: telegramBookingNotifications ?? existingData?.telegramBookingNotifications ?? true,
        telegramPaymentNotifications: telegramPaymentNotifications ?? existingData?.telegramPaymentNotifications ?? true,
        telegramReminderNotifications: telegramReminderNotifications ?? existingData?.telegramReminderNotifications ?? true,
        telegramAlbumNotifications: telegramAlbumNotifications ?? existingData?.telegramAlbumNotifications ?? true,
        telegramDeliveryNotifications: telegramDeliveryNotifications ?? existingData?.telegramDeliveryNotifications ?? true,
        telegramDailySummary: telegramDailySummary ?? existingData?.telegramDailySummary ?? true,
        updatedAt: Date.now(),
      };

      // Save token only if it's not the masked value and not empty
      if (botToken && botToken !== "••••••••") {
        updatedData.botToken = botToken;
      } else if (botToken === "") {
        updatedData.botToken = "";
      } else {
        // Keep existing token
        updatedData.botToken = existingData?.botToken || "";
      }

      await saveTelegramSecureConfig(uid, updatedData, idToken);
      res.json({ success: true, message: "Telegram settings saved securely." });
    } catch (error: any) {
      console.error("Error saving secure telegram config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test Connection Route
  app.post("/api/telegram/test-connection", authenticateUser, async (req: any, res) => {
    const uid = req.user.uid;
    const idToken = req.idToken;
    let { botToken, chatId } = req.body;

    try {
      // If token is masked, fetch from firestore
      if (botToken === "••••••••" || !botToken) {
        const secureData = await getTelegramSecureConfig(uid, idToken);
        if (secureData) {
          if (botToken === "••••••••") {
            botToken = secureData?.botToken || "";
          }
          if (!chatId) {
            chatId = secureData?.chatId || "";
          }
        }
      }

      if (!botToken || !chatId) {
        return res.status(400).json({ error: "Missing bot token or chat ID." });
      }

      // Verify Telegram bot token with getMe
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data: any = await response.json();

      if (response.ok && data.ok) {
        res.json({ success: true, message: "Connected Successfully", bot: data.result });
      } else {
        res.status(400).json({ success: false, error: "Invalid Bot Token" });
      }
    } catch (error: any) {
      console.error("Error testing telegram connection:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send Test Message Route
  app.post("/api/telegram/send-test", authenticateUser, async (req: any, res) => {
    const uid = req.user.uid;
    const idToken = req.idToken;
    let { botToken, chatId } = req.body;

    try {
      // If token is masked, fetch from firestore
      if (botToken === "••••••••" || !botToken) {
        const secureData = await getTelegramSecureConfig(uid, idToken);
        if (secureData) {
          if (botToken === "••••••••") {
            botToken = secureData?.botToken || "";
          }
          if (!chatId) {
            chatId = secureData?.chatId || "";
          }
        }
      }

      if (!botToken || !chatId) {
        return res.status(400).json({ error: "Missing bot token or chat ID." });
      }

      // Send test message
      const text = `📸 Asmaul Production\n\n✅ Telegram Bot Connected Successfully.`;
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      });

      const data: any = await response.json();

      if (response.ok && data.ok) {
        res.json({ success: true, message: "Test message sent successfully." });
      } else {
        res.status(400).json({ success: false, error: data.description || "Failed to send message." });
      }
    } catch (error: any) {
      console.error("Error sending test telegram message:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Main automatic notification route
  app.post("/api/telegram/notify", authenticateUser, async (req: any, res) => {
    const uid = req.user.uid;
    const idToken = req.idToken;
    const { eventType, booking, payment } = req.body;

    try {
      const secureData = await getTelegramSecureConfig(uid, idToken);
      if (!secureData) {
        return res.json({ success: false, message: "Telegram not configured." });
      }

      if (!secureData?.enabled || !secureData?.botToken || !secureData?.chatId) {
        return res.json({ success: false, message: "Telegram notifications are disabled or incomplete." });
      }

      const { botToken, chatId } = secureData;

      // 1. Check Toggle Settings based on event categories
      if (eventType === 'New Booking' || eventType === 'Booking Cancelled' || eventType === 'Booking Updated') {
        if (secureData.telegramBookingNotifications === false) {
          return res.json({ success: true, message: "Booking notifications are disabled in settings." });
        }
      }
      if (eventType.includes('Payment Received') || eventType === 'Payment Due Reminder') {
        if (secureData.telegramPaymentNotifications === false) {
          return res.json({ success: true, message: "Payment notifications are disabled in settings." });
        }
      }
      if (eventType.includes('Reminder')) {
        if (secureData.telegramReminderNotifications === false) {
          return res.json({ success: true, message: "Reminder notifications are disabled in settings." });
        }
      }
      if (eventType === 'Album Approved' || eventType === 'Album Changes Requested' || eventType === 'Album Design PDF Uploaded') {
        if (secureData.telegramAlbumNotifications === false) {
          return res.json({ success: true, message: "Album notifications are disabled in settings." });
        }
      }
      if (eventType === 'Project Completed' || eventType === 'Gallery Uploaded' || eventType === 'Project Delivered') {
        if (secureData.telegramDeliveryNotifications === false) {
          return res.json({ success: true, message: "Delivery notifications are disabled in settings." });
        }
      }

      // 2. Format Beautiful Message from Rich Templates
      const message = constructTelegramMessage(eventType, booking, payment);

      // 3. Send with retry
      const success = await sendTelegramWithRetry(botToken, chatId, message);

      if (success) {
        await logTelegramStatusFallback(uid, eventType, 'success', chatId, message, idToken);
        res.json({ success: true });
      } else {
        await logTelegramStatusFallback(uid, eventType, 'failed', chatId, message, idToken, "Failed after max retries");
        res.status(400).json({ success: false, error: "Failed to send Telegram notification after retries." });
      }
    } catch (error: any) {
      console.error("Error sending automatic telegram notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite development middleware OR static production bundle serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start automated background Telegram scheduler
    console.log("Starting automated background Telegram scheduler...");
    processTelegramRemindersAndSummaries(firestoreDb).catch(err => {
      if (err?.message?.includes("PERMISSION_DENIED") || err?.message?.includes("permissions")) {
        console.warn("[Firebase Scheduler] Initial run bypassed due to permissions.");
      } else {
        console.error("Failed to execute initial Telegram scheduler run:", err);
      }
    });

    setInterval(() => {
      console.log("Running background Telegram scheduler job...");
      processTelegramRemindersAndSummaries(firestoreDb).catch(err => {
        if (err?.message?.includes("PERMISSION_DENIED") || err?.message?.includes("permissions")) {
          console.warn("[Firebase Scheduler] Periodic run bypassed due to permissions.");
        } else {
          console.error("Failed in background Telegram scheduler run:", err);
        }
      });
    }, 15 * 60 * 1000); // Check every 15 minutes to guarantee timely morning 8:00 AM summaries and reminders
  });
}

startServer();
