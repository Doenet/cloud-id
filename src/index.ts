#!/usr/bin/env node

import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Logger from "./logger";
import morganMiddleware from './morgan-middleware';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import getAuthorize from './controllers/authorize';
import postToken from './controllers/token';
import getLogout from './controllers/logout';
import { post as postEmail, verify as verifyEmail } from './controllers/email';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

app.set('token-secret', process.env.TOKEN_SECRET);
app.use(cookieParser(process.env.SECRET));

// I am behind nginx
app.set('trust proxy', 1);

app.use(morganMiddleware);

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");



app.use(
    express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })
);

app.use(helmet());

const myCors = cors({
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
});

// preflight for all routes
app.options('*', myCors);
app.use(myCors);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/logout', getLogout);
app.get('/authorize', getAuthorize);
app.post('/token', postToken);

app.post('/email/:email', postEmail);
app.get('/email/:email/:nonce', verifyEmail);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).render('404', { status: 404, url: req.url });
});

app.use((err: any, req: Request, res: Response) => {
  res.status(500).render('500', {
    status: err.status || 500,
    error: err
  });
});

app.listen(PORT, () => {
  Logger.debug(`Server running on ${PORT}`);
});

