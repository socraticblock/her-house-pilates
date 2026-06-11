// Her House — booking + nav.
// Modal lives only on /schedule/. Other pages link to /schedule/ for booking.
// Schedule data (weekly template) lives in schedule-data.js, loaded before this file.
// Studio WhatsApp: +995 555 12 34 56 (placeholder until owner confirms).

const STUDIO_WHATSAPP = "995555123456";
const WHATSAPP_BASE = `https://wa.me/${STUDIO_WHATSAPP}`;

// === Booking dedup (sessionStorage, per-tab) ===
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

// === DOM refs (only present on /schedule/) ===
const modal = document.querySelector("#booking-modal");
const selectedClassText = document.querySelector("#selected-class");
const classIdInput = document.querySelector("#class-id");
const form = document.querySelector("#booking-form");
const toast = document.querySelector("#toast");
const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");

// === Pending booking context (set when modal opens, read on submit) ===
let pendingBooking = null;

function setPendingBooking(ctx) {
  pendingBooking = ctx;
  if (classIdInput) classIdInput.value = ctx.id;
}

// === Phone normalization (Georgia +995 / 995 / local 5XXXXXXXX) ===
function normalizePhone(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (/^5\d{8}$/.test(digits)) return `+995${digits}`;
  if (/^\+?9955\d{8}$/.test(digits)) return digits.startsWith("+") ? digits : `+${digits}`;
  return digits.length >= 9 ? digits : "";
}

// === Toast ===
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 5200);
}

// === Modal open/close (weekly only — next-7-days flow is gone) ===
function openModalForSlot(slot, dayId, dayLabel, dayDate) {
  if (!modal || !form || !selectedClassText || !classIdInput) return;
  const id = window.classRowId(dayId, slot);
  const dateStr = window.formatScheduleDate(dayDate);
  const meta = window.rowMeta(slot);
  setPendingBooking({
    id,
    type: "weekly",
    slot,
    dayId,
    dayLabel,
    dayDate: dayDate.toISOString(),
  });
  selectedClassText.textContent = `${dayLabel}, ${dateStr} at ${slot.time} — ${slot.title} ${meta}`.trim();
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

// === WhatsApp (stopgap until real backend lands) ===
// v2 format: Class / Date / Time / Instructor / Notes / Name / WhatsApp.
// Removed: "Sent from her-house-pilates.com", "First time", polite close.
function openWhatsAppForWeekly(slot, dayLabel, dayDate, name, whatsapp, notes) {
  const dateStr = window.formatScheduleDate(dayDate);
  const lines = [
    `Hi Her House, I'd like to book a class.`,
    ``,
    `*Class:* ${slot.title}`,
    `*Date:* ${dateStr}`,
    `*Time:* ${slot.time}`,
  ];
  if (slot.instructor) lines.push(`*Instructor:* ${slot.instructor}`);
  if (notes) lines.push(`*Notes:* ${notes}`);
  lines.push(`*Name:* ${name}`);
  lines.push(`*WhatsApp:* ${whatsapp}`);
  const text = lines.join("\n");
  window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

// === Schedule carousel ===
//
// Renders 6 slides from window.weeklySchedule. Each row is date-aware:
// its booking state is computed against the next upcoming occurrence in
// Tbilisi local time, so 24h/7d/past/comingSoon rules hold regardless of
// the visitor's browser timezone.

function renderScheduleCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;
  const track = root.querySelector("[data-carousel-track]");
  const dots = root.querySelector("[data-carousel-dots]");
  const data = window.weeklySchedule;
  if (!track || !dots || !data) return;

  // Precompute per-section dates. The weekend slide has TWO sub-sections
  // (Saturday + Sunday) each with its own day-of-week, so each gets its own date.
  // Weekday slides have a single date.
  const slideDates = data.map((day) => ({
    day,
    dates: day.sections.map((section) => window.dateForSection(day.id, section.heading)),
  }));

  track.innerHTML = slideDates.map(({ day, dates }, i) => {
    const isWeekend = day.id === "weekend";
    // Slide-level date (used for the slide header) = first section's date.
    const headerDate = dates[0];
    const headerDateStr = window.formatScheduleDate(headerDate);
    const sections = day.sections.map((section, j) => {
      const dateStr = window.formatScheduleDate(dates[j]);
      return `
        <section class="day-section">
          <h3 class="section-head">${section.heading} <span class="slide-date">${dateStr}</span> <span class="slide-label">SCHEDULE</span></h3>
          <ul class="class-rows">
            ${section.classes.map((slot) => {
              const state = window.getBookingState(slot, dates[j]);
              const rowId = window.classRowId(day.id, slot);
              const meta = window.rowMeta(slot);
              const disabled = state.disabled;
              const stateLabel = state.disabled ? `<span class="class-state">${state.label}</span>` : "";
              return `
                <li>
                  <button type="button" class="class-row ${state.state}${disabled ? ' is-disabled' : ''}"
                          ${disabled
                            ? `aria-disabled="true" tabindex="-1" data-day-id="${day.id}" data-row-id="${rowId}"`
                            : `data-class-row="${rowId}" data-day-id="${day.id}"`}
                          aria-label="${disabled
                            ? `${slot.title} — ${state.label}`
                            : `Book ${slot.title} on ${day.label} ${window.formatScheduleDate(dates[j])} at ${slot.time}`}">
                    <span class="class-time">${slot.time}</span>
                    <span class="class-info">
                      <span class="class-title">${slot.title}</span>
                      ${meta ? `<span class="class-meta">${meta}</span>` : ''}
                      ${stateLabel}
                    </span>
                    <span class="class-book" aria-hidden="true">${state.buttonLabel}</span>
                  </button>
                </li>
              `;
            }).join('')}
          </ul>
        </section>
      `;
    }).join('');

    return `
      <article class="schedule-slide" data-day="${day.id}" role="tabpanel" aria-label="${day.label} schedule">
        <header class="slide-head">
          <h2 class="slide-day">${day.label} <span class="slide-date">${headerDateStr}</span></h2>
          ${!isWeekend ? '<span class="slide-label">SCHEDULE</span>' : ''}
        </header>
        ${sections}
      </article>
    `;
  }).join('');

  // Dots
  dots.innerHTML = data.map((day, i) => `
    <button type="button" class="carousel-dot" data-slide-index="${i}" aria-label="Go to ${day.label}" role="tab"></button>
  `).join('');

  initScheduleCarousel(root, data, slideDates);
}

