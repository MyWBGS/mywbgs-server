// @ts-check
const router = require('express').Router();
const Student = require('./lib/student');
const Assignment = require('./lib/assignment');
const Db = require('./lib/db');
const Gateway = require('./lib/gateway');
const Token = require('./lib/token');
const Cache = require('./lib/cache');

const authenticate = async (req, res, next) => {
    if(req.get('X-Auth')) {
        try {
            const tokenData = await Token.decode(req.get('X-Auth'));
            req.username = tokenData.username;
            next();
        } catch(err) {
            res.status(401);
        }
    } else {
        res.status(400).send('X-Auth header missing');
    }
}

router.post('/student/authenticate', async (req, res) => {
    const username = req.body['username'].toLowerCase().trim();
    const password = req.body['password'];

    const result = await Student.authenticate(username, password);
    if(result) {
        const token = await Token.encode({username}, "1y");
        res.json({success: true, result: token});
    } else {
        res.json({success: false, result: 'INVALID_AUTH'})
    }
});

router.get('/student/info', authenticate, async (req, res) => {
    // @ts-ignore
    const username = req.username;
    const info = (await Student.get(username)).get({plain: true});
    delete info.hash;
    delete info.createdAt;
    delete info.updatedAt;
    res.json(info);
});

router.get('/student/lessons', authenticate, async (req, res) => {
    // @ts-ignore
    const username = req.username;
    const lessons = await Student.getLessons(username);
    res.json(lessons);
});

router.get('/student/timetable', authenticate, async (req, res) => {
    // @ts-ignore
    const username = req.username;
    const lessons = await Student.getLessons(username);
    const timetable = await Student.makeTimetable(lessons);
    res.json(timetable);
});

router.route('/assignment')
    .all(authenticate)
    .get(async (req, res) => {
        // @ts-ignore
        const username = req.username;
        const assignments = await Assignment.getAllForUser(username);
        res.json(assignments);
    })
    .post(async (req, res) => {
        // @ts-ignore
        const username = req.username;
        try {
            const assignment = await Assignment.create(req.body, username);
            res.json({success: true, result: assignment});
        } catch(err) {
            if(err.name === 'ValidationError') {
                res.status(400).json({success: false, result: err.get()});
            } else {
                throw err;
            }
        }
    });

router.route('/assignment/:id')
    .all(authenticate, async (req, res, next) => {
        const assignment = await Assignment.get(req.params.id);
        if(!assignment) return res.sendStatus(404);

        // @ts-ignore
        const username = req.username;
        if(!assignment.belongsTo(username)) return res.sendStatus(401);
        
        // @ts-ignore
        req.assignment = assignment;
        next();
    })
    .get(async (req, res) => {
        // @ts-ignore
        const assignment = req.assignment.get({plain: true});
        delete req.body.studentUsername;
        res.json(assignment);
    })
    .put(async (req, res) => {
        // @ts-ignore
        const assignment = req.assignment;
        try {
            await assignment.update(req.body);
            res.json({success: true, result: assignment.get({plain: true})});
        } catch(err) {
            if(err.name === 'ValidationError') {
                res.status(400).json({success: false, result: err.get()});
            } else {
                throw err;
            }
        }
    })
    .delete(async (req, res) => {
        // @ts-ignore
        await req.assignment.destroy();
        res.json({success: true});
    });

router.get('/calendar', authenticate, async (req, res) => {
    res.json(Cache.get(Cache.KEY_CALENDAR));
});

router.get('/menu', authenticate, async (req, res) => {
    res.json(Cache.get(Cache.KEY_MENU));
});

module.exports = {router};