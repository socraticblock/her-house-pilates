// Her House — booking + nav + weekly schedule carousel
// Static site, no backend. Bookings persist in sessionStorage only.
// Studio WhatsApp: +995 555 12 34 56 (placeholder until owner confirms)

const STUDIO_WHATSAPP = "995555123456";
const WHATSAPP_BASE = `https://wa.me/${STUDIO_WHATSAPP}`;

// Hardcoded "next 7 days" preview used by the home page schedule block.
// (Different from the recurring weekly template in schedule-data.js.)
const schedule = [
  { id: "flow-1", title: "Reformer Flow", level: "All Levels", dayOffset: 2, time: "09:00", duration: 60, capacity: 8, booked: 5, instructor: "Nata", status: "open" },
  { id: "beginner-1", title: "Beginner Reformer", level: "Beginner Friendly", dayOffset: 2, time: "11:00", duration: 60, capacity: 8, booked: 4, instructor: "Elle", status: "open" },
  { id: "sculpt-1", title: "Sculpt & Strength", level: "Intermediate", dayOffset: 2, time: "18:30", duration: 60, capacity: 8, booked: 6, instructor: "Nata", status: "open" },
  { id: "reset-1", title: "Stretch & Reset", level: "All Levels", dayOffset: 1, time: "09:00", duration: 50, capacity: 8, booked: 3, instructor: "Elle", status: "open" },
  { id: "flow-2", title: "Morning Reformer", level: "All Levels", dayOffset: 5, time: "10:00", duration: 50, capacity: 8, booked: 8, instructor: "Nata", status: "open" },
];

// Persist bookings in sessionStorage so refresh doesn't wipe them.
const BOOKINGS_KEY = "herhouse.bookings.v1";

function loadBookings() {
  try {
    const raw = sessionStorage.getItem(BOOKINGS_KEY);
    return raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
  } catch {
    return new Map();
  }
}

function saveBookings(map) {
  try {
    sessionStorage.setItem(BOOKINGS_KEY, JSON.stringify(Object.fromEntries(map)));
  } catch {
    /* sessionStorage disabled */
  }
}

const bookings = loadBookings();

const classList = document.querySelector(".class-list");
const modal = document.querySelector("#booking-modal");
const selectedClassText = document.querySelector("#selected-class");
const classIdInput = document.querySelector("#class-id");
const form = document.querySelector("#booking-form");
const toast = document.querySelector("#toast");
const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");

// ---- Booking context ----
// The modal can be opened from two places:
//   - Home page: a class from the next-7-days `schedule` array (date + time + capacity rules)
//   - Schedule page: a weekly slot (day + time, no specific date, no capacity rules)
// `pendingBooking` is set when the modal opens and read on submit.
let pendingBooking = null;

function setPendingBooking(ctx) {
  pendingBooking = ctx;
  if (classIdInput) classIdInput.value = ctx.id;
}

