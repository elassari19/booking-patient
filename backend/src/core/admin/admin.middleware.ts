import type { Request, Response, NextFunction } from 'express';
import type { User } from '@prisma/client';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as User;

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required.',
    });
  }

  next();
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as User;

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access denied. Super administrator privileges required.',
    });
  }

  // You can add additional super admin logic here
  // For example, check for specific permissions in adminProfile
  next();
};

export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    // Log the admin action
    console.log('Admin Action Audit:', {
      adminId: user?.id,
      adminEmail: user?.email,
      action,
      targetResource: req.params.id || req.path,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  };
};
