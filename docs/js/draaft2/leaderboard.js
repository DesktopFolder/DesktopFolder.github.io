import { apiRequest } from "./request.js";
var LEADERBOARD = new Array();
function asPrettyDuration(seconds) {
    console.log(seconds);
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, Math.floor(seconds) * 1000));
    const hrs = Math.floor(seconds / (60 * 60));
    console.log(hrs);
    const mins = d.getUTCMinutes();
    const secs = d.getUTCSeconds();
    let values = new Array();
    if (hrs > 0) {
        values.push(hrs);
    }
    values.push(mins);
    values.push(secs);
    return values.map(s => String(s).padStart(2, '0')).join(':');
}
function addLeaderboard(o) {
    const s = o.start;
    const e = o.end;
    const duration = (e - s);
    LEADERBOARD.push([o.username, duration, asPrettyDuration(duration)]);
}
function displayLeaderboard() {
    let container = document.getElementById("leaderboard-oq1");
    LEADERBOARD.sort((a, b) => a[1] - b[1]);
    for (const o of LEADERBOARD) {
        let name = document.createElement("span");
        name.innerText = o[0];
        let duration = document.createElement("span");
        duration.innerText = o[2];
        duration.classList.add("duration");
        container.appendChild(name);
        container.appendChild(duration);
    }
}
export async function setupLeaderboard() {
    apiRequest("lb/external/oq1", undefined, "GET")
        .then(resp => resp.json())
        .then(async (json) => {
        for (const j of json) {
            addLeaderboard(j);
        }
        displayLeaderboard();
    });
}