function classDate(item) {
  const date = new Date();
  date.setDate(date.getDate() + item.dayOffset);
  const [hours, minutes] = item.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeRange(date, duration) {
  const end = new Date(date.getTime() + duration * 60 * 1000);
  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  return `${date.toLocaleTimeString("en", options)} - ${end.toLocaleTimeString("en", options)}`;
}

function bookingState(item) {
  const date = classDate(item);
  const now = new Date();
  const hoursUntil = (date - now) / 36e5;
  const daysUntil = Math.floor((date - now) / 864e5);
  const spaces = item.capacity - item.booked;

  if (item.status === "cancelled") return { label: "Cancelled", buttonLabel: "Cancelled", disabled: true, reason: "This class has been cancelled." };
  if (spaces <= 0) return { label: "Class full", buttonLabel: "Class Full", disabled: true, reason: "This class is full." };
  if (hoursUntil <= 24) return { label: "Booking closed — less than 24h before class", buttonLabel: "Booking Closed", disabled: true, reason: "Booking closes 24 hours before class." };
  if (daysUntil > 7) return { label: "Bookings open 7 days before class", buttonLabel: "Not Yet Open", disabled: true, reason: "Bookings open 7 days before class." };
  return { label: `${spaces} spaces left`, buttonLabel: "Book Class", disabled: false, reason: "" };
}

function renderSchedule() {
  if (!classList) return;

  classList.innerHTML = schedule.map((item) => {
    const date = classDate(item);
    const state = bookingState(item);
    const closed = state.disabled ? " is-closed" : "";
    return `
      <article class="class-card${closed}">
        <div>
          <h3>${item.title}</h3>
          <p class="class-level">${item.level}</p>
        </div>
        <div>
          <p class="class-meta">${formatDate(date)}</p>
          <p class="class-meta">${formatTimeRange(date, item.duration)}</p>
          <p class="class-meta">Instructor: ${item.instructor}</p>
        </div>
        <p class="spaces">${state.label}</p>
        <button class="button button-solid" type="button" data-class-id="${item.id}" ${state.disabled ? "disabled" : ""}>
          ${state.buttonLabel}
        </button>
      </article>
    `;
  }).join("");
}

function openModal(item) {
  if (!modal || !form || !selectedClassText || !classIdInput) {
    window.location.href = "/schedule/";
    return;
  }
  const date = classDate(item);
  setPendingBooking({
    id: item.id,
    type: "next7",
    item,
    date,
  });
  selectedClassText.textContent = `${item.title} — ${formatDate(date)}, ${formatTimeRange(date, item.duration)} with ${item.instructor}.`;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => form.elements.name.focus(), 50);
}

// Open the modal for a weekly slot (schedule page). slot is from schedule-data.js.
function openModalForSlot(slot, dayId, dayLabel) {
  if (!modal || !form || !selectedClassText || !classIdInput) return;
  const id = window.classRowId(dayId, slot);
  const meta = window.rowMeta(slot);
  setPendingBooking({
    id,
    type: "weekly",
    slot,
    dayId,
    dayLabel,
  });
  selectedClassText.textContent = `${dayLabel} at ${slot.time} — ${slot.title} ${meta}`.trim();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => form.elements.name.focus(), 50);
}

function closeModal() {
  if (!modal || !form) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  form.reset();
  pendingBooking = null;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 5200);
}

// Accepts +995XXXXXXXXX, 995XXXXXXXXX, or local 9XXXXXXXX (8 digits).
// Returns E.164 string or empty.
function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (/^5\d{8}$/.test(digits)) return `+995${digits}`;
  if (/^\+?9955\d{8}$/.test(digits)) return digits.startsWith("+") ? digits : `+${digits}`;
  return digits.length >= 9 ? digits : "";
}

