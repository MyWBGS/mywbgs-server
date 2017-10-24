// @ts-check
const { Student, Assignment } = require('./db');

/**
 * Creates an unassigned homework
 * @param {any} data
 * @returns {Promise<any>} created homework 
 */
async function create(data, username) {
    const student = await Student.findOne({where: {username}});
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    const assignment = await Assignment.create(data);
    assignment.setStudent(student);
    return assignment;
}

/**
 * Updates an assignment
 * @param {number} id 
 * @param {any} data
 */
async function update(assignment, data) {
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.studentUsername;
    assignment.update(data);
}

/**
 * Gets all assignments for student
 * @param {string} username
 * @returns {Promise<Array<any>>} assignments
 */
async function getAllForUser(username) {
    const student = await Student.findOne({where: {username}});
    const assignments = await student.getAssignments();
    return assignments;
}

/**
 * Gets assignment by id
 * @param {number} id
 * @returns {Promise<any>} assignment 
 */
async function get(id) {
    return Assignment.findById(id);
}

module.exports = {create, getAllForUser, get};