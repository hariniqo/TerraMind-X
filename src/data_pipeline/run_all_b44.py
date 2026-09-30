Act as a senior agricultural technology product architect, AI/ML engineer,
full-stack developer, UX designer, and Smart India Hackathon mentor.

Design and build a production-style hackathon MVP named:

KRISHIBALANCE AI
Tagline: “Predict. Balance. Sell Better.”

Problem Statement:
Small and marginal farmers often sell crops immediately after harvest because
they do not know the best market, buyer, price trend, buyer demand, quality
requirements, transport cost, storage options, or payment reliability.

Many farmers in the same region grow and harvest the same crop at the same
time. This creates excess supply in nearby mandis, price crashes, post-harvest
loss, weak bargaining power, and poor farmer income. At the same time,
processors, retailers, exporters, hotels, institutional buyers, and traders
struggle to source the right quantity and quality of produce at the right time.

The platform must solve the larger problem of agricultural supply-demand
imbalance, not merely show current mandi prices or make a simple buyer-seller
marketplace.

Core Product Vision:
Build an AI-enabled, multilingual, offline-first agricultural supply-demand
balancing and market-linkage platform for farmers, Farmer Producer
Organisations (FPOs), buyers, transport providers, storage providers, and
agricultural administrators.

The platform should:
1. Collect expected farmer/FPO supply before harvest.
2. Collect real buyer demand, quality requirements, and delivery windows.
3. Combine this with mandi prices, mandi arrivals, historical trends,
   weather, crop calendars, festival demand, logistics cost, storage capacity,
   and payment risk.
4. Calculate whether a crop will face shortage, balanced supply, moderate
   oversupply, or severe oversupply for a crop, grade, location, and week.
5. Convert that analysis into real balancing actions:
   - FPO aggregation
   - buyer matching
   - alternate market routing
   - shared logistics
   - cold-storage recommendation
   - staggered dispatch
   - crop quality routing
   - processor linkage
   - pre-harvest buyer booking
   - next-season crop diversification advice
6. Explain every recommendation in simple language in English, Marathi,
   Tamil, and optionally Hindi.

Main Innovation:
The platform is not a “market price app.”
It is a “Supply-Demand Balance Engine” that predicts local market pressure and
coordinates supply allocation to prevent price crashes and improve net farmer
income.

Project Goal:
Improve farmer price realization, reduce information asymmetry, reduce post-
harvest loss, strengthen FPO aggregation, reduce transaction cost, and help
buyers find consistent quality-assured crop supply.

Target Users:
1. Small and marginal farmers
2. FPO managers and collection-centre staff
3. Verified buyers: processors, wholesalers, retailers, exporters, hotels,
   institutional buyers, and traders
4. Transport providers
5. Cold-storage and warehouse operators
6. Agricultural market-board administrators
7. Field officers or village volunteers

User Roles and Permissions:

Farmer:
- Register crop supply and expected harvest
- View nearby prices, arrivals, buyer demand, and market risk
- Receive AI selling recommendation
- Join FPO bulk lots
- Accept/reject buyer offers
- Request transport and storage
- View payment/order status
- Use voice/text interface

FPO Manager:
- Add or validate farmer supply declarations
- Create crop clusters and bulk lots
- Match lots with buyers
- Approve farmer participation
- Track collection, quality, dispatch, payments, and disputes
- View cluster-level supply-demand dashboard

Buyer:
- Register purchase demand
- Specify crop, variety, grade, quantity, price, delivery date, pickup,
  payment term, and location
- View matching FPO bulk lots
- Place an offer or reserve a lot
- Confirm pickup, weight, quality, and payment
- Build a transparent transaction record

Transport Provider:
- Add vehicle type, capacity, rate, route, availability, and contact
- Accept shared transport bookings

Storage Provider:
- Add facility type, capacity, commodity support, cost, availability,
  location, and booking status

Administrator:
- Verify buyer/FPO/transport/storage profiles
- Monitor disputes and platform activity
- Manage commodity, market, district, crop-calendar, and festival data
- View district-level supply-risk dashboard
- Audit data source, freshness, confidence, and consent status

Geographic Scope for MVP:
Build the demo for one district in Maharashtra, preferably Nashik, Pune,
Ahmednagar, Solapur, Aurangabad, or another agriculture-heavy district.
Make the data model location-configurable so the product can later support
Tamil Nadu, including Madurai, Thoothukudi, and other districts.

Commodities for MVP:
Use exactly three commodities for the first version:
1. Tomato
2. Onion
3. Soybean

The architecture must be expandable to other crops, varieties, grades,
districts, and states.

Data Strategy:
Do not falsely claim that full current cultivation data for all farmers is
available. Full plot-level cultivation data can be restricted and unavailable.

