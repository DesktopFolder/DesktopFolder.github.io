import { isValidPlayerName, STEVE } from "./utils.js";
import { getDraftItem } from "./options.js";
export function load_overlay(params) {
    console.log("Loading overlay...");
    document.getElementById("bg-video").remove();
    document.getElementById("options-div").remove();
    document.getElementById("options-shower").remove();
    document.getElementById("undo-button").remove();
    document.getElementById("home-button").remove();
    const pname = params.get("name");
    const nname = pname || "???";
    // '1,2,5,10'
    const ummmmwhatrewegetting = (params.get("picks") || '').split(',').map((numk) => getDraftItem(parseInt(numk)));
    // let's over some lays yo
    document.body.classList.add("overlay-body");
    let name = document.createElement("p");
    name.classList.add("overlay-name", "common-shadow");
    name.innerHTML = `${nname} Picks`;
    let playerFace = document.createElement("img");
    playerFace.classList.add("player-face", "overlay-face");
    playerFace.onerror = () => (playerFace.src = STEVE);
    if (isValidPlayerName(nname)) {
        playerFace.src = `https://mineskin.eu/helm/${nname}/128`;
    }
    else {
        playerFace.src = STEVE;
    }
    let pf2 = playerFace.cloneNode();
    let header = document.createElement("div");
    header.id = "overlay-header";
    header.classList.add("flex-right");
    header.appendChild(playerFace);
    header.appendChild(name);
    header.appendChild(pf2);
    let footer = document.createElement("div");
    footer.classList.add("flex-down");
    ummmmwhatrewegetting.sort((a, b) => {
        return a.getValue() - b.getValue();
    });
    var lastpick = null;
    for (const pickdi of ummmmwhatrewegetting) {
        if (pickdi == undefined) {
            continue;
        }
        if (pickdi.pool == 'armour' || pickdi.pool == 'tools') {
            continue;
        }
        let lepick = document.createElement("p");
        lepick.innerHTML = pickdi.prettyName;
        lepick.classList.add('lepick', "common-shadow");
        if (lastpick != pickdi.pool) {
            lepick.classList.add('newpick');
        }
        footer.appendChild(lepick);
        lastpick = pickdi.pool;
    }
    let opicks = document.createElement("div");
    opicks.appendChild(header);
    opicks.appendChild(footer);
    opicks.classList.add("flex-down");
    opicks.id = "overlay-picks";
    document.body.appendChild(opicks);
    /*********************************************/
    let bigname = document.createElement("div");
    let _bigname = document.createElement("p");
    _bigname.classList.add("big-name", "common-shadow");
    _bigname.innerHTML = `${nname}`;
    let _bignamea = document.createElement("p");
    _bignamea.classList.add("big-name-after", "common-shadow");
    bigname.appendChild(_bigname);
    bigname.appendChild(_bignamea);
    bigname.classList.add("flex-down");
    let bigface = document.createElement("img");
    bigface.classList.add("player-face", "big-face", "common-shadow");
    bigface.onerror = () => (bigface.src = STEVE);
    if (isValidPlayerName(nname)) {
        bigface.src = `https://mineskin.eu/helm/${nname}/256`;
    }
    else {
        bigface.src = STEVE;
    }
    let ourname = document.createElement("div");
    ourname.id = "overlay-our-name";
    ourname.classList.add("flex-right");
    ourname.appendChild(bigface);
    ourname.appendChild(bigname);
    let obigname = document.createElement("div");
    obigname.appendChild(ourname);
    obigname.id = "overlay-box-bigname";
    document.body.appendChild(obigname);
    /*********************************************/
    const opname = params.get("otherplayer");
    const onname = opname || "???";
    let smallname = document.createElement("div");
    smallname.classList.add("small-name");
    let _smallname = document.createElement("p");
    _smallname.classList.add("small-name-a", "common-shadow");
    _smallname.innerHTML = `${onname}`;
    let _smallnamea = document.createElement("p");
    _smallnamea.classList.add("small-name-after", "common-shadow");
    smallname.appendChild(_smallname);
    smallname.appendChild(_smallnamea);
    smallname.classList.add("flex-down");
    let smallface = document.createElement("img");
    smallface.classList.add("player-face", "small-face", "common-shadow");
    smallface.onerror = () => (smallface.src = STEVE);
    if (isValidPlayerName(onname)) {
        smallface.src = `https://mineskin.eu/helm/${onname}/256`;
    }
    else {
        smallface.src = STEVE;
    }
    let theirname = document.createElement("div");
    theirname.id = "overlay-their-name";
    theirname.classList.add("flex-right");
    theirname.appendChild(smallface);
    theirname.appendChild(smallname);
    let osmallname = document.createElement("div");
    osmallname.appendChild(theirname);
    osmallname.id = "overlay-box-smallname";
    document.body.appendChild(osmallname);
}
