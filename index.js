// @ts-check
const http = require('http');
const https = require('https');
const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const schedule = require('node-schedule');
const cors = require('cors');
const Db = require('./lib/db');
const Gateway = require('./lib/gateway');
const routes = require('./routes').router;

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: ['https://mywbgs.org', 'http://localhost:3000'],
}));

app.use('/', routes);

(async () => {
    await Db.sequelize.sync();
    const events = await Gateway.getCalendar();

    const port = process.env.PORT || config.get('port');
    app.listen(port, () => console.log(`Server listening on *:${port}`));
})();