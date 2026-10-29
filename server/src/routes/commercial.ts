import { Router } from 'express';
import { prisma } from '../lib/prisma'; // Need to create this
import { auth } from '../lib/auth';

const router = Router();

// Middleware to check authentication
const protect = async (req: any, res: any, next: any) => {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return res.status(401).json({ message: "Unauthorized" });
    req.user = session.user;
    next();
};

router.post('/offers', protect, async (req: any, res) => {
    if (req.user.role !== 'producer') return res.status(403).json({ message: "Forbidden" });
    const { productName, quantity, unit, quality, pricePerUnit, availableDate } = req.body;
    const offer = await prisma.commercialOffer.create({
        data: {
            producerId: req.user.id,
            productName,
            quantity: parseFloat(quantity),
            unit,
            quality,
            pricePerUnit: parseFloat(pricePerUnit),
            availableDate: new Date(availableDate)
        }
    });
    res.status(201).json(offer);
});

router.get('/offers', async (req, res) => {
    const offers = await prisma.commercialOffer.findMany({ where: { status: 'published' } });
    res.json(offers);
});

export default router;
