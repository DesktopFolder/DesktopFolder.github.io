// I'm just going to quickly preface this.
// I have no knowledge whatsoever of best practice within JS.
// This is just me going based off of some very basic assumptions.
// This may not be good code. (And most likely isn't.)

// Helpers
function timestamp() {
    return Math.floor(Date.now() / 1000);
}

function isValidColour(s) {
    let e = document.getElementById("validColour");
    e.style.borderColor = '';
    e.style.borderColor = s;
    return e.style.borderColor.length != 0;
}

class Player {
    constructor(username) {
        this.lastPolled = null;
        this.rawData = [];
        this.data = [];
        this.username = username;
        this.nickname = username;
        this.overrideNick = null;
        this.base_rank = 0;
        this.base_elo = 0;
        this.prev_date = 0;
        this.isActive = false;
        this.timer = null;
    }

    setInactive() {
        this.isActive = false;
        if (this.timer != null) {
            clearInterval(this.timer); 
            this.timer = null;
        }
    }

    setActive() {
        if (!this.isActive) {
            this.isActive = true;
            this.fetchingPoll(0);
        }
        if (this.timer == null)
            this.timer = setInterval(() => this.fetchingPoll(0), application.config.pollMinutes * 60 * 1000 + 1000);
    }

    shouldPoll() {
        // Check if it's been 5 minutes since we last polled.
        return (timestamp() - (this.lastPolled || 0)) > (application.config.pollMinutes * 60);
    }

    polled() {
        this.lastPolled = timestamp();
    }

    scoreChangeFrom(matchData) {
        const uuid = matchData.members.find((item) => (item.nickname.toLowerCase() == this.username)).uuid;
        return matchData.score_changes.find((item) => (item.uuid == uuid)).score;
    }

    enemyFrom(matchData) {
        return matchData.members.find((item) => (item.nickname.toLowerCase() != this.username));
    }

    eloFrom(matchData) {
        return matchData.members.find((item) => (item.nickname.toLowerCase() == this.username)).elo_rate;
    }

    dataFrom(matchData) {
        return matchData.members.find((item) => (item.nickname.toLowerCase() == this.username));
    }

    fetchingPoll(i = 0) {
        if (!this.shouldPoll() && i == 0) {
            console.log(`Player: Did not poll for ${this.username} due to internal ratelimit. (Page 0 request)`);
            return;
        }
        this.polled();
        console.log(`Player: Submitting fetch for ${this.username}`);
        fetch(`https://mcsrranked.com/api/users/${this.username}/matches?filter=2&count=${application.config.pageCount}&page=${i}`, {mode:'cors'})
            .then((response) => response.json())
            .then((data) => {
                console.log(`Got data for ${this.username}`);
                // LOGGING / INVALID DATA
                // console.log(data);
                // let output = document.getElementById("json-output");
                // output.innerHTML = JSON.stringify(data);

                // Player is invalid in some way.
                if (data.status == "error") { 
                    console.log(`Player ${this.username}: Refusing to update application with bad data.`);
                    this.setInactive();
                    return;
                }

                // Player is valid from here.
                if (data.data.length > 0 && i == 0) {
                    // Let's get some data from this.
                    let ourData = this.dataFrom(data.data[0]);
                    this.base_elo = ourData.elo_rate;
                    this.nickname = ourData.nickname;
                    this.base_rank = ourData.elo_rank;
                    console.log(`Player ${this.username}: Set base elo to ${this.base_elo}`);

                    // If latest match has already been loaded, exit.
                    const latest_match_date = data.data[0].match_date;
                    if (latest_match_date == this.prev_date) {
                        console.log(`Player ${this.username}: No update found.`);
                        return;
                    }

                    this.prev_date = latest_match_date;
                    this.data = [];
                    this.rawData = [];
                }

                // Load the new data into ourselves.
                this.extendData(data.data);

                // Maybe launch another fetch.
                if (data.data.length >= application.config.pageCount) {
                    console.log(`Queued another read for page ${i + 1} for ${this.username}`);
                    setTimeout(() => {
                        if (this.isActive) { this.fetchingPoll(i + 1) }
                    }, 2000);
                }

                application.rerender();
            })
            .catch((e) => { console.log(`Player ${this.username}: Fetches interrupted by: ${e}`); });
    }

    //asData() {
    //    return JSON.stringify(this.data.filter((e, i, a) => (i == 0 || a[i - 1][1] != e[1] || a[i - 1][2] != e[2])));
    //}

    toEloChartData() {
        return this.data;
        //return this.data.map(o => ({x: o[0] * 1000, y: o[2]}));
    }
    toRankChartData() {
        return this.data;
        //return this.data.map(o => ({x: o[0] * 1000, y: o[1]}));
    }

