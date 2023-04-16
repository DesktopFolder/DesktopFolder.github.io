import { getItem } from "/js/ls.js"

export function doShowables() {
    for (const showable of Array.from(
        document.getElementsByClassName("notice-banner")
    )) {
        if (getItem(showable.id) == null) {
            document.getElementById(showable.id).style.display = "";
        }
    }
}

