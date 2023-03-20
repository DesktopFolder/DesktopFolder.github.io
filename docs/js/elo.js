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
    e.style.borderColor = "";
    e.style.borderColor = s;
    return e.style.borderColor.length != 0;
}

function doGrouping() {
    return document.getElementById("group-sessions").checked;
}

function graphType() {
    return document.getElementById("graph-type").value;
}

function asSRTime(v) {
    const s = (v / 1000).toFixed(0) % 60;
    const m = (v / (1000 * 60)).toFixed(0);
    const sstr = (s < 10 ? "0" : "") + String(s);
    const mstr = (m < 10 ? "0" : "") + String(m);
    return `${mstr}:${sstr}`;
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
        this.loading = "Inactive";
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
            this.timer = setInterval(
                () => this.fetchingPoll(0),
                application.config.pollMinutes * 60 * 1000 + 1000
            );
    }

    shouldPoll() {
        // Check if it's been 5 minutes since we last polled.
        return (
            timestamp() - (this.lastPolled || 0) >
            application.config.pollMinutes * 60
        );
    }

    polled() {
        this.lastPolled = timestamp();
    }

    scoreChangeFrom(matchData) {
        const uuid = matchData.members.find(
            (item) => item.nickname.toLowerCase() == this.username
        ).uuid;
        return matchData.score_changes.find((item) => item.uuid == uuid).score;
    }

    enemyFrom(matchData) {
        return matchData.members.find(
            (item) => item.nickname.toLowerCase() != this.username
        );
    }

    eloFrom(matchData) {
        return matchData.members.find(
            (item) => item.nickname.toLowerCase() == this.username
        ).elo_rate;
    }

    dataFrom(matchData) {
        return matchData.members.find(
            (item) => item.nickname.toLowerCase() == this.username
        );
    }

    fetchingPoll(i = 0) {
        if (!this.shouldPoll() && i == 0) {
            application.log(
                `Player: Did not poll for ${this.username} due to internal ratelimit. (Page 0 request)`
            );
            return;
        }
        this.polled();
        application.log(`Player: Submitting fetch for ${this.username}`);
        fetch(
            `https://mcsrranked.com/api/users/${this.username}/matches?filter=2&count=${application.config.pageCount}&page=${i}`,
            { mode: "cors" }
        )
            .then((response) => response.json())
            .then((data) => {
                application.log(`Got data for ${this.username}`);
                // LOGGING / INVALID DATA
                // console.log(data);
                // let output = document.getElementById("json-output");
                // output.innerHTML = JSON.stringify(data);
                this.loading = `Queried API page ${i}...`;

                // Player is invalid in some way.
                if (data.status == "error") {
                    console.log(
                        `Player ${this.username}: Refusing to update application with bad data.`
                    );
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
                    application.log(
                        `Player ${this.username}: Set base elo to ${this.base_elo}`
                    );

                    // If latest match has already been loaded, exit.
                    const latest_match_date = data.data[0].match_date;
                    if (latest_match_date == this.prev_date) {
                        application.log(
                            `Player ${this.username}: No update found.`
                        );
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
                    application.log(
                        `Queued another read for page ${i + 1} for ${
                            this.username
                        }`
                    );
                    setTimeout(() => {
                        if (this.isActive) {
                            this.fetchingPoll(i + 1);
                        }
                    }, 2000);
                } else {
                    this.loading = `Fetched all ${this.data.length} values.`;
                    setTimeout(() => {
                        if (this.isActive) {
                            this.loading = null;
                            application.rerender();
                        }
                    }, 3000);
                }

                application.rerender();
            })
            .catch((e) => {
                console.log(
                    `Player ${this.username}: Fetches interrupted by: ${e}`
                );
                document.getElementById("error-message").style.display = "";
            });
    }

    //asData() {
    //    return JSON.stringify(this.data.filter((e, i, a) => (i == 0 || a[i - 1][1] != e[1] || a[i - 1][2] != e[2])));
    //}
    genericFilteredData() {
        let data = this.data.map((o) => {
            o.comprises = 1;
            o.change = o.raw_change;
            return o;
        });

        const begin = document.getElementById("begin-date").value;
        if (begin !== "") {
            const ts = new Date(begin).getTime();
            data = data.filter((d) => d.x > ts);
            application.log(`Filtered with begin ${begin}`);
        }
        const end = document.getElementById("end-date").value;
        if (end !== "") {
            const ts = new Date(end).getTime();
            data = data.filter((d) => d.x < ts);
            application.log(`Filtered with end ${end}`);
        }

        if (application.enabled("no-ffs")) data = data.filter((o) => !o.ff);
        if (application.enabled("wins-only")) data = data.filter((o) => o.won);
        return data;
    }

    asWinrate(d) {
        let wr = 0;
        let matches = 0;
        let wins = 0;
        return d
            .reverse()
            .map(function getWinrate(o) {
                matches += 1;
                if (o.won) wins += 1;
                o.y = Math.round((100 * wins) / matches, 2);
                return o;
            })
            .splice(5)
            .reverse();
    }

    asDuration(d) {
        let total = 0;
        let num = 0;
        return d
            .reverse()
            .map(function getAvgDuration(o) {
                num += 1;
                total += o.duration;
                o.y = Math.round(total / num, 0);
                return o;
            })
            .reverse();
    }

    toChartData(groupable = true) {
        let data = this.genericFilteredData();
        if (data.length == 0) return [];

        const gt = graphType();
        if (gt == "player-winrate") data = this.asWinrate(data);
        else if (gt == "match-duration") data = this.asDuration(data);
        else
            data = data.map(function fixY(o) {
                o.y = o.elo;
                return o;
            });

        if (application.enabled("group-sessions") && groupable) {
            const tval =
                parseInt(document.getElementById("group-thresh-val").value) ||
                30;
            const MINUTES = tval * 60 * 1000;

            let last_time = data[0].x + 2 * MINUTES;
            let last_allowed = data[0];
            let won = 0;
            let lost = 0;
            let total_time = 0;
            const first_elo = data[data.length - 1].y;
            data = data.filter((d) => {
                const prev = last_time;
                // prev is now the NEXT data point chronologically
                last_time = d.x;
                const allow = prev - d.x > MINUTES;
                // if we allow it, we are now last allowed
                if (allow) {
                    last_allowed.change = last_allowed.y - d.y;
                    const total_games = won + lost;
                    last_allowed.wr = Math.round(
                        (won * 100.0) / total_games,
                        2
                    );
                    last_allowed.avduration = (
                        total_time / total_games
                    ).toFixed(0);
                    last_allowed = d;
                    won = 0;
                    lost = 0;
                    total_time = 0;
                }
                // otherwise, increment last allowed count
                else {
                    last_allowed.comprises += 1;
                    last_allowed.first_x = d.x;
                }

                if (d.won) won += 1;
                else lost += 1; // TODO - draw accounting? I don't really care so
                total_time += d.duration;
                return allow;
            });
            let first_post_filter = data[data.length - 1];
            first_post_filter.wr = Math.round((won * 100.0) / (won + lost), 2);
            first_post_filter.avduration = (total_time / (won + lost)).toFixed(
                0
            );
            first_post_filter.change = first_post_filter.y - first_elo;
        }

        if (gt == "match-rduration")
            data = data.map(function asDur(o) {
                o.y = o.avduration || o.duration;
                return o;
            });

        return data;
        //return this.data.map(o => ({x: o[0] * 1000, y: o[2]}));
    }

    dateFiltered(min, max) {
        const fd = this.toChartData(false).filter((d) => d.x >= min && d.x <= max);
        console.log(`Filtered by ${min}-${max} to get ${fd.length} points.`);
        const gt = graphType();
        if (gt == "match-rduration") {
            return fd.map(function (o) {
                o.y = o.duration;
                return o;
            });
        }
        if (gt == "match-duration") {
            return fd.map(function (o) {
                o.y = o.duration;
                return o;
            });
        }
        return fd;
    }

    toPointRadiusData(d) {
        const comprisesToRadius1 = (c) => {
            if (c <= 6) return c + 2;
            return 6 + Math.sqrt(c);
        };
        const comprisesToRadius2 = (c) => {
            return (6.5 * c) / (c / 2 + 6) + 2;
        };
        if (application.enabled("smart-points"))
            return d.map((e) => comprisesToRadius2(e.comprises));
        else return d.map((e) => 3);
    }
    toRankChartData() {
        return this.data;
        //return this.data.map(o => ({x: o[0] * 1000, y: o[1]}));
    }

    extendData(data) {
        for (const d of data) {
            if (d.match_type != 2) continue;
            if (d.score_changes == null) continue;
            const ourData = this.dataFrom(d);
            let c = this.scoreChangeFrom(d);

            // we go most recent to least recent
            // first set the data, then make the change
            this.data.push({
                x: d.match_date * 1000,
                first_x: d.match_date * 1000,
                // Elo value is stored in y.
                y: this.base_elo,
                elo: this.base_elo,
                duration: d.final_time,
                avduration: null,
                enemy: this.enemyFrom(d).nickname,
                comprises: 1,
                wr: null,
                change: c,
                raw_change: c,
                won: ourData.uuid == d.winner,
                ff: d.forfeit,
            });

            this.rawData.push({
                x: d.match_date * 1000,
                y: this.base_elo,
                enemy: this.enemyFrom(d).nickname,
                comprises: 1,
                change: c,
            });

            this.base_elo -= c;
        }
    }
}

