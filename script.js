
function updateClock() {
    console.log("updating");
    let now = new Date();
    let clock = document.getElementById("clock");
    clock.textContent = "Time: "+ now.toLocaleTimeString();
}
setInterval(updateClock, 1000);

async function updateServer() {
    let response = await fetch("http://192.168.0.46:5000/server_stats");
    let data = await response.json();
    console.log(data);
    let cpuTemp = document.getElementById("cpu-temp");
    let gpuTemp = document.getElementById("gpu-temp");
    let jellyfinStatus = document.getElementById("jellyfin_status");
    cpuTemp.textContent = "CPU: " + data.cpu + "°C";
    gpuTemp.textContent = "GPU: " + data.gpu + "°C";
    jellyfinStatus.textContent = "Jellyfin: " + data.jellyfin_status;
}
setInterval(updateServer, 1000);