Use a hybrid and transparent data model:

A. Public/official market data:
- Daily mandi prices
- Minimum, maximum, and modal price
- Mandi arrival quantities
- Market name, district, state
- Commodity and variety
- Historical price and arrival trends

B. Platform-created supply data:
- Farmer/FPO crop declaration
- Expected harvest week
- Expected quantity range
- Actual harvest quantity
- Grade/quality
- Village or pincode
- Storage availability
- Selling urgency
- Consent status
- Verification status

C. Platform-created demand data:
- Buyer crop requirement
- Variety
- Grade/quality requirement
- Quantity required
- Delivery date window
- Offered rate
- Pickup availability
- Payment period
- Buyer verification state

D. Supporting data:
- Weather and rainfall
- Festival and seasonal calendar
- Crop sowing/harvest calendar
- Transport rates and vehicle availability
- Cold-storage/warehouse availability and charges
- Distance/route estimates
- FPO registration/collection-centre data
- Buyer payment performance
- Historical crop price patterns

E. Optional remote-sensing data:
- Use satellite or NDVI/crop-condition indicators only as a broad regional
  crop-condition and area proxy.
- Never claim satellite data identifies every farmer’s crop exactly.
- Clearly show satellite confidence/coverage limitations.

Data Provenance Requirements:
Every data item must have:
- source_type: public, farmer-reported, FPO-verified, buyer-reported,
  admin-verified, satellite-estimated, synthetic-demo, model-predicted
- source_name
- created_at
- last_updated_at
- freshness_status
- verification_status
- confidence_score
- consent_status where farmer data is involved

Supply-Demand Balance Engine:
Design an engine named SDBI:
Supply-Demand Balance Index.

Core Formula:
SDBI = Expected Available Supply / (Expected Demand + 1)

For each:
- Crop
- Variety
- Grade
- District/cluster
- Village group or FPO cluster
- Harvest/delivery week

Supply estimation must consider:
1. Farmer-declared expected quantity
2. FPO collection/aggregation quantity
3. Current and recent mandi arrivals
4. Historical seasonal arrival pattern
5. Crop calendar
6. Weather disruption factor
7. Optional satellite crop-condition signal
8. Harvest-date confidence
9. Grade-wise available quantity

Demand estimation must consider:
1. Verified buyer demand listing
2. Buyer delivery time window
3. Buyer quality/grade requirements
4. Historical market absorption or mandi offtake proxy
5. Seasonal demand
6. Festival demand signal
7. Processor capacity
8. Retailer/institutional demand
9. Open purchase orders
10. Buyer reliability and fulfilment likelihood

SDBI Interpretation:
- SDBI < 0.80 = Demand higher than supply / shortage opportunity
- 0.80 to 1.20 = Healthy balance
- 1.20 to 1.50 = Moderate oversupply risk
- SDBI > 1.50 = Severe oversupply risk

The system must show:
- SDBI value
- Risk color: green/yellow/orange/red
- Supply estimate
- Demand estimate
- Data confidence
- Top 3 contributing factors
- Recommended balancing actions

Example explanation:
“Tomato supply risk is high for Nashik Cluster in Week 41. Farmer/FPO
registrations indicate 42 tonnes expected supply, while confirmed buyer demand
and estimated market absorption total 29 tonnes. Mandi arrivals are rising and
historical seasonal data shows a price decline during this period. Recommendation:
pre-book processor buyers, create separate Grade A and Grade B lots, stagger
dispatch, and avoid sending all produce to the same mandi.”

Price Forecasting Module:
Build an Explainable Price Forecast Engine.

Inputs:
- Historical modal price
- Minimum and maximum price
- Daily arrivals
- Mandi/market
- Commodity
- Variety
- Month, week, and season
- Lag price values
- Lag arrival values
- Weather/rainfall
- Festival indicator
- Buyer demand volume
- FPO supply volume
- District/cluster
- Transport disruption or fuel-cost proxy where possible

Outputs:
- Current market price
- 3-day forecast
- 7-day forecast
- 14-day forecast
- Forecasted price range, not one guaranteed price
- Rise/fall/stable direction
- Confidence score
- Likely drivers of movement
- Historical comparison
- Suggested action

Use a baseline model first:
- XGBoost, LightGBM, Random Forest, Prophet, or similar model
- Build robust fallback logic using moving average, seasonal average, and
  price-arrival relationship when advanced ML is unavailable

Optional advanced innovation:
Integrate a diffusion-based market-scenario model that generates multiple
plausible future price trajectories. Use it to produce price intervals and
market risk, not a single exact prediction.

Never claim:
“The AI gives exact future price.”

