//COPY FROM C:/Dev/BetterReports/NitroCharts.Web2/client-app/src/_model/pricing.helper AND REMOVE THE export KEYWORDS
interface TierVM {
  strRange: string;
  strUnitCost: string;
  strFlatFee: string;
  minSliderValue: number;
  maxSliderValue: number;
  sliderStepSize: number;
  stepCount: number;
  minQtyValue: number;
  maxQtyValue: number;
}

interface PricingVM {
  tierVMs: TierVM[];
  sliderMax: number;
  hasFlatFees: boolean;
}

interface Plan {
  name: string;
  monthlyPrice: number;
  description: string;
}

interface MeteredPlanTier {
  upperQuantity?: number;
  flatFee?: number;
  unitCost: number;
  sliderStepSize: number;
  sliderMax?: number;
}

interface MeteredPlanCost {
  totalCost: number;
  totalFlatFee?: number;
  tierCosts: MeteredPlanTierCost[];
  strEstimatedCost: string;
}

interface MeteredPlanTierCost {
  tierUnitCost: number;
  tierQuantity: number;
  tierTotalVariableCost: number;
  tierFlatFee: number;
  tierTotalCost: number;
}

class PricingHelper {
  static comutePricingVM(tiers: MeteredPlanTier[]): PricingVM {
    let previousTier: TierVM = null;

    const tiersVM = tiers.map(t => {
      let tierVM = <TierVM>{
        strRange:
          (previousTier == null
            ? 0
            : previousTier.maxQtyValue + 1
          ).toLocaleString("en-US") +
          (t.upperQuantity == null ? "+" : " to ") +
          (t.upperQuantity == null
            ? ""
            : t.upperQuantity.toLocaleString("en-US")),
        strFlatFee:
          t.flatFee == 0 || t.flatFee == null
            ? "-"
            : `$${t.flatFee.toLocaleString("en-US")}`,
        strUnitCost: `$${t.unitCost.toLocaleString("en-US")}`,
        minQtyValue: previousTier == null ? 0 : previousTier.maxQtyValue + 1,
        maxQtyValue: t.upperQuantity,
        sliderStepSize: t.sliderStepSize,
        minSliderValue:
          previousTier == null ? 0 : previousTier.maxSliderValue + 1,
        stepCount:
          ((t.sliderMax != null ? t.sliderMax : t.upperQuantity) -
            (previousTier == null ? 0 : previousTier.maxQtyValue)) /
            t.sliderStepSize +
          (previousTier == null ? 1 : 0), //add the step for 0 on the first tier
        maxSliderValue: null
      };
      tierVM.maxSliderValue = tierVM.minSliderValue + tierVM.stepCount - 1;
      previousTier = tierVM;

      return tierVM;
    });
    const sliderMax = tiersVM[tiersVM.length - 1].maxSliderValue;
    const hasFlatFees = tiers.some(t => t.flatFee != null);
    return {
      tierVMs: tiersVM,
      sliderMax: sliderMax,
      hasFlatFees: hasFlatFees
    };
  }

