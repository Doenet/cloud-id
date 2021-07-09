import { Request, Response } from 'express';
import { createNodeRedisClient } from 'handy-redis';
import { URL } from 'url';
import { uuid } from 'uuidv4';

const client = createNodeRedisClient();

export default async function get(req: Request, res: Response) {

  if (req.query.response_type !== 'code') {
    res.status(500).send('expected response_type to be "code"');
    return;
  }

  const state = req.query.state as string;
  if (!state) {
    res.status(500).send('expected state to be provided');
    return;
  }

  const codeChallenge = req.query.code_challenge as string;
  if (!codeChallenge) {
    res.status(500).send('expected code_challenge to be provided');
    return;
  }    

  if (req.query.code_challenge_method !== 'S256') {
    res.status(500).send('expected code_challenge_method to be "S256"');
    return;
  }
  
  if (req.query.redirect_uri === undefined) {
    res.status(500).send('a redirect_uri is required');
    return;    
  } else {
    try {
      const redirectUri = new URL(req.query.redirect_uri as string);

      if (redirectUri.host !== req.query.client_id) {
        res.status(500).send('expected client_id to be the hostname of the redirect_uri');
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

      client.setex(`authcode:${res.locals.code}`, 60, codeChallenge);
      
      res.locals.title = 'authorize';
      res.render('authorize');
    } catch (e) {
      res.status(500).send(e.toString());
      return;        
    }
  }

  return;
}