Always present:
“Likely price range, direction, confidence, and underlying drivers.”

Net Realization Optimizer:
Do not recommend markets based only on visible mandi price.

For every market, buyer, storage, and logistics option, calculate:

Net Realisation =
Expected Selling Price
- Transport Cost
- Loading/Unloading Cost
- Market Fee
- Commission
- Packaging Cost
- Storage Cost
- Expected Spoilage Loss
- Quality Rejection Risk Cost

The system must rank options by:
- Expected net income
- Price forecast
- Buyer trust
- Payment speed
- Distance
- Transport reliability
- Storage feasibility
- Farmer cash urgency
- Risk

Output example:
Option 1: Local mandi
Gross price: ₹1,850/quintal
Costs: ₹160/quintal
Net realization: ₹1,690/quintal

Option 2: Verified processor buyer
Gross price: ₹1,950/quintal
Costs: ₹180/quintal
Net realization: ₹1,770/quintal

Recommendation:
“Sell to the verified processor buyer. Though the gross price difference is
only ₹100/quintal, your expected final income is ₹80/quintal higher after
transport and market costs.”

Smart Allocation Engine:
Build a matching and allocation engine that matches supply lots to buyer
demand, not just individual farmers to phone numbers.

Matching conditions:
- Same commodity
- Compatible variety
- Required quality grade
- Available quantity
- Buyer required quantity
- Harvest date vs delivery window
- Geographic distance
- Pickup availability
- Transport feasibility
- Offered price
- Buyer trust score
- Farmer cash urgency
- Storage capability
- FPO membership
- Payment timeline

Allocation prioritization:
1. Quality compatibility
2. Delivery-time compatibility
3. Highest expected net realization
4. Buyer trust score
5. Payment speed
6. Lowest spoilage risk
7. Shortest feasible logistics route
8. Fair allocation among participating farmers

When supply exceeds demand:
- Split supply across multiple buyers/markets
- Build FPO lots
- Route lower grade produce to processors
- Recommend storage only if economically viable
- Recommend staggered dispatch
- Show alternative markets
- Create buyer outreach alerts
- Create next-season diversification warning

When demand exceeds supply:
- Notify matching farmers/FPOs
- Aggregate small lots
- Reserve supply for verified buyer
- Suggest fair price negotiation range
- Prioritize urgent buyer orders
- Enable shared pickup

FPO Aggregation Engine:
Build a module that combines small farmer lots into a bulk FPO lot.

Aggregation conditions:
- Same crop
- Compatible grade
- Compatible harvest/availability date
- Nearby villages within configurable radius
- Buyer minimum quantity requirement
- Route and transport capacity
- Farmer consent
- FPO validation

FPO bulk lot must include:
- Commodity and variety
- Grade
- Total quantity
- Participating farmer count
- Village cluster
- Availability window
- Suggested buyer matches
- Expected average price
- Transport plan
- Storage requirement
- Quality checklist
- Lot status: draft, approved, offered, reserved, collected, dispatched,
  delivered, paid, disputed

Innovative feature:
Use geographic clustering to group farmers with compatible crop, grade,
quantity, and harvest date into a shared pickup route and a quality-matched
bulk lot.

Buyer Trust and Payment Reliability Engine:
Build a transparent Buyer Trust Score.

Input factors:
- Buyer KYC/verification status
- GST/PAN/business registration verification field
- FPO or admin approval
- Previous completed orders
- On-time payment percentage
- Average payment delay
- Quality dispute rate
- Cancellation rate
- Farmer/FPO feedback
- Delivery fulfilment rate

Example formula:
Buyer Trust Score =
0.35 × On-Time Payment Score
+ 0.25 × Order Fulfilment Score
+ 0.20 × Quality Dispute Score
+ 0.20 × Verification Score

Show:
- Trust score out of 100
- Verified/pending/unverified state
- Payment terms
- Average payment duration
- Transaction count
- Dispute status
- Warning for new/unverified buyers

Important:
Do not claim that an AI score alone proves a buyer is legitimate.
In production, legal verification must occur through authorized KYC,
FPO validation, market-board records, GST/PAN verification, and banking
integration where legally permitted.

Quality-Based Routing:
Farmers must be able to declare or upload crop quality data.

Quality fields:
- Grade: A/B/C
- Size class
- Colour/ripeness
- Moisture percentage for grains
- Damage percentage
- Defect percentage
- Packaging type
- Harvest date
- Photos

Optional image AI:
Build an image-based preliminary quality-assistance tool for tomato/onion.
It should classify produce approximately as Grade A, B, or C and highlight
visible defects.

Important disclaimer:
“The image analysis is preliminary decision support. Final grade and price are
confirmed by the FPO, buyer, mandi, or authorized quality-assessment process.”

