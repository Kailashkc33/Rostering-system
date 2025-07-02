import { Request, Response, NextFunction } from 'express';
import ratelimit from "../config/upstash";
const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.ip || 'unknown-ip';
        const { success } = await ratelimit.limit(key);
        if (!success) {
            return res.status(429).json({ error: "Too many requests" });
        }
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
export default rateLimiter;
