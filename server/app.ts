import * as express from 'express';
import { resolve, } from 'path';
import { createServer } from 'http';
import * as bodyParser from 'body-parser';

const CORS = false;
const DEBUG = false;
const PORT = 3000;

const app = express();
const server = createServer(app);

if (CORS) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
}

app.use(express.static(resolve(__dirname, '../dist')));
app.use('/icons', express.static(resolve(__dirname, '../icons')));
app.use(bodyParser.json({limit: '50mb'}));

if (DEBUG) {
  app.use(function (req, res, next) {
    console.log(`${req.method} ${req.url}`);
    console.log('req.query = '+ JSON.stringify(req.query, null, 2));
    console.log(`req.body = ${JSON.stringify(req.body, null, 2)}`);
    next();
  });
}

console.log(`listening on port: ${PORT}`);
server.listen(PORT);
