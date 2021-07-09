import { Request, Response } from 'express';

import { createNodeRedisClient } from 'handy-redis';
const client = createNodeRedisClient();

export default async function get(req: Request, res: Response) {
  res.locals.redirect_uri = req.query.redirect_uri;
    
  // get the TLD from the request host
  res.locals.host = req.headers.host?.split(/\./).slice(-2).join('.');

  if (req.signedCookies.userId) {
    res.locals.email = await client.hget( `user:${req.signedCookies.userId}`, 'email' );
    res.clearCookie('userId');
  }
  
  res.render('logout');
  
  return;
}