Quality routing logic:
- Grade A: premium retailer, exporter, institutional buyer
- Grade B: wholesale buyer, regular retail
- Grade C: processor, pulp/pickle/drying/animal-feed where appropriate
- Rejected produce: show recovery/waste-reduction option where available

Logistics and Storage Optimizer:
Build a module for:
- Nearby transport providers
- Vehicle capacity
- Shared transport matching
- Pickup route planning
- Distance calculation
- Per-km transport cost
- Vehicle availability
- Cold-storage availability
- Warehouse availability
- Commodity compatibility
- Storage cost
- Available capacity
- Estimated spoilage risk
- Dispatch schedule

Storage decision logic:
Recommend storage only when:

Expected Future Net Realisation
- Storage Cost
- Additional Spoilage Cost
- Interest/Liquidity Cost
is greater than Immediate Net Realisation.

If storage is not economically justified, clearly recommend immediate sale or
FPO/buyer aggregation.

Transport decision logic:
Group farmer lots into a shared vehicle route when:
- Total load fits a vehicle
- Pickup radius is acceptable
- Delivery window is compatible
- Shared transport reduces per-farmer logistics cost

Pre-Harvest Planning Innovation:
Add a module called:
“Next Season Market Risk Advisor.”

Purpose:
Help farmers avoid growing the same crop in the same period without checking
expected market pressure.

Inputs:
- Farmer intended crop
- Area or expected quantity
- Expected harvest month/week
- Local crop-pulse declarations
- Historical arrival and price patterns
- Confirmed/preliminary buyer demand
- Crop calendar
- Water availability/soil suitability if available
- Weather risk
- Festival demand

Outputs:
- High/medium/low market saturation risk
- Likely harvest-period price range
- Suggested staggered sowing period
- Alternative crop category suggestions
- Suggested percentage diversification
- Need for pre-booked buyer or FPO linkage
- Market confidence score

Do not force farmers to change crops.
Present advice as decision support:
“High tomato market-pressure risk detected. Consider reducing tomato area,
staggering planting, pre-booking a processor buyer, or diversifying a portion
of land into suitable alternatives.”

Explainable AI Layer:
Every recommendation must include:
1. Recommended action
2. Expected net result
3. Risk level
4. Confidence score
5. Top 3 reasons
6. Data freshness
7. Data source labels
8. Alternative action

Example:
Recommendation: “Join FPO Lot #TOM-W41-A.”
Expected net realization: ₹1,770/quintal.
Risk: Medium.
Confidence: 78%.
Why:
1. Verified processor demand exists for 5 tonnes.
2. Your Grade A tomato matches the buyer’s requirement.
3. Shared pickup reduces transport cost by ₹70/quintal.
Alternative:
“Local mandi sale gives ₹1,690/quintal but has rising arrivals.”

Multilingual, Low-Literacy and Offline-First UX:
Design for rural users with variable digital literacy and intermittent
connectivity.

Requirements:
- English, Marathi, Tamil, and Hindi language selector
- Simple cards with large icons
- Audio/voice input and text-to-speech output where feasible
- Farmer can ask:
  “Where should I sell my tomato?”
  “என் தக்காளியை எங்கே விற்றால் நல்ல நிகர வருமானம் கிடைக்கும்?”
  “माझा टोमॅटो कुठे विकल्यास जास्त निव्वळ उत्पन्न मिळेल?”
- Display simple action cards:
  - Sell Now
  - Wait
  - Join FPO Lot
  - Find Buyer
  - Book Transport
  - Book Storage
  - Check Market Risk
- PWA with local caching
- Store draft forms offline using IndexedDB/local storage
- Sync when connection is restored
- Always show “Last updated” timestamp
- When offline or data is stale, reduce confidence and show safe fallback advice

Offline fallback:
- Cached latest price/arrival records
- Cached crop calendar
- Farmer can submit supply declaration offline
- Queue sync when online
- Rule-based recommendations where ML service is unavailable
- Clear message:
  “Using data last updated on [date/time]. Forecast confidence is reduced.”

Dashboards:

1. Farmer Dashboard:
- Current crop card
- Current price and nearby market prices
- Supply-demand risk meter
- 3/7/14-day price direction
- Best buyer/market recommendation
- Net realization comparison
- FPO aggregation opportunity
- Storage/transport suggestion
- Voice assistant
- Alerts

2. FPO Dashboard:
- Registered farmers
- Supply by crop, grade, village, and harvest week
- Demand by buyer and delivery week
- SDBI heatmap
- Suggested bulk lots
- Buyer matching queue
- Transport route suggestions
- Payment status
- Risk alerts

