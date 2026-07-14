function updateClock() {
    console.log("updating");
    let now = new Date();
    let clock = document.getElementById("clock");
    clock.textContent = "Time: " + now.toLocaleTimeString();
}
setInterval(updateClock, 1000);

async function updateServer() {
    let response = await fetch("http://192.168.0.46:5000/server_stats");
    let data = await response.json();
    console.log(data);
    let cpuTemp = document.getElementById("cpu-temp");
    let RAM = document.getElementById("RAM");
    let jellyfinStatus = document.getElementById("jellyfin_status");
    cpuTemp.textContent = "CPU: " + data.cpu + "%";
    RAM.textContent = "RAM: " + data.ram + "%";
    jellyfinStatus.textContent = "Jellyfin: " + data.jellyfin_status;
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

    feedback.textContent = isLoggedToday
        ? "Creatine taken"
        : "Creatine not logged yet";
    streakCount.textContent = `Current streak: ${state.streak} day${state.streak === 1 ? "" : "s"}`;
    button.disabled = isLoggedToday;
    button.textContent = isLoggedToday ? "Creatine logged for today" : "Creatine Taken";
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

    const updatedState = {
        streak: nextStreak,
        lastDate: today
    };

    saveTrackerState(updatedState);
    updateTrackerUI(updatedState);
}

if (button) {
    button.addEventListener("click", markCreatineTaken);
}

updateTrackerUI(loadTrackerState());
