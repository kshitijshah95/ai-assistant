import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent')?.slice(0, 50),
    };

    if (res.statusCode >= 400) {
      console.error('Request:', log);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Request:', log);
    }
  });

  next();
}
