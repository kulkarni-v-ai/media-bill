/**
 * couponEstimator.js
 * Mirrors backend substitution logic to show estimated discount in the UI.
 */

export const estimateDiscount = (cart, coupon) => {
  if (!coupon) return 0;
  
  let discount = 0;
  const items = [];
  cart.forEach(c => {
    for (let i = 0; i < c.qty; i++) {
      items.push({ ...c, unitPrice: c.price });
    }
  });

  const offerType = coupon.offerType;

  switch (offerType) {
    case 'DICE_1_1': {
      const polaroids = items.filter(i => i.category === 'polaroid');
      if (polaroids.length >= 2) {
        const target = polaroids.find(p => p.unitPrice > 99);
        if (target) discount = target.unitPrice - 99;
      }
      break;
    }
    case 'DICE_2_2': {
      const p1 = items.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const p2 = items.find(i => i.category === 'polaroid' && i.name.toLowerCase().includes('customized'));
      if (p1 && p2) discount = (p1.unitPrice + p2.unitPrice) - 229;
      break;
    }
    case 'DICE_3_3': {
      const digitals = items.filter(i => i.name.toLowerCase().includes('digital'));
      if (digitals.length >= 3) {
        const currentSum = digitals.slice(0, 3).reduce((s, i) => s + i.unitPrice, 0);
        discount = currentSum - 99;
      }
      break;
    }
    case 'DICE_4_4': {
      const customized = items.filter(i => i.name.toLowerCase().includes('customized'));
      if (customized.length >= 2) {
        const currentSum = customized.slice(0, 2).reduce((s, i) => s + i.unitPrice, 0);
        discount = currentSum - 222;
      }
      break;
    }
    case 'DICE_5_5': {
      const normal = items.find(i => !i.name.toLowerCase().includes('customized') && !i.name.toLowerCase().includes('digital'));
      const digital = items.find(i => i.name.toLowerCase().includes('digital'));
      if (normal && digital) discount = (normal.unitPrice + digital.unitPrice) - 125;
      break;
    }
    case 'DICE_6_6': {
      const polaroid = items.find(i => i.category === 'polaroid');
      if (polaroid) discount = polaroid.unitPrice - 99;
      break;
    }
    default:
      break;
  }

  return Math.max(0, discount);
};
