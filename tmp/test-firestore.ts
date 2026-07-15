import fs from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  console.log("Config:", firebaseConfig);
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
  console.log("Database ID:", dbId);
  const db = getFirestore(app, dbId);
  try {
    const snapshot = await db.collection("bookings").limit(1).get();
    console.log("Successfully fetched bookings. Count:", snapshot.size);
  } catch (err: any) {
    console.error("Error fetching bookings:", err.message, err.stack);
  }
}

test();
