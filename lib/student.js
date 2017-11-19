// @ts-check
const { Student, Lesson } = require('./db');
const gateway = require('./gateway');
const bcrypt = require('bcryptjs');

/**
 * Authenticates a student uses multiple strategies
 * @param {string} username 
 * @param {string} password
 * @returns {Promise<boolean>} authentication success 
 */
async function authenticate(username, password) {
    username = username.toLowerCase().trim();

    const student = await get(username);
    if(student) {
        if(await bcrypt.compare(password, student.hash)) {
            return true;
        }
    }

    const auth = await gateway.authenticateStudent(username, password);
    if(auth) {
        const hash = await bcrypt.hash(password, 8);
        if(student) {
            student.hash = hash;
            await student.save();
        } else {
            const data = await Promise.all([
                gateway.getStudentInfo(auth),
                gateway.getStudentTimetable(auth)
            ]);
            // @ts-ignore
            data[0].hash = hash;
            // @ts-ignore
            data[0].username = username;
            const student = await Student.create(data[0]);
            // @ts-ignore
            data[1].forEach(lesson => lesson.studentUsername = student.username);
            await Lesson.bulkCreate(data[1]);
        }
        return true;
    }
    return false;
}

/**
 * Gets an unsorted and ungrouped array of lessons for student
 * @param {string} username
 * @returns {Promise<Array<any>>} 
 */
async function getLessons(username) {
    return Lesson.findAll({where: {studentUsername: username}});
}

/**
 * Converts a flat array of lessons into a nested timetable
 * @param {Array<any>} lessons
 * @returns {Promise<Array<Array<any>>>}
 */
async function makeTimetable(lessons) {
    const timetable = [];
    for(let i = 0; i < 5; i++) {
        const day = lessons.filter(lesson => lesson.day === i);
        timetable.push(day);
    }
    return timetable;
}

/**
 * 
 * @param {string} username
 * @returns {Promise<any>}
 */
async function get(username) {
    return Student.findOne({where: {username}});
}

module.exports = {authenticate, getLessons, get, makeTimetable};