  public static computeMeteredPlanCost(
    tiers: MeteredPlanTier[],
    actualQty: number
  ): MeteredPlanCost {
    let totalCost = 0;
    let previousTierUpperQuantity = 0;
    let tierCosts: MeteredPlanTierCost[] = [];

    for (let tier of tiers) {
      let tierQty =
        Math.min(
          tier.upperQuantity == null ? Number.MAX_VALUE : tier.upperQuantity,
          actualQty
        ) - previousTierUpperQuantity;
      let tierVariableCost = tierQty * tier.unitCost;
      let tierTotalCost =
        tierVariableCost + (tier.flatFee == null ? 0 : tier.flatFee);
      totalCost += tierTotalCost;
      previousTierUpperQuantity = tier.upperQuantity;

      tierCosts.push({
        tierQuantity: tierQty,
        tierUnitCost: tier.unitCost,
        tierTotalVariableCost: tierVariableCost,
        tierFlatFee: tier.flatFee,
        tierTotalCost: tierTotalCost
      });

      if (tier.upperQuantity >= actualQty) break;
    }

    let strEstimatedCost =
      tierCosts
        .map(
          tc =>
            `(${tc.tierQuantity.toLocaleString(
              "en-US"
            )} x ${tc.tierUnitCost.toLocaleString("en-US")})` +
            (tc.tierFlatFee == null || tc.tierFlatFee == 0
              ? ""
              : ` + ${tc.tierFlatFee.toLocaleString("en-US")}`)
        )
        .join(" + ") +
      ` = $${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    let res: MeteredPlanCost = {
      totalCost: totalCost,
      tierCosts: tierCosts,
      strEstimatedCost: strEstimatedCost
    };

    return res;
  }

  public static convertSliderValueToQtyValue(
    sliderValue: number,
    tiersVM: TierVM[]
  ) {
    sliderValue = Math.round(sliderValue);
    let tier = tiersVM.find(t => t.maxSliderValue >= sliderValue);
    let previousTier = tiersVM[tiersVM.indexOf(tier) - 1];
    let qtyValue =
      (previousTier == null
        ? 0
        : previousTier.maxQtyValue + tier.sliderStepSize) +
      (sliderValue - tier.minSliderValue) * tier.sliderStepSize;
    return qtyValue;
  }

  public static convertQtyValueToSliderValue(
    qtyValue: number,
    tiersVM: TierVM[]
  ) {
    let t = tiersVM.find(t => t.maxQtyValue >= qtyValue);
    let sliderValue =
      t.minSliderValue +
      Math.round((qtyValue - t.minQtyValue) / t.sliderStepSize);
    return sliderValue;
  }
}
//END COPY

interface ConnectorPricing {
  tiers?: MeteredPlanTier[];
  plans?: Plan[];
  tierQtyLabel?: string;
  unitPriceLabel?: string;
  tierContactSalesIfAbove?: number;
  freeTrialDays: number;
}

const connectorToPricing = new Map<string, ConnectorPricing>();

connectorToPricing.set("stripe", {
  freeTrialDays: 14,
  tierQtyLabel: "Charges per month",
  unitPriceLabel: "Unit price",
  tiers: [
    { flatFee: 29.9, unitCost: 0, upperQuantity: 500, sliderStepSize: 10 },
    { flatFee: 0, unitCost: 0.03, upperQuantity: 1_000, sliderStepSize: 10 },
    { flatFee: 0, unitCost: 0.025, upperQuantity: 5_000, sliderStepSize: 100 },
    {
      flatFee: 0,
      unitCost: 0.02,
      upperQuantity: null,
      sliderStepSize: 1_000,
      sliderMax: 50_000
    }
  ],
  tierContactSalesIfAbove: 50000
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

function renderPricing(connectorName: string, targetEltId) {
  const pricing = connectorToPricing.get(connectorName);
  if (pricing == null) {
    console.log(`No pricing found for connector ${connectorName}`);
    return;
  }

  console.log(`Found pricing for connector ${connectorName}`);
  const targetElt = document.getElementById(targetEltId);
  if (targetElt == null) {
    console.log(`Target element ${targetEltId} not found`);
    return;
  }

  let html = `<div class="pricing-wrapper">`;

  if (pricing.freeTrialDays != null) {
    html += `<div class="free-trial">${pricing.freeTrialDays}-day free trial</div>`;
  }

  if (pricing.plans != null) {
    html += `<div class="plans">`;
    for (let p of pricing.plans) {
      const isIntPrice = p.monthlyPrice == Math.round(p.monthlyPrice);
      html += `
        <div class="plan">
            <h5 class="plan-title">${p.name}</h5>
            <h6 class="plan-price">$${
              isIntPrice ? p.monthlyPrice.toFixed(0) : p.monthlyPrice.toFixed(2)
            } / month</h6>
            <p class="plan-desc">${p.description}</p>
        </div>`;
    }
    html += `</div>`;
  }

  if (pricing.tiers != null) {
    let pricingVM = PricingHelper.comutePricingVM(pricing.tiers);
    html += `<table class="tiers">`;
    html += `<thead>
                    <tr class="tiers-title-row">
                        <th>${pricing.tierQtyLabel}</th>
                        <th>${pricing.unitPriceLabel}</th>
                        ${!pricingVM.hasFlatFees ? "" : "<th>Flat fee</th>"}
                    </tr>
             </thead>`;
    html += `<tbody>`;
    for (let t of pricingVM.tierVMs) {
      html += `<tr class="tiers-data-row">
                    <td>${t.strRange}</td>
                    <td>${t.strUnitCost}</td>
                    ${
                      !pricingVM.hasFlatFees
                        ? ""
                        : "<td>" + t.strFlatFee + "</td>"
                    }
                </tr>`;
    }
    html += `</tbody>`;
    html += `</table>`;

    let qtyValue = pricing.tiers[0].upperQuantity;
    let sliderValue = PricingHelper.convertQtyValueToSliderValue(
      qtyValue,
      pricingVM.tierVMs
    );
    let cost = PricingHelper.computeMeteredPlanCost(pricing.tiers, qtyValue);
    let strQtyValue = qtyValue.toLocaleString("en-US");

    html += `<div class="tier-cost">
                <div class="tier-cost-qty"><span id="tier-cost-qty-label">${pricing.tierQtyLabel}</span>: <span id="tier-cost-qty-value">${strQtyValue}</span></div>
                <div class="tier-cost-estimated-cost">Estimated cost:</div>
                <div class="tier-cost-slide-container">
                  <input id="slider" type="range" min="0" max="${pricingVM.sliderMax}" value="${sliderValue}">
                </div>
                <div id="tier-cost-detail">${cost.strEstimatedCost}</div>
             </div>`;
  }

  html += `</div>`;

  targetElt.innerHTML = html;
  if (pricing.tiers != null) {
    let pricingVM = PricingHelper.comutePricingVM(pricing.tiers);
    let eltSlider = <HTMLInputElement>targetElt.querySelector("#slider");
    let eltStrQty = <HTMLInputElement>(
      targetElt.querySelector("#tier-cost-qty-value")
    );
    let eltTierCostDetail = <HTMLElement>(
      targetElt.querySelector("#tier-cost-detail")
    );
    eltSlider.oninput = () => {
      let qtyValue = PricingHelper.convertSliderValueToQtyValue(
        parseInt(eltSlider.value),
        pricingVM.tierVMs
      );
      let strQtyValue = qtyValue.toLocaleString("en-US");
      eltTierCostDetail.innerHTML = PricingHelper.computeMeteredPlanCost(
        pricing.tiers,
        qtyValue
      ).strEstimatedCost;
      eltStrQty.innerHTML = strQtyValue;
    };
  }
}
