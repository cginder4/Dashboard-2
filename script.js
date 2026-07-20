function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock");
  if (clock) {
    clock.textContent = "Time: " + now.toLocaleTimeString();
  }
}
setInterval(updateClock, 1000);

async function updateServer() {
  try {
    const response = await fetch("http://192.168.0.46:5000/server_stats");
    const data = await response.json();
    const cpuTemp = document.getElementById("cpu-temp");
    const RAM = document.getElementById("RAM");
    const jellyfinStatus = document.getElementById("jellyfin_status");
    cpuTemp.textContent = "CPU: " + data.cpu + "%";
    RAM.textContent = "RAM: " + data.ram + "%";
    jellyfinStatus.textContent = "Jellyfin: " + data.jellyfin_status;
  } catch (error) {
    console.warn("Server stats unavailable", error);
  }
}
setInterval(updateServer, 1000);

const storageKey = "creatine-tracker-state";
const button = document.getElementById("creatine-taken-button");
const feedback = document.getElementById("creatine-feedback");
const streakCount = document.getElementById("streak");

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

function loadTrackerState() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return { streak: 0, lastDate: null };
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Could not parse creatine tracker data", error);
    return { streak: 0, lastDate: null };
  }
}

function saveTrackerState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function updateTrackerUI(state) {
  const today = formatDate(new Date());
  const isLoggedToday = state.lastDate === today;

  if (feedback) {
    feedback.textContent = isLoggedToday ? "Creatine taken" : "Creatine not logged yet";
  }

  if (streakCount) {
    streakCount.textContent = `Current streak: ${state.streak} day${state.streak === 1 ? "" : "s"}`;
  }

  if (button) {
    button.disabled = isLoggedToday;
    button.textContent = isLoggedToday ? "Creatine logged for today" : "Creatine Taken";
  }
}

function markCreatineTaken() {
  const today = formatDate(new Date());
  const state = loadTrackerState();

  if (state.lastDate === today) {
    updateTrackerUI(state);
    return;
  }

  const yesterday = getDateOffset(-1);
  let nextStreak = 1;

  if (state.lastDate === yesterday) {
    nextStreak = state.streak + 1;
  } else if (state.lastDate && state.lastDate !== today) {
    nextStreak = 1;
  }

  const updatedState = { streak: nextStreak, lastDate: today };
  saveTrackerState(updatedState);
  updateTrackerUI(updatedState);
}

if (button) {
  button.addEventListener("click", markCreatineTaken);
}
updateTrackerUI(loadTrackerState());

const weightStorageKey = "bodyweight-history";
const workoutStorageKey = "detailed-workout-days";
let selectedWorkoutDayId = null;
const muscleGroupOptions = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

function loadWeightEntries() {
  const stored = localStorage.getItem(weightStorageKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Could not parse weight data", error);
    return [];
  }
}

function saveWeightEntries(entries) {
  localStorage.setItem(weightStorageKey, JSON.stringify(entries));
}

function renderWeightChart(entries) {
  const svg = document.getElementById("weight-chart");
  if (!svg) return;

  const relevant = entries.slice(-7);
  if (relevant.length === 0) {
    svg.innerHTML = "<text x='16' y='80' fill='#18453B'>Add a weight entry to start the trend.</text>";
    return;
  }

  const width = 320;
  const height = 140;
  const padding = 18;
  const values = relevant.map((entry) => Number(entry.weight));
  const minValue = Math.min(...values) - 1;
  const maxValue = Math.max(...values) + 1;
  const stepX = (width - padding * 2) / Math.max(relevant.length - 1, 1);
  const stepY = (height - padding * 2) / Math.max(maxValue - minValue, 1);

  const points = relevant.map((entry, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (Number(entry.weight) - minValue) * stepY;
    return `${x},${y}`;
  }).join(" ");

  const line = `<polyline fill="none" stroke="#18453B" stroke-width="3" points="${points}" />`;
  const circles = relevant.map((entry, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (Number(entry.weight) - minValue) * stepY;
    return `<circle cx="${x}" cy="${y}" r="4" fill="#1f5f4c" />`;
  }).join("");

  const labels = relevant.map((entry, index) => {
    const x = padding + index * stepX;
    return `<text x="${x}" y="${height - 4}" text-anchor="middle" font-size="10" fill="#56766f">${entry.date.slice(5)}</text>`;
  }).join("");

  svg.innerHTML = `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#dce6e2" />${line}${circles}${labels}`;
}

