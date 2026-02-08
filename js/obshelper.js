import { Member } from "./draaft2/member.js";
import { apiRequest, externalAPIRequest, LOCAL_TESTING } from "./draaft2/request.js";
import { removeAllPages, ROOM_CONFIG, STEVE, UUID, set_draft_info } from "./draaft2/util.js";
let PICKS_PER_POOL = 0;
let MAX_PICKS = 0;
let CUR_PICKS = 0;
let SINGLEPLAYER = false;
// key -> pool
let POOL_MAPPING = new Map();
// pool -> pick count
let POOL_COUNT = new Map();
// pool -> total allowed picks in this pool
let TOTAL_POOL_COUNT = new Map();
// pool -> keys
let KEY_MAPPING = new Map();
// pool -> pool name
let POOL_NAME_MAPPING = new Map();
function setPickInfo(picks_per_pool, max_picks) {
    PICKS_PER_POOL = picks_per_pool;
    MAX_PICKS = max_picks;
    if (LOCAL_TESTING) {
        console.log(`Set picks per pool: ${picks_per_pool} | Set max picks: ${MAX_PICKS}`);
    }
    for (const k of POOL_MAPPING.keys()) {
        // every key
        let pool_id = POOL_MAPPING.get(k);
        if (!SINGLEPLAYER)
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)}`;
        else
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)}`;
    }
}
// do all logic for post-draft in here
export function stop_drafting() {
    console.log("Stopping drafting.");
    DRAFT_ALLOWED = false;
    // disable gambits
    for (const g of document.getElementsByClassName("gambit-button")) {
        console.log(`Disabling gambit button: ${g.id}`);
        let b = g;
        b.classList.add("noclick");
    }
    // we're basically waiting for the server to give us the OK
    // to run the timer now
}
let DRAFT_ALLOWED = false;
export let IS_DRAFTING = false;
export function startDrafting() {
    if (IS_DRAFTING) {
        return;
    }
    IS_DRAFTING = true;
    // ensure we do this no matter what lol
    document.getElementById("home-button").style.display = "none";
    removeAllPages();
    document.getElementById("loading-credits").show();
    // always just start fetching the data early
    let p = apiRequest("draft/status", undefined, "GET").then(resp => resp.json());
    // Fill everything in, assuming we have it.
    displayDraftables(p);
}
function updateHeader(picker, cur, after, isLoading = false) {
    let next_four = new Set(cur.concat(after));
    let hdr = document.getElementById('draft-page-header');
    // don't worry about it haha
    hdr.innerHTML = '';
    let rightdiv = document.createElement("div");
    rightdiv.classList.add("next-players");
    // hdr.appendChild(rightdiv);
    rightdiv = hdr;
    const len = next_four.size;
    var count = 0;
    for (const s of next_four) {
        // append the member first
        (new Member(s)).addDiv(rightdiv, true);
        if (++count < len) {
            // then append the >
            let com1 = document.createElement("span");
            com1.innerText = ",";
            com1.classList.add("header-comma");
            rightdiv.appendChild(com1);
        }
    }
}
function makeLogLine() {
    // Add it to the chat log.
    let lg = document.getElementById("draft-page-log");
    let ctr = document.createElement("span");
    ctr.classList.add("log-line");
    lg.appendChild(ctr);
    return ctr;
}
function iconId(key) {
    return `draft-pick-image-${key}`;
}
function pickerId(key) {
    return `draft-picker-image-${key}`;
}
function poolTitleId(key) {
    return `pool-title-${key}`;
}
function setAsPicked(key, picker, isLoading = false) {
    let pker = document.getElementById(pickerId(key));
    // easy peasy
    if (pker.classList.contains("picked")) {
        return;
    }
    CUR_PICKS += 1;
    pker.src = `https://mineskin.eu/helm/${picker}/100`;
    pker.classList.add("picked");
    let ic = document.getElementById(iconId(key));
    ic.onclick = undefined;
    ic.classList.add("picked");
    let ctnr = document.getElementById(`draft-advancement-bg-${key}`);
    if (ctnr != undefined) {
        ctnr.classList.add("picked");
    }
    let pool_id = POOL_MAPPING.get(key);
    TOTAL_POOL_COUNT.set(pool_id, TOTAL_POOL_COUNT.get(pool_id) - 1);
    // if they're all picked, put the unpicked ones into the gutter.
    if (TOTAL_POOL_COUNT.get(pool_id) <= 0) {
        for (const pck of KEY_MAPPING.get(pool_id)) {
            if (document.getElementById(iconId(pck)).classList.contains("picked"))
                continue;
            let fullParent = `draft-pick-container-${pck}`;
            let ele = document.getElementById(fullParent);
            ele.parentNode.removeChild(ele);
            document.getElementById(`shared-pool-items`).appendChild(ele);
            for (const e of document.querySelectorAll(`#${fullParent} img`)) {
                if (e instanceof HTMLElement)
                    e.onclick = undefined;
            }
        }
    }
    {
        let ctr = makeLogLine();
        // [Face] Name
        if (picker == UUID) {
            (new Member(picker)).addDiv(ctr, true, "You");
        }
        else {
            (new Member(picker)).addDiv(ctr, true);
        }
        let mid_text = "picked";
        let mid_span = document.createElement("span");
        mid_span.innerText = mid_text;
        mid_span.classList.add("log-joiner");
        ctr.appendChild(mid_span);
        // now the pick
        let new_node = document.getElementById(iconId(key)).cloneNode(true);
        new_node.classList.remove("picked");
        new_node.id = undefined;
        ctr.appendChild(new_node);
        let name_span = document.createElement("span");
        name_span.innerText = DRAFTABLES[1][key].name.pretty_name;
        name_span.classList.add("log-item-name");
        ctr.appendChild(name_span);
    }
    if (picker == UUID) {
        pker.classList.add("current-user");
        // also enforce things
        let pn = POOL_MAPPING.get(key);
        if (!POOL_COUNT.has(pn)) {
            POOL_COUNT.set(pn, 0);
        }
        let cur_count = POOL_COUNT.get(pn) + 1;
        POOL_COUNT.set(pn, cur_count);
        // also update the above text here when it exists
        if (!SINGLEPLAYER)
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)} (${cur_count} / ${PICKS_PER_POOL})`;
        else
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)} (${cur_count})`;
    }
    else {
        pker.classList.add("current-user");
    }
}
export function handleDraftpick(e) {
    // DraftPickUpdate
    let key = e.key;
    let picker = e.player;
    setAsPicked(key, picker);
    if (e.positions[0] == UUID) {
        DRAFT_ALLOWED = true;
    }
    else {
        DRAFT_ALLOWED = false;
    }
    updateHeader(picker, e.positions, e.next_positions);
}
let SELECTED_GAMBITS = 0;
function displayDraftables(p) {
    if (DRAFTABLES === undefined) {
        console.log("Do not have draftables yet. Calling back to displayDraftables in 500ms.");
        setTimeout(() => { displayDraftables(p); }, 500);
        return;
    }
    let pools = DRAFTABLES[0];
    let picks = DRAFTABLES[1];
    let gambits = DRAFTABLES[2];
    for (const pool of pools) {
        // let's not worry about preserving information about this stuff
        let pd = document.createElement("div");
        let pool_name = pool.name.full_name;
        let pool_id = pool.name.full_name.replace(/[^\w\d]/, '');
        POOL_NAME_MAPPING.set(pool_id, pool_name);
        let all_keys = new Array();
        KEY_MAPPING.set(pool_id, all_keys);
        // update this asap
        TOTAL_POOL_COUNT.set(pool_id, 99);
        let pool_title = document.createElement("span");
        pool_title.classList.add("pool-title");
        pool_title.id = poolTitleId(pool_id);
        pd.appendChild(pool_title);
        pool_title.innerText = pool_name;
        pd.id = `pool-${pool_id}`;
        pd.classList.add("draft-pool-container", "draft-page-item");
        if (LOCAL_TESTING) {
            console.log(`Building draft pool ${pool_id}`);
            console.log(pool);
        }
        // maybe more options in the future idk
        let do_icons = pool.kind === "icons";
        for (const k of pool.contains) {
            if (LOCAL_TESTING) {
                console.log(picks[k]);
            }
            let pk = picks[k];
            all_keys.push(pk.key);
            // kind of stupid, but whatever
            POOL_MAPPING.set(pk.key, pool_id);
            let pickd = document.createElement("div");
            pickd.classList.add("draft-pick-container");
            pickd.id = `draft-pick-container-${pk.key}`;
            // what will we display in the container?
            if (do_icons) {
                // our main hovering div thing
                // this is what should really have the onclick callback btw :)
                let imgdiv = document.createElement("div");
                imgdiv.classList.add("draft-image-container");
                // the innermost image
                let ic = document.createElement("img");
                ic.src = `/assets/draaft/picks/${pk.image_uri}`;
                ic.classList.add("draft-pick-image");
                if (pk.advancement != null) {
                    // we will append a div instead of an image haha
                    let ctnr = document.createElement("div");
                    ic.classList.add("is-advancement");
                    ctnr.classList.add("draft-image-advancement");
                    ctnr.id = `draft-advancement-bg-${pk.key}`;
                    ctnr.style.backgroundImage = `url(/assets/draaft/picks/${pk.advancement})`;
                    imgdiv.classList.add("is-advancement");
                    ctnr.appendChild(ic);
                    imgdiv.appendChild(ctnr);
                }
                else {
                    imgdiv.appendChild(ic);
                }
                ic.id = iconId(pk.key);
                // WRONG! FIX THIS! THANKS!
                // is it still wrong :sob: I don't know...
                let picker = document.createElement("img");
                picker.classList.add("draft-picker-image");
                picker.id = pickerId(pk.key);
                picker.src = STEVE;
                picker.onerror = () => (picker.src = STEVE);
                pickd.appendChild(imgdiv);
                pickd.appendChild(picker);
            }
            else {
                let name = document.createElement("p");
                name.innerText = picks[k].name.full_name;
                pickd.appendChild(name);
            }
            let desc = document.createElement("div");
            for (const ptx of picks[k].description.split("\n")) {
                let ptxp = document.createElement("p");
                ptxp.innerText = ptx;
                desc.appendChild(ptxp);
            }
            desc.classList.add("tooltip", "pick-tooltip");
            pickd.appendChild(desc);
            pd.appendChild(pickd);
        }
        document.getElementById("draft-page-main").appendChild(pd);
    }
    /* GAMBITS! WOOHOO */
    const gambit_title = document.createElement("span");
    const NUM_GAMBITS = Object.keys(gambits).length;
    // const MAX_GAMBITS = (ROOM_CONFIG.max_gambits === undefined || ROOM_CONFIG.max_gambits === '') ? 10000 : parseInt(ROOM_CONFIG.max_gambits);
    const MAX_GAMBITS = 1000;
    const update_gambits = (num) => {
        if (NUM_GAMBITS > MAX_GAMBITS) {
            gambit_title.innerText = `Gambits (${num} / ${MAX_GAMBITS})`;
        }
    };
    const gambit_div = document.getElementById("draft-page-gambits");
    if (true || ROOM_CONFIG.enable_gambits) {
        gambit_title.innerText = 'Gambits';
        gambit_div.appendChild(gambit_title);
        update_gambits(0);
        for (const k of Object.keys(gambits)) {
            let v = gambits[k];
            if (LOCAL_TESTING) {
                console.log(v);
            }
            let b = document.createElement("button");
            b.classList.add("standard-ui", "gambit-button", "enabled");
            b.id = `gambit-${v.key}`;
            let nm = document.createElement("span");
            let nmt = document.createElement("p");
            let img = document.createElement("img");
            img.src = "/assets/draaft/ui/cancel.png";
            nmt.innerText = v.name;
            nm.appendChild(nmt);
            // nm.appendChild(img);
            b.appendChild(nm);
            let desc = document.createElement("span");
            desc.classList.add("full-flex-down");
            for (const d of v.description.split("/")) {
                const p = document.createElement("p");
                p.innerText = d;
                desc.appendChild(p);
            }
            desc.classList.add("tooltip");
            b.appendChild(desc);
            gambit_div.appendChild(b);
        }
    }
    else {
        console.log("Gambits are disabled for this room.");
        gambit_div.style.display = 'none';
    }
    if (LOCAL_TESTING) {
        console.log("Finished building draft pools.");
    }
    let json = p;
    console.log("Got current draft status. Populating all information.");
    if (LOCAL_TESTING) {
        console.log("Current draft status:");
        console.log(json);
    }
    set_draft_info(json);
    try {
        document.getElementById("end-draft-button").remove();
    }
    catch (e) { }
    let ctr = makeLogLine();
    let starter = document.createElement("span");
    starter.innerText = `The drAAft has started. First pick: `;
    starter.classList.add("starter-log");
    ctr.appendChild(starter);
    (new Member(json.players[0])).addDiv(ctr, true);
    // fix gambits
    if (json.gambits != undefined) {
        if (json.gambits[UUID] != undefined) {
            console.log("Enabling gambits from server");
            for (const g of json.gambits[UUID]) {
                console.log(`Enabling gambit from server: '${g}'`);
                const gambitId = `gambit-${g}`;
                let gambitElement = document.getElementById(gambitId);
                if (gambitElement == undefined) {
                    console.warn(`Gambit did not exist when enabling gambits: ${g}`);
                    continue;
                }
                gambitElement.classList.remove("disabled");
                gambitElement.classList.add("enabled");
                SELECTED_GAMBITS += 1;
            }
            update_gambits(SELECTED_GAMBITS);
        }
    }
    // must come before setAsPicked
    let max_picks_per_pool = (json.players.length < 2) ? 100 : ((json.players.length == 2) ? 4 : json.players.length);
    if (json.players.length == 1) {
        SINGLEPLAYER = true;
    }
    // do this now that we know player count
    else {
        let pd = document.createElement("div");
        let pool_title = document.createElement("span");
        pool_title.classList.add("pool-title");
        pool_title.id = poolTitleId("shared-pool-title");
        pd.appendChild(pool_title);
        pool_title.innerText = "Shared Picks";
        pd.id = `shared-pool`;
        pd.classList.add("draft-pool-container", "draft-page-item");
        let pool_items = document.createElement("div");
        pool_items.id = 'shared-pool-items';
        pd.appendChild(pool_items);
        document.getElementById("draft-page-main").appendChild(pd);
    }
    for (const k of TOTAL_POOL_COUNT.keys()) {
        // logic: max picks per pool is 100 if 1 player,
        // 2 if 2 player,
        // 1 otherwise
        TOTAL_POOL_COUNT.set(k, max_picks_per_pool);
    }
    setPickInfo(json.picks_per_pool, json.max_picks);
    for (const pk of json.draft) {
        setAsPicked(pk.key, pk.player);
    }
    updateHeader(undefined, json.position, json.next_positions, true);
    if (json.position[0] == UUID && !json.complete) {
        DRAFT_ALLOWED = true;
    }
    if (json.complete) {
        stop_drafting();
    }
    // FULLY LOADED!
    console.log("Successfully loaded the draft. Fading out credits.");
    setTimeout(() => {
        document.getElementById("loading-credits").classList.add("fade");
        const id = "draft-page";
        document.getElementById(id).style.display = "flex";
        document.getElementById(id).classList.add("visible", "fade");
        setTimeout(() => { document.getElementById("loading-credits").close(); }, 1000);
    }, 1000);
}
function setupHelpPage(pools, picks, gambits) {
    console.log("Setting up help page.");
    for (const pool of pools) {
        let pool_name = pool.name.full_name;
        // update this asap
        let pool_title = document.createElement("span");
        pool_title.classList.add("pool-title", "doc-pool-title");
        pool_title.innerText = `Draft Pool: ${pool_name}`;
        document.getElementById("documentation-picks").appendChild(pool_title);
        for (const k of pool.contains) {
            let pk = picks[k];
            let pickd = document.createElement("span");
            let imgdiv = document.createElement("div");
            imgdiv.classList.add("draft-image-container");
            // the innermost image
            let ic = document.createElement("img");
            ic.src = `/assets/draaft/picks/${pk.image_uri}`;
            ic.classList.add("draft-pick-image");
            if (pk.advancement != null) {
                // we will append a div instead of an image haha
                let ctnr = document.createElement("div");
                ic.classList.add("is-advancement");
                ctnr.classList.add("draft-image-advancement");
                ctnr.id = `draft-advancement-bg-${pk.key}`;
                ctnr.style.backgroundImage = `url(/assets/draaft/picks/${pk.advancement})`;
                imgdiv.classList.add("is-advancement");
                ctnr.appendChild(ic);
                imgdiv.appendChild(ctnr);
            }
            else {
                imgdiv.appendChild(ic);
            }
            pickd.appendChild(imgdiv);
            pickd.classList.add("full-flex-right", "docs-pick-div");
            let desc = document.createElement("div");
            for (const ptx of picks[k].description.split("\n")) {
                let ptxp = document.createElement("p");
                ptxp.innerText = ptx;
                desc.appendChild(ptxp);
            }
            desc.classList.add("full-flex-down");
            pickd.appendChild(desc);
            document.getElementById("documentation-picks").appendChild(pickd);
        }
    }
    const gambit_div = document.getElementById("documentation-gambits");
    for (const k of Object.keys(gambits)) {
        let v = gambits[k];
        let gambitname = document.createElement("p");
        gambitname.innerText = v.name;
        let gambitd = document.createElement("span");
        gambitd.appendChild(gambitname);
        gambitd.classList.add("full-flex-right", "docs-pick-div");
        let desc = document.createElement("span");
        desc.classList.add("full-flex-down");
        for (const d of v.description.split("/")) {
            const p = document.createElement("p");
            p.innerText = d;
            desc.appendChild(p);
        }
        gambitd.appendChild(desc);
        gambit_div.appendChild(gambitd);
    }
}
export let PUBLIC_DRAFTABLES = undefined;
export let DRAFTABLES = undefined;
async function setupObsHelper() {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    let p1 = 0;
    let p2 = 1;
    if (params.has("flip")) {
        p1 = 1;
        p2 = 0;
    }
    let res = await externalAPIRequest("draft/external/livestatus", undefined, "GET");
    let data = await res.json();
    if (data == undefined || data.draft == undefined) {
        data = {
            "draft": {
                "players": [
                    "5d831a52730a4b4dadb7d1ea69617f3e",
                    "f41c16957a9c4b0cbd2277a7e28c37a6"
                ]
            }
        };
    }
    let loc = document.getElementById("obs-player-names-unfocused");
    (new Member(data.draft.players[p1])).withPronouns().addDiv(loc, true);
    (new Member(data.draft.players[p2])).withPronouns().addDiv(loc, true);
}
function main() {
    document.getElementById("home-button").style.display = "none";
    setupObsHelper();
}
document.addEventListener("DOMContentLoaded", main, false);
