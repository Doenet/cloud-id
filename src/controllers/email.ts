import { Request, Response, NextFunction } from 'express';
import { createNodeRedisClient } from 'handy-redis';
import { URL } from 'url';
import dotenv from 'dotenv';
import { uuid, isUuid } from 'uuidv4';
import { parse } from 'address-rfc2822';

import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  logger: true
});

const client = createNodeRedisClient();

export async function post(req: Request, res: Response, next: NextFunction) : Promise<void> {
  try {
    const emails = parse(req.params.email);
    const address = emails[0].address;

    const nonce = uuid();

    // One day before the verification nonce expires
    await client.setex(`nonce:${nonce}`, 24 * 60 * 60, address);

    const verifyUrl = new URL(req.protocol + '://' + req.get('host'));
    verifyUrl.pathname = `/email/${address}/${nonce}`;
    
    const info = await transporter.sendMail({
      from: '"Doenet" <help@doenet.cloud>',
      to: address,
      subject: "Verify your email address",
      text: `Hello,\n\nPlease visit this link\n\n  ${verifyUrl}\n\nto verify your email address.\n\nThe Doenet Team`,
      html: `<p>Hello,</p><p>To verify your email address, Please <a href="${verifyUrl}">click here</a> or copy and paste the link <a href="${verifyUrl}">${verifyUrl}</a> into your browser's address bar.</p><p>The Doenet Team</p>`,
    });

    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
  
  return;
}

export async function verify(req: Request, res: Response, next: NextFunction): Promise<void> {
  const nonce = req.params.nonce;
  
  if (!isUuid(nonce)) {
    next(new Error('Missing nonce'));
    return;
  }

  try {
    const emails = parse(req.params.email);
    const address = emails[0].address;

    res.locals.email = address;
  } catch (e) {
    next(e);
    return;
  }

  const result = await client.multi()
        .get(`nonce:${nonce}`)
        .del(`nonce:${nonce}`).exec();
  
  if (result[1] === 0) {
    next(new Error('Invalid nonce'));    
    return;
  }

  if (result[0] !== res.locals.email) {
    next(new Error('Provided email does not match the email associated with the nonce'));
    return;
  }  

  // create a fresh account...
  let userId = uuid();
  // but if we're already logged in, use that
  if (req.signedCookies.userId) {
    userId = req.signedCookies.userId;
  }
  
  // now i am authenticated so i should be logged in with a cookie
  const userResult = await client.multi()
        .setnx(`email:${res.locals.email}`, userId)
        .get(`email:${res.locals.email}`)
        .exec();

  // prefer the userId from a previous account with that email address
  userId = userResult[1];
  
  if (!userId) {
    next(new Error('Could not find or produce a user id'));
    return;    
  }

  // add the email address to the list for this user
  client.sadd(`user-email:${userId}`, res.locals.email);
  
  res.cookie('userId', userId, {
    signed: true,
    maxAge: 52 * 604800000,
    secure: true,
    httpOnly: true,
  });
  
  res.render('verify');
  
  return;
}
