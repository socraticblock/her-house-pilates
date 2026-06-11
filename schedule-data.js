// Her House — weekly class template (the recurring schedule, not specific instances).
// Edit this file to change the schedule shown on /schedule/.
//
// shape: array of { id, label, sections: [{ heading, classes: [{ time, title, instructor?, note?, bookable }] }] }
//
// id       — stable key for the slide (used by carousel + deep links + booking dedup)
// label    — fallback display name for the slide
// heading  — section heading inside the slide (usually the same as label; "Weekend" slide has "Saturday" and "Sunday")
// time     — "HH:MM" 24h, interpreted as studio-local Tbilisi time
// title    — class type in UPPERCASE (e.g. "REFORMER PILATES")
// instructor — optional, shown as "(NATA)" beside title
// note     — optional, shown in place of instructor (e.g. "COMING SOON")
// bookable — if false, the row is visible but disabled (no booking opens, "Coming soon" badge)

const weeklySchedule = [
  {
    id: "monday",
    label: "Monday",
    sections: [
      {
        heading: "Monday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "12:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "17:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "18:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "19:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true }
        ]
      }
    ]
  },
  {
    id: "tuesday",
    label: "Tuesday",
    sections: [
      {
        heading: "Tuesday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "12:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "17:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "18:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "19:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "20:00", title: "YOGA", note: "COMING SOON", bookable: false }
        ]
      }
    ]
  },
  {
    id: "wednesday",
    label: "Wednesday",
    sections: [
      {
        heading: "Wednesday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "12:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "18:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "19:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "20:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true }
        ]
      }
    ]
  },
  {
    id: "thursday",
    label: "Thursday",
    sections: [
      {
        heading: "Thursday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "12:00", title: "MAT PILATES", instructor: "ELLE", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "17:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "18:00", title: "MAT PILATES", instructor: "ELLE", bookable: true },
          { time: "19:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "20:00", title: "YOGA", note: "COMING SOON", bookable: false }
        ]
      }
    ]
  },
  {
    id: "friday",
    label: "Friday",
    sections: [
      {
        heading: "Friday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "12:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "17:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "18:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "19:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true }
        ]
      }
    ]
  },
  {
    id: "weekend",
    label: "Weekend",
    sections: [
      {
        heading: "Saturday",
        classes: [
          { time: "11:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true },
          { time: "12:00", title: "MAT PILATES", instructor: "NATA", bookable: true },
          { time: "13:00", title: "REFORMER PILATES", instructor: "NATA", bookable: true }
        ]
      },
      {
        heading: "Sunday",
        classes: [
          { time: "18:00", title: "REFORMER PILATES", instructor: "ELLE", bookable: true },
          { time: "19:00", title: "YOGA", note: "COMING SOON", bookable: false }
        ]
      }
    ]
  }
];

// === Timezone: Asia/Tbilisi (UTC+4, no DST) ===
const TBILISI_TZ = "Asia/Tbilisi";
const TBILISI_OFFSET_MS = 4 * 60 * 60 * 1000;

// Get Tbilisi wall-clock parts for a given Date (default: now).
// Returns { year, month, day, hour, minute, second, weekday }.
function getTbilisiParts(at) {
  const d = at || new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TBILISI_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24, // Intl can return "24" for midnight in some locales
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

// Build a UTC Date that represents the given Tbilisi wall-clock time.
function tbilisiToUTC(year, month, day, hour, minute, second) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - TBILISI_OFFSET_MS);
}

// Current moment, expressed in Tbilisi wall-clock.
function nowInTbilisi() {
  const p = getTbilisiParts(new Date());
  return tbilisiToUTC(p.year, p.month, p.day, p.hour, p.minute, p.second);
}

// Midnight today in Tbilisi.
function todayMidnightInTbilisi() {
  const p = getTbilisiParts(new Date());
  return tbilisiToUTC(p.year, p.month, p.day, 0, 0, 0);
}

