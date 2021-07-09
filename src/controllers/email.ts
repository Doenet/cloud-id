import { Request, Response } from 'express';
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

export async function post(req: Request, res: Response) {
  try {
    const emails = parse(req.params.email);
    const address = emails[0].address;

    const nonce = uuid();

    // One day before the verification nonce expires
    await client.setex(`verify-email:${nonce}`, 24 * 60 * 60, address);

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
    res.status(500).send(e.toString());
    return;
  }
  
  return;
}

export async function verify(req: Request, res: Response) {
  const uuid = req.params.uuid;
  
  if (!isUuid(uuid)) {
    res.status(500).send('Missing uuid');
    return;
  }

  try {
    const emails = parse(req.params.email);
    const address = emails[0].address;

    res.locals.email = address;
  } catch (e) {
    res.status(500).send(e.toString());
    return;
  }

  const result = await client.multi()
        .get(`verify-email:${uuid}`)
        .del(`verify-email:${uuid}`).exec();
  
  if (result[1] === 0) {
    res.status(500).send('Invalid nonce');
    return;
  }

  if (result[0] !== res.locals.email) {
    res.status(500).send('Provided email does not match the email associated with the nonce');
    return;
  }  
  
  // now i am authenticated so i should be logged in with a cookie
  
  res.render('verify');
  
  return;
}
