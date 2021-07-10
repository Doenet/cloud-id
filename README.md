# doenet.cloud identity server

## Routes for authorization

### GET /authorize

An endpoint to initiate PKCE-enhanced oauth flow.  Provides an authorization code.

### POST /token

Exchange an authorization code for a JWT access token.

## Routes for authentication

### GET /logout

Clear the signed userId cookie.

### POST /email/:address

Request a one-time password (a `nonce`) be sent to the provided
`address`.

### GET /email/:address/:nonce

Exchanges the previously emailed `nonce` for a signed userId cookie.

## Server configuration

Environment variables are requried, such as

```
SMTP_HOST=smtp.somewhere.com
SMTP_PORT=587
SMTP_USER=mailperson
SMTP_PASS=your-mail-password
```

The cookies are signed with
```
SECRET=your-cookie-secret
```
and the JWT tokens are signed with
```
TOKEN_SECRET=your-jwt-token-secret
```

The JWT provided by `id.doenet.cloud` has an audience set to
```
AUDIENCE_URL_ROOT=https://api.doenet.cloud/
```
