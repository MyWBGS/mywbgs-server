// @ts-check
const request = require('request-promise');
const cheerio = require('cheerio');
const config = require('config');
const fs = require('fs');

const LOGIN_URL = 'https://learning.watfordboys.org/login/index.php';
const INFO_URL = 'https://learning.watfordboys.org/blocks/mis_portal/ajax/portlet_html.php';
const TIMETABLE_URL = 'https://learning.watfordboys.org/blocks/mis_portal/index.php?tab=timetable';
const CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/calendars/watfordboyscalendar@gmail.com/events';
const USER_AGENT_STRING = 'MyWBGS/1.0';
const INVALID_LOGIN_ERROR = 'INVALID_LOGIN';

const req = request.defaults({
    headers: {
        'User-Agent': USER_AGENT_STRING
    }
});

/**
 * @typedef {object} StudentInfo
 * @prop {string} name
 * @prop {string} email
 * @prop {string} form
 */

/**
 * @typedef {object} Lesson
 * @prop {string} subject
 * @prop {string} room
 * @prop {string} teacher
 * @prop {number} day
 * @prop {number} period
 * @prop {boolean} free
 */

/**
 * @typedef {object} AuthObject
 * @prop {string} username
 * @prop {object} jar
 */

/**
 * @typedef {object} Event
 * @prop {string} summary
 * @prop {string} start
 * @prop {string} end
 */

/**
 * Returns the cookie jar for the provided credidentials. Checks against WBGS Moodle.
 * @param {string} username 
 * @param {string} password
 * @returns {Promise<AuthObject>} auth object or null is unauthorised
 */
async function authenticateStudent(username, password) {
    const jar = req.jar();
    const response = await req.post(LOGIN_URL, {
        form: {username, password},
        followAllRedirects: true,
        jar: jar
    });

    const $ = cheerio.load(response);
    if($('title').html() !== 'Portal Home') {
        return null;
    }
    
    return {username, jar};
}

/**
 * Downloads and parses the timetable using the provided cookies
 * @param {AuthObject} auth
 * @returns {Promise<Array<Lesson>>}
 */
async function getStudentTimetable(auth) {
    const response = await req(TIMETABLE_URL, {
        jar: auth.jar
    });
    const $ = cheerio.load(response);

    /** @type {Array<Lesson>} */
    const timetable = [];
    $('tr').each((rowi, tr) => {
        $('.tt_lesson', tr).each((coli, td) => {
            const subject = $('.tt_subject', td).text();
            // const code = (codes.find(code => code.subject === subject) || {code: subject})['code'] || '';
            const room = $('.tt_room', td).text();
            const teacher = $('.tt_teacher', td).text();
            const day = rowi - 1;
            const period = coli - 1;
            const free = !room;

            if(subject === 'Registration') return;
            timetable.push({subject, room, teacher, day, period, free});
        });
    });

    return timetable;
}

/**
 * Downloads and parses student info using the provided cookies
 * @param {AuthObject} auth
 * @returns {Promise<StudentInfo>} response
 */
async function getStudentInfo(auth) {
    const response = await req.post(INFO_URL, {
        form: {
            portletid: 'portlet_personal_details_1',
            tab: 'learner_welcome'
        },
        jar: auth.jar
    });
    const $ = cheerio.load(response);

    const table = $('.portal_table');
    const name = $('tr:nth-child(1) .value', table).text();
    const email = $('tr:nth-child(8) .value a', table).text();
    const form = $('tr:nth-child(5) .value', table).text().split(' ')[0];
    
    return {name, email, form};
}

/**
 * Scrapes the WBGS Google Calendar for events
 * @returns {Promise<Array<Event>>}
 */
async function getCalendar() {
    const response = await req(CALENDAR_URL, {
        qs: {
            key: config.get('calendar_key'),
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: new Date().toISOString()
        },
        json: true
    });

    const events = response['items'].map(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        const end = new Date(event.end.dateTime || event.end.date);

        return {
            summary: event.summary,
            start: start.toISOString(),
            end: end.toISOString()
        };
    });

    return events;
}

module.exports = {authenticateStudent, getStudentInfo, getStudentTimetable, getCalendar, INVALID_LOGIN_ERROR};