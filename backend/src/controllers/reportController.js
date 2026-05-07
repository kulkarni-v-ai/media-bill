const Bill = require('../models/Bill');

// @route GET /api/reports/daily
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const bills = await Bill.find({ createdAt: { $gte: start, $lte: end } })
      .populate('createdBy', 'name');

    const totalNetRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalDiscounts = bills.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
    const totalGrossRevenue = totalNetRevenue + totalDiscounts;

    // QR-wise breakdown
    const qrBreakdown = { QR1: 0, QR2: 0, QR3: 0, QR4: 0, CASH: 0 };
    const qrCount = { QR1: 0, QR2: 0, QR3: 0, QR4: 0, CASH: 0 };

    bills.forEach((b) => {
      if (qrBreakdown[b.qrUsed] !== undefined) {
        qrBreakdown[b.qrUsed] += b.grandTotal;
        qrCount[b.qrUsed]++;
      }
    });

    // Detailed Category totals
    let polaroidRev = 0;
    let digitalRev = 0;
    let posterRev = 0;
    let stickerRev = 0;

    bills.forEach(b => {
      b.items.forEach(li => {
        if (li.category === 'polaroid') polaroidRev += li.subtotal;
        else if (li.category === 'digital photo') digitalRev += li.subtotal;
        else if (li.category === 'poster') posterRev += li.subtotal;
        else if (li.category === 'sticker') stickerRev += li.subtotal;
      });
    });

    // Top items sold
    const itemMap = {};
    bills.forEach((b) => {
      b.items.forEach((li) => {
        if (!itemMap[li.name]) itemMap[li.name] = { name: li.name, category: li.category, qty: 0, revenue: 0 };
        itemMap[li.name].qty += li.qty;
        itemMap[li.name].revenue += li.subtotal;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      totalBills: bills.length,
      totalNetRevenue: parseFloat(totalNetRevenue.toFixed(2)),
      totalGrossRevenue: parseFloat(totalGrossRevenue.toFixed(2)),
      totalDiscounts: parseFloat(totalDiscounts.toFixed(2)),
      breakdown: {
        polaroid: parseFloat(polaroidRev.toFixed(2)),
        digitalPhoto: parseFloat(digitalRev.toFixed(2)),
        poster: parseFloat(posterRev.toFixed(2)),
        sticker: parseFloat(stickerRev.toFixed(2)),
      },
      qrBreakdown: Object.keys(qrBreakdown).map((k) => ({
        qr: k,
        total: parseFloat(qrBreakdown[k].toFixed(2)),
        count: qrCount[k],
      })),
      topItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/reports/range
const getDateRangeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const bills = await Bill.find({ createdAt: { $gte: start, $lte: end } });

    const dateMap = {};
    bills.forEach((b) => {
      const d = b.createdAt.toISOString().split('T')[0];
      if (!dateMap[d]) dateMap[d] = { date: d, revenue: 0, count: 0, discounts: 0 };
      dateMap[d].revenue += b.grandTotal;
      dateMap[d].discounts += (b.discountAmount || 0);
      dateMap[d].count++;
    });

    const dailyData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);

    res.json({
      startDate,
      endDate,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalBills: bills.length,
      dailyData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDailyReport, getDateRangeReport };
