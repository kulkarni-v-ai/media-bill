const Item = require('../models/Item');

// @route GET /api/items
const getItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const items = await Item.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/items
const createItem = async (req, res) => {
  try {
    const { name, category, price, stock, lowStockThreshold } = req.body;
    const item = await Item.create({ name, category, price, stock, lowStockThreshold });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route PUT /api/items/:id
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const fields = ['name', 'category', 'price', 'stock', 'lowStockThreshold', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route DELETE /api/items/:id (soft delete)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.isActive = false;
    await item.save();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/items/low-stock
const getLowStockItems = async (req, res) => {
  try {
    const items = await Item.find({ isActive: true });
    const lowStock = items.filter(
      (i) => i.stock <= i.lowStockThreshold
    );
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getItems, createItem, updateItem, deleteItem, getLowStockItems };