function initScheduleCarousel(root, data, slideDates) {
  const track = root.querySelector("[data-carousel-track]");
  const dots = root.querySelector("[data-carousel-dots]");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const viewport = root.querySelector(".carousel-viewport");
  if (!track || !dots || !prev || !next) return;

  // Initial slide: deep link `?day=<id>` overrides; else the slide with the SOONEST
  // bookable class. Skips past/soon/comingSoon rows; falls back to slide 0 only if
  // literally every class across every slide is unbookable (extreme edge case).
  function computeInitialIndex() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("day");
    if (requested) {
      const idx = data.findIndex((d) => d.id === requested);
      if (idx >= 0) return idx;
    }
    const soonest = window.findSoonestBookableSlideIndex(slideDates);
    if (soonest >= 0) return soonest;
    return 0;
  }

  let index = computeInitialIndex();

  function goTo(i) {
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
  }

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  dots.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-slide-index]");
    if (!dot) return;
    goTo(Number(dot.dataset.slideIndex));
  });

  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(data.length - 1); }
  });

  // Click row → open modal with date+time+class preselected.
  // Disabled rows (state.disabled) do NOT open the modal; clicking shows a toast.
  track.addEventListener("click", (e) => {
    const row = e.target.closest("[data-class-row], [data-day-id][data-row-id]");
    if (!row) return;
    const rowId = row.dataset.classRow || row.dataset.rowId;
    const dayId = row.dataset.dayId;
    const isBookable = row.hasAttribute("data-class-row");
    // Find the matching slot (weekend sub-sections use their own date, not the slide's primary date)
    let found = null;
    outer: for (const sd of slideDates) {
      if (sd.day.id !== dayId) continue;
      for (let j = 0; j < sd.day.sections.length; j++) {
        const section = sd.day.sections[j];
        const slot = section.classes.find((s) => window.classRowId(dayId, s) === rowId);
        if (slot) { found = { slot, date: sd.dates[j], day: sd.day }; break outer; }
      }
    }
    if (!found) return;

    if (!isBookable) {
      // Disabled row — show a friendly message instead of opening the modal.
      const state = window.getBookingState(found.slot, found.date);
      showToast(state.reason);
      return;
    }
    openModalForSlot(found.slot, found.day.id, found.day.label, found.date);
  });

  // Touch swipe
  let startX = 0, startY = 0, tracking = false;
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

