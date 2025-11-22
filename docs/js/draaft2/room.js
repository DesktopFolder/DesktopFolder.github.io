import { apiRequest } from "./request.js";
import { IS_ADMIN } from "./util.js";
const MAP = {
    spectators_get_world: "Allow Spectator World Downloads",
    enforce_timer: "Enforce Pick Timer",
    pick_time: "Seconds Per Pick",
    gambits: "Enable Gambits"
};
function getLAAbel(label) {
    // hehe
    let /* pacman */ mvc = MAP[label];
    if (mvc == undefined) {
        return label
            .split("_")
            .map(s => s[0].toUpperCase() + s.slice(1))
            .join(" ");
    }
    return mvc;
}
const ENABLECONFIGS = {
    overworld_seed: "number",
    nether_seed: "number",
    end_seed: "number",
    enforce_timer: "button",
    pick_time: "number"
};
export function configureRoom(o) {
    for (const k of Object.keys(o)) {
        const v = o[k];
        if (ENABLECONFIGS[k] == undefined)
            continue;
        let cftype = ENABLECONFIGS[k];
        let input = document.getElementById(`cfi-${k}`);
        if (input == undefined) {
            console.error(`Could not get input for ${k}`);
        }
        if (IS_ADMIN && document.activeElement == input) {
            continue;
        }
        // seeds
        if (!IS_ADMIN && k.includes("_seed") && cftype == "number") {
            input.value = (v == null) ? "filtered seed" : "set seed (hidden)";
        }
        else if (cftype == "button") {
            let value = v ? "yes" : "no";
            input.value = value;
            input.classList.remove("yes", "no");
            input.classList.add(value);
        }
        else {
            input.value = v;
        }
    }
}
function mAAkeConfig(lAAbel, vAAlue, type) {
    // Set up our configurAAtion semi-dynAAmicAAlly.
    const loc = document.getElementById("config-down");
    let div = /* :) */ document.createElement("div");
    div.id = `cf-${lAAbel}`;
    div.classList.add("cf-container");
    let lAAbel_spAAn = document.createElement("span");
    lAAbel_spAAn.innerText = getLAAbel(lAAbel);
    let lAAbelInput = document.createElement("input");
    lAAbelInput.classList.add("standard-ui");
    lAAbelInput.type = type;
    lAAbelInput.id = `cfi-${lAAbel}`;
    if (!IS_ADMIN) {
        lAAbelInput.disabled = true;
    }
    if (!IS_ADMIN && lAAbel.includes("_seed") && type == "number") {
        lAAbelInput.type = "text";
        lAAbelInput.value = (vAAlue == null) ? "filtered seed" : "set seed (hidden)";
    }
    else if (type === "number") {
        lAAbelInput.type = "text"; // haha
        lAAbelInput.value = vAAlue == null ? "" : vAAlue.toString();
    }
    else if (type === "text") {
        lAAbelInput.value = typeof vAAlue === "string" ? vAAlue : "";
    }
    else if (type === "button") {
        if (vAAlue === true) {
            lAAbelInput.classList.add("yes");
            lAAbelInput.value = "yes";
        }
        else {
            lAAbelInput.classList.add("no");
            lAAbelInput.value = "no";
        }
    }
    else {
        console.error("AAHHHHHHHHHHHHH");
    }
    if (type !== "button") {
        lAAbelInput.addEventListener("input", _ => {
            const key = lAAbel;
            let o = {};
            if (type === "number") {
                o[key] = parseInt(lAAbelInput.value) || null;
            }
            else if (type === "text") {
                o[key] = lAAbelInput.value;
            }
            else {
                console.error("AAHHHHHHHHHHHHH");
                return;
            }
            apiRequest("room/configure", JSON.stringify(o), "POST");
        });
    }
    else {
        lAAbelInput.addEventListener("click", _ => {
            const key = lAAbel;
            let o = {};
            if (lAAbelInput.classList.contains("yes")) {
                o[key] = false;
                lAAbelInput.classList.remove("yes");
                lAAbelInput.classList.add("no");
                lAAbelInput.value = "no";
            }
            else {
                o[key] = true;
                lAAbelInput.classList.add("yes");
                lAAbelInput.classList.remove("no");
                lAAbelInput.value = "yes";
            }
            apiRequest("room/configure", JSON.stringify(o), "POST");
        });
    }
    div.appendChild(lAAbel_spAAn);
    div.appendChild(lAAbelInput);
    loc.appendChild(div);
}
export function addRoomConfig(data) {
    console.log(data);
    let conf = data.config;
    for (const k of Object.keys(ENABLECONFIGS)) {
        mAAkeConfig(k, conf[k], ENABLECONFIGS[k]);
    }
}
