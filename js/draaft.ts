import { pools } from "./draaft/options.js";
import { Player } from "./draaft/players.js";

let allPlayers: Array<Player> = [];

class StateMachine {
    title: HTMLParagraphElement;
    titleContainer: HTMLDivElement;

    playerList: Array<Player> = [];

    start() {
        if (this.checkPlayers() == 0) {
            return;
        }
        this.title.innerHTML = "Drafting...";

        // Let's get our players!
        for (const player of allPlayers) {
            if (player.exists()) {
                this.playerList.push(player);
            }
        }

        this.title.innerHTML = `Draft pick: ${allPlayers[0].name}`;
    }

    setToPlayers(n: number) {
        if (n == 0) {
            this.title.innerHTML = "Waiting for players...";
        } else if (n == 1) {
            this.title.innerHTML =
                "1 player entered, press start to begin draft...";
        } else {
            this.title.innerHTML = `${n} players entered, press start to begin draft...`;
        }
    }

    constructor() {
        this.title = document.createElement("p");
        this.titleContainer = document.createElement("div");
        this.titleContainer.appendChild(this.title);
        this.titleContainer.classList.add("title-container");
        this.checkPlayers();
    }

    checkPlayers() {
        let count = 0;
        for (const p of allPlayers) {
            if (p.exists()) {
                count += 1;
            }
        }
        this.setToPlayers(count);
        return count;
    }
}

function main() {
    let sm = new StateMachine();

    let players = document.createElement("div");
    players.id = "left-gutter";
    for (let step = 0; step < 4; step++) {
        let p = new Player();
        players.appendChild(p.container);
        allPlayers.push(p);
        p.input.addEventListener("change", () => {
            sm.checkPlayers();
        });
    }
    let starter = document.createElement("a");
    starter.classList.add("start-button");
    starter.href = "#";
    starter.innerHTML = "Start";
    starter.onclick = () => {
        sm.start();
        return false;
    };
    players.appendChild(starter);
    document.body.appendChild(players);

    let container = document.createElement("div");
    container.id = "draft-body";
    container.classList.add("flex-right");

    container.appendChild(sm.titleContainer);

    for (const pool of pools) {
        console.log(`Adding pool: ${pool.prettyName}`);
        container.appendChild(pool.makeDiv());
    }

    document.body.appendChild(container);
}

document.addEventListener("DOMContentLoaded", main, false);
