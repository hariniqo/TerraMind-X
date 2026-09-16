# Market Oversupply Risk Target Derivation

This document defines how the target label `oversupply_target` is calculated from raw spot prices and arrivals.

## Inputs
- `modal_price`: The current modal wholesale price of the commodity.
- `arrivals`: The volume of arrivals at the wholesale market.

## Calculation Formula

The target represents a probability indicator (0.0 to 1.0) derived dynamically:

$$\text{Oversupply Target} = 0.6 \times \text{Price Drop Scaled} + 0.4 \times \text{Arrival Surge Scaled}$$

### 1. Price Drop Scaled
Compares the current price against the 4-period rolling average price:
$$\text{Price Drop} = \frac{\text{Price}_{\text{rolling\_mean}} - \text{Price}_{\text{current}}}{\text{Price}_{\text{rolling\_mean}}}$$
$$\text{Price Drop Scaled} = \text{Clip}\left(\frac{\text{Price Drop}}{0.5}, 0, 1\right)$$

### 2. Arrival Surge Scaled
Identifies if current arrivals spike above historic averages:
$$\text{Arrival Surge} = \frac{\text{Arrivals}_{\text{current}}}{\text{Arrivals}_{\text{rolling\_mean}}}$$
$$\text{Arrival Surge Scaled} = \text{Clip}\left(\frac{\text{Arrival Surge} - 1.0}{2.0}, 0, 1\right)$$

## Reasoning
This metric flags a market risk state where massive volume arrivals trigger spot price crashes, which helps the council recommend crop diversifications before the farmer harvests.
