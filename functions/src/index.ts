import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all Cloud Functions
export { fanOutMarkAll } from "./fanOutMarkAll";
export { scoringEngine } from "./scoringEngine";
export { retroactiveRecalculate } from "./retroactiveRecalculate";
export { recalculateScoresForClass } from "./recalculateScoresForClass";
