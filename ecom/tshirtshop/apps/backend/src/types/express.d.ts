declare global {
  namespace Express {
    interface Request {
      user?: import('../common/auth.types').AuthUser | null;
      session?: unknown;
    }
  }
}

export {};
