import { Request, Response } from 'express';

export function token(req: Request, res: Response) {
  res.send('<h1>Hello from the TypeScript world!</h1>');
}
