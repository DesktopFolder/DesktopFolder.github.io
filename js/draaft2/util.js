export const STEVE = "/assets/steve.png";
export let IS_ADMIN = false;
export function set_admin(b) {
    IS_ADMIN = b;
}
export let UUID;
export function set_uuid(s) {
    UUID = s;
}
var UPDATING_TEXT_MAP = new Map();
export class UpdatingText {
    eleID;
    intervalID;
    textString;
    noAppend;
    timeoutValue;
    defaultText;
    update() {
        this.timeoutValue -= 1;
        if (this.timeoutValue <= 0) {
            this.cancel();
            return;
        }
        if (!this.noAppend) {
            this.textString.innerHTML = this.textString.innerHTML + ".";
        }
    }
    cancel() {
        this.textString.innerHTML = this.defaultText;
        window.clearInterval(this.intervalID);
        console.log(`Deleted interval ID: ${this.intervalID}`);
        UPDATING_TEXT_MAP.delete(this.eleID);
    }
    constructor(id, text, timeout, noAppend = true, defaultText = "") {
        this.noAppend = noAppend;
        this.timeoutValue = timeout;
        this.defaultText = defaultText;
        this.textString = document.getElementById(id);
        if (this.textString == undefined) {
            console.error(`Could not find ID '${id}' in DOM!`);
            return;
        }
        // Cancel the previous one here, so that we don't have weird side effects.
        if (UPDATING_TEXT_MAP.has(id)) {
            UPDATING_TEXT_MAP.get(id).cancel();
        }
        console.log(`Creating updating text with initial text: ${text}`);
        this.eleID = id;
        this.textString.innerHTML = text;
        this.intervalID = window.setInterval(() => this.update(), 1000);
        console.log(`Created interval ID: ${this.intervalID}`);
        UPDATING_TEXT_MAP.set(id, this);
    }
}
