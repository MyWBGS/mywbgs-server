// @ts-check
const Sequelize = require('sequelize');

// const sequelize = new Sequelize('postgres://root:root@localhost/mywbgs');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db.sqlite'
});


const Student = sequelize.define('student', {
    username: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    form: Sequelize.STRING,
    hash: Sequelize.STRING
});


const Assignment = sequelize.define('assignment', {
    title: Sequelize.STRING,
    notes: Sequelize.STRING,
    completed: Sequelize.BOOLEAN,
    due: Sequelize.DATEONLY,
    period: Sequelize.INTEGER
});
// @ts-ignore
Assignment.prototype.belongsTo = function(username) {return this.studentUsername === username};
Student.hasMany(Assignment);
Assignment.belongsTo(Student);


const Lesson = sequelize.define('lesson', {
    studentUsername: {
        type: Sequelize.STRING,
        // @ts-ignore
        model: Student,
        key: 'username',
        primaryKey: true
    },
    day: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    period: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    subject: Sequelize.STRING,
    room: Sequelize.STRING,
    teacher: Sequelize.STRING,
    free: Sequelize.BOOLEAN
});

module.exports = {sequelize, Student, Assignment, Lesson};