function openWhatsAppForNext7(item, name, whatsapp) {
  const date = classDate(item);
  const text = [
    `Hi Her House, I'd like to book a class.`,
    ``,
    `*Class:* ${item.title}`,
    `*Date:* ${formatDate(date)}`,
    `*Time:* ${formatTimeRange(date, item.duration)}`,
    `*Instructor:* ${item.instructor}`,
    `*Name:* ${name}`,
    `*WhatsApp:* ${whatsapp}`,
    ``,
    `Sent from her-house-pilates.com`,
  ].join("\n");
  window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function openWhatsAppForWeekly(slot, dayLabel, name, whatsapp) {
  const meta = window.rowMeta(slot);
  const text = [
    `Hi Her House, I'd like to book a class.`,
    ``,
    `*Day:* ${dayLabel}`,
    `*Time:* ${slot.time}`,
    `*Class:* ${slot.title}`,
    slot.instructor ? `*Instructor:* ${slot.instructor}` : null,
    `*Name:* ${name}`,
    `*WhatsApp:* ${whatsapp}`,
    ``,
    `Sent from her-house-pilates.com`,
  ].filter(Boolean).join("\n");
  window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

// ---- Weekly schedule carousel ----

function renderScheduleCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;
  const track = root.querySelector("[data-carousel-track]");
  const dots = root.querySelector("[data-carousel-dots]");
  const data = window.weeklySchedule;
  if (!track || !dots || !data) return;

  const today = new Date().getDay(); // 0=Sun..6=Sat

  // Build slides
  track.innerHTML = data.map((day, i) => {
    const isWeekend = day.id === "weekend";
    const isToday = (isWeekend && (today === 0 || today === 6)) || (!isWeekend && data.findIndex(d => d.id === ["monday","tuesday","wednesday","thursday","friday"][today === 0 || today === 6 ? 5 : today - 1]) === i);
    const sections = day.sections.map((section) => `
      <section class="day-section">
        <h3 class="section-head">${section.heading} <span class="slide-label">SCHEDULE</span></h3>
        <ul class="class-rows">
          ${section.classes.map((slot) => {
            const meta = window.rowMeta(slot);
            const disabled = !slot.bookable;
            const rowId = window.classRowId(day.id, slot);
            return `
              <li>
                <button type="button" class="class-row${disabled ? ' is-disabled' : ''}"
                        ${disabled ? 'aria-disabled="true" tabindex="-1"' : `data-class-row="${rowId}"`}
                        aria-label="${disabled ? `${slot.title} coming soon` : `Book ${slot.title} on ${day.label} at ${slot.time}`}">
                  <span class="class-time">${slot.time}</span>
                  <span class="class-info">
                    <span class="class-title">${slot.title}</span>
                    ${meta ? `<span class="class-meta">${meta}</span>` : ''}
                  </span>
                  <span class="class-book" aria-hidden="true"><span class="class-book-text">${disabled ? 'Soon' : 'Book'}</span></span>
                </button>
              </li>
            `;
          }).join('')}
        </ul>
      </section>
    `).join('');

    return `
      <article class="schedule-slide" data-day="${day.id}" role="tabpanel" aria-label="${day.label} schedule">
        <header class="slide-head">
          <h2 class="slide-day">${day.label}</h2>
          ${!isWeekend ? '<span class="slide-label">SCHEDULE</span>' : ''}
          <span class="slide-today"${isToday ? '' : ' hidden'}>Today</span>
        </header>
        ${sections}
      </article>
    `;
  }).join('');

  // Build dots
  dots.innerHTML = data.map((day, i) => `
    <button type="button" class="carousel-dot" data-slide-index="${i}" aria-label="Go to ${day.label}" role="tab"></button>
  `).join('');

  initScheduleCarousel(root, data);
}

function initScheduleCarousel(root, data) {
  const track = root.querySelector("[data-carousel-track]");
  const dots = root.querySelector("[data-carousel-dots]");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const viewport = root.querySelector(".carousel-viewport");
  if (!track || !dots || !prev || !next) return;

  let index = window.todaySlideIndex ? window.todaySlideIndex() : 0;
  if (index < 0 || index >= data.length) index = 0;

  function goTo(i, opts = {}) {
    if (i < 0) i = 0;
    if (i >= data.length) i = data.length - 1;
    index = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    dots.querySelectorAll(".carousel-dot").forEach((d, di) => {
      if (di === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    prev.disabled = i === 0;
    next.disabled = i === data.length - 1;
    if (opts.focus && typeof opts.focus === "string") {
      const slide = track.children[i];
      if (slide) {
        const target = slide.querySelector(opts.focus);
        if (target) target.focus();
      }
    }
  }

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  dots.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-slide-index]");
    if (!dot) return;
    goTo(Number(dot.dataset.slideIndex));
  });

  // Keyboard nav when carousel (or its viewport) has focus
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(data.length - 1); }
  });

  // Click row → open booking modal
  track.addEventListener("click", (e) => {
    const row = e.target.closest("[data-class-row]");
    if (!row) return;
    const rowId = row.dataset.classRow;
    // find the matching slot across all days
    for (const day of data) {
      for (const section of day.sections) {
        const slot = section.classes.find((s) => window.classRowId(day.id, s) === rowId);
        if (slot) {
          openModalForSlot(slot, day.id, day.label);
          return;
        }
      }
    }
  });

  // Touch swipe
  let startX = 0;
  let startY = 0;
  let tracking = false;
  viewport.addEventListener("touchstart", (e) => {
    if (!e.touches[0]) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });
  viewport.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    }
  });

  goTo(index);
}

