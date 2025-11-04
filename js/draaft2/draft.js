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
