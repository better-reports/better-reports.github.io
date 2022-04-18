//Keep logic here because code is copied in other project:
//code as plain as possible because copied and paste for betterreports.github.io which powers connector pricing on betterreports.com
var PricingHelper = /** @class */ (function () {
    function PricingHelper() {
    }
    PricingHelper.comutePricingVM = function (tiers) {
        var previousTier = null;
        var tiersVM = tiers.map(function (t) {
            var tierVM = {
                strRange: (previousTier == null ? 0 : previousTier.maxQtyValue + 1).toLocaleString('en-US') +
                    (t.upperQuantity == null ? '+' : ' to ') +
                    (t.upperQuantity == null ? '' : t.upperQuantity.toLocaleString('en-US')),
                strFlatFee: t.flatFee == 0 || t.flatFee == null ? '-' : "$".concat(t.flatFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
                strUnitCost: t.unitCost == null ? null : "$".concat(t.unitCost.toLocaleString('en-US')),
                minQtyValue: previousTier == null ? 0 : previousTier.maxQtyValue + 1,
                maxQtyValue: t.upperQuantity,
                sliderStepSize: t.sliderStepSize,
                minSliderValue: previousTier == null ? 0 : previousTier.maxSliderValue + 1,
                stepCount: (((t.sliderMax != null ? t.sliderMax : t.upperQuantity) - (previousTier == null ? 0 : previousTier.maxQtyValue)) / t.sliderStepSize) +
                    (previousTier == null ? 1 : 0),
                maxSliderValue: null
            };
            tierVM.maxSliderValue = tierVM.minSliderValue + tierVM.stepCount - 1;
            previousTier = tierVM;
            return tierVM;
        });
        var sliderMax = tiersVM[tiersVM.length - 1].maxSliderValue;
        var hasFlatFees = tiers.some(function (t) { return t.flatFee != null; });
        var hasUnitCosts = tiers.some(function (t) { return t.unitCost != null; });
        return {
            tierVMs: tiersVM,
            sliderMax: sliderMax,
            hasFlatFees: hasFlatFees,
            hasUnitCosts: hasUnitCosts
        };
    };
    PricingHelper.computeMeteredPlanCost = function (tiers, actualQty) {
        var _a;
        var totalCost = 0;
        var previousTierUpperQuantity = 0;
        var tierCosts = [];
        for (var _i = 0, tiers_1 = tiers; _i < tiers_1.length; _i++) {
            var tier = tiers_1[_i];
            var tierQty = Math.min(tier.upperQuantity == null ? Number.MAX_VALUE : tier.upperQuantity, actualQty) - previousTierUpperQuantity;
            var tierVariableCost = tierQty * ((_a = tier.unitCost) !== null && _a !== void 0 ? _a : 0);
            var tierTotalCost = tierVariableCost + (tier.flatFee == null ? 0 : tier.flatFee);
            totalCost += tierTotalCost;
            previousTierUpperQuantity = tier.upperQuantity;
            tierCosts.push({
                tierQuantity: tierQty,
                tierUnitCost: tier.unitCost,
                tierTotalVariableCost: tierVariableCost,
                tierFlatFee: tier.flatFee,
                tierTotalCost: tierTotalCost,
            });
            if (tier.upperQuantity >= actualQty)
                break;
        }
        var strEstimatedCost = tierCosts
            //cannot use ncMapMany from public site, so inline the implementation
            .map(function (tc) { return [
            (tc.tierUnitCost == null ? null : "(".concat(tc.tierQuantity.toLocaleString('en-US'), " x ").concat(tc.tierUnitCost.toLocaleString('en-US'), ")")),
            (tc.tierFlatFee == null || tc.tierFlatFee == 0 ? null : "".concat(tc.tierFlatFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })))
        ]; })
            .reduce(function (previous, current) { return previous.concat(current); }, [])
            .filter(function (i) { return i != null; })
            .join(' + ')
            + " = $".concat(totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 }), " / month");
        var res = {
            totalCost: totalCost,
            tierCosts: tierCosts,
            strEstimatedCost: strEstimatedCost
        };
        return res;
    };
    PricingHelper.convertSliderValueToQtyValue = function (sliderValue, tiersVM) {
        sliderValue = Math.round(sliderValue);
        var tier = tiersVM.find(function (t) { return t.maxSliderValue >= sliderValue; });
        var previousTier = tiersVM[tiersVM.indexOf(tier) - 1];
        var qtyValue = (previousTier == null ? 0 : previousTier.maxQtyValue + tier.sliderStepSize) + (sliderValue - tier.minSliderValue) * tier.sliderStepSize;
        return qtyValue;
    };
    PricingHelper.convertQtyValueToSliderValue = function (qtyValue, tiersVM) {
        var t = tiersVM.find(function (t) { return t.maxQtyValue >= qtyValue; });
        var sliderValue = t.minSliderValue + Math.round(((qtyValue - t.minQtyValue) / t.sliderStepSize));
        return sliderValue;
    };
    return PricingHelper;
}());
var connectorToPricing = new Map();
connectorToPricing.set("quickbooks", {
    freeTrialDays: 14,
    plans: [
        {
            name: 'QuickBooks Connector',
            description: 'Standard plan with access to all reports and features',
            monthlyPrice: 19.90
        }
    ]
});
connectorToPricing.set("stripe", {
    freeTrialDays: 14,
    tierQtyLabel: 'Transactions per month',
    tierQtyLabelExplanationHtml: "Transactions include:\n              <ul class=\"label-explanation-list\">\n                  <li>Payments</li>\n                  <li>Collected <a href=\"https://stripe.com/docs/connect/direct-charges#collecting-fees\" target=\"_blank\">application fees</a> (relevant only if you are a Connect platform)</li>\n                  <li><a href=\"https://stripe.com/docs/issuing/purchases/transactions\" target=\"_blank\">Issuing transactions</a> (relevant only if you issue payment cards)</li>\n              </ul>",
    unitPriceLabel: 'Unit price',
    tiers: [
        { flatFee: 29.90, unitCost: 0, upperQuantity: 500, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.03, upperQuantity: 1000, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.025, upperQuantity: 5000, sliderStepSize: 100 },
        { flatFee: 0, unitCost: 0.02, upperQuantity: null, sliderStepSize: 1000, sliderMax: 50000 }
    ],
    tierContactSalesIfAbove: 50000,
});
connectorToPricing.set("helpscout", {
    freeTrialDays: 14,
    tierQtyLabel: 'Conversations',
    unitPriceLabel: 'Monthly price per conversation',
    tiers: [
        { flatFee: 29.90, unitCost: 0, upperQuantity: 500, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.03, upperQuantity: 1000, sliderStepSize: 10 },
        { flatFee: 0, unitCost: 0.025, upperQuantity: 5000, sliderStepSize: 100 },
        { flatFee: 0, unitCost: 0.02, upperQuantity: null, sliderStepSize: 1000, sliderMax: 50000 }
    ],
    tierContactSalesIfAbove: 100
});
connectorToPricing.set("shopify", {
    plans: [
        {
            name: "Basic Shopify",
            description: "For stores currently on the Basic Shopify plan",
            monthlyPrice: 19.9
        },
        {
            name: "Shopify",
            description: "For stores currently on the Shopify plan",
            monthlyPrice: 39.9
        },
        {
            name: "Advanced Shopify",
            description: "For stores currently on Advanced Basic Shopify plan",
            monthlyPrice: 149.9
        },
        {
            name: "Shopify Plus",
            description: "For stores currently on the Shopify Plus plan",
            monthlyPrice: 299.9
        }
    ],
    freeTrialDays: 14
});
function renderPricing(connectorName, targetEltId) {
    var pricing = connectorToPricing.get(connectorName);
    if (pricing == null) {
        console.log("No pricing found for connector ".concat(connectorName));
        return;
    }
    console.log("Found pricing for connector ".concat(connectorName));
    var targetElt = document.getElementById(targetEltId);
    if (targetElt == null) {
        console.log("Target element ".concat(targetEltId, " not found"));
        return;
    }
    var html = "<div class=\"pricing-wrapper\">";
    if (pricing.freeTrialDays != null) {
        html += "<div class=\"free-trial\">".concat(pricing.freeTrialDays, "-day free trial</div>");
    }
    if (pricing.plans != null) {
        html += "<div class=\"plans\">";
        for (var _i = 0, _a = pricing.plans; _i < _a.length; _i++) {
            var p = _a[_i];
            var isIntPrice = p.monthlyPrice == Math.round(p.monthlyPrice);
            html += "\n        <div class=\"plan\">\n            <div class=\"plan-title\">".concat(p.name, "</div>\n            <div class=\"plan-price-wrapper\">\n              <div class=\"plan-price\">$").concat(isIntPrice ? p.monthlyPrice.toFixed(0) : p.monthlyPrice.toFixed(2), "</div>\n              <div class=\"plan-price-month\"> / month</div>\n            </div>\n            <p class=\"plan-desc\">").concat(p.description, "</p>\n        </div>");
        }
        html += "</div>";
    }
    if (pricing.tiers != null) {
        var pricingVM = PricingHelper.comutePricingVM(pricing.tiers);
        html += "<table class=\"tiers\">";
        html += "<thead>\n                    <tr class=\"tiers-title-row\">\n                        <th>".concat(pricing.tierQtyLabel, "</th>\n                        ").concat(!pricingVM.hasUnitCosts ? "" : "<th>".concat(pricing.unitPriceLabel, "</th>"), "\n                        ").concat(!pricingVM.hasFlatFees ? "" : "<th>Monthly flat fee</th>", "\n                    </tr>\n             </thead>");
        html += "<tbody>";
        for (var _b = 0, _c = pricingVM.tierVMs; _b < _c.length; _b++) {
            var t = _c[_b];
            html += "<tr class=\"tiers-data-row\">\n                    <td>".concat(t.strRange, "</td>\n                    ").concat(!pricingVM.hasUnitCosts
                ? ""
                : "<td>" + t.strUnitCost + "</td>", "\n                    ").concat(!pricingVM.hasFlatFees
                ? ""
                : "<td>" + t.strFlatFee + "</td>", "\n                </tr>");
        }
        html += "</tbody>";
        html += "</table>";
        var noSlider = !pricingVM.hasUnitCosts && pricing.isVolumePricing;
        if (!noSlider) {
            var qtyValue = pricing.tiers[0].upperQuantity;
            var sliderValue = PricingHelper.convertQtyValueToSliderValue(qtyValue, pricingVM.tierVMs);
            var cost = PricingHelper.computeMeteredPlanCost(pricing.tiers, qtyValue);
            var strQtyValue = qtyValue.toLocaleString("en-US");
            html += "<div class=\"tier-cost\">\n                  <div class=\"tier-cost-qty\"><span id=\"tier-cost-qty-label\">".concat(pricing.tierQtyLabel, "</span>: <span id=\"tier-cost-qty-value\">").concat(strQtyValue, "</span></div>\n                  <div class=\"tier-cost-slide-container\">\n                  <input id=\"slider\" type=\"range\" min=\"0\" max=\"").concat(pricingVM.sliderMax, "\" value=\"").concat(sliderValue, "\">\n                  </div>\n                  <div class=\"tier-cost-estimated-cost\">Estimated cost:</div>\n                  <div id=\"tier-cost-detail\">").concat(cost.strEstimatedCost, "</div>\n              </div>");
        }
    }
    if (pricing.tierQtyLabelExplanationHtml != null) {
        html += "<div class=\"label-explanation\">".concat(pricing.tierQtyLabelExplanationHtml, "</div>");
    }
    html += "</div>";
    targetElt.innerHTML = html;
    if (pricing.tiers != null) {
        var pricingVM_1 = PricingHelper.comutePricingVM(pricing.tiers);
        var eltSlider_1 = targetElt.querySelector("#slider");
        if (eltSlider_1 == null) // no slider
            return;
        var eltStrQty_1 = (targetElt.querySelector("#tier-cost-qty-value"));
        var eltTierCostDetail_1 = (targetElt.querySelector("#tier-cost-detail"));
        eltSlider_1.oninput = function () {
            var qtyValue = PricingHelper.convertSliderValueToQtyValue(parseInt(eltSlider_1.value), pricingVM_1.tierVMs);
            var strQtyValue = qtyValue.toLocaleString("en-US");
            eltTierCostDetail_1.innerHTML = PricingHelper.computeMeteredPlanCost(pricing.tiers, qtyValue).strEstimatedCost;
            eltStrQty_1.innerHTML = strQtyValue;
        };
    }
}
//# sourceMappingURL=pricing.js.map