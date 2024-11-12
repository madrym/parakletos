import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "Delete empty notes",
  { hourUTC: 14, minuteUTC: 0 },
  internal.cleanupNotes.deleteEmptyNotes
);

export default crons;
