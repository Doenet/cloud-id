import { Request, Response } from 'express';
import { createNodeRedisClient } from 'handy-redis';
import { URL } from 'url';
import { uuid } from 'uuidv4';

const client = createNodeRedisClient();

export default async function get(req: Request, res: Response, next: NextFunction) {

  if (req.query.response_type !== 'code') {
    next(new Error('expected response_type to be "code"'));
    return;
  }

  const state = req.query.state as string;
  if (!state) {
    next(new Error('expected state to be provided'));
    return;
  }

  const codeChallenge = req.query.code_challenge as string;
  if (!codeChallenge) {
    next(new Error('expected code_challenge to be provided'));
    return;
  }    

  if (req.query.code_challenge_method !== 'S256') {
    next(new Error('expected code_challenge_method to be "S256"'));
    return;
  }
  
  if (req.query.redirect_uri === undefined) {
    next(new Error('a redirect_uri is required'));
    return;    
  }
  
  const redirectUri = new URL(req.query.redirect_uri as string);

  if (redirectUri.host !== req.query.client_id) {
    next(new Error('expected client_id to be the hostname of the redirect_uri'));
    return;
  }

  redirectUri.searchParams.append('state',state);

  res.locals.redirectHost = redirectUri.host;

  // get the TLD from the request host
  res.locals.host = req.headers.host?.split(/\./).slice(-2).join('.');

  const declineUrl = new URL(req.query.redirect_uri as string);
  declineUrl.searchParams.append('error','access_denied');
  res.locals.declineUrl = declineUrl.toString();
      
  res.locals.code = uuid();

  const acceptUrl = new URL(req.query.redirect_uri as string);      
  acceptUrl.searchParams.append('code',res.locals.code);
  res.locals.acceptUrl = acceptUrl.toString();

  // five minutes to accept authorization code
  client.setex(`authcode:${res.locals.code}`, 5*60, codeChallenge);
  
  if (req.signedCookies.userId) {
    res.locals.email = await client.hget( `user:${req.signedCookies.userId}`, 'email' );
  }
      
  res.locals.title = 'authorize';
      
  res.render('authorize');

  return;
}