// Map a slide id to its target day-of-week (0=Sun..6=Sat).
const DOW_OF_ID = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};
const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Return a UTC Date at midnight in Tbilisi for the next upcoming occurrence of dayId.
// If today matches dayId, returns today.
function nextOccurrenceOf(dayId) {
  const targetDow = DOW_OF_ID[dayId];
  if (targetDow === undefined) return null;
  const p = getTbilisiParts(new Date());
  const currentDow = DOW_NAMES.indexOf(p.weekday);
  let daysAhead = (targetDow - currentDow + 7) % 7;
  // Use UTC arithmetic on the Tbilisi date components, then convert back.
  const base = new Date(Date.UTC(p.year, p.month - 1, p.day));
  base.setUTCDate(base.getUTCDate() + daysAhead);
  return tbilisiToUTC(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), 0, 0, 0);
}

// Format a Tbilisi-midnight Date as "Jun 16".
function formatScheduleDate(date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TBILISI_TZ,
    month: "short", day: "numeric",
  });
  return fmt.format(date);
}

// === Booking state machine ===
// Per spec: 4 states — bookable, soon, past, comingSoon.
// - comingSoon: data.bookable === false (overrides everything)
// - past: class datetime is in the past (in Tbilisi)
// - soon: < 24h away (or > 7d, defensive)
// - bookable: 24h+ and <= 7d away

const SOON_REASON_24H = "Booking opens 24 hours before class.";
const SOON_REASON_7D  = "Bookings open 7 days before class.";
const PAST_REASON     = "This class has already started or passed.";
const COMING_REASON   = "This class is not bookable yet.";

function getBookingState(slot, dayDate) {
  // 1. Data-marked not bookable: always comingSoon.
  if (slot.bookable === false) {
    return {
      state: "comingSoon",
      label: "Coming soon",
      buttonLabel: "Soon",
      reason: COMING_REASON,
      disabled: true,
    };
  }
  // 2. Compute the class's exact start moment in Tbilisi.
  const parts = getTbilisiParts(dayDate);
  const [hh, mm] = slot.time.split(":").map(Number);
  const classStart = tbilisiToUTC(parts.year, parts.month, parts.day, hh, mm, 0);

  const now = nowInTbilisi();
  const hoursUntil = (classStart - now) / 36e5;
  const daysFromTodayMidnight = (classStart - todayMidnightInTbilisi()) / 864e5;

  // 3. Past
  if (classStart < now) {
    return {
      state: "past",
      label: "Past",
      buttonLabel: "Past",
      reason: PAST_REASON,
      disabled: true,
    };
  }
  // 4. Soon (< 24h, but in the future)
  if (hoursUntil < 24) {
    return {
      state: "soon",
      label: "Bookings open 24h before class",
      buttonLabel: "Closed",
      reason: SOON_REASON_24H,
      disabled: true,
    };
  }
  // 5. Defensive: > 7d (unreachable in this carousel, but keeps the 7d rule in code)
  if (daysFromTodayMidnight > 7) {
    return {
      state: "soon",
      label: "Bookings open 7 days before class",
      buttonLabel: "Not yet open",
      reason: SOON_REASON_7D,
      disabled: true,
    };
  }
  // 6. Bookable
  return {
    state: "bookable",
    label: "Book",
    buttonLabel: "Book",
    reason: "",
    disabled: false,
  };
}

// Stable id for a class row used by booking dedup.
function classRowId(dayId, klass) {
  const slot = klass.time.replace(":", "");
  const safe = klass.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${dayId}-${slot}-${safe}`;
}

// Row meta: "(NATA)" or "(COMING SOON)" — used in the row UI and WhatsApp.
function rowMeta(klass) {
  if (klass.note) return `(${klass.note})`;
  if (klass.instructor) return `(${klass.instructor})`;
  return "";
}

// === Expose to window for non-module script.js ===
if (typeof window !== "undefined") {
  window.weeklySchedule = weeklySchedule;
  window.classRowId = classRowId;
  window.rowMeta = rowMeta;
  window.nextOccurrenceOf = nextOccurrenceOf;
  window.getBookingState = getBookingState;
  window.formatScheduleDate = formatScheduleDate;
  window.nowInTbilisi = nowInTbilisi;
  window.TBILISI_TZ = TBILISI_TZ;
}
