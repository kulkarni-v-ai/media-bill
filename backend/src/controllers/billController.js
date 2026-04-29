const Bill = require('../models/Bill');
const Item = require('../models/Item');
const { calculateBill } = require('../utils/billCalculator');

// @route POST /api/bills
const createBill = async (req, res) => {
  try {
    const { customerName, cartItems, qrUsed } = req.body;
    // cartItems: [{ itemId, qty }]

    if (!customerName || !cartItems || cartItems.length === 0 || !qrUsed) {
      return res.status(400).json({ message: 'customerName, cartItems, and qrUsed are required' });
    }

    // Fetch and validate all items
    const enrichedCart = [];
    for (const ci of cartItems) {
      const item = await Item.findById(ci.itemId);

      if (!item || !item.isActive) {
        return res.status(404).json({ message: `Item not found: ${ci.itemId}` });
      }

      // ✅ Block billing if stock is 0
      if (item.stock === 0) {
        return res.status(400).json({
          message: `"${item.name}" is out of stock and cannot be billed`,
          outOfStock: true,
          itemName: item.name,
        });
      }

      // Block if requested qty exceeds available stock
      if (ci.qty > item.stock) {
        return res.status(400).json({
          message: `Not enough stock for "${item.name}". Available: ${item.stock}`,
          insufficientStock: true,
          itemName: item.name,
          available: item.stock,
        });
      }

      enrichedCart.push({
        itemId: item._id,
        name: item.name,
        category: item.category,
        unitPrice: item.price,
        qty: ci.qty,
        stockRef: item, // used for stock reduction
      });
    }

    // Calculate totals using isolated utility
    const { polaroidTotal, othersTotal, grandTotal, lineItems } = calculateBill(enrichedCart);

    // Reduce stock atomically
    for (const ci of enrichedCart) {
      await Item.findByIdAndUpdate(ci.itemId, { $inc: { stock: -ci.qty } });
    }

    const bill = await Bill.create({
      customerName,
      createdBy: req.user._id,
      items: lineItems,
      polaroidTotal,
      othersTotal,
      grandTotal,
      qrUsed,
    });

    await bill.populate('createdBy', 'name email role');

    // Shape response based on role
    const response = bill.toObject();
    if (!['admin'].includes(req.user.role)) {
      delete response.polaroidTotal;
      delete response.othersTotal;
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/bills
const getBills = async (req, res) => {
  try {
    const { date, qrUsed, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (qrUsed) filter.qrUsed = qrUsed;

    const bills = await Bill.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Bill.countDocuments(filter);

    // Strip breakdown for non-admins
    const sanitized = bills.map((b) => {
      const obj = b.toObject();
      if (!['admin'].includes(req.user.role)) {
        delete obj.polaroidTotal;
        delete obj.othersTotal;
      }
      return obj;
    });

    res.json({ bills: sanitized, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/bills/:id
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('createdBy', 'name email role');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const response = bill.toObject();
    if (!['admin'].includes(req.user.role)) {
      delete response.polaroidTotal;
      delete response.othersTotal;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getBills, getBillById };
