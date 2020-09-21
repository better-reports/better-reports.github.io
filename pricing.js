let stripePricing = {
    freeTrialDays: 14,
    tierQtyLabel: 'Charges per month',
    unitPriceLabel: 'Unit price',
    tiers: [
        { flatFee: 29.90, unitCost: 0, upperQuantity: 500, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.03, upperQuantity: 1_000, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.025, upperQuantity: 5_000, sliderStepSize: 100 },
        { flatFee: 0, unitCost: 0.02, upperQuantity: null, sliderStepSize: 1_000, sliderMax: 50_000 }
    ],
    tierContactSalesIfAbove: 50000
}

console.log(stripePricing);