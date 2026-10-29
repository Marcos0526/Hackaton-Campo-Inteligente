import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { protect } from '../lib/session';

const router = Router();

const toNumber = (value: any) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : NaN;
};

const requireFields = (res: any, fields: Record<string, any>) => {
    const missing = Object.entries(fields)
        .filter(([, value]) => value === undefined || value === null || value === '' || (typeof value === 'number' && Number.isNaN(value)))
        .map(([key]) => key);
    if (missing.length > 0) {
        res.status(400).json({ message: `Campos inválidos o faltantes: ${missing.join(', ')}` });
        return false;
    }
    return true;
};

// ---------------------------------------------------------------- Profile
router.get('/profile', protect, async (req: any, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            producerProfile: true,
            transporterProfile: true,
            buyerProfile: true,
        },
    });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    const { sessions, accounts, ...safeUser } = user as any;
    res.json(safeUser);
});

// ---------------------------------------------------------------- Offers
router.get('/offers', async (req, res) => {
    const offers = await prisma.commercialOffer.findMany({
        where: { status: 'published' },
        include: { producer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(offers);
});

router.get('/offers/mine', protect, async (req: any, res) => {
    const offers = await prisma.commercialOffer.findMany({
        where: { producerId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(offers);
});

router.post('/offers', protect, async (req: any, res) => {
    if (req.user.role !== 'producer') return res.status(403).json({ message: "Solo los productores pueden publicar ofertas" });

    const { productName, unit, quality, availableDate } = req.body;
    const quantity = toNumber(req.body.quantity);
    const pricePerUnit = toNumber(req.body.pricePerUnit);

    if (!requireFields(res, { productName, unit, quality, availableDate, quantity, pricePerUnit })) return;

    const offer = await prisma.commercialOffer.create({
        data: {
            producerId: req.user.id,
            productName,
            quantity,
            unit,
            quality,
            pricePerUnit,
            availableDate: new Date(availableDate),
        },
        include: { producer: { select: { id: true, name: true } } },
    });
    res.status(201).json(offer);
});

// ---------------------------------------------------------------- Buyer requests
router.get('/requests', async (req, res) => {
    const requests = await prisma.buyerRequest.findMany({
        where: { status: 'published' },
        include: { buyer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
});

router.get('/requests/mine', protect, async (req: any, res) => {
    const requests = await prisma.buyerRequest.findMany({
        where: { buyerId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
});

router.post('/requests', protect, async (req: any, res) => {
    if (req.user.role !== 'buyer') return res.status(403).json({ message: "Solo los compradores pueden publicar solicitudes" });

    const { productName, unit, deliveryDate } = req.body;
    const quantity = toNumber(req.body.quantity);
    const targetPriceMin = toNumber(req.body.targetPriceMin);
    const targetPriceMax = toNumber(req.body.targetPriceMax);

    if (!requireFields(res, { productName, unit, deliveryDate, quantity, targetPriceMin, targetPriceMax })) return;
    if (targetPriceMin > targetPriceMax) {
        res.status(400).json({ message: "El precio mínimo no puede ser mayor al máximo" });
        return;
    }

    const request = await prisma.buyerRequest.create({
        data: {
            buyerId: req.user.id,
            productName,
            quantity,
            unit,
            targetPriceMin,
            targetPriceMax,
            deliveryDate: new Date(deliveryDate),
        },
        include: { buyer: { select: { id: true, name: true } } },
    });
    res.status(201).json(request);
});

export default router;
