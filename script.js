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
const workoutStorageKey = "workout-history";

const exerciseOptions = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Push-Ups", "Dips"],
  Back: ["Pull-Ups", "Rows", "Lat Pulldown", "Deadlift"],
  Legs: ["Squat", "Romanian Deadlift", "Lunges", "Leg Press"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Shrugs"],
  Arms: ["Biceps Curl", "Hammer Curl", "Triceps Extension", "Close-Grip Push-Up"],
  Core: ["Plank", "Crunches", "Hanging Knee Raise", "Russian Twist"]
};

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

function loadWorkoutEntries() {
  const stored = localStorage.getItem(workoutStorageKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Could not parse workout data", error);
    return [];
  }
}

function saveWeightEntries(entries) {
  localStorage.setItem(weightStorageKey, JSON.stringify(entries));
}

function saveWorkoutEntries(entries) {
  localStorage.setItem(workoutStorageKey, JSON.stringify(entries));
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

function populateExerciseOptions(group) {
  const select = document.getElementById("exercise-name");
  if (!select) return;
  select.innerHTML = (exerciseOptions[group] || []).map((exercise) => `<option value="${exercise}">${exercise}</option>`).join("");
}

function renderWorkoutHistory(entries) {
  const list = document.getElementById("workout-history");
  const lastWorkout = document.getElementById("workout-last");
  const focus = document.getElementById("workout-focus");
  if (!list) return;

  if (entries.length === 0) {
    list.innerHTML = "<li>No workouts logged yet.</li>";
    if (lastWorkout) lastWorkout.textContent = "—";
    if (focus) focus.textContent = "—";
    return;
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  list.innerHTML = sorted.slice(-6).reverse().map((entry) => `<li>${entry.date} • ${entry.muscleGroup} • ${entry.exercise} • ${entry.sets}x${entry.reps}</li>`).join("");

  if (lastWorkout) {
    const latest = sorted[sorted.length - 1];
    lastWorkout.textContent = `${latest.exercise} • ${latest.sets}x${latest.reps}`;
  }

  if (focus) {
    const counts = sorted.reduce((acc, entry) => {
      acc[entry.muscleGroup] = (acc[entry.muscleGroup] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    focus.textContent = top ? top[0] : "—";
  }
}

function setupWorkoutTracker() {
  const form = document.getElementById("workout-form");
  const groupSelect = document.getElementById("muscle-group");
  const dateInput = document.getElementById("workout-date");
  const setsInput = document.getElementById("sets");
  const repsInput = document.getElementById("reps");
  if (!form || !groupSelect || !dateInput || !setsInput || !repsInput) return;

  dateInput.value = formatDate(new Date());
  populateExerciseOptions(groupSelect.value);
  renderWorkoutHistory(loadWorkoutEntries());

  groupSelect.addEventListener("change", () => populateExerciseOptions(groupSelect.value));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const exerciseSelect = document.getElementById("exercise-name");
    const entry = {
      date: dateInput.value,
      muscleGroup: groupSelect.value,
      exercise: exerciseSelect.value,
      sets: Number(setsInput.value),
      reps: Number(repsInput.value)
    };

    const existing = loadWorkoutEntries();
    const updated = [...existing, entry];
    updated.sort((a, b) => a.date.localeCompare(b.date));
    saveWorkoutEntries(updated);

    renderWorkoutHistory(updated);

    form.reset();
    dateInput.value = formatDate(new Date());
    setsInput.value = 3;
    repsInput.value = 10;
    populateExerciseOptions(groupSelect.value);
  });
}

setupWeightTracker();
setupWorkoutTracker();
