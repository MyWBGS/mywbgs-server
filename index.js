// @ts-check
const http = require('http');
const https = require('https');
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const schedule = require('node-schedule');
const Db = require('./lib/db');
const Gateway = require('./lib/gateway');
const routes = require('./routes').router;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(process.env.COOKIE_SECRET || config.get('cookie_secret')));
app.use(helmet());

app.use('/', routes);

(async () => {
    await Db.sequelize.sync();
    const events = await Gateway.getCalendar();

    const port = process.env.PORT || config.get('port');
    app.listen(port, () => console.log(`Server listening on *:${port}`));
})();