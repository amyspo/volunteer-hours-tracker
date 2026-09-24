// Change these values to customize the app.
const WORK_TYPES = ["Field Service", "Credit"];
const VOLUNTEER_YEAR_START_MONTH = 8; // September is month 8 when January is 0.
const STORAGE_KEY = "volunteerHoursApp";
const DEFAULT_YEARLY_GOAL = 600;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const entryForm = document.querySelector("#entry-form");
const entryDate = document.querySelector("#entry-date");
const entryType = document.querySelector("#entry-type");
const entryHours = document.querySelector("#entry-hours");
const entryNote = document.querySelector("#entry-note");
const formMessage = document.querySelector("#form-message");
const yearlyGoal = document.querySelector("#yearly-goal");
const reportMonth = document.querySelector("#report-month");
const entriesList = document.querySelector("#entries-list");

let appData = loadData();

// Return the volunteer year label for a date. September starts a new year.
function getVolunteerYearLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const startYear =
    date.getMonth() >= VOLUNTEER_YEAR_START_MONTH
      ? date.getFullYear()
      : date.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
}

// Return the volunteer year that is current today.
function getCurrentVolunteerYearLabel() {
  return getVolunteerYearLabel(getLocalDateString(new Date()));
}

// Turn a local Date into the date format used by the date input.
function getLocalDateString(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

// Read saved data, or use a clean starting state.
function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return { goal: DEFAULT_YEARLY_GOAL, entries: [] };

  try {
    const parsedData = JSON.parse(savedData);
    return {
      goal:
        Number(parsedData.goal) > 0
          ? Number(parsedData.goal)
          : DEFAULT_YEARLY_GOAL,
      entries: Array.isArray(parsedData.entries) ? parsedData.entries : [],
    };
  } catch (error) {
    return { goal: DEFAULT_YEARLY_GOAL, entries: [] };
  }
}

// Save the current app data on this device.
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// Format a number without unnecessary trailing zeroes.
function formatHours(hours) {
  return Number(hours)
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

// Build the type and month dropdown choices.
function buildSelectors() {
  WORK_TYPES.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    entryType.appendChild(option);
  });

  for (let offset = 0; offset < 12; offset += 1) {
    const monthNumber = (VOLUNTEER_YEAR_START_MONTH + offset) % 12;
    const option = document.createElement("option");
    option.value = String(monthNumber);
    option.textContent = monthNames[monthNumber];
    reportMonth.appendChild(option);
  }

  document.querySelector("#type-a-label").textContent = WORK_TYPES[0];
  document.querySelector("#type-b-label").textContent = WORK_TYPES[1];
}

// Return the entries for the currently displayed volunteer year.
function getCurrentYearEntries() {
  const currentYearLabel = getCurrentVolunteerYearLabel();
  return appData.entries.filter(
    (entry) => getVolunteerYearLabel(entry.date) === currentYearLabel,
  );
}

// Show the current volunteer year's total and progress bar.
function updateYearlyProgress() {
  const currentYearEntries = getCurrentYearEntries();
  const hoursDone = currentYearEntries.reduce(
    (total, entry) => total + Number(entry.hours),
    0,
  );
  const hoursRemaining = Math.max(Number(appData.goal) - hoursDone, 0);
  const progressPercent = Math.min(
    (hoursDone / Number(appData.goal)) * 100,
    100,
  );
  const progressBar = document.querySelector("#progress-bar");
  const progressTrack = document.querySelector(".progress-track");

  document.querySelector("#volunteer-year-label").textContent =
    getCurrentVolunteerYearLabel();
  document.querySelector("#hours-done").textContent = formatHours(hoursDone);
  document.querySelector("#hours-remaining").textContent =
    formatHours(hoursRemaining);
  progressBar.style.width = `${progressPercent}%`;
  progressTrack.setAttribute("aria-valuemax", appData.goal);
  progressTrack.setAttribute("aria-valuenow", hoursDone);
  document.querySelector("#progress-message").textContent =
    hoursDone >= appData.goal
      ? "Goal reached. Great work."
      : `${formatHours(progressPercent)}% of your goal`;
}