// === Boot ===
renderScheduleCarousel();

// === Global click handler ===
// - `[data-book-action]`: if modal exists, open with first bookable slot of the week;
//   otherwise navigate to /schedule/. Same UX across all pages.
// - `[data-close-modal]`: close modal.
// - `.mobile-nav a`: close mobile menu on link tap.
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-book-action]")) {
    if (modal) {
      // Find the first bookable slot of the week, using the same soonest-bookable
      // logic as the carousel's auto-open (so the modal lands on the earliest bookable).
      const data = window.weeklySchedule;
      if (data) {
        const slideDates = data.map((day) => ({
          day,
          dates: day.sections.map((section) => window.dateForSection(day.id, section.heading)),
        }));
        const idx = window.findSoonestBookableSlideIndex(slideDates);
        if (idx >= 0) {
          const day = data[idx];
          for (let j = 0; j < day.sections.length; j++) {
            const section = day.sections[j];
            const sectionDate = slideDates[idx].dates[j];
            const slot = section.classes.find((s) => window.getBookingState(s, sectionDate).state === "bookable");
            if (slot) { openModalForSlot(slot, day.id, day.label, sectionDate); return; }
          }
        }
        // Fallback: open modal empty (no bookable slot exists at all)
        if (selectedClassText) selectedClassText.textContent = "No bookable classes this week. Please message us on WhatsApp.";
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
    } else {
      window.location.href = "/schedule/";
    }
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

// === Form submit ===
// 1. Re-validate booking state at submit time (state may have slipped while the modal was open).
// 2. Dedup by classId + whatsapp in sessionStorage.
// 3. Open WhatsApp with v2 message format (Date + Notes added, no boilerplate).
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const whatsapp = normalizePhone(data.get("whatsapp") || "");
  const notes = String(data.get("notes") || "").trim();
  const firstTime = data.get("firstTime") === "on";

  if (!pendingBooking || pendingBooking.type !== "weekly") {
    showToast("Please choose a class from the schedule.");
    return;
  }
  if (!name) { showToast("Please add your name."); return; }
  if (!whatsapp) { showToast("Please add a valid WhatsApp number (e.g. +995 555 12 34 56)."); return; }

  // Re-validate: state may have changed (clock passed 24h threshold, etc.)
  const { slot, dayId, dayLabel } = pendingBooking;
  const dayDate = new Date(pendingBooking.dayDate);
  const state = window.getBookingState(slot, dayDate);
  if (state.state !== "bookable") {
    showToast(state.reason);
    closeModal();
    return;
  }

  // Dedup
  const key = `weekly:${pendingBooking.id}:${whatsapp}`;
  if (bookings.has(key)) {
    showToast("This WhatsApp number is already booked for that slot.");
    return;
  }

  bookings.set(key, {
    id: pendingBooking.id,
    name, whatsapp, notes, firstTime,
    slot, dayId, dayLabel,
    createdAt: Date.now(),
  });
  saveBookings(bookings);
  closeModal();
  showToast(`You're booked <3 — ${slot.title} on ${dayLabel} at ${slot.time}. We'll confirm by WhatsApp.`);
  openWhatsAppForWeekly(slot, dayLabel, dayDate, name, whatsapp, notes);
});
