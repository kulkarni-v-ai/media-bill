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

    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalBills = bills.length;

    // QR-wise breakdown
    const qrBreakdown = { QR1: 0, QR2: 0, QR3: 0, QR4: 0 };
    const qrCount = { QR1: 0, QR2: 0, QR3: 0, QR4: 0 };

    bills.forEach((b) => {
      if (qrBreakdown[b.qrUsed] !== undefined) {
        qrBreakdown[b.qrUsed] += b.grandTotal;
        qrCount[b.qrUsed]++;
      }
    });

    // Category totals (admin-friendly)
    const polaroidRevenue = bills.reduce((sum, b) => sum + b.polaroidTotal, 0);
    const othersRevenue = bills.reduce((sum, b) => sum + b.othersTotal, 0);

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
      totalBills,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      polaroidRevenue: parseFloat(polaroidRevenue.toFixed(2)),
      othersRevenue: parseFloat(othersRevenue.toFixed(2)),
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

    // Group by date
    const dateMap = {};
    bills.forEach((b) => {
      const d = b.createdAt.toISOString().split('T')[0];
      if (!dateMap[d]) dateMap[d] = { date: d, revenue: 0, count: 0 };
      dateMap[d].revenue += b.grandTotal;
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