// ---- Boot ----
renderSchedule();
renderScheduleCarousel();

// Click handler (shared by home page next-7-days + schedule page modal open)
document.addEventListener("click", (event) => {
  const classButton = event.target.closest("[data-class-id]");
  if (classButton && !classButton.disabled) {
    const id = classButton.dataset.classId;
    const found = schedule.find((entry) => entry.id === id);
    if (found) openModal(found);
  }

  if (event.target.closest("[data-book-first]")) {
    // If we're on the schedule page, preselect the first bookable class of today.
    const todayIdx = window.todaySlideIndex ? window.todaySlideIndex() : -1;
    if (window.weeklySchedule && todayIdx >= 0) {
      const today = window.weeklySchedule[todayIdx];
      for (const section of today.sections) {
        const slot = section.classes.find((s) => s.bookable);
        if (slot) { openModalForSlot(slot, today.id, today.label); return; }
      }
    }
    // Fallback: home page preview
    const firstOpen = schedule.find((item) => !bookingState(item).disabled);
    if (firstOpen) openModal(firstOpen);
  }

  if (event.target.closest("[data-close-modal]")) {
    closeModal();
  }

  if (event.target.closest(".mobile-nav a")) {
    mobileNav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

navToggle?.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal();
  }
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const whatsapp = normalizePhone(data.get("whatsapp") || "");

  if (!pendingBooking) {
    showToast("Please choose a class from the schedule.");
    return;
  }
  if (!name) {
    showToast("Please add your name.");
    return;
  }
  if (!whatsapp) {
    showToast("Please add a valid WhatsApp number (e.g. +995 555 12 34 56).");
    return;
  }

  // ---- Weekly template booking ----
  if (pendingBooking.type === "weekly") {
    const { slot, dayLabel } = pendingBooking;
    const key = `weekly:${pendingBooking.id}:${whatsapp}`;
    if (bookings.has(key)) {
      showToast("This WhatsApp number is already booked for that slot.");
      return;
    }
    bookings.set(key, { id: pendingBooking.id, name, whatsapp, slot, dayLabel, createdAt: Date.now() });
    saveBookings(bookings);
    closeModal();
    showToast(`You're booked <3 — ${slot.title} on ${dayLabel} at ${slot.time}. Please arrive 10 minutes early.`);
    openWhatsAppForWeekly(slot, dayLabel, name, whatsapp);
    return;
  }

  // ---- Next-7-days preview booking ----
  if (pendingBooking.type === "next7") {
    const item = pendingBooking.item;
    const classId = pendingBooking.id;
    const key = `${classId}:${whatsapp}`;
    if (bookings.has(key)) {
      showToast("This WhatsApp number is already booked for that class.");
      return;
    }
    const state = bookingState(item);
    if (state.disabled) {
      showToast(state.reason);
      closeModal();
      renderSchedule();
      return;
    }
    bookings.set(key, Object.fromEntries(data.entries()));
    item.booked += 1;
    saveBookings(bookings);
    closeModal();
    renderSchedule();
    const date = classDate(item);
    const time = formatTimeRange(date, item.duration);
    showToast(`You're booked <3 — ${item.title} on ${formatDate(date)}, ${time}. Please arrive 10 minutes early.`);
    openWhatsAppForNext7(item, name, whatsapp);
    return;
  }
});
