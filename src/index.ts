import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Logger from "./logger";
import morganMiddleware from './morgan-middleware';
import path from 'path';

import getAuthorize from './controllers/authorize';
import postToken from './controllers/token';
import { post as postEmail, verify as verifyEmail } from './controllers/email';


dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

// I am behind nginx
app.set('trust proxy', 1);

app.use(morganMiddleware);

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(
    express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })
);

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/authorize', getAuthorize);
app.post('/token', postToken);

app.post('/email/:email', postEmail);
app.get('/email/:email/:uuid', verifyEmail);

app.listen(PORT, () => {
  Logger.debug(`Server running on ${PORT}`);
});

