#!/usr/bin/env bash
set -euo pipefail

# Create Stripe products and prices for the washer/dryer booking system.
# Requires: stripe CLI authenticated (`stripe login`)
#
# Pricing matrix:
#   All packages: M2M $79/mo, $39 setup
#   WD 6mo: $65/mo, $39 setup  |  WD 12mo: $59/mo, $39 setup
#   WO 6mo: $40/mo, $39 setup  |  WO 12mo: $36/mo, $39 setup
#   DO 6mo: $35/mo, $39 setup  |  DO 12mo: $32/mo, $39 setup

ENV_FILE="${1:-.env}"

echo "=== Creating Stripe products and prices ==="
echo "Output will be appended to: $ENV_FILE"
echo ""

# Helper: extract "id" from Stripe CLI JSON output
get_id() {
  grep '"id":' | head -1 | sed 's/.*"id": "\([^"]*\)".*/\1/'
}

# Helper: create a product
create_product() {
  local name="$1"
  local desc="$2"
  stripe products create --name="$name" --description="$desc" 2>/dev/null | get_id
}

# Helper: create a recurring monthly price
create_recurring_price() {
  local product_id="$1"
  local amount="$2"
  local nickname="$3"
  stripe prices create \
    --product="$product_id" \
    --unit-amount="$amount" \
    --currency=usd \
    -d "recurring[interval]=month" \
    --nickname="$nickname" 2>/dev/null | get_id
}

# Helper: create a one-time price (setup fee)
create_onetime_price() {
  local product_id="$1"
  local amount="$2"
  local nickname="$3"
  stripe prices create \
    --product="$product_id" \
    --unit-amount="$amount" \
    --currency=usd \
    --nickname="$nickname" 2>/dev/null | get_id
}

# ── Create Products ──────────────────────────────────────
echo "Creating products..."

PROD_WD=$(create_product "Washer + Dryer Rental" "Full-size washer and electric dryer, delivered and installed.")
echo "  Washer+Dryer product: $PROD_WD"

PROD_WO=$(create_product "Washer Only Rental" "Full-size washer, delivered and installed.")
echo "  Washer Only product:  $PROD_WO"

PROD_DO=$(create_product "Dryer Only Rental" "Full-size electric dryer, delivered and installed.")
echo "  Dryer Only product:   $PROD_DO"

echo ""
echo "Creating prices..."

# ── Washer+Dryer Prices ─────────────────────────────────
STRIPE_PRICE_WD_M2M_MONTHLY=$(create_recurring_price "$PROD_WD" 7900 "WD M2M Monthly")
echo "  WD M2M Monthly:  $STRIPE_PRICE_WD_M2M_MONTHLY"

STRIPE_PRICE_WD_M2M_SETUP=$(create_onetime_price "$PROD_WD" 3900 "WD M2M Setup")
echo "  WD M2M Setup:    $STRIPE_PRICE_WD_M2M_SETUP"

STRIPE_PRICE_WD_6MO_MONTHLY=$(create_recurring_price "$PROD_WD" 6500 "WD 6mo Monthly")
echo "  WD 6mo Monthly:  $STRIPE_PRICE_WD_6MO_MONTHLY"

STRIPE_PRICE_WD_6MO_SETUP=$(create_onetime_price "$PROD_WD" 3900 "WD 6mo Setup")
echo "  WD 6mo Setup:    $STRIPE_PRICE_WD_6MO_SETUP"

STRIPE_PRICE_WD_12MO_MONTHLY=$(create_recurring_price "$PROD_WD" 5900 "WD 12mo Monthly")
echo "  WD 12mo Monthly: $STRIPE_PRICE_WD_12MO_MONTHLY"

STRIPE_PRICE_WD_12MO_SETUP=$(create_onetime_price "$PROD_WD" 3900 "WD 12mo Setup")
echo "  WD 12mo Setup:   $STRIPE_PRICE_WD_12MO_SETUP"

# ── Washer Only Prices ───────────────────────────────────
STRIPE_PRICE_WO_M2M_MONTHLY=$(create_recurring_price "$PROD_WO" 7900 "WO M2M Monthly")
echo "  WO M2M Monthly:  $STRIPE_PRICE_WO_M2M_MONTHLY"

STRIPE_PRICE_WO_M2M_SETUP=$(create_onetime_price "$PROD_WO" 3900 "WO M2M Setup")
echo "  WO M2M Setup:    $STRIPE_PRICE_WO_M2M_SETUP"

STRIPE_PRICE_WO_6MO_MONTHLY=$(create_recurring_price "$PROD_WO" 4000 "WO 6mo Monthly")
echo "  WO 6mo Monthly:  $STRIPE_PRICE_WO_6MO_MONTHLY"

STRIPE_PRICE_WO_6MO_SETUP=$(create_onetime_price "$PROD_WO" 3900 "WO 6mo Setup")
echo "  WO 6mo Setup:    $STRIPE_PRICE_WO_6MO_SETUP"

STRIPE_PRICE_WO_12MO_MONTHLY=$(create_recurring_price "$PROD_WO" 3600 "WO 12mo Monthly")
echo "  WO 12mo Monthly: $STRIPE_PRICE_WO_12MO_MONTHLY"

STRIPE_PRICE_WO_12MO_SETUP=$(create_onetime_price "$PROD_WO" 3900 "WO 12mo Setup")
echo "  WO 12mo Setup:   $STRIPE_PRICE_WO_12MO_SETUP"

