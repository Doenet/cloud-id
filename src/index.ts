import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Logger from "./logger";
import morganMiddleware from './morgan-middleware';
import path from 'path';
import cookieParser from 'cookie-parser';

import getAuthorize from './controllers/authorize';
import postToken from './controllers/token';
import getLogout from './controllers/logout';
import { post as postEmail, verify as verifyEmail } from './controllers/email';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/logout', getLogout);
app.get('/authorize', getAuthorize);
app.post('/token', postToken);

app.post('/email/:email', postEmail);
app.get('/email/:email/:nonce', verifyEmail);

app.use(function(req, res, next){
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  res.render('404', { status: 404, url: req.url });
});

app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.render('500', {
      status: err.status || 500
    , error: err
  });
});

app.listen(PORT, () => {
  Logger.debug(`Server running on ${PORT}`);
});

