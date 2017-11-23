const Gateway = require('./gateway');

const KEY_CALENDAR = 'calendar';
const KEY_MENU = 'menu';

const cache = {calendar: [], menu: []};

function set(key, value) {
    cache[key] = value;
}

function get(key) {
    return cache[key];
}

async function update() {
    const events = await Gateway.getCalendar();
    set(KEY_CALENDAR, events);
    try {
        const menu = await Gateway.getMenu();
        set(KEY_MENU, menu);
    } catch(err) {
        console.error(err);
    }
    console.log('Cache updated');
}

module.exports = {KEY_CALENDAR, KEY_MENU, set, get, update};