# ── Dryer Only Prices ────────────────────────────────────
STRIPE_PRICE_DO_M2M_MONTHLY=$(create_recurring_price "$PROD_DO" 7900 "DO M2M Monthly")
echo "  DO M2M Monthly:  $STRIPE_PRICE_DO_M2M_MONTHLY"

STRIPE_PRICE_DO_M2M_SETUP=$(create_onetime_price "$PROD_DO" 3900 "DO M2M Setup")
echo "  DO M2M Setup:    $STRIPE_PRICE_DO_M2M_SETUP"

STRIPE_PRICE_DO_6MO_MONTHLY=$(create_recurring_price "$PROD_DO" 3500 "DO 6mo Monthly")
echo "  DO 6mo Monthly:  $STRIPE_PRICE_DO_6MO_MONTHLY"

STRIPE_PRICE_DO_6MO_SETUP=$(create_onetime_price "$PROD_DO" 3900 "DO 6mo Setup")
echo "  DO 6mo Setup:    $STRIPE_PRICE_DO_6MO_SETUP"

STRIPE_PRICE_DO_12MO_MONTHLY=$(create_recurring_price "$PROD_DO" 3200 "DO 12mo Monthly")
echo "  DO 12mo Monthly: $STRIPE_PRICE_DO_12MO_MONTHLY"

STRIPE_PRICE_DO_12MO_SETUP=$(create_onetime_price "$PROD_DO" 3900 "DO 12mo Setup")
echo "  DO 12mo Setup:   $STRIPE_PRICE_DO_12MO_SETUP"

echo ""
echo "=== All prices created ==="
echo ""

# ── Update .env file ─────────────────────────────────────
# Remove old price keys if present
sed -i '/^STRIPE_PRICE_WASHER_DRYER_MONTHLY=/d' "$ENV_FILE"
sed -i '/^STRIPE_PRICE_WASHER_ONLY_MONTHLY=/d' "$ENV_FILE"
sed -i '/^STRIPE_PRICE_DRYER_ONLY_MONTHLY=/d' "$ENV_FILE"
sed -i '/^STRIPE_PRICE_SETUP_FEE=/d' "$ENV_FILE"

# Remove new-format keys if they exist (re-run safe)
sed -i '/^STRIPE_PRICE_WD_/d' "$ENV_FILE"
sed -i '/^STRIPE_PRICE_WO_/d' "$ENV_FILE"
sed -i '/^STRIPE_PRICE_DO_/d' "$ENV_FILE"

# Append new price IDs
cat >> "$ENV_FILE" << EOF

# Stripe Price IDs — Washer+Dryer
STRIPE_PRICE_WD_M2M_MONTHLY="$STRIPE_PRICE_WD_M2M_MONTHLY"
STRIPE_PRICE_WD_M2M_SETUP="$STRIPE_PRICE_WD_M2M_SETUP"
STRIPE_PRICE_WD_6MO_MONTHLY="$STRIPE_PRICE_WD_6MO_MONTHLY"
STRIPE_PRICE_WD_6MO_SETUP="$STRIPE_PRICE_WD_6MO_SETUP"
STRIPE_PRICE_WD_12MO_MONTHLY="$STRIPE_PRICE_WD_12MO_MONTHLY"
STRIPE_PRICE_WD_12MO_SETUP="$STRIPE_PRICE_WD_12MO_SETUP"

# Stripe Price IDs — Washer Only
STRIPE_PRICE_WO_M2M_MONTHLY="$STRIPE_PRICE_WO_M2M_MONTHLY"
STRIPE_PRICE_WO_M2M_SETUP="$STRIPE_PRICE_WO_M2M_SETUP"
STRIPE_PRICE_WO_6MO_MONTHLY="$STRIPE_PRICE_WO_6MO_MONTHLY"
STRIPE_PRICE_WO_6MO_SETUP="$STRIPE_PRICE_WO_6MO_SETUP"
STRIPE_PRICE_WO_12MO_MONTHLY="$STRIPE_PRICE_WO_12MO_MONTHLY"
STRIPE_PRICE_WO_12MO_SETUP="$STRIPE_PRICE_WO_12MO_SETUP"

# Stripe Price IDs — Dryer Only
STRIPE_PRICE_DO_M2M_MONTHLY="$STRIPE_PRICE_DO_M2M_MONTHLY"
STRIPE_PRICE_DO_M2M_SETUP="$STRIPE_PRICE_DO_M2M_SETUP"
STRIPE_PRICE_DO_6MO_MONTHLY="$STRIPE_PRICE_DO_6MO_MONTHLY"
STRIPE_PRICE_DO_6MO_SETUP="$STRIPE_PRICE_DO_6MO_SETUP"
STRIPE_PRICE_DO_12MO_MONTHLY="$STRIPE_PRICE_DO_12MO_MONTHLY"
STRIPE_PRICE_DO_12MO_SETUP="$STRIPE_PRICE_DO_12MO_SETUP"
EOF

echo "Updated $ENV_FILE with all price IDs."
echo ""
echo "Products created:"
echo "  Washer+Dryer: $PROD_WD"
echo "  Washer Only:  $PROD_WO"
echo "  Dryer Only:   $PROD_DO"
echo ""
echo "Done!"
