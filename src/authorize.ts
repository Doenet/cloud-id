import { Request, Response } from 'express';

export default function get(req: Request, res: Response) {
  res.send('<h1>Hello from the authorize world!</h1>');
}
