
function updateClock() {
    console.log("updating");
    let now = new Date();
    let clock = document.getElementById("clock");
    clock.textContent = "Time: "+ now.toLocaleTimeString();
}
setInterval(updateClock, 1000);