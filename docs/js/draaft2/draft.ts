import {apiRequest, LOCAL_TESTING} from "./request.js";
import {displayOnlyPage, fullPageNotification, STEVE, UUID} from "./util.js";

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

    displayOnlyPage("draft-page");

    // Fill everything in, assuming we have it.
    displayDraftables(p);
}

function iconId(key: string) {
    return `draft-pick-image-${key}`;
}
function pickerId(key: string) {
    return `draft-picker-image-${key}`;
}
function setAsPicked(key: string, picker: string) {
    let ic = document.getElementById(iconId(key));
    ic.onclick = undefined;
    ic.classList.add("picked");
    let pker = <HTMLImageElement>document.getElementById(pickerId(key));
    pker.src = `https://mineskin.eu/helm/${picker}/100`;
    console.log(pker.src);
    pker.classList.add("picked");
}

function displayDraftables(p: Promise<any>) {
    if (DRAFTABLES === undefined) {
        setTimeout(displayDraftables, 200);
        return;
    }
    let pools = DRAFTABLES[0];
    let picks = DRAFTABLES[1];
    for (const pool of pools) {
        // let's not worry about preserving information about this stuff
        let pd = document.createElement("div");
        pd.id = `pool-${pool.name.short_name}`;
        pd.classList.add("draft-pool-container", "draft-page-item");
        if (LOCAL_TESTING) {
            console.log(`Building draft pool ${pool.name.short_name}`);
            console.log(pool);
        }
        // maybe more options in the future idk
        let do_icons = pool.kind === "icons";
        for (const k of pool.contains) {
            if (LOCAL_TESTING) {
                console.log(picks[k]);
            }
            let pk = picks[k];

            let pickd = document.createElement("div");
            pickd.classList.add("draft-pick-container");

            // what will we display in the container?
            if (do_icons) {
                let imgdiv = document.createElement("div");
                imgdiv.classList.add("draft-image-container");
                let ic = document.createElement("img");
                ic.src = `/assets/draaft/picks/${pk.image_uri}`;
                ic.classList.add("draft-pick-image");
                ic.id = iconId(pk.key);
                // WRONG! FIX THIS! THANKS!
                ic.onclick = () => {
                    console.log(`Picking ${pk.key} :)`);
                    apiRequest(`draft/pick?key=${pk.key}`).then(_ => {
                        setAsPicked(pk.key, UUID);
                    });
                };
                imgdiv.appendChild(ic);

                let picker = document.createElement("img");
                picker.classList.add("draft-picker-image");
                picker.id = pickerId(pk.key);
                picker.src = STEVE;
                picker.onerror = () => (picker.src = STEVE);

                pickd.appendChild(imgdiv);
                pickd.appendChild(picker);
            } else {
                let name = document.createElement("p");
                name.innerHTML = picks[k].name.short_name;
                pickd.appendChild(name);
            }

            let desc = document.createElement("div");
            desc.innerHTML = picks[k].description;
            desc.classList.add("tooltip", "pick-tooltip");
            pickd.appendChild(desc);

            pd.appendChild(pickd);
        }
        document.getElementById("draft-page-main").appendChild(pd);
    }
    if (LOCAL_TESTING) {
        console.log("Finished building draft pools.");
    }
    p.then(async json => {
        if (LOCAL_TESTING) {
            console.log("Current draft status:");
            console.log(json);
        }
        for (const pk of json.draft) {
            setAsPicked(pk.key, pk.player);
        }
    }).catch(_ => {
        fullPageNotification("There was an error loading the in-progress draft.", "reload page", () =>
            window.location.reload()
        );
    });
}

export let DRAFTABLES = undefined;
export function fetchData() {
    apiRequest("draft/draftables", undefined, "GET")
        .then(resp => resp.json())
        .then(async json => {
            console.log("Successfully downloaded draftables.");
            if (LOCAL_TESTING) {
                console.log(json);
            }
            DRAFTABLES = json;
        });
}