3. Buyer Dashboard:
- Purchase requirement form
- Matching supply lots
- Quality/grade availability
- Delivery schedule
- Offer/bid screen
- Buyer profile/trust status
- Confirmed orders

4. Admin Dashboard:
- District supply-demand map
- Crop-wise risk heatmap
- Data freshness dashboard
- Unverified buyer queue
- FPO activity
- Market arrivals and price trends
- Dispute overview
- Platform impact metrics

Map and Visualization:
Use Leaflet + OpenStreetMap.

Map layers:
- Mandis/APMCs
- FPO collection centres
- Farmer cluster points, not precise private farm locations by default
- Buyer locations
- Storage facilities
- Transport hubs
- Supply-risk heatmap
- Demand hotspots
- Suggested delivery routes

Privacy:
- Never show individual farmer location publicly.
- Show village/cluster-level aggregated markers.
- Allow exact location only for authorized transaction participants after consent.

UI Pages:
1. Landing page
2. Login/register
3. Farmer onboarding
4. Farmer supply declaration
5. Farmer dashboard
6. Market price and arrival dashboard
7. Supply-demand balance dashboard
8. Buyer demand listing page
9. Buyer registration/profile page
10. FPO manager dashboard
11. FPO bulk-lot builder
12. Smart buyer/market matching page
13. Net-income comparison page
14. Transport booking page
15. Storage booking page
16. Transaction tracking page
17. Payment and dispute page
18. District risk map
19. Admin verification page
20. Data provenance and confidence page
21. Next-season market-risk advisor page

Required Database Design:

TABLE: users
- id
- full_name
- phone
- email
- role
- language
- district
- pincode
- status
- created_at

TABLE: farmer_profiles
- id
- user_id
- fpo_id
- village
- district
- state
- preferred_language
- storage_access
- consent_status
- verification_status

TABLE: fpos
- id
- name
- registration_number
- district
- state
- location
- contact_person
- verification_status
- created_at

TABLE: buyer_profiles
- id
- user_id
- business_name
- buyer_type
- gst_pan_status
- address
- district
- state
- verification_status
- trust_score
- avg_payment_days
- dispute_rate
- created_at

TABLE: farmer_supply_declarations
- id
- farmer_id
- fpo_id
- crop
- variety
- grade
- expected_quantity_min_kg
- expected_quantity_max_kg
- actual_available_quantity_kg
- harvest_start_date
- harvest_end_date
- village
- latitude_approx
- longitude_approx
- storage_available
- urgency
- consent_status
- verification_status
- source_type
- freshness_status
- confidence_score
- created_at
- updated_at

TABLE: buyer_demand_listings
- id
- buyer_id
- crop
- variety
- grade_required
- required_quantity_kg
- fulfilled_quantity_kg
- delivery_start_date
- delivery_end_date
- offered_price_per_quintal
- pickup_available
- payment_days
- location
- status
- verification_status
- created_at

TABLE: market_prices
- id
- date
- state
- district
- market_name
- crop
- variety
- min_price
- max_price
- modal_price
- unit
- source_name
- source_type
- source_updated_at
- confidence_score

TABLE: market_arrivals
- id
- date
- market_name
- crop
- variety
- arrival_quantity
- unit
- source_name
- source_type
- source_updated_at
- confidence_score

TABLE: fpo_bulk_lots
- id
- fpo_id
- crop
- variety
- grade
- total_quantity_kg
- farmer_count
- availability_start_date
- availability_end_date
- cluster_name
- suggested_price
- status
- created_at

TABLE: bulk_lot_members
- id
- bulk_lot_id
- farmer_supply_declaration_id
- allocated_quantity_kg
- consent_status
- quality_status

TABLE: buyer_offers
- id
- buyer_id
- bulk_lot_id
- offered_price
- accepted_quantity_kg
- payment_days
- pickup_date
- offer_status
- created_at

TABLE: transport_options
- id
- provider_id
- vehicle_type
- capacity_kg
- base_rate
- rate_per_km
- available_date
- current_location
- verification_status

TABLE: storage_facilities
- id
- facility_name
- district
- state
- commodity_supported
- available_capacity_kg
- charge_per_kg_per_day
- latitude
- longitude
- verification_status
- updated_at

TABLE: transactions
- id
- farmer_id
- fpo_lot_id
- buyer_id
- crop
- grade
- quantity_kg
- agreed_price
- pickup_date
- delivery_date
- payment_due_date
- payment_status
- transaction_status
- dispute_status

TABLE: price_forecasts
- id
- crop
- market_name
- district
- forecast_date
- target_date
- predicted_low
- predicted_high
- predicted_direction
- confidence_score
- model_name
- top_factors_json
- created_at

