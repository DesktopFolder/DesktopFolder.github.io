import {Member} from "./member.js";
import {apiRequest, LOCAL_TESTING, requiredJsonGETRequest} from "./request.js";
import {displayOnlyPage, fullPageNotification, play_audio, removeAllPages, ROOM_CONFIG, STEVE, UUID, set_draft_info, IS_PLAYER} from "./util.js";

let PICKS_PER_POOL = 0;
let MAX_PICKS = 0;
let CUR_PICKS = 0;
let SINGLEPLAYER = false;

// key -> pool
let POOL_MAPPING: Map<string, string> = new Map();
// pool -> pick count
let POOL_COUNT: Map<string, number> = new Map();
// pool -> total allowed picks in this pool
let TOTAL_POOL_COUNT: Map<string, number> = new Map();
// pool -> keys
let KEY_MAPPING: Map<string, Array<string>> = new Map();
// pool -> pool name
let POOL_NAME_MAPPING: Map<string, string> = new Map();

function setPickInfo(picks_per_pool: number, max_picks: number) {
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

let IS_YOU = false;
let TIMER = undefined;
function dec(prev: number) {
    const next = prev - 1;
    const v = document.getElementById("draft-timer-value");
    v.innerText = next.toString();
    if (next == 5 && IS_YOU) {
        play_audio("low-sound");
        setTimeout(() => play_audio("low-sound"), 270);
    }
    if (next != 0) {
        TIMER = setTimeout(() => dec(next), 1000);
    }
}
function update_pick_timer(additional: number = 0) {
    // if (ROOM_CONFIG.enforce_timer === false) return;   
    if (TIMER != undefined) clearTimeout(TIMER);
    const v = document.getElementById("draft-timer-value");
    const initial: number = additional + parseInt(ROOM_CONFIG.pick_time);
    v.innerText = initial.toString();
    console.log(`INITIAL PICK TIME: ${initial}`);
    TIMER = setTimeout(() => dec(initial), 1000);
}

function stop_timer() {
    if (TIMER != undefined) clearTimeout(TIMER);
    TIMER = undefined;
    const v = document.getElementById("draft-timer-value");
    v.innerText = '0';
}

// do all logic for post-draft in here
function stop_drafting() {
    console.log("Stopping drafting.");
    stop_timer();

    // disable gambits
    for (const g of document.getElementsByClassName("gambit-button"))
    {
        console.log(`Disabling gambit button: ${g.id}`);
        let b = <HTMLButtonElement>g;
        b.classList.add("noclick");
    }

    if (IS_PLAYER) {
        let zipDownload = document.getElementById("download-zip");
        zipDownload.onclick = () => {
            play_audio("normal-click");
            downloadZip();
        };
        zipDownload.style.display = "block";
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
    (<HTMLDialogElement>document.getElementById("loading-credits")).show();

    // always just start fetching the data early
    let p = apiRequest("draft/status", undefined, "GET").then(resp => resp.json());

    // config - timer
    if (ROOM_CONFIG.enforce_timer === true) {
        console.log("displaying enforced timer");
        document.getElementById("draft-page-timer").style.display = "flex";
        update_pick_timer(10);
    }
    else {
        console.log("timer is not enforced for this room");
    }

    // Fill everything in, assuming we have it.
    displayDraftables(p);
}

function updateHeader(picker: string, cur: Array<string>, after: Array<string>, isLoading: boolean = false) {
    if (!isLoading && ROOM_CONFIG.enforce_timer === true) update_pick_timer();

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
        cursp.id = "visible-header-text";
        hdr.appendChild(cursp);

        stop_drafting();

        return;
    }

    console.log(next_four[0]);
    console.log(UUID);
    if (next_four[0] == UUID) {
        IS_YOU = true;
        if (!isLoading) {
            play_audio("your-turn"); 
        }
    } else { IS_YOU = false; }

    let leftdiv = <HTMLElement>document.createElement("div");
    leftdiv.classList.add("picking-player");
    let cursp = document.createElement("span");
    cursp.innerText = "Picking:";
    leftdiv = hdr;
    leftdiv.appendChild(cursp);

    (new Member(next_four[0])).addDiv(leftdiv, true);
    // hdr.appendChild(leftdiv);

    let rightdiv = <HTMLElement>document.createElement("div");
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

function makeLogLine() {
    // Add it to the chat log.
    let lg = document.getElementById("draft-page-log");
    
    let ctr = document.createElement("span");
    ctr.classList.add("log-line");
    lg.appendChild(ctr);

    return ctr;
}

export function draft_disconnect_player(uuid: string) {
    let cl = makeLogLine();

    (new Member(uuid)).addDiv(cl, true);

    let mid_span = document.createElement("span");
    mid_span.innerText = "left the draft";

    cl.appendChild(mid_span)
}

function iconId(key: string) {
    return `draft-pick-image-${key}`;
}
function pickerId(key: string) {
    return `draft-picker-image-${key}`;
}
function poolTitleId(key: string) {
    return `pool-title-${key}`;
}
function setAsPicked(key: string, picker: string, isLoading: boolean = false) {
    let pker = <HTMLImageElement>document.getElementById(pickerId(key));
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
            if (document.getElementById(iconId(pck)).classList.contains("picked")) continue;
            let fullParent = `draft-pick-container-${pck}`;
            let ele = document.getElementById(fullParent);
            ele.parentNode.removeChild(ele);
            document.getElementById(`shared-pool-items`).appendChild(ele);
            for (const e of document.querySelectorAll(`#${fullParent} img`)) {
                if (e instanceof HTMLElement) e.onclick = undefined;
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

        ctr.appendChild(mid_span)

        // now the pick
        let new_node = document.getElementById(iconId(key)).cloneNode(true);
        (<HTMLElement>new_node).classList.remove("picked");
        (<HTMLElement>new_node).id = undefined;
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
        pker.classList.add("other-user");
    }
}

export function handleDraftpick(e: any) {
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
function displayDraftables(p: Promise<any>) {
    if (DRAFTABLES === undefined) {
        console.log("Do not have draftables yet. Calling back to displayDraftables in 500ms.");
        setTimeout(() => { displayDraftables(p) }, 500);
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
                    }).catch(
                        () => `draft/pick?key=${pk.key} failed`
                    );
                };

                let picker = document.createElement("img");
                picker.classList.add("draft-picker-image");
                picker.id = pickerId(pk.key);
                picker.src = STEVE;
                picker.onerror = () => (picker.src = STEVE);

                pickd.appendChild(imgdiv);
                pickd.appendChild(picker);
            } else {
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
    const MAX_GAMBITS = ROOM_CONFIG.max_gambits;
    const update_gambits = (num: number) => {
        if (NUM_GAMBITS > MAX_GAMBITS) {
            gambit_title.innerText = `Gambits (${num} / ${MAX_GAMBITS})`;
        }
    };
    const gambit_div = document.getElementById("draft-page-gambits");
    if (ROOM_CONFIG.enable_gambits) {
        gambit_title.innerText = 'Gambits';
        gambit_div.appendChild(gambit_title);

        update_gambits(0);

        for (const k of Object.keys(gambits)) {
            let v = gambits[k];
            if (LOCAL_TESTING) {
                console.log(v);
            }
            
            let b = document.createElement("button");
            b.classList.add("standard-ui", "gambit-button", "disabled");
            b.id = `gambit-${v.key}`;

            let nm = document.createElement("span");
            let nmt = document.createElement("p");
            let img = document.createElement("img");
            img.src = "/assets/draaft/ui/cancel.png";
            nmt.innerText = v.name;
            nm.appendChild(nmt);
            nm.appendChild(img);
            
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
            
            b.onclick = () => {
                // disallowed if we can't select more gambits
                if (b.classList.contains("noclick") || (b.classList.contains("disabled") && SELECTED_GAMBITS >= MAX_GAMBITS)) {
                    play_audio("low-sound");
                    return;
                }
                play_audio("normal-click");
                var req = undefined;
                if (b.classList.contains("disabled")) {
                    req = apiRequest(`draft/gambit/enable?key=${k}`).then(resp => {
                        if (!resp.ok) { throw new Error('Failed toggle gambit'); }
                        SELECTED_GAMBITS += 1;
                        update_gambits(SELECTED_GAMBITS);
                        b.classList.add("enabled");
                        b.classList.remove("disabled");
                    });
                }
                else { // enabled
                    req = apiRequest(`draft/gambit/disable?key=${k}`).then(resp => {
                        if (!resp.ok) { throw new Error('Failed toggle gambit'); }
                        SELECTED_GAMBITS -= 1;
                        update_gambits(SELECTED_GAMBITS);
                        b.classList.remove("enabled");
                        b.classList.add("disabled");
                    });
                }
                req.catch(() => play_audio("low-sound"));
            };
            gambit_div.appendChild(b);
        }
    }
    else {
        gambit_div.style.display = 'none';
    }

    if (LOCAL_TESTING) {
        console.log("Finished building draft pools.");
    }
    p.then(async json => {
        if (LOCAL_TESTING) {
            console.log("Current draft status:");
            console.log(json);
        }

        set_draft_info(json);

        let ctr = makeLogLine();
        let starter = document.createElement("span");
        starter.innerText = `The drAAft has started. First pick: `;
        starter.classList.add("starter-log");
        ctr.appendChild(starter);
        (new Member(json.players[0])).addDiv(ctr, true);

        // fix gambits
        if (json.gambits != undefined) {
            if (json.gambits[UUID] != undefined) {
                console.log("Enabling from server");
                for (const g of json.gambits[UUID]) {
                    document.getElementById(`gambit-${g}`).classList.remove("disabled");
                    document.getElementById(`gambit-${g}`).classList.add("enabled");
                    SELECTED_GAMBITS += 1;
                }
                update_gambits(SELECTED_GAMBITS);
            }
        }

        // must come before setAsPicked
        let max_picks_per_pool = (json.players.length < 2) ? 100 : (
            (json.players.length == 2) ? 4 : json.players.length
        );
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
        if (json.position[0] == UUID) {
            DRAFT_ALLOWED = true;
        }

        // FULLY LOADED!
        console.log("Successfully loaded the draft. Fading out credits.");
        setTimeout(() => {
            (<HTMLDialogElement>document.getElementById("loading-credits")).classList.add("fade");

            displayOnlyPage("draft-page");

            setTimeout(() => {(<HTMLDialogElement>document.getElementById("loading-credits")).close();}, 1000);
        }, 1000);
    }).catch(_ => {
        fullPageNotification("There was an error loading the in-progress draft.", "reload page", () =>
            window.location.reload()
        );
    });
}

export let DRAFTABLES = undefined;
export function fetchData(): Promise<void> {
    return requiredJsonGETRequest("draft/draftables", (json) => {
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
        })
}

export function downloadWorldgen() {
    apiRequest("draft/worldgen", undefined, "GET")
        .then(resp => resp.text())
        .then(async text => {
            console.log(text);
        });
}
