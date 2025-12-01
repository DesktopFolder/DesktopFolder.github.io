import { Member } from "./member.js";
import { apiRequest, LOCAL_TESTING } from "./request.js";
import { displayOnlyPage, fullPageNotification, play_audio, ROOM_CONFIG, STEVE, UUID } from "./util.js";
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
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)} (0 / ${PICKS_PER_POOL})`;
        else
            document.getElementById(poolTitleId(pool_id)).innerText = `${POOL_NAME_MAPPING.get(pool_id)} (0)`;
    }
}
let TIMER = undefined;
function dec(prev) {
    const next = prev - 1;
    const v = document.getElementById("draft-timer-value");
    v.innerText = next.toString();
    if (next != 0) {
        TIMER = setTimeout(() => dec(next), 1000);
    }
}
function update_pick_timer(additional = 0) {
    // if (ROOM_CONFIG.enforce_timer === false) return;   
    if (TIMER != undefined)
        clearTimeout(TIMER);
    const v = document.getElementById("draft-timer-value");
    const initial = additional + ROOM_CONFIG.pick_time;
    v.innerText = initial.toString();
    TIMER = setTimeout(() => dec(initial), 1000);
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
    // always just start fetching the data early
    let p = apiRequest("draft/status", undefined, "GET").then(resp => resp.json());
    // config - timer
    if (ROOM_CONFIG.enforce_timer === true) {
        console.log("displaying enforced timer");
        document.getElementById("draft-page-timer").style.display = "flex";
    }
    else {
        console.log("timer is not enforced for this room");
    }
    update_pick_timer(10);
    displayOnlyPage("draft-page");
    // Fill everything in, assuming we have it.
    displayDraftables(p);
}
function updateHeader(picker, cur, after, isLoading = false) {
    update_pick_timer();
    let next_four = cur.concat(after);
    while (next_four.length < 10) {
        next_four = next_four.concat(after.toReversed());
        next_four = next_four.concat(after);
    }
    let hdr = document.getElementById('draft-page-header');
    // don't worry about it haha
    hdr.innerHTML = '';
    if (CUR_PICKS >= MAX_PICKS) {
        hdr.style.justifyContent = 'center';
        let cursp = document.createElement("span");
        cursp.innerText = "Draft complete. Loading...";
        hdr.appendChild(cursp);
        return;
    }
    console.log(next_four[0]);
    console.log(UUID);
    if (next_four[0] == UUID && !isLoading) {
        play_audio("your-turn");
    }
    let leftdiv = document.createElement("div");
    leftdiv.classList.add("picking-player");
    let cursp = document.createElement("span");
    cursp.innerText = "Picking:";
    leftdiv = hdr;
    leftdiv.appendChild(cursp);
    (new Member(next_four[0])).addDiv(leftdiv, true);
    // hdr.appendChild(leftdiv);
    let rightdiv = document.createElement("div");
    rightdiv.classList.add("next-players");
    // hdr.appendChild(rightdiv);
    rightdiv = hdr;
    let nexsp = document.createElement("span");
    nexsp.innerText = "Next:";
    nexsp.classList.add("next-picks");
    rightdiv.appendChild(nexsp);
    for (var i = 1; i < next_four.length && CUR_PICKS + i < MAX_PICKS; i++) {
        // append the member first
        (new Member(next_four[i])).addDiv(rightdiv, true);
        // then append the >
        let com1 = document.createElement("span");
        com1.innerText = ">";
        com1.classList.add("header-comma");
        rightdiv.appendChild(com1);
    }
    let com3 = document.createElement("span");
    com3.innerText = "Draft complete";
    com3.classList.add("header-comma");
    rightdiv.appendChild(com3);
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
        // Add it to the chat log.
        let lg = document.getElementById("draft-page-log");
        let ctr = document.createElement("span");
        ctr.classList.add("log-line");
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
        lg.appendChild(ctr);
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
        pker.classList.add("other-user");
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
function displayDraftables(p) {
    if (DRAFTABLES === undefined) {
        setTimeout(displayDraftables, 200);
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
                ic.onclick = () => {
                    if (!DRAFT_ALLOWED) {
                        console.log("Failed draft attempt: can't draft.");
                        return;
                    }
                    if (POOL_COUNT.get(POOL_MAPPING.get(pk.key)) >= PICKS_PER_POOL) {
                        console.log(`Failed draft attempt: too many picks for pool ${POOL_MAPPING.get(pk.key)}`);
                        return;
                    }
                    console.log(`Picking ${pk.key} :)`);
                    play_audio("normal-click");
                    apiRequest(`draft/pick?key=${pk.key}`).then(_ => {
                        setAsPicked(pk.key, UUID, true);
                    });
                };
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
    const gambit_div = document.getElementById("draft-page-gambits");
    for (const k of Object.keys(gambits)) {
        let v = gambits[k];
        if (LOCAL_TESTING) {
            console.log(v);
        }
        let b = document.createElement("button");
        b.classList.add("standard-ui", "disabled");
        b.innerText = v.name;
        b.onclick = () => {
            if (b.classList.contains("disabled")) {
                apiRequest(`draft/gambit/enable?key=${k}`).then(_ => {
                    b.classList.add("enabled");
                    b.classList.remove("disabled");
                });
            }
            else { // enabled
                apiRequest(`draft/gambit/disable?key=${k}`).then(_ => {
                    b.classList.remove("enabled");
                    b.classList.add("disabled");
                });
            }
        };
        gambit_div.appendChild(b);
    }
    if (LOCAL_TESTING) {
        console.log("Finished building draft pools.");
    }
    p.then(async (json) => {
        if (LOCAL_TESTING) {
            console.log("Current draft status:");
            console.log(json);
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
        updateHeader(undefined, json.position, json.next_positions, false);
        if (json.position[0] == UUID) {
            DRAFT_ALLOWED = true;
        }
    }).catch(_ => {
        fullPageNotification("There was an error loading the in-progress draft.", "reload page", () => window.location.reload());
    });
}
export let DRAFTABLES = undefined;
export function fetchData() {
    apiRequest("draft/draftables", undefined, "GET")
        .then(resp => resp.json())
        .then(async (json) => {
        console.log("Successfully downloaded draftables.");
        if (LOCAL_TESTING) {
            console.log(json);
        }
        DRAFTABLES = json;
    });
}
export function downloadZip() {
    apiRequest("draft/download", undefined, "GET")
        .then(resp => resp.status == 200 ? resp.blob() : Promise.reject('Failed to download draaft datapack'))
        .then(blob => {
        // https://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'draaftpack.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    });
}
export function downloadWorldgen() {
    apiRequest("draft/worldgen", undefined, "GET")
        .then(resp => resp.text())
        .then(async (text) => {
        console.log(text);
    });
}
