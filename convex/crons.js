import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "Delete empty notes",
  { minuteUTC: 0 },
  internal.cleanupNotes.deleteEmptyNotes
);

export default crons;
