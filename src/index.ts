import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import getAuthorize from './authorize';
import postToken from './token';
import Logger from "./logger";
import morganMiddleware from './morgan-middleware';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

app.use(morganMiddleware);

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/authorize', getAuthorize);

app.post('/token', postToken);

app.listen(PORT, () => {
  Logger.debug(`Server is up and running @ http://localhost:${PORT}`);
});

