import {apiRequest} from "./request.js";
import {CONFIG} from "./settings.js";

var LEADERBOARD = new Array();



function asPrettyDuration(seconds: number) {
    console.log(seconds);
    const d = new Date(Date.UTC(0,0,0,0,0,0,Math.floor(seconds) * 1000));

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

    return values.map(s => String(s).padStart(2,'0')).join(':');
}

function addLeaderboard(o: any) {
    const s = o.start;
    const e = o.end;
    const duration = (e - s);
    LEADERBOARD.push([o.username, duration, asPrettyDuration(duration)]);
}

function asPlayerName(o: string, pq: Set<string>): string {
    const ol = o.toLowerCase();
    if (pq.has(ol)) {
        return o + " *";
    }
    return o;
}

function displayLeaderboard(prequalified: Set<string> = new Set()) {
    let container = document.getElementById("leaderboard-oq1");

    prequalified = new Set(prequalified.keys().map((s: string) => s.toLowerCase()));

    // sort first, then remove duplicates
    LEADERBOARD.sort((a, b) => a[1] - b[1]);

    let hasMap = new Set();
    if (CONFIG.display_all_leaderboard_runs.get() !== true) {
        // basically. display just one per player.
        LEADERBOARD = LEADERBOARD.filter(o => {
            if (hasMap.has(o[0])) {
                return false;
            }
            hasMap.add(o[0]);
            return true;
        });
    }

    if (CONFIG.hide_prequalified_from_leaderboard.get() === true) {
        LEADERBOARD = LEADERBOARD.filter(o => !prequalified.has(o[0].toLowerCase()));
    }

    var i = 0;
    for (const o of LEADERBOARD) {
        let n = document.createElement("span");
        n.innerText = (++i).toString();
        n.classList.add("position");

        let name = document.createElement("span");
        name.innerText = asPlayerName(o[0], prequalified);
        
        let duration = document.createElement("span");
        duration.innerText = o[2];
        duration.classList.add("duration");

        // Append the number (e.g. 1,2,3...)
        container.appendChild(n);
        // Append the name of the player
        container.appendChild(name);
        container.appendChild(duration);
    }
}

async function setupLeaderboardOQ1() {
    apiRequest("lb/external/oq1", undefined, "GET")
                     .then(resp => resp.json())
                     .then(async json =>  {
                        for (const j of json) {
                            addLeaderboard(j);
                        }
                        const PREQUALIFIED = new Set(
                            [
                                "DoyPingu",
                                "Feinberg",
                                "CroPro",
                                "Snakezy",
                                "Oxidiot",
                                "Xia_Wen", /* Not participating */
                                "Coosh02",
                                "dbowzer", /* Xia_Wen is not playing this tournament */
                                "Infume",
                            ]
                        );
                        displayLeaderboard(PREQUALIFIED);
                     });
}

export async function setupLeaderboard() {
    setupLeaderboardOQ1();
}