TABLE: supply_demand_snapshots
- id
- crop
- variety
- grade
- district_or_cluster
- week
- expected_supply_kg
- confirmed_demand_kg
- estimated_market_absorption_kg
- sd_balance_index
- risk_level
- confidence_score
- top_factors_json
- created_at

TABLE: recommendations
- id
- farmer_id
- crop
- quantity_kg
- action_type
- target_type
- target_id
- estimated_gross_revenue
- estimated_total_cost
- estimated_net_realization
- risk_level
- confidence_score
- reason_1
- reason_2
- reason_3
- alternative_action
- created_at

TABLE: data_provenance
- id
- entity_type
- entity_id
- source_type
- source_name
- freshness_status
- verification_status
- confidence_score
- consent_status
- last_updated_at

API Requirements:

Authentication:
- POST /auth/register
- POST /auth/login
- GET /auth/me

Farmer:
- POST /farmers/supply-declarations
- GET /farmers/supply-declarations
- GET /farmers/dashboard
- GET /farmers/recommendations
- POST /farmers/join-bulk-lot
- POST /farmers/request-transport
- POST /farmers/request-storage

FPO:
- GET /fpo/dashboard
- GET /fpo/supply-clusters
- POST /fpo/bulk-lots
- PATCH /fpo/bulk-lots/{id}
- POST /fpo/bulk-lots/{id}/add-member
- GET /fpo/buyer-matches
- POST /fpo/validate-supply/{id}

Buyer:
- POST /buyers/demand-listings
- GET /buyers/demand-listings
- GET /buyers/matching-lots
- POST /buyers/offers
- PATCH /buyers/offers/{id}
- GET /buyers/profile/trust-score

Market intelligence:
- GET /market/prices
- GET /market/arrivals
- GET /market/forecast
- GET /market/compare-options
- GET /market/supply-demand-balance
- GET /market/risk-map
- GET /market/next-season-advisor

Logistics/storage:
- GET /transport/options
- POST /transport/bookings
- GET /storage/facilities
- POST /storage/bookings

Admin:
- GET /admin/dashboard
- GET /admin/data-provenance
- PATCH /admin/verify-buyer/{id}
- PATCH /admin/verify-fpo/{id}
- GET /admin/disputes

Machine Learning Requirements:
1. Price Forecast Model:
- Train with historical price and arrival data.
- Use time-series validation, never random-only splitting.
- Evaluate MAE, RMSE, MAPE, and directional accuracy.
- Show forecast intervals.
- Save model metadata and model version.

2. Supply-Demand Risk Model:
- Start rule-based using SDBI.
- Add weighted risk factors:
  arrival growth,
  registered supply growth,
  confirmed demand,
  historical seasonal risk,
  weather disruption,
  storage availability,
  buyer demand reliability.
- Output risk: low, medium, high, severe.
- Output confidence based on data coverage/freshness.

3. Recommendation Engine:
- Start transparent weighted scoring, not a black box.
- Combine net realization, buyer trust, payment speed, distance,
  price forecast, spoilage risk, and urgency.
- Return reasons and alternative option.

4. Quality Classifier:
- Optional for MVP.
- Use image upload and simple classifier/API placeholder.
- Must retain human verification requirement.

Data Confidence Model:
Build a confidence-score function:

Data Confidence =
0.35 × Data Freshness
+ 0.25 × Source Reliability
+ 0.20 × Supply Coverage
+ 0.20 × Demand Coverage

Show confidence labels:
- 80–100: High confidence
- 60–79: Medium confidence
- Below 60: Low confidence

Data freshness rules:
- Market data updated today: high freshness
- Market data 1–3 days old: medium freshness
- Older than 3 days: low freshness
- Buyer listing past delivery period: expired
- Farmer harvest declaration not updated for 14 days: needs reconfirmation

Fallback and Failure Handling:
- If live market data fails, show cached data with timestamp.
- If price model fails, use seasonal average/moving average forecast.
- If farmer supply data is missing, use mandi arrivals and historical
  seasonality and reduce confidence.
- If buyer demand is missing, show market-only recommendation and prompt
  FPO to collect demand listings.
- If the internet is unavailable, queue forms locally and sync later.
- If an unverified buyer submits an order, show a caution badge and require
  FPO/admin approval before confirmation.
- Never hide uncertainty. Show missing-data warnings clearly.

Security and Privacy:
- Use role-based access control.
- Protect phone numbers and private details.
- Store consent for farmer supply declarations.
- Show only cluster/village-level farmer data on maps.
- Do not expose individual farmer quantities to unrelated buyers.
- Share specific identity and pickup information only after a farmer/FPO
  accepts a transaction.
- Log verification and payment-status changes.
- Allow a farmer to withdraw a supply listing.
- Use dummy/synthetic personal data for the hackathon demo.