    extendData(data) {
        for (const d of data) {
            if (d.match_type != 2) continue;
            if (d.score_changes == null) continue;
            let c = this.scoreChangeFrom(d);
            
            // we go most recent to least recent
            // first set the data, then make the change
            this.data.push({
                x: d.match_date * 1000,
                y: this.base_elo,
                enemy: this.enemyFrom(d).nickname,
                change: c,
            });

            this.rawData.push({
                x: d.match_date * 1000,
                y: this.base_elo,
                enemy: this.enemyFrom(d).nickname,
                change: c,
            });

            this.base_elo -= c;
        }
    }
}

class Application {
    static #FEINBERG_LINE = 'rgb(255, 99, 132)';
    static #FEINBERG_BG = 'rgb(75, 192, 192)';
    static #DEFAULT_LINE = 'rgba(113, 121, 126, 0.8)';
    static #DEFAULT_BG = 'rgba(226, 242, 252, 0.4)';
    //static #DEFAULT_FG_LINE = 'rgba(178, 121, 126, 0.9)';

    timer = null;

    config = { 
        pageCount: 50,
        pollMinutes: 5,
    };

    // LocalStorage accessors/modifiers
    getItem(id, default_value = null) {
        return localStorage.getItem('_elo:' + id.toLowerCase()) || default_value;
    }

    setItem(id, val) {
        return localStorage.setItem('_elo:' + id.toLowerCase(), val);
    }

    removeItem(id) {
        return localStorage.removeItem('_elo:' + id.toLowerCase());
    }

    isEaster() {
        return document.getElementById("allow-eggs").checked;
    }

    // Setup - load our relevant data
    constructor() {
        this.players = new Map(); // These are lazy loaded.
        this.activePlayer = null;
    }

