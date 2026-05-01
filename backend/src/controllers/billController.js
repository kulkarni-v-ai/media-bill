const Bill = require('../models/Bill');
const Item = require('../models/Item');
const { calculateBill } = require('../utils/billCalculator');

/* ─────────────────────────────────────────────────────────────────
   Central-stock helpers
   When an item has a `stockRef`, all stock operations (check,
   deduct, restore) act on the REFERENCED master item, scaled by
   the variant's `piecesPerUnit`.
───────────────────────────────────────────────────────────────── */

/**
 * Resolve the effective stock item and required pieces for one line.
 * Returns { stockItem, pieces } where `pieces` = qty * piecesPerUnit.
 */
async function resolveStock(item, qty) {
  const ppu = item.piecesPerUnit ?? 1;
  const pieces = qty * ppu;

  if (item.stockRef) {
    const master = await Item.findById(item.stockRef);
    if (!master) throw new Error(`Central stock master not found for "${item.name}"`);
    return { stockItem: master, pieces };
  }
  return { stockItem: item, pieces };
}

// @route POST /api/bills
const createBill = async (req, res) => {
  try {
    const { customerName, cartItems, qrUsed } = req.body;

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

      // Resolve the effective stock source (central master or self)
      const { stockItem, pieces } = await resolveStock(item, ci.qty);

      // ✅ Block billing if stock is 0
      if (stockItem.stock === 0) {
        return res.status(400).json({
          message: `"${item.name}" is out of stock and cannot be billed`,
          outOfStock: true,
          itemName: item.name,
        });
      }

      // Block if required pieces exceed available central stock
      if (pieces > stockItem.stock) {
        return res.status(400).json({
          message: `Not enough stock for "${item.name}". ` +
            `This package uses ${item.piecesPerUnit ?? 1} polaroid(s) each. ` +
            `Available: ${stockItem.stock} polaroid(s)`,
          insufficientStock: true,
          itemName: item.name,
          available: Math.floor(stockItem.stock / (item.piecesPerUnit ?? 1)),
        });
      }

      enrichedCart.push({
        itemId: item._id,
        name: item.name,
        category: item.category,
        unitPrice: item.price,
        qty: ci.qty,
        stockItemId: stockItem._id, // where to actually deduct
        pieces,                     // how many physical units to deduct
      });
    }

    // Calculate totals using isolated utility
    const { polaroidTotal, othersTotal, grandTotal, lineItems } = calculateBill(
      enrichedCart.map((c) => ({ ...c, itemId: c.itemId }))
    );

    // Reduce stock atomically (via the resolved stockItem)
    for (const ci of enrichedCart) {
      await Item.findByIdAndUpdate(ci.stockItemId, { $inc: { stock: -ci.pieces } });
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

// @route DELETE /api/bills/:id  — admin only
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    // Restore stock for every line item.
    // Need the original item to know piecesPerUnit + stockRef.
    for (const li of bill.items) {
      const item = await Item.findById(li.item);
      if (!item) continue; // item may have been removed; skip gracefully

      const ppu = item.piecesPerUnit ?? 1;
      const pieces = li.qty * ppu;
      const stockItemId = item.stockRef ?? item._id;
      await Item.findByIdAndUpdate(stockItemId, { $inc: { stock: pieces } });
    }

    await bill.deleteOne();
    res.json({ message: 'Bill deleted and stock restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/bills/:id  — admin only
// Allows editing: customerName, qrUsed, and item quantities.
// Central stock is adjusted (delta × piecesPerUnit) automatically.
const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const { customerName, qrUsed, items } = req.body;

    if (customerName !== undefined) bill.customerName = customerName.trim();
    if (qrUsed !== undefined) bill.qrUsed = qrUsed;

    if (items && Array.isArray(items)) {
      const updatedItems = [];

      for (const incoming of items) {
        const existing = bill.items.find(
          (li) => li.item.toString() === incoming.item.toString()
        );
        if (!existing) {
          return res.status(400).json({ message: `Item ${incoming.item} not found in this bill` });
        }

        const dbItem = await Item.findById(existing.item);
        if (!dbItem) {
          return res.status(404).json({ message: `Item ${existing.item} not found in inventory` });
        }

        const ppu = dbItem.piecesPerUnit ?? 1;
        const stockItemId = dbItem.stockRef ?? dbItem._id;
        const oldPieces = existing.qty * ppu;
        const newPieces = incoming.qty * ppu;
        const delta = newPieces - oldPieces; // positive = need more, negative = returning

        if (delta > 0) {
          const stockItem = await Item.findById(stockItemId);
          if (!stockItem) {
            return res.status(404).json({ message: `Stock source not found for "${dbItem.name}"` });
          }
          if (stockItem.stock < delta) {
            return res.status(400).json({
              message: `Not enough stock for "${dbItem.name}". Available: ${Math.floor(stockItem.stock / ppu)} units`,
            });
          }
          await Item.findByIdAndUpdate(stockItemId, { $inc: { stock: -delta } });
        } else if (delta < 0) {
          await Item.findByIdAndUpdate(stockItemId, { $inc: { stock: Math.abs(delta) } });
        }

        updatedItems.push({
          ...existing.toObject(),
          qty: incoming.qty,
          subtotal: incoming.qty * existing.unitPrice,
        });
      }

      // Keep items not mentioned in the patch unchanged
      const updatedItemIds = new Set(items.map((i) => i.item.toString()));
      for (const li of bill.items) {
        if (!updatedItemIds.has(li.item.toString())) {
          updatedItems.push(li.toObject());
        }
      }

      bill.items = updatedItems;

      // Recalculate totals
      const polaroids = bill.items.filter((i) => i.category === 'polaroid');
      const others    = bill.items.filter((i) => i.category !== 'polaroid');
      bill.polaroidTotal = polaroids.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      bill.othersTotal   = others.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      bill.grandTotal    = bill.polaroidTotal + bill.othersTotal;
    }

    await bill.save();
    await bill.populate('createdBy', 'name email role');

    res.json(bill.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getBills, getBillById, deleteBill, updateBill };
