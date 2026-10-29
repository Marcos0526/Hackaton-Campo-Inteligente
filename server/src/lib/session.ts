import { auth } from './auth';

/**
 * Express middleware: requires a valid Better Auth session and attaches it to `req.user`.
 */
export const protect = async (req: any, res: any, next: any) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return res.status(401).json({ message: 'Unauthorized' });
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
};