class Application {
    static #FEINBERG_LINE = "rgb(255, 99, 132)";
    static #FEINBERG_BG = "rgb(75, 192, 192)";
    static #DEFAULT_LINE = "rgba(113, 121, 126, 0.8)";
    static #DEFAULT_BG = "rgba(226, 242, 252, 0.4)";
    //static #DEFAULT_FG_LINE = 'rgba(178, 121, 126, 0.9)';

    timer = null;

    config = {
        pageCount: 50,
        pollMinutes: 5,
    };

    enabled(id) {
        return document.getElementById(id).checked;
    }

    // LocalStorage accessors/modifiers
    getItem(id, default_value = null) {
        return (
            localStorage.getItem("_elo:" + id.toLowerCase()) || default_value
        );
    }

    setItem(id, val) {
        return localStorage.setItem("_elo:" + id.toLowerCase(), val);
    }

    removeItem(id) {
        return localStorage.removeItem("_elo:" + id.toLowerCase());
    }

    // Setup - load our relevant data
    constructor() {
        this.players = new Map(); // These are lazy loaded.
        this.activePlayer = null;
        // atm just enable this via console.
        this.doLogging = this.getItem("do-logging") != null;
    }

    axisID() {
        const gt = graphType();
        if (gt == "player-elo" || gt == "stats-view") return "ELO";
        if (gt == "player-winrate") return "WINRATE";
        if (gt == "match-duration") return "DURATION";
        if (gt == "match-rduration") return "RDURATION";
        return "Stop messing around...";
    }

