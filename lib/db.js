// @ts-check
const Sequelize = require('sequelize');

let sequelize;
if(process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL);
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'db.sqlite'
    });
}


const Student = sequelize.define('student', {
    username: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    form: Sequelize.STRING,
    hash: Sequelize.STRING,
    lessons: Sequelize.TEXT
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

module.exports = {sequelize, Student, Assignment};