Hackathon MVP Priority:
Must implement:
1. Farmer supply declaration form
2. Buyer demand listing form
3. Market price and arrivals dashboard
4. Supply-Demand Balance Index dashboard
5. Price trend/forecast display
6. Net realization comparison
7. Smart buyer/market recommendation
8. FPO bulk-lot builder
9. Buyer offer flow
10. Data provenance/confidence labels
11. Marathi/Tamil/English text support
12. Offline or cached-data demonstration

Nice-to-have:
1. Voice interface
2. Image-based quality grading
3. Live weather integration
4. Map route optimization
5. WhatsApp/SMS alerts
6. Satellite crop-condition overlay
7. Diffusion-based scenario generation
8. Automated payment status integration

Recommended Technology Stack:
Frontend:
- Next.js or React
- Tailwind CSS
- shadcn/ui or Material UI
- Recharts for charts
- Leaflet + OpenStreetMap for maps
- PWA support and IndexedDB for offline caching

Backend:
- Python FastAPI
- PostgreSQL with PostGIS preferred for geospatial capability
- SQLAlchemy
- Redis optional for queues/caching
- JWT authentication

AI/ML:
- Python
- Pandas, NumPy, scikit-learn
- XGBoost or LightGBM
- Prophet optional
- SHAP or feature-importance explanation
- PyTorch only for optional diffusion/scenario module

Deployment:
- Frontend: Vercel
- Backend: Render/Railway
- Database: Supabase PostgreSQL / Neon / Railway PostgreSQL
- File storage: Supabase Storage or Cloudinary

User Interface Design:
Visual identity:
- Agricultural green, earthy brown, clean white, alert amber/red
- Avoid a complicated enterprise-looking dashboard for farmers
- Use cards, icons, visual risk meter, large buttons, and simple language
- Design separately for farmers and FPO/admin users

Farmer home screen:
- Greeting and current village
- “What do you want to do today?”
- Add My Crop
- Check Best Selling Option
- Join FPO Lot
- Find Buyer
- Book Transport
- Check Price Risk
- Voice help button

Main farmer insight card:
Crop: Tomato, Grade A, 800 kg
Best action: Join FPO processor lot
Expected net income: ₹1,770/quintal
Local mandi alternative: ₹1,690/quintal
Risk: Medium
Confidence: 78%
Reasons:
- Processor has 5-tonne verified demand.
- Shared pickup reduces transport cost.
- Mandi arrivals are rising.

FPO dashboard:
- Crop supply cards
- Buyer demand cards
- Supply-demand heatmap
- Unmatched supply quantity
- Unfulfilled buyer demand
- Suggested lots
- Pending verification
- Payment tracking

Charts:
- Price versus arrivals dual-axis chart
- Supply versus demand stacked bar chart by week
- SDBI risk gauge
- Crop/grade supply heatmap
- Net realization comparison bar chart
- Buyer trust radar/card
- District supply-demand map

Demo Data Requirements:
Generate realistic, internally consistent demo data for:
- One Maharashtra district
- 5 mandis/APMCs
- Tomato, onion, soybean
- 90 days of price and arrival records
- At least 30 farmers across 5 villages
- At least 10 buyers
- At least 5 transport providers
- At least 3 storage facilities
- At least 3 FPOs
- At least 5 weeks of future supply declarations
- At least 5 weeks of buyer demand listings
- At least 3 oversupply cases and 2 shortage cases
- Different buyer trust scores and payment terms
- Grade A/B/C produce examples
- At least one successful FPO bulk lot and one rejected/expired buyer offer
- Data source labels that clearly identify demo/synthetic records

Create these demo scenarios:

Scenario 1: Tomato Oversupply
- Registered expected supply: 42 tonnes
- Confirmed buyer demand + estimated market absorption: 29 tonnes
- SDBI: approximately 1.45
- Rising mandi arrivals and falling price
- Recommend FPO aggregation, processor linkage, Grade A/B separation,
  staggered dispatch, and alternate-market routing

Scenario 2: Onion Demand Opportunity
- Supply: 18 tonnes
- Demand: 30 tonnes
- SDBI: 0.60
- Buyer needs urgent Grade A onion
- Recommend aggregation, price negotiation range, and shared transport

Scenario 3: Soybean Storage Decision
- Current price modest
- Forecast suggests possible increase
- Storage cost and spoilage are low
- Recommend storing only a defined percentage, not all quantity
- Show calculation comparing immediate and delayed net realization

Scenario 4: Unverified Buyer Alert
- Buyer offers high price but has pending verification and long payment terms
- System should warn farmer/FPO and recommend safer verified alternative

