import { Request, Response, NextFunction } from 'express';
import { createNodeRedisClient } from 'handy-redis';
import { uuid } from 'uuidv4';
import { URL } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const client = createNodeRedisClient();

export default async function post(req: Request, res: Response, next: NextFunction) {
  if (req.query.grant_type !== 'authorization_code') {
    next(new Error('expected grant_type to be "authorization_code"'));
    return;
  }

  if (req.query.code === undefined) {
    next(new Error('a code is required'));
    return;    
  }

  const [ codeChallenge, originalRedirectUri, userId ] =
        await client.hmget(`authcode:${req.query.code}`,
                           "codeChallenge", "redirectUri", "userId");

  if (!codeChallenge) {
    next(new Error('could not retrieve codeChallenge using provided code'));
    return;
  }

  if (req.query.redirect_uri === undefined) {
    next(new Error('a redirect_uri is required'));
    return;    
  }

  if (originalRedirectUri !== (req.query.redirect_uri as string)) {
    next(new Error('redirect_uri must match the originally provided redirect_uri'));
    return;        
  }
  const redirectUri = new URL(req.query.redirect_uri as string);
  
  if (redirectUri.hostname !== req.query.client_id) {
    next(new Error('expected client_id to be the hostname of the redirect_uri'));
    return;
  }

  if (req.query.code_verifier === undefined) {
    next(new Error('a code_verifier is required'));
    return;    
  }
  
  const hashedVerifier = crypto
        .createHash('sha256')
        .update(req.query.code_verifier as string)
        .digest('base64')
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

  if (hashedVerifier !== codeChallenge) {
    next(new Error('the hashed code_verifier does not match the original code_challenge'));
    return;
  }

  const issuer = new URL(req.protocol + '://' + req.get('host'));

  const audienceUrl = new URL(`/domains/${redirectUri.hostname}/`, process.env.AUDIENCE_URL_ROOT);
  const audience = audienceUrl.toString();

  const scope = "score state";
  const payload = {
    "iss": issuer.toString(),
    "sub": userId,
    // TODO: fix audience to be like api.doenet.cloud/domains/hostname/
    "aud": audience,
    "client_id": req.query.client_id,
    scope
  };

  const expires_in = 365 * 86400;
  const access_token = jwt.sign(payload,
                                req.app.get('token-secret'),
                                { expiresIn: `${expires_in}s` });

  const envelope = {
    access_token,
    "token_type":"Bearer",
    expires_in,
    scope
  };

  res.set('Cache-Control', 'no-store');
  res.json(envelope);
}
