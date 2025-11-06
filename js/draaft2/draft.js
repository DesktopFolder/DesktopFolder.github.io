import { apiRequest, LOCAL_TESTING } from "./request.js";
import { displayOnlyPage, fullPageNotification } from "./util.js";
export let IS_DRAFTING = false;
export function startDrafting() {
    if (IS_DRAFTING) {
        return;
    }
    IS_DRAFTING = true;
    // always just start fetching the data early
    let p = apiRequest("draft/status", undefined, "GET")
        .then(resp => resp.json())
        .then(async (json) => {
        console.log(json);
    })
        .catch(_ => {
        fullPageNotification("There was an error loading the in-progress draft.", "reload page", () => window.location.reload());
    });
    apiRequest("draft/pick?key=bucket", undefined, "POST");
    displayOnlyPage("draft-page");
    // Fill everything in, assuming we have it.
    displayDraftables();
}
function displayDraftables() {
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
        for (const k of pool.contains) {
            if (LOCAL_TESTING) {
                console.log(picks[k]);
            }
            let pickd = document.createElement("div");
            pickd.classList.add("draft-pick-container");
            let name = document.createElement("p");
            name.innerHTML = picks[k].name.short_name;
            pickd.appendChild(name);
            let desc = document.createElement("p");
            desc.innerHTML = picks[k].description;
            desc.classList.add("tooltip", "pick-tooltip");
            pickd.appendChild(desc);
            pd.appendChild(pickd);
        }
        document.getElementById('draft-page-main').appendChild(pd);
    }
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