    init() {
        if (this.getItem('version', 0) < 1) {
            // Version upgrade things?
        }
        this.ctx = document.getElementById("incredible-elo-chart");
        this.data = {
            labels: [],
            datasets: [{
                label: 'Elo Value',
                backgroundColor: Application.#DEFAULT_BG,
                borderColor: Application.#DEFAULT_LINE, 
                fill: true,
                data: [],
                yAxisID: 'ELO',
                tension: 0.2,
            }, /*{
                label: 'MCSR Rank',
                backgroundColor: Application.#DEFAULT_BG,
                borderColor: Application.#DEFAULT_FG_LINE, 
                fill: false,
                data: [],
                yAxisID: 'RANK',
            }*/
            ],
        };
        this.graph = new Chart(this.ctx, {
            type: 'line',
            data: this.data,
            options: {
                plugins: {
                    title: {
                        text: 'Elo Graph',
                        display: true
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (context) {
                                const c = context.raw.change;
                                let cval = c > 0 ? '+' + String(c) : String(c);
                                return `${context.raw.y} (${cval} vs ${context.raw.enemy})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            tooltipFormat: 'DD T'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    ELO: {
                        type: 'linear',
                        position: 'left',
                        id: 'ELO',
                        title: {
                            display: true,
                            text: 'Elo'
                        }
                    },
                    /*RANK: {
                        type: 'linear',
                        position: 'right',
                        id: 'RANK',
                        title: {
                            display: true,
                            text: 'Rank'
                        },
                        reverse: true,
                    }*/
                }
            }
        });
    }

    getPlayer(username) {
        if (this.players.has(username)) { return this.players.get(username); }
        this.players.set(username, new Player(username)); 
        return this.players.get(username);
    }

    doTension(t) {
        this.graph.data.datasets[0].tension = t;
        this.graph.update();
    }

    maybeSetColours() {
        let bg = document.getElementById("bg-col-value").value;
        let line = document.getElementById("line-col-value").value;
        if (bg != Application.#DEFAULT_BG && isValidColour(bg))
            this.graph.data.datasets[0].backgroundColor = bg;
        if (line != Application.#DEFAULT_LINE && isValidColour(line))
            this.graph.data.datasets[0].borderColor = line;
    }

    rerender() {
        if (this.activePlayer == null) {
            console.log("Warning: this.activePlayer was null when rerender()");
            return;
        }

        // This is where all of our rendering code should stem from.
        let eloChartData = this.activePlayer.toEloChartData();

        if (this.isEaster()) {
            this.doPerUserEasterEggs(this.activePlayer);
        }
        else {
            console.log(`Removing easter eggs for ${player.username}`);
            this.removeEasterEggs(this.activePlayer);
        }

        this.maybeSetColours();

        // Don't update the graph unless we have actual data.
        // This enables our delayed callback system.
        if (eloChartData.length > 0) {
            this.graph.data.datasets[0].data = eloChartData;
            this.graph.options.plugins.title.text = `Elo Graph for ${this.activePlayer.overrideNick || this.activePlayer.nickname}`;
            console.log(`Rerendered for ${this.activePlayer.username}`);
        }
        else {
            console.log(`Did not rerender for ${this.activePlayer.username} as data was 0.`);
        }
        // Always call update graph, we just don't update the data necessarily.
        this.graph.update();
    }

    doPerUserEasterEggs(player) {
        // Reset everything. Yeah this is ugly but whatever.
        // Who expects performance out of javascript web apps anyways? Lol!
        this.removeEasterEggs(player);

        // We're having so much fun, aren't we?
        console.log(`Doing easter eggs for ${player.username}`);
        let username = player.username;
        if (username == 'feinberg') {
            this.graph.data.datasets[0].backgroundColor = Application.#FEINBERG_BG;
            this.graph.data.datasets[0].borderColor = Application.#FEINBERG_LINE;
        }
        else if (username == 'shenaningans') {
            player.overrideNick = 'Ella';
            this.graph.data.datasets[0].backgroundColor = 'rgba(207,191,246,0.5)';
            this.graph.data.datasets[0].borderColor = 'rgba(81,55,130,1)';
        }
        else if (username == 'hamazonau') {
            player.overrideNick = 'Hamazon (Top 50 AU)';
        }
        else if (username == 'redlime') {
            // I don't know Oliver's ingame name lol
            player.overrideNick = 'RedLime (MCSR Developer)';
        }
        else if (username == 'desktopfolder') {
            player.overrideNick = 'DesktopFolder (NOT A WEB DEVELOPER, PLEASE BELIEVE ME)';
            this.graph.data.datasets[0].backgroundColor = 'rgba(85, 172, 238, 0.4)';
            this.graph.data.datasets[0].borderColor = 'rgba(34,102,153,1)';
        }
        else if (username == 'fulham') {
            // ngl I don't watch fulham's stream enough to know any fun easter eggs
            // thanks for being my unwitting test subject for this app though
            this.graph.data.datasets[0].label = 'Elo Value (It\'s high, right?)';
        }
    }

    removeEasterEggs(player) {
        player.overrideNick = null;
        this.graph.data.datasets[0].backgroundColor = Application.#DEFAULT_BG;
        this.graph.data.datasets[0].borderColor = Application.#DEFAULT_LINE;
        this.graph.data.datasets[0].label = 'Elo Value';
    }

    // Entry point for our application.
    loadUsername(inputUsername) {
        let username = inputUsername.toLowerCase();
        if (!/^([a-z0-9_]{2,17})$/.test(username)) {
            return;
        }
        
        if (this.activePlayer != null) this.activePlayer.setInactive();
        this.activePlayer = this.getPlayer(username);
        this.activePlayer.setActive();

        // Just always rerender.
        this.rerender();
    }
}

var application = new Application();

function updateUrls(username) {
    var o = document.getElementById("current-url");
    var newUrl = 'https://' + location.host + location.pathname;
    // this should use join, but shh
    const u = (username == 0) ? '' : ('username=' + username);
    const res = [u].filter(v => v).join('&');
    if (res.length != 0) {
        newUrl = newUrl + '?' + res;
    }
    o.href = newUrl;
    o.innerHTML = newUrl;

    // Also update the nacho thing
    // a nice long line of code ^^
    // feast thine eyes upon it...
    document.getElementById("nacho-url").href = "https://nacho-cs.github.io/?q=" + username;
    document.getElementById("pasta-url").href = "https://mcsr-ranked-stats-viewer.vercel.app/player/" + username;
}

function onDomLoaded() {
    // Config & initialization of graph.
    application.init();

    document.getElementById("username-value").addEventListener("keypress", function(e) {
        if (e.key == 'Enter') {
            console.log("Enter keypress -> Firing username update.");
            const username = document.getElementById("username-value").value;
            application.loadUsername(username);
            updateUrls(username);
        }
    });

    for (const appChanger of Array.from(document.getElementsByClassName("app-rerender"))) {
        appChanger.addEventListener("change", function() {
            console.log("Attempting application rerender through app-rerender class.");

            if (document.getElementById("group-sessions").checked) {
                document.getElementById("warn-experimental").innerHTML = 'No seriously, this does nothing';
            }
            else {
                document.getElementById("warn-experimental").innerHTML = 'WIP come back in a few days';
            }
            application.rerender();
        });
    }

    document.getElementById("tension-value").addEventListener("input", function(e) {
        let t = parseFloat(document.getElementById("tension-value").value);
        if (isNaN(t) || t == null) return;
        if (t > 1.0 || t < 0.0) return;

        application.doTension(t);
    });

    // Parse URL parameters.
    const url = new URL(window.location.href);
    const username = url.searchParams.get("username") || "";
    document.getElementById("username-value").value = username;
    application.loadUsername(username);

    updateUrls(username);

    console.log("Finished application setup.");
}

document.addEventListener('DOMContentLoaded', onDomLoaded, false);
