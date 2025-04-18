"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var options_1 = require("./draaft/options");
var all_divs = [];
for (var _i = 0, pools_1 = options_1.pools; _i < pools_1.length; _i++) {
    var pool = pools_1[_i];
    console.log("Adding pool: ".concat(pool.prettyName));
    all_divs.push(pool.makeDiv());
}
console.log("Creating full page.");
var full_data = all_divs.join('\n');
var container = document.createElement('div');
document.body.appendChild(container);
container.innerHTML = full_data;
