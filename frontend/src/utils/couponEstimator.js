/**
 * couponEstimator.js
 * Identifies which items are discounted to show original vs reduced price in the UI.
 * Targets the CHEAPEST items to avoid business loss.
 */

export const getDiscountedCart = (cart, coupon) => {
  const safeCart = cart || [];
  
  // If no coupon, still provide totalOriginal/totalDiscounted so UI can render
  if (!coupon) {
    return safeCart.map(item => ({
      ...item,
      discountedPrice: (item.price || 0),
      totalDiscounted: (item.price || 0) * (item.qty || 1),
      totalOriginal: (item.price || 0) * (item.qty || 1),
      hasDiscount: false
    }));
  }
  
  // Create a flat list of individual items to apply offers to
  let flatItems = [];
  safeCart.forEach(c => {
    for (let i = 0; i < (c.qty || 0); i++) {
      flatItems.push({ 
        ...c, 
        unitPrice: (c.price || 0), 
        originalPrice: (c.price || 0), 
        discountedPrice: (c.price || 0) 
      });
    }
  });

  // Sort by unitPrice ASCENDING to target cheapest items first
  flatItems.sort((a, b) => a.unitPrice - b.unitPrice);

  const offerType = coupon.offerType;

  switch (offerType) {
    case 'DICE_1_1': {
      const allPolaroids = flatItems.filter(i => i.category === 'polaroid');
      const single = flatItems.find(p => p.category === 'polaroid' && p.unitPrice > 99 && (p.name.toLowerCase().includes('single') || p.piecesPerUnit === 1));
      if (allPolaroids.length >= 2 && single) {
        single.discountedPrice = 99;
      }
      break;
    }
    case 'DICE_2_2': {
      const p1 = flatItems.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const p2 = flatItems.find(i => i.category === 'polaroid' && i.name.toLowerCase().includes('customized'));
      if (p1 && p2) {
        p1.discountedPrice = 229;
        p2.discountedPrice = 0;
      }
      break;
    }
    case 'DICE_3_3': {
      const digitals = flatItems.filter(i => i.category === 'digital photo' || i.name.toLowerCase().includes('digital'));
      if (digitals.length >= 3) {
        digitals[0].discountedPrice = 99;
        digitals[1].discountedPrice = 0;
        digitals[2].discountedPrice = 0;
      }
      break;
    }
    case 'DICE_4_4': {
      const packs = flatItems.filter(i => i.category === 'polaroid' && i.piecesPerUnit === 2);
      if (packs.length >= 1) {
        // flatItems is sorted ASC, so packs[0] is the cheapest
        packs[0].discountedPrice = 222;
      }
      break;
    }
    case 'DICE_5_5': {
      const polaroid = flatItems.find(i => i.category === 'polaroid' && !i.name.toLowerCase().includes('customized'));
      const digital = flatItems.find(i => (i.category === 'digital photo' || i.name.toLowerCase().includes('digital')) && i.piecesPerUnit === 1);
      if (polaroid && digital) {
        polaroid.discountedPrice = 125;
        digital.discountedPrice = 0;
      }
      break;
    }
    case 'DICE_6_6': {
      const polaroid = flatItems.find(i => i.category === 'polaroid');
      if (polaroid) {
        polaroid.discountedPrice = 99;
      }
      break;
    }
    default:
      break;
  }

  // Group back into cart items, keeping track of total discounted price vs original
  const resultCart = safeCart.map(cartItem => {
    const itemInstances = flatItems.filter(fi => fi._id === cartItem._id);
    const totalDiscounted = itemInstances.reduce((sum, fi) => sum + fi.discountedPrice, 0);
    const totalOriginal = itemInstances.reduce((sum, fi) => sum + fi.originalPrice, 0);
    
    return {
      ...cartItem,
      totalDiscounted,
      totalOriginal,
      hasDiscount: totalDiscounted < totalOriginal
    };
  });

  return resultCart;
};

export const estimateDiscount = (cart, coupon) => {
  const discounted = getDiscountedCart(cart, coupon);
  const original = (cart || []).reduce((s, i) => s + ((i.price || 0) * (i.qty || 0)), 0);
  const final = discounted.reduce((s, i) => s + (i.totalDiscounted || 0), 0);
  return Math.max(0, original - final);
};
