let CONFIG = new Map();

export function initialize() {
    let elements: Array<HTMLInputElement> = [];

    // Deal with our configuration map.
    // 1. Set default values as specified (or not specified) by the HTML.
    var numConfigs = 0;
    for (const o of document.getElementsByClassName("configurer")) {
        let id = o.id;
        if (!(o instanceof HTMLInputElement)) {
            continue;
        }
        numConfigs += 1;
        if (o.type == "checkbox") {
            CONFIG.set(id, o.checked);
        } else if (o.type == "text") {
            CONFIG.set(id, o.value);
        }
        else {
            console.log(`Found invalid configuration: ${o.type} (${o})`);
            numConfigs -= 1;
        }
        elements.push(o);
    }
    console.log(`Configuration: Found ${numConfigs} valid configuration options.`);

    // Some weird error handling.
    if (!(localStorage.getItem("draaftConfig") || "[]").startsWith("[")) {
        localStorage.setItem("draaftConfig", "[]");
    }

    // 2. For everything we already have in our memory, set those.
    let draaftConfig: Map<string, any> = new Map(JSON.parse(localStorage.getItem("draaftConfig") || "[]"));
    for (const [key, value] of draaftConfig) {
        if (CONFIG.has(key)) {
            CONFIG.set(key, value);
            console.log(`Configuration: Found preset value for ${key}: ${value}`);
            let o = document.getElementById(key);
            if (o instanceof HTMLInputElement) {
                if (o.type == "checkbox" && typeof value == "boolean") {
                    o.checked = value;
                } else if (o.type == "text" && typeof value == "string") {
                    o.value = value;
                }
            }
        }
    }

    // 3. Now, set our event listeners for changed values.
    for (const e of elements) {
        e.addEventListener("change", () => {
            console.log(`Got update to config: ${e.id} ${e.type}`);
            if (e.type == "checkbox") {
                console.log(e.checked);
                CONFIG.set(e.id, e.checked);
                console.log(CONFIG);
            } else if (e.type == "text") {
                CONFIG.set(e.id, e.value);
                console.log(CONFIG);
            } else {
                console.log(`Could not save type: ${e.type}`);
            }
            saveConfig();
        });
    }
}

export function conf(key: string) {
    return CONFIG.get(key);
}

function saveConfig() {
    let res = JSON.stringify(Array.from(CONFIG.entries()));
    localStorage.setItem("draaftConfig", res);
    console.log(`Saved config as: ${res}`);
}
