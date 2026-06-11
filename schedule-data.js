// Her House — weekly class template (the recurring schedule, not specific instances).
// Edit this file to change the schedule shown on /schedule/.
// shape: array of { id, label, sections: [{ heading, classes: [{ time, title, instructor?, note?, bookable }] }] }
//
// id       — stable key for the slide (used by carousel + deep links)
// label    — fallback display name for the slide
// heading  — section heading inside the slide (usually the same as label; "Weekend" slide has "Saturday" and "Sunday")
// time     — "HH:MM" 24h
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

// Stable id for a class row used by booking flow + duplicate-prevention.
function classRowId(dayId, klass) {
  const slot = klass.time.replace(":", "");
  const safe = klass.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${dayId}-${slot}-${safe}`;
}

// Render row meta as a single short string: "(NATA)" or "(COMING SOON)".
function rowMeta(klass) {
  if (klass.note) return `(${klass.note})`;
  if (klass.instructor) return `(${klass.instructor})`;
  return "";
}

// Today → carousel index (0=Mon .. 4=Fri, 5=Weekend for Sat/Sun).
function todaySlideIndex() {
  const d = new Date().getDay();
  if (d === 0 || d === 6) return 5;
  return d - 1;
}

// Expose on window for non-module script.js to use.
if (typeof window !== "undefined") {
  window.weeklySchedule = weeklySchedule;
  window.classRowId = classRowId;
  window.rowMeta = rowMeta;
  window.todaySlideIndex = todaySlideIndex;
}
