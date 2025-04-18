import { pools } from "./draaft/options";

let all_divs: string[] = []
for (const pool of pools) {
    console.log(`Adding pool: ${pool.prettyName}`)
    all_divs.push(pool.makeDiv())
}

console.log("Creating full page.");
let full_data = all_divs.join('\n')

let container = document.createElement('div')
document.body.appendChild(container)
container.innerHTML = full_data
