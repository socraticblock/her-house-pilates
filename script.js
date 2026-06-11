// Her House — booking + nav
// Static site, no backend. Bookings persist in sessionStorage only.
// Studio WhatsApp: +995 555 12 34 56 (placeholder until owner confirms)

const STUDIO_WHATSAPP = "995555123456";
const WHATSAPP_BASE = `https://wa.me/${STUDIO_WHATSAPP}`;

const schedule = [
  { id: "flow-1", title: "Reformer Flow", level: "All Levels", dayOffset: 2, time: "09:00", duration: 60, capacity: 8, booked: 5, instructor: "Nata", status: "open" },
  { id: "beginner-1", title: "Beginner Reformer", level: "Beginner Friendly", dayOffset: 2, time: "11:00", duration: 60, capacity: 8, booked: 4, instructor: "Elle", status: "open" },
  { id: "sculpt-1", title: "Sculpt & Strength", level: "Intermediate", dayOffset: 2, time: "18:30", duration: 60, capacity: 8, booked: 6, instructor: "Nata", status: "open" },
  { id: "reset-1", title: "Stretch & Reset", level: "All Levels", dayOffset: 1, time: "09:00", duration: 50, capacity: 8, booked: 3, instructor: "Elle", status: "open" },
  { id: "flow-2", title: "Morning Reformer", level: "All Levels", dayOffset: 5, time: "10:00", duration: 50, capacity: 8, booked: 8, instructor: "Nata", status: "open" },
];

// Persist bookings in sessionStorage so refresh doesn't wipe them.
// Key: `${classId}:${whatsapp}`  -> booking payload
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
  // Inclusive 24-hour rule: classes within 24 hours are closed.
  const hoursUntil = (date - now) / 36e5;
  // 7-day window: floor to day boundary so "exactly 7 days away" is allowed.
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
  selectedClassText.textContent = `${item.title} — ${formatDate(date)}, ${formatTimeRange(date, item.duration)} with ${item.instructor}.`;
  classIdInput.value = item.id;
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
  // Normalize local Georgian format
  if (/^5\d{8}$/.test(digits)) return `+995${digits}`;
  if (/^\+?9955\d{8}$/.test(digits)) return digits.startsWith("+") ? digits : `+${digits}`;
  // Fall back to whatever they typed (with at least 9 digits)
  return digits.length >= 9 ? digits : "";
}

function openWhatsAppBooking(item, name, whatsapp) {
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

renderSchedule();

document.addEventListener("click", (event) => {
  const classButton = event.target.closest("[data-class-id]");
  if (classButton && !classButton.disabled) {
    const id = classButton.dataset.classId;
    const found = schedule.find((entry) => entry.id === id);
    if (found) openModal(found);
  }

  if (event.target.closest("[data-book-first]")) {
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
  const classId = data.get("classId");
  const item = schedule.find((entry) => entry.id === classId);
  const name = String(data.get("name") || "").trim();
  const whatsapp = normalizePhone(data.get("whatsapp") || "");

  if (!item) {
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

  // Open WhatsApp to the studio with the booking pre-filled (stopgap until real backend).
  openWhatsAppBooking(item, name, whatsapp);
});