// Show totals for the selected month and work type.
function updateMonthlyReport() {
  const selectedMonth = Number(reportMonth.value);
  const monthEntries = getCurrentYearEntries().filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`);
    return date.getMonth() === selectedMonth;
  });
  const typeAHours = monthEntries
    .filter((entry) => entry.type === WORK_TYPES[0])
    .reduce((total, entry) => total + Number(entry.hours), 0);
  const typeBHours = monthEntries
    .filter((entry) => entry.type === WORK_TYPES[1])
    .reduce((total, entry) => total + Number(entry.hours), 0);

  document.querySelector("#type-a-hours").textContent = formatHours(typeAHours);
  document.querySelector("#type-b-hours").textContent = formatHours(typeBHours);
  document.querySelector("#month-total").textContent = formatHours(
    typeAHours + typeBHours,
  );
}

// Render every saved entry, newest date first.
function renderEntries() {
  entriesList.innerHTML = "";
  const sortedEntries = [...appData.entries].sort((first, second) => {
    return second.date.localeCompare(first.date) || second.id - first.id;
  });

  if (sortedEntries.length === 0) {
    entriesList.innerHTML =
      '<p class="empty-state">No entries yet. Add your first record above.</p>';
    return;
  }

  sortedEntries.forEach((entry) => {
    const entryElement = document.createElement("article");
    entryElement.className = "entry";
    entryElement.innerHTML = `
      <div class="entry-details">
        <div class="entry-main">
          <span class="entry-date">${formatDate(entry.date)}</span>
          <span class="entry-type">${escapeHtml(entry.type)}</span>
          <span class="entry-hours">${formatHours(entry.hours)} hours</span>
        </div>
        ${entry.note ? `<p class="entry-note">${escapeHtml(entry.note)}</p>` : ""}
      </div>
      <button class="delete-button" type="button" data-entry-id="${entry.id}">Delete</button>
    `;
    entriesList.appendChild(entryElement);
  });
}

// Format dates for display without changing the saved date.
function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Keep notes and types safe when adding them to the page.
function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

// Add a new entry after checking the required fields.
function addEntry(event) {
  event.preventDefault();
  const hours = Number(entryHours.value);

  if (
    !entryDate.value ||
    !WORK_TYPES.includes(entryType.value) ||
    !Number.isFinite(hours) ||
    hours <= 0
  ) {
    formMessage.textContent =
      "Please choose a type and enter a positive number of hours.";
    return;
  }

  appData.entries.push({
    id: Date.now(),
    date: entryDate.value,
    type: entryType.value,
    hours,
    note: entryNote.value.trim(),
  });
  saveData();
  entryHours.value = "";
  entryNote.value = "";
  formMessage.textContent = "Entry added.";
  refreshDisplay();
}

// Remove one entry after a deliberate button click.
function deleteEntry(event) {
  const button = event.target.closest("[data-entry-id]");
  if (!button) return;
  appData.entries = appData.entries.filter(
    (entry) => String(entry.id) !== button.dataset.entryId,
  );
  saveData();
  refreshDisplay();
}

// Update all visible sections after data or a selection changes.
function refreshDisplay() {
  updateYearlyProgress();
  updateMonthlyReport();
  renderEntries();
}

// Set the initial values and connect the controls.
function startApp() {
  entryDate.value = getLocalDateString(new Date());
  yearlyGoal.value = appData.goal;

  buildSelectors();
  reportMonth.value = String(new Date().getMonth());
  entryForm.addEventListener("submit", addEntry);
  entriesList.addEventListener("click", deleteEntry);
  reportMonth.addEventListener("change", updateMonthlyReport);
  yearlyGoal.addEventListener("change", () => {
    const newGoal = Number(yearlyGoal.value);
    if (Number.isFinite(newGoal) && newGoal > 0) {
      appData.goal = newGoal;
      saveData();
      refreshDisplay();
    } else {
      yearlyGoal.value = appData.goal;
    }
  });
  document
    .querySelector("#export-button")
    .addEventListener("click", exportBackup);
  document
    .querySelector("#import-file")
    .addEventListener("change", importBackup);
  refreshDisplay();
}

// Download all saved data as a JSON backup.
function exportBackup() {
  const backup = new Blob([JSON.stringify(appData, null, 2)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(backup);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "volunteer-hours-backup.json";
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

// Load a JSON backup after checking its basic shape.
function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedData = JSON.parse(reader.result);
      if (
        !Array.isArray(importedData.entries) ||
        !(Number(importedData.goal) > 0)
      )
        throw new Error("Invalid backup");
      appData = {
        goal: Number(importedData.goal),
        entries: importedData.entries,
      };
      saveData();
      yearlyGoal.value = appData.goal;
      refreshDisplay();
      formMessage.textContent = "Backup imported.";
    } catch (error) {
      formMessage.textContent =
        "That file is not a valid volunteer hours backup.";
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

startApp();