function renderWeightHistory(entries) {
  const list = document.getElementById("weight-history");
  if (!list) return;

  if (entries.length === 0) {
    list.innerHTML = "<li>No weight entries yet.</li>";
    return;
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  list.innerHTML = sorted.slice(-7).reverse().map((entry) => `<li>${entry.date}: ${entry.weight} lb</li>`).join("");
}

function renderWeightSummary(entries) {
  const current = document.getElementById("weight-current");
  const change = document.getElementById("weight-change");
  if (!current || !change) return;

  if (entries.length === 0) {
    current.textContent = "—";
    change.textContent = "—";
    return;
  }

  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];

  current.textContent = `${latest.weight} lb`;

  if (!previous) {
    change.textContent = "New entry";
  } else {
    const delta = latest.weight - previous.weight;
    change.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} lb`;
  }
}

function setupWeightTracker() {
  const form = document.getElementById("weight-form");
  const dateInput = document.getElementById("weight-date");
  const weightInput = document.getElementById("weight-value");
  if (!form || !dateInput || !weightInput) return;

  dateInput.value = formatDate(new Date());

  const entries = loadWeightEntries();
  renderWeightChart(entries);
  renderWeightHistory(entries);
  renderWeightSummary(entries);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const entry = {
      date: dateInput.value,
      weight: Number(weightInput.value)
    };

    const existing = loadWeightEntries();
    const updated = [...existing];
    const index = updated.findIndex((item) => item.date === entry.date);

    if (index >= 0) {
      updated[index] = entry;
    } else {
      updated.push(entry);
    }

    updated.sort((a, b) => a.date.localeCompare(b.date));
    saveWeightEntries(updated);

    renderWeightChart(updated);
    renderWeightHistory(updated);
    renderWeightSummary(updated);

    form.reset();
    dateInput.value = formatDate(new Date());
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadWorkoutDays() {
  const stored = localStorage.getItem(workoutStorageKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored).map(normalizeWorkoutDay);
  } catch (error) {
    console.warn("Could not parse workout data", error);
    return [];
  }
}

function saveWorkoutDays(days) {
  localStorage.setItem(workoutStorageKey, JSON.stringify(days.map(normalizeWorkoutDay)));
}

function createWorkoutDay(title, date) {
  return {
    id: `day-${Date.now()}`,
    title: title.trim() || `Workout ${date}`,
    date,
    muscleGroups: [],
    savedAt: null
  };
}

function getSortedWorkoutDays(days) {
  return [...days].sort((a, b) => b.date.localeCompare(a.date));
}

function getWorkoutDaySummary(day) {
  const exerciseCount = (day.muscleGroups || []).reduce((total, group) => total + (group.exercises || []).length, 0);
  const entryCount = (day.muscleGroups || []).reduce((total, group) => total + (group.exercises || []).reduce((groupTotal, exercise) => groupTotal + ((exercise.entries || []).length), 0), 0);
  const status = day.savedAt ? "Saved" : "Draft";
  return { exerciseCount, entryCount, status };
}

function renderWorkoutSummary(day) {
  const summary = document.getElementById("workout-day-summary");
  const saveStatus = document.getElementById("workout-save-status");
  if (!summary) return;

  if (!day) {
    summary.innerHTML = "";
    if (saveStatus) saveStatus.textContent = "";
    return;
  }

  const { exerciseCount, entryCount, status } = getWorkoutDaySummary(day);
  summary.innerHTML = `
    <strong>${escapeHtml(day.title)}</strong><br>
    <span>${day.date} • ${status} • ${day.muscleGroups.length} muscle group${day.muscleGroups.length === 1 ? "" : "s"} • ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} • ${entryCount} entry${entryCount === 1 ? "" : "s"}</span>
  `;

  if (saveStatus) {
    saveStatus.textContent = day.savedAt ? `Saved ${new Date(day.savedAt).toLocaleString()}` : "Unsaved draft. Use Save workout day when you are finished.";
  }
}

function renderWorkoutHistory(days) {
  const list = document.getElementById("workout-history");
  const count = document.getElementById("workout-count");
  if (!list) return;

  if (count) {
    count.textContent = String(days.length);
  }

  if (days.length === 0) {
    list.innerHTML = "<li>No workout days yet.</li>";
    return;
  }

  const sorted = getSortedWorkoutDays(days);
  list.innerHTML = sorted.map((day) => {
    const { exerciseCount, entryCount, status } = getWorkoutDaySummary(day);
    return `
      <button type="button" class="workout-day-select ${day.id === selectedWorkoutDayId ? "active" : ""}" data-day-id="${day.id}">
        <strong>${escapeHtml(day.title)}</strong><br>
        <span>${day.date} • ${status} • ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} • ${entryCount} entry${entryCount === 1 ? "" : "s"}</span>
      </button>
    `;
  }).join("");
}

function getExerciseOptionsForGroup(groupName) {
  const optionsByGroup = {
    Chest: ["Bench Press", "Incline Dumbbell Press", "Push-Ups", "Dips"],
    Back: ["Lat Pulldown", "Seated Row", "Chest-Supported Row", "Deadlift"],
    Legs: ["Squat", "Romanian Deadlift", "Leg Press", "Lunge"],
    Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Shrugs"],
    Arms: ["Biceps Curl", "Hammer Curl", "Triceps Extension", "Skull Crusher"],
    Core: ["Plank", "Crunches", "Hanging Knee Raise", "Russian Twist"]
  };

  return optionsByGroup[groupName] || ["Custom Exercise"];
}

function normalizeWorkoutDay(day) {
  if (!day || !Array.isArray(day.muscleGroups)) return day;

  day.muscleGroups.forEach((group) => {
    group.exercises = (group.exercises || []).map((exercise) => {
      if (Array.isArray(exercise.entries)) {
        return exercise;
      }

      if (Array.isArray(exercise.sets)) {
        return {
          ...exercise,
          entries: exercise.sets.map((set) => ({
            sets: set.sets || 1,
            reps: set.reps || 0,
            weight: set.weight || 0,
            notes: set.notes || ""
          }))
        };
      }

      return {
        ...exercise,
        entries: []
      };
    });
  });

  return day;
}

function renderWorkoutBuilder(day) {
  const builder = document.getElementById("workout-day-builder");
  if (!builder) return;

  if (!day) {
    builder.innerHTML = "<p class='empty-text'>Create a workout day to start tracking exercises and sets.</p>";
    renderWorkoutSummary(null);
    return;
  }

  const muscleGroupOptionsMarkup = muscleGroupOptions.map((option) => `<option value="${option}">${option}</option>`).join("");

  builder.innerHTML = `
    <div class="workout-builder">
      <div class="selected-day-card">
        <div class="inline-fields">
          <label>
            Day name
            <input class="day-title-input" data-day-id="${day.id}" type="text" value="${escapeHtml(day.title)}">
          </label>
          <label>
            Date
            <input class="day-date-input" data-day-id="${day.id}" type="date" value="${day.date}">
          </label>
        </div>
        <div class="exercise-adder">
          <select id="muscle-group-selector">${muscleGroupOptionsMarkup}</select>
          <button id="add-muscle-group-btn" type="button">Add muscle group</button>
          <button id="save-workout-day-btn" type="button">Save workout day</button>
        </div>
      </div>

      <div class="muscle-group-list">
        ${day.muscleGroups.length === 0 ? '<p class="empty-text">Add a muscle group to begin building this day.</p>' : day.muscleGroups.map((group, groupIndex) => `
          <div class="muscle-group-card">
            <div class="muscle-group-header">
              <h3>${escapeHtml(group.name)}</h3>
              <button class="remove-muscle-group-btn" data-group-index="${groupIndex}" type="button">Remove</button>
            </div>

            <div class="exercise-adder">
              <select class="exercise-option-select" data-group-index="${groupIndex}">
                ${getExerciseOptionsForGroup(group.name).map((option) => `<option value="${option}">${option}</option>`).join("")}
              </select>
              <button class="add-exercise-btn" data-group-index="${groupIndex}" type="button">Add exercise</button>
            </div>

            <div class="exercise-list">
              ${group.exercises.length === 0 ? '<p class="empty-text">No exercises logged yet.</p>' : group.exercises.map((exercise, exerciseIndex) => `
                <div class="exercise-card">
                  <div class="exercise-header">
                    <select class="exercise-name-select" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}">
                      ${getExerciseOptionsForGroup(group.name).map((option) => `<option value="${option}" ${option === exercise.name ? "selected" : ""}>${option}</option>`).join("")}
                    </select>
                    <button class="add-set-entry-btn" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" type="button">Add entry</button>
                    <button class="remove-exercise-btn" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" type="button">Remove</button>
                  </div>

                  <div class="set-list">
                    ${(exercise.entries || []).length === 0 ? '<p class="empty-text">No entries logged yet.</p>' : (exercise.entries || []).map((entry, entryIndex) => `
                      <div class="set-row">
                        <input class="set-sets-input" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" data-entry-index="${entryIndex}" type="number" min="1" value="${entry.sets || 3}">
                        <input class="set-reps-input" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" data-entry-index="${entryIndex}" type="number" min="1" value="${entry.reps || 10}">
                        <input class="set-weight-input" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" data-entry-index="${entryIndex}" type="number" step="0.25" value="${entry.weight || 0}">
                        <input class="set-notes-input" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" data-entry-index="${entryIndex}" type="text" value="${escapeHtml(entry.notes || "")}" placeholder="Notes">
                        <button class="remove-set-entry-btn" data-group-index="${groupIndex}" data-exercise-index="${exerciseIndex}" data-entry-index="${entryIndex}" type="button">Remove</button>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  renderWorkoutSummary(day);
}

function renderWorkoutTracker() {
  const days = getSortedWorkoutDays(loadWorkoutDays());
  if (!selectedWorkoutDayId && days.length > 0) {
    selectedWorkoutDayId = days[0].id;
  }
  const selectedDay = days.find((day) => day.id === selectedWorkoutDayId) || null;
  renderWorkoutHistory(days);
  renderWorkoutBuilder(selectedDay);
}

function updateWorkoutDay(dayId, updater) {
  const days = loadWorkoutDays();
  const day = days.find((entry) => entry.id === dayId);
  if (!day) return;
  updater(day);
  saveWorkoutDays(days);
  renderWorkoutTracker();
}

function createWorkoutDayFromForm() {
  const titleInput = document.getElementById("workout-day-title");
  const dateInput = document.getElementById("workout-day-date");
  if (!titleInput || !dateInput) return;

  const newDay = createWorkoutDay(titleInput.value, dateInput.value || formatDate(new Date()));
  const days = loadWorkoutDays();
  days.push(newDay);
  saveWorkoutDays(days);
  selectedWorkoutDayId = newDay.id;
  titleInput.value = "";
  dateInput.value = formatDate(new Date());
  renderWorkoutTracker();
}

function saveWorkoutDay() {
  if (!selectedWorkoutDayId) return;
  const days = loadWorkoutDays();
  const day = days.find((entry) => entry.id === selectedWorkoutDayId);
  if (!day) return;

  day.savedAt = new Date().toISOString();
  saveWorkoutDays(days);
  renderWorkoutTracker();
}

function addMuscleGroupToSelectedDay() {
  const selector = document.getElementById("muscle-group-selector");
  if (!selector || !selectedWorkoutDayId) return;

  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    day.muscleGroups.push({
      name: selector.value,
      exercises: []
    });
  });
}

function addExerciseToGroup(groupIndex, exerciseName) {
  if (!selectedWorkoutDayId) return;
  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    if (!group) return;
    const trimmedName = exerciseName.trim();
    if (trimmedName) {
      group.exercises.push({ name: trimmedName, entries: [] });
    }
  });
}

function addSetEntryToExercise(groupIndex, exerciseIndex) {
  if (!selectedWorkoutDayId) return;
  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    const exercise = group && group.exercises[exerciseIndex];
    if (!exercise) return;
    exercise.entries = exercise.entries || [];
    exercise.entries.push({ sets: 3, reps: 10, weight: 0, notes: "" });
  });
}

function removeSetEntryFromExercise(groupIndex, exerciseIndex, entryIndex) {
  if (!selectedWorkoutDayId) return;
  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    const exercise = group && group.exercises[exerciseIndex];
    if (!exercise) return;
    exercise.entries = exercise.entries || [];
    exercise.entries.splice(entryIndex, 1);
  });
}

function removeExerciseFromGroup(groupIndex, exerciseIndex) {
  if (!selectedWorkoutDayId) return;
  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    if (!group) return;
    group.exercises.splice(exerciseIndex, 1);
  });
}

function removeMuscleGroup(groupIndex) {
  if (!selectedWorkoutDayId) return;
  updateWorkoutDay(selectedWorkoutDayId, (day) => {
    day.muscleGroups.splice(groupIndex, 1);
  });
}

function updateDayTitle(dayId, value) {
  updateWorkoutDay(dayId, (day) => {
    day.title = value;
  });
}

function updateDayDate(dayId, value) {
  updateWorkoutDay(dayId, (day) => {
    day.date = value;
  });
}

function updateExerciseName(dayId, groupIndex, exerciseIndex, value) {
  updateWorkoutDay(dayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    const exercise = group && group.exercises[exerciseIndex];
    if (exercise) {
      exercise.name = value;
    }
  });
}

function updateEntryField(dayId, groupIndex, exerciseIndex, entryIndex, field, value) {
  updateWorkoutDay(dayId, (day) => {
    const group = day.muscleGroups[groupIndex];
    const exercise = group && group.exercises[exerciseIndex];
    const entry = exercise && exercise.entries && exercise.entries[entryIndex];
    if (entry) {
      entry[field] = field === "sets" || field === "reps" || field === "weight" ? Number(value) : value;
    }
  });
}

function setupWorkoutTracker() {
  const createButton = document.getElementById("create-workout-day-btn");
  const titleInput = document.getElementById("workout-day-title");
  const dateInput = document.getElementById("workout-day-date");
  if (!createButton || !titleInput || !dateInput) return;

  dateInput.value = formatDate(new Date());
  renderWorkoutTracker();

  createButton.addEventListener("click", createWorkoutDayFromForm);

  document.getElementById("workout-day-builder").addEventListener("click", (event) => {
    const target = event.target;
    if (target.id === "add-muscle-group-btn") {
      addMuscleGroupToSelectedDay();
      return;
    }

    if (target.id === "save-workout-day-btn") {
      saveWorkoutDay();
      return;
    }

    if (target.classList.contains("workout-day-select")) {
      selectedWorkoutDayId = target.dataset.dayId;
      renderWorkoutTracker();
      return;
    }

    if (target.classList.contains("add-exercise-btn")) {
      const groupIndex = Number(target.dataset.groupIndex);
      const select = target.closest(".exercise-adder").querySelector(".exercise-option-select");
      addExerciseToGroup(groupIndex, select ? select.value : "");
      return;
    }

    if (target.classList.contains("add-set-entry-btn")) {
      addSetEntryToExercise(Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex));
      return;
    }

    if (target.classList.contains("remove-set-entry-btn")) {
      removeSetEntryFromExercise(Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), Number(target.dataset.entryIndex));
      return;
    }

    if (target.classList.contains("remove-exercise-btn")) {
      removeExerciseFromGroup(Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex));
      return;
    }

    if (target.classList.contains("remove-muscle-group-btn")) {
      removeMuscleGroup(Number(target.dataset.groupIndex));
    }
  });

  document.getElementById("workout-day-builder").addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("day-title-input")) {
      updateDayTitle(target.dataset.dayId, target.value);
      return;
    }

    if (target.classList.contains("day-date-input")) {
      updateDayDate(target.dataset.dayId, target.value);
      return;
    }

    if (target.classList.contains("exercise-name-select") && target.dataset.exerciseIndex !== undefined) {
      updateExerciseName(selectedWorkoutDayId, Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), target.value);
      return;
    }

    if (target.classList.contains("set-sets-input")) {
      updateEntryField(selectedWorkoutDayId, Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), Number(target.dataset.entryIndex), "sets", target.value);
      return;
    }

    if (target.classList.contains("set-reps-input")) {
      updateEntryField(selectedWorkoutDayId, Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), Number(target.dataset.entryIndex), "reps", target.value);
      return;
    }

    if (target.classList.contains("set-weight-input")) {
      updateEntryField(selectedWorkoutDayId, Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), Number(target.dataset.entryIndex), "weight", target.value);
      return;
    }

    if (target.classList.contains("set-notes-input")) {
      updateEntryField(selectedWorkoutDayId, Number(target.dataset.groupIndex), Number(target.dataset.exerciseIndex), Number(target.dataset.entryIndex), "notes", target.value);
    }
  });
}

setupWeightTracker();
setupWorkoutTracker();