Scenario 5: Quality Allocation
- Buyer needs Grade A tomatoes
- Supply has Grade A, B, and C lots
- Route Grade A to premium buyer, Grade B to wholesaler, Grade C to
  processor
- Show different prices and net realization

Success Metrics:
Product impact:
- Number of farmers/FPOs/buyers participating
- Quantity aggregated through FPO lots
- Percentage of supply matched to buyer demand
- Reduction in unmatched supply
- Reduction in post-harvest loss
- Transport cost saved by shared routes
- Average farmer net-realization improvement compared with local-market baseline
- On-time buyer payment rate
- Buyer order fulfilment rate
- Forecast directional accuracy
- Recommendation acceptance rate
- Data freshness and supply-demand coverage

Model metrics:
- MAE
- RMSE
- MAPE
- Directional accuracy
- Prediction-interval coverage
- Risk classification precision/recall where labels become available

Required Presentation Content:
Create a 10-slide pitch deck structure:

1. Problem:
   Agricultural price crashes happen when fragmented farmer supply meets
   unknown/fragmented buyer demand.

2. Gap:
   Current platforms show prices or enable transactions but often do not help
   farmers balance expected local supply, quality, timing, buyer demand,
   transport, storage, and payment risk before selling.

3. Solution:
   KrishiBalance AI: Predict. Balance. Sell Better.

4. How It Works:
   Farmer Supply Pulse + Buyer Demand Pulse + Market Intelligence + SDBI
   Engine + Smart Allocation.

5. Core Innovation:
   Supply-Demand Balance Index and real balancing actions, not only price
   prediction.

6. Technology:
   AI price interval forecast, transparent scoring, geospatial clustering,
   FPO bulk lot matching, PWA/offline architecture.

7. Demo:
   Tomato oversupply case and FPO allocation flow.

8. Impact:
   Higher farmer price realization, reduced waste, stronger FPO bargaining,
   more reliable sourcing for buyers.

9. Feasibility and Data:
   Hybrid public-data + opt-in farmer/FPO + buyer-demand approach with
   source labels and confidence score.

10. Scale:
   Start with one district/three crops, expand through FPOs, APMCs, buyers,
   storage, transport, and authorized government integrations.

Judge Questions and Strong Answers:

Question:
“Where do you get current cultivation data?”

Answer:
“We do not claim access to all private or restricted cultivation records.
KrishiBalance AI uses a hybrid model: public mandi price and arrival data,
opt-in farmer/FPO harvest declarations, buyer demand listings, crop calendars,
weather signals, and optional regional satellite indicators. Every insight
shows data source, freshness, coverage, and confidence.”

Question:
“What makes this AI and not a normal dashboard?”

Answer:
“The AI forecasts price ranges and direction, detects local imbalance by crop,
grade, location, and week, ranks market/buyer/storage options by expected net
income and risk, clusters farmer lots for FPO aggregation, and explains each
recommendation. A transparent rule-based fallback remains available if data
is limited.”

Question:
“How do you prevent buyer fraud?”

Answer:
“Buyers have verification states and a transparent trust score based on
authorized verification workflow, completed orders, payment timeliness,
disputes, and FPO/admin feedback. Unverified buyers cannot be treated as
safe transaction partners merely because they offer a high price.”

Question:
“How does it work without internet?”

Answer:
“The PWA caches latest market data, accepts offline farmer declarations,
queues them for synchronization, and provides rule-based recommendations using
the latest cached data. It always shows the data timestamp and lowers
confidence when information is stale.”

Question:
“How is this different from e-NAM or a mandi app?”

Answer:
“e-NAM and mandi systems are important trading and price-information
infrastructure. KrishiBalance AI is a pre-transaction intelligence and
coordination layer: it creates a localized supply-demand pulse, forecasts
risk, calculates net realization, matches quality-based lots to buyer demand,
supports FPO aggregation, and recommends balancing actions before farmers
make a selling decision.”

Final Desired Output:
Generate:
1. A working responsive frontend.
2. A FastAPI backend with documented APIs.
3. PostgreSQL database schema and seed script.
4. Realistic demo CSV/JSON dataset.
5. ML/notebook or Python training script for baseline price forecast.
6. Rule-based SDBI and recommendation service.
7. FPO aggregation and buyer-matching algorithm.
8. Farmer/FPO/buyer/admin dashboards.
9. Offline-cache demonstration flow.
10. A README with setup steps, assumptions, data limitations, and demo script.
11. A pitch deck outline and 3-minute demo narration.
12. Clear source labels, confidence scores, and disclaimers throughout.

Build the product as a working SIH MVP first. Prioritize end-to-end workflow,
transparent data assumptions, stable demo behavior, and easy explanation over
unnecessary complexity.