// @ts-check
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const schedule = require('node-schedule');
const cors = require('cors');
const Raven = require('raven');
const Db = require('./lib/db');
const Cache = require('./lib/cache');
const routes = require('./routes').router;

const PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();
app.set('trust proxy', 1);
if(PRODUCTION) {
    Raven.config(process.env.SENTRY_DSN).install();
    app.use(Raven.requestHandler());
}
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: ['https://mywbgs.org', 'http://localhost:3000', 'https://yearbook.mywbgs.org'],
}));

app.use('/', routes);

if(PRODUCTION) {
    app.use(Raven.errorHandler());
    app.use((err, req, res, next) => {
        res.status(500).send(res.sentry);
    });
}

(async () => {
    await Db.migrate();
    await Db.sequelize.sync();
    await Cache.update();
    schedule.scheduleJob('0 0 * * MON', () => Cache.update());

    const port = process.env.PORT || config.get('port');
    app.listen(port, () => console.log(`Server listening on *:${port}`));
})();