    graphTitle() {
        const gt = graphType();
        if (gt == "player-elo" || gt == "stats-view") return "Elo Value";
        if (gt == "player-winrate") return "Winrate";
        if (gt == "match-duration") return "Average Match Duration";
        if (gt == "match-rduration") return "Match Duration";
        return "Stop messing around...";
    }

    init() {
        if (this.getItem("version", 0) < 1) {
            // Version upgrade things?
        }
        this.ctx = document.getElementById("incredible-elo-chart");

        const tens = application.getItem("tension-value", "0.2");
        document.getElementById("tension-value").value = tens;

        const sg = application.getItem("group-sessions", "false");
        document.getElementById("group-sessions").checked = sg == "true";
        const sp = application.getItem("smart-points", "false");
        document.getElementById("smart-points").checked = sp == "true";
        const cg = application.getItem("clean-graph", "false");
        document.getElementById("clean-graph").checked = cg == "true";

        document.getElementById("bg-col-value").value = this.getItem(
            "bg-colour",
            Application.#DEFAULT_BG
        );
        document.getElementById("line-col-value").value = this.getItem(
            "line-colour",
            Application.#DEFAULT_LINE
        );

        this.data = {
            labels: [],
            datasets: [
                {
                    label: this.graphTitle(),
                    backgroundColor:
                        document.getElementById("bg-col-value").value,
                    borderColor:
                        document.getElementById("line-col-value").value,
                    fill: true,
                    data: [],
                    pointRadius: undefined,
                    hoverRadius: undefined,
                    yAxisID: "ELO",
                    tension: this.getTension(tens) || 0.2,
                    pointBackgroundColor: function (c) {
                        let idx = c.dataIndex;
                        let p = c.dataset.data[idx];
                        if (p == null) return;
                        if (p.comprises > 1) {
                            // return 'rgba(255, 0, 0, 0.3)';
                        }
                        return "rgba(0, 0, 0, 0.1)";
                    },
                }
                /*
                {
                    label: "Win Duration",
                    backgroundColor:
                        document.getElementById("bg-col-value").value,
                    borderColor:
                        document.getElementById("line-col-value").value,
                    fill: true,
                    data: [],
                    hidden: true,
                    pointRadius: undefined,
                    hoverRadius: undefined,
                    yAxisID: "ELO",
                    tension: this.getTension(tens) || 0.2,
                    pointBackgroundColor: function (c) {
                        let idx = c.dataIndex;
                        let p = c.dataset.data[idx];
                        if (p == null) return;
                        if (p.comprises > 1) {
                            // return 'rgba(255, 0, 0, 0.3)';
                        }
                        return "rgba(0, 0, 0, 0.1)";
                    },
                },
                {
                    label: "Loss Duration",
                    backgroundColor:
                        document.getElementById("bg-col-value").value,
                    borderColor:
                        document.getElementById("line-col-value").value,
                    fill: true,
                    data: [],
                    hidden: true,
                    pointRadius: undefined,
                    hoverRadius: undefined,
                    yAxisID: "ELO",
                    tension: this.getTension(tens) || 0.2,
                    pointBackgroundColor: function (c) {
                        let idx = c.dataIndex;
                        let p = c.dataset.data[idx];
                        if (p == null) return;
                        if (p.comprises > 1) {
                            // return 'rgba(255, 0, 0, 0.3)';
                        }
                        return "rgba(0, 0, 0, 0.1)";
                    },
                },
                */
                /*{
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
            type: "line",
            data: this.data,
            options: {
                elements: {
                    point: {
                        radius: 1,
                    },
                },
                onClick: (event, elements, chart) => {
                    if (elements[0]) {
                        let min = Number.MAX_VALUE;
                        let max = 0;
                        for (const e of elements) {
                            const dsi = e.datasetIndex;
                            const di = e.index;
                            const de =
                                application.graph.data.datasets[dsi].data[di];
                            min = Math.min(min, de.first_x);
                            max = Math.max(max, de.x);
                        }
                        application.prevData =
                            application.graph.data.datasets[0].data;
                        application.graph.data.datasets[0].data =
                            application.activePlayer.dateFiltered(min, max);
                        application.graph.data.datasets[0].pointRadius = 4;
                        application.graph.data.datasets[0].hoverRadius = 6;
                        application.graph.update();
                    }
                },
                plugins: {
                    title: {
                        text: "Elo Graph",
                        display: true,
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (context) {
                                let dobj = context.raw;
                                if (dobj == undefined) {
                                    // HACKS SO MANY HACKS
                                    const di = context.dataIndex;
                                    dobj = application.prevData[di];
                                }
                                const c = dobj.change;
                                let cval = c > 0 ? "+" + String(c) : String(c);
                                const enemies =
                                    (dobj.comprises > 1)
                                        ? `${dobj.comprises} players, ${dobj.wr}% winrate`
                                        : dobj.enemy;
                                let y = dobj.y;
                                if (graphType().includes("duration")) y = asSRTime(y);
                                return `${y} (${cval} vs ${enemies})`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        type: "time",
                        time: {
                            tooltipFormat: "DD T",
                        },
                        title: {
                            display: true,
                            text: "Date",
                        },
                    },
                    ELO: {
                        type: "linear",
                        display: () => graphType() == "player-elo" || graphType() == "stats-view",
                        position: "left",
                        id: "ELO",
                        title: {
                            display: true,
                            text: "Elo",
                        },
                    },
                    WINRATE: {
                        type: "linear",
                        display: () => graphType() == "player-winrate",
                        position: "left",
                        id: "WINRATE",
                        title: {
                            display: true,
                            text: "Winrate"
                        },
                    },
                    DURATION: {
                        type: "linear",
                        display: () => graphType() == "match-duration",
                        position: "left",
                        id: "DURATION",
                        title: {
                            display: true,
                            text: "AverageDuration",
                        },
                        ticks: {
                            callback: asSRTime,
                        },
                    },
                    RDURATION: {
                        type: "linear",
                        display: () => graphType() == "match-rduration",
                        position: "left",
                        id: "RDURATION",
                        title: {
                            display: true,
                            text: "Duration",
                        },
                        ticks: {
                            callback: asSRTime,
                        },
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
                },
            },
        });
        this.graph.update();
    }

    disableZoom() {
        application.log("Disabling zoom.");
        this.graph.options.plugins.zoom = {};
    }

    enableZoom() {
        application.log("Enabling zoom.");
        this.graph.options.plugins.zoom = {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true,
                },
                mode: "x",
            },
            pan: {
                enabled: true,
                mode: "x",
            },
        };
        this.graph.update();
    }

    getPlayer(username) {
        if (this.players.has(username)) {
            return this.players.get(username);
        }
        this.players.set(username, new Player(username));
        return this.players.get(username);
    }

    getTension(tsrc) {
        let t = parseFloat(tsrc);
        if (isNaN(t) || t == null) return null;
        if (t > 1.0 || t < 0.0) return null;
        return t;
    }

    doTension(tsrc) {
        application.setItem("tension-value", tsrc);
        let t = this.getTension(tsrc);
        if (t == null) return;
        this.graph.data.datasets[0].tension = t;
        this.graph.update();
    }

    maybeSetColours() {
        let bg = document.getElementById("bg-col-value").value;
        let line = document.getElementById("line-col-value").value;
        if (bg != Application.#DEFAULT_BG) {
            if (isValidColour(bg)) {
                this.setItem("bg-colour", bg);
                this.graph.data.datasets[0].backgroundColor = bg;
            } else {
                this.removeItem("bg-colour");
            }
        }
        if (line != Application.#DEFAULT_LINE) {
            if (isValidColour(line)) {
                this.setItem("line-colour", line);
                this.graph.data.datasets[0].borderColor = line;
            } else {
                this.removeItem("line-colour");
            }
        }
    }

    rerender() {
        if (this.enabled("allow-zoom")) this.enableZoom();
        else this.disableZoom();
        const gt = graphType();
        if (this.enabled("clean-graph")) {
            this.log("Doing clean graphing.");
            this.graph.data.datasets[0].pointRadius = undefined;
            this.graph.data.datasets[0].hoverRadius = undefined;
            this.graph.options.elements.point.radius = 1;
        } else {
            this.graph.options.elements.point.radius = 3;
        }

        if (this.activePlayer == null) {
            console.log("Warning: this.activePlayer was null when rerender()");
            this.graph.update();
            return;
        }

        let eloChartData = this.activePlayer.toChartData();
        // This is where all of our rendering code should stem from.

        if (this.enabled("allow-eggs")) {
            this.doPerUserEasterEggs(this.activePlayer);
        } else {
            application.log(
                `Removing easter eggs for ${this.activePlayer.username}`
            );
            this.removeEasterEggs(this.activePlayer);
        }

        this.maybeSetColours();

        // Don't update the graph unless we have actual data.
        // This enables our delayed callback system.
        if (eloChartData.length > 0) {
            this.graph.data.datasets[0].yAxisID = this.axisID();
            this.graph.data.datasets[0].data = eloChartData;
            if (!this.enabled("clean-graph")) {
                this.graph.data.datasets[0].pointRadius =
                    this.activePlayer.toPointRadiusData(eloChartData);
                this.graph.data.datasets[0].hoverRadius = this.activePlayer
                    .toPointRadiusData(eloChartData)
                    .map((c) => c + 2);
            }
            let loadingtext =
                this.activePlayer.loading == null
                    ? ""
                    : ` (${this.activePlayer.loading})`;
            this.graph.options.plugins.title.text = `Elo Graph for ${
                this.activePlayer.overrideNick || this.activePlayer.nickname
            }${loadingtext}`;
            application.log(`Rerendered for ${this.activePlayer.username}`);
        } else {
            application.log(
                `Did not rerender for ${this.activePlayer.username} as data was 0.`
            );
        }
        this.log(this.graph.data.datasets);
        this.log("Calling graph.update()");
        // Always call update graph, we just don't update the data necessarily.
        this.graph.update();
    }

    doPerUserEasterEggs(player) {
        // Reset everything. Yeah this is ugly but whatever.
        // Who expects performance out of javascript web apps anyways? Lol!
        this.removeEasterEggs(player);

        // We're having so much fun, aren't we?
        application.log(`Doing easter eggs for ${player.username}`);
        let username = player.username;
        if (username == "feinberg") {
            this.graph.data.datasets[0].backgroundColor =
                Application.#FEINBERG_BG;
            this.graph.data.datasets[0].borderColor =
                Application.#FEINBERG_LINE;
        }
        if (username == "sickrates") {
            this.graph.data.datasets[0].backgroundColor =
                Application.#FEINBERG_BG;
            this.graph.data.datasets[0].borderColor =
                Application.#FEINBERG_LINE;
            player.overrideNick = "Feinberg Alt #1";
        }
        if (username == "couriway") {
            player.overrideNick = "Couriway (Pronounced 'curry')";
        }
        if (username == "illuminahd") {
            player.overrideNick = "Illumina (WR holding in our hearts)";
        }
        if (username == "Tekniik") {
            player.overrideNick = "Tekniik (Ranked Grinder)";
        }
        if (username == "zylenox") {
            player.overrideNick = "Zylenox (WR holder - 1.16.1 RSG)";
        } else if (username == "shenaningans") {
            player.overrideNick = "Ella";
            this.graph.data.datasets[0].backgroundColor =
                "rgba(207,191,246,0.5)";
            this.graph.data.datasets[0].borderColor = "rgba(81,55,130,1)";
        } else if (username == "hamazonau") {
            player.overrideNick = "Hamazon (Top 50 AU)";
            this.graph.data.datasets[0].backgroundColor = "rgba(205,0,1,0.5)";
            this.graph.data.datasets[0].borderColor = "rgba(0,0,102,1)";
        } else if (username == "red_lime") {
            // I don't know Oliver's ingame name lol
            player.overrideNick = "RedLime (MCSR Developer)";
            this.graph.data.datasets[0].backgroundColor = "rgba(255,99,99,0.4)";
            this.graph.data.datasets[0].borderColor = "rgba(102,31,31,1)";
        } else if (username == "desktopfolder") {
            player.overrideNick =
                "DesktopFolder (NOT A WEB DEVELOPER, PLEASE BELIEVE ME)";
            this.graph.data.datasets[0].backgroundColor =
                "rgba(85, 172, 238, 0.4)";
            this.graph.data.datasets[0].borderColor = "rgba(34,102,153,1)";
        } else if (username == "fulham") {
            // ngl I don't watch fulham's stream enough to know any fun easter eggs
            // thanks for being my unwitting test subject for this app though
            this.graph.data.datasets[0].label = "Elo Value (It's high, right?)";
        } else if (username == "toph033") {
            player.overrideNick = "Toph";
            this.graph.data.datasets[0].backgroundColor =
                "rgba(134, 252, 212, 0.4)";
            this.graph.data.datasets[0].borderColor = "rgba(74, 94, 81, 0.9)";
        } else if (username == "commandleo") {
            player.overrideNick = "Leo (Storage tech pro)";
        }
    }

    removeEasterEggs(player) {
        player.overrideNick = null;
        this.graph.data.datasets[0].backgroundColor = Application.#DEFAULT_BG;
        this.graph.data.datasets[0].borderColor = Application.#DEFAULT_LINE;
        this.graph.data.datasets[0].label = "Elo Value";
    }

    // Entry point for our application.
    loadUsername(inputUsername) {
        let username = inputUsername.toLowerCase();

        if (/^([a-z0-9_]{2,17})$/.test(username)) {
            if (this.activePlayer != null) this.activePlayer.setInactive();
            this.activePlayer = this.getPlayer(username);
            this.activePlayer.setActive();
            this.setItem("last-player", username);
        }

        // Just always rerender.
        this.rerender();
    }

    log(m) {
        if (this.doLogging) {
            console.log(m);
        }
    }
}

var application = new Application();

function updateUrls(username) {
    var o = document.getElementById("current-url");
    var newUrl = "https://" + location.host + location.pathname;
    // this should use join, but shh
    const u = username == 0 ? "" : "username=" + username;
    const res = [u].filter((v) => v).join("&");
    if (res.length != 0) {
        newUrl = newUrl + "?" + res;
    }
    o.href = newUrl;
    o.innerHTML = newUrl;

    // Also update the nacho thing
    // a nice long line of code ^^
    // feast thine eyes upon it...
    document.getElementById("nacho-url").href =
        "https://nacho-cs.github.io/?q=" + username;
    document.getElementById("pasta-url").href =
        "https://mcsr-ranked-stats-viewer.vercel.app/player/" + username;
}

function onDomLoaded() {
    // Config & initialization of graph.
    application.init();

    document
        .getElementById("username-value")
        .addEventListener("keypress", function (e) {
            if (e.key == "Enter") {
                application.log("Enter keypress -> Firing username update.");
                const username =
                    document.getElementById("username-value").value;
                application.loadUsername(username);
                updateUrls(username);
            }
        });

    for (const appChanger of Array.from(
        document.getElementsByClassName("app-rerender")
    )) {
        appChanger.addEventListener("change", function () {
            application.log(
                "Attempting application rerender through app-rerender class."
            );
            application.setItem(
                appChanger.id,
                String(application.enabled(appChanger.id))
            );

            application.rerender();
        });
    }

    document
        .getElementById("stats-view")
        .addEventListener("change", function (e) {
            const val = document.getElementById("graph-type").value;
            if (val == "stats-view") {
                document.getElementById("incredible-elo-chart").style.display = "none";
                document.getElementById("stats-view").style.display = "";
            }
            else {
                document.getElementById("stats-view").style.display = "none";
                document.getElementById("incredible-elo-chart").style.display = "";
            }
        });

    document
        .getElementById("tension-value")
        .addEventListener("input", function (e) {
            const inputval = document.getElementById("tension-value").value;
            application.doTension(inputval);
        });

    // Parse URL parameters.
    const url = new URL(window.location.href);
    const username =
        url.searchParams.get("username") ||
        application.getItem("last-player", "");
    document.getElementById("username-value").value = username;
    application.loadUsername(username);

    updateUrls(username);

    // User counting!! Very simple.
    // ok this looks less simple now LOL
    if (!location.host.includes("localhost")) {
        application.log("User counting!");
        if (application.getItem("unique-visitor") == null) {
            application.setItem("unique-visitor", "visited");
            fetch(
                "https://api.countapi.xyz/hit/disrespec.tech/unique-visits-elo"
            )
                .then((response) => response.json())
                .then((data) => {
                    console.log(`You are unique visitor ${data.value}`);
                })
                .catch((e) => {
                    console.log(`CountAPI error (unique): ${e}`);
                });
        } else {
            fetch(
                "https://api.countapi.xyz/info/disrespec.tech/unique-visits-elo"
            )
                .then((response) => response.json())
                .then((data) => {
                    console.log(
                        `You were a part of ${data.value} unique visitors!`
                    );
                })
                .catch((e) => {
                    console.log(`CountAPI error: ${e}`);
                });
        }
        fetch("https://api.countapi.xyz/hit/disrespec.tech/visits-elo")
            .then((response) => response.json())
            .then((data) => {
                console.log(`You are visitor ${data.value}`);
            })
            .catch((e) => {
                console.log(`CountAPI error: ${e}`);
            });
    } else {
        application.log("Not user counting (localhost)");
    }
    application.log("Finished application setup.");
}

document.addEventListener("DOMContentLoaded", onDomLoaded, false);
