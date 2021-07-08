import { Request, Response } from 'express';

export default function post(req: Request, res: Response) {
  res.send('<h1>Hello from the post world!</h1>');
}
