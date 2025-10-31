# Stars Currency System Documentation

## Overview
The Stars currency system is a virtual currency that users can purchase and use to buy subscriptions instead of real money. This provides a flexible payment system with daily, weekly, and monthly subscription options.

## Features Implemented

### 1. Backend Models

#### User Model (`backend/models/User.js`)
- Added `stars` field (Number, default: 0, min: 0)
- Tracks each user's current stars balance

#### StarTransaction Model (`backend/models/StarTransaction.js`)
- **Fields:**
  - `user_id`: Reference to User
  - `type`: Enum ['purchase', 'spend', 'refund']
  - `amount`: Number of stars in transaction
  - `description`: Transaction description
  - `relatedSubscription`: Optional reference to Subscription
  - `balanceAfter`: User's balance after transaction
  - `createdAt`: Timestamp

#### Subscription Model (`backend/models/Subscription.js`)
- Added `starsCost`: Stars required (Number, required, default: 0)
- Added `refunded`: Boolean flag for refund status
- Added `refundAmount`: Stars refunded (Number, default: 0)
- Added `refundedAt`: Refund timestamp

### 2. Backend API Endpoints

#### User Stars Endpoints (`backend/routes/users.js`)
- **POST /users/stars/buy**
  - Purchase stars (no payment integration for now)
  - Request: `{ amount: number }`
  - Creates StarTransaction record
  - Updates user's stars balance

- **GET /users/stars/balance**
  - Get current stars balance
  - Returns: `{ stars: number }`

- **GET /users/stars/transactions**
  - Get user's transaction history
  - Returns array of transactions with related subscriptions

#### Subscription Endpoints (`backend/routes/subscriptions.js`)
- **POST /subscriptions/purchase**
  - Purchase subscription with stars
  - Request: `{ driver_assignment_id, pickup_stop_id, drop_stop_id, plan_type }`
  - Plan types: 'daily' (10 stars), 'weekly' (60 stars), 'monthly' (200 stars)
  - Validates stars balance
  - Checks vehicle capacity
  - Deducts stars and creates subscription
  - Creates StarTransaction record

- **POST /subscriptions/:id/refund**
  - Refund subscription (50% stars back)
  - Validates subscription ownership and status
  - Returns 50% of stars cost
  - Marks subscription as refunded
  - Creates refund StarTransaction

#### Admin Stars Economy Endpoint (`backend/routes/admin.js`)
- **GET /admin/stars-economy**
  - Returns comprehensive stars economy data:
    - Total stars in circulation (all user balances)
    - Total stars purchased
    - Total stars spent
    - Total stars refunded
    - Active subscriptions by plan type
    - Recent star transactions (last 20)

### 3. Frontend Pages

#### BuyStars Page (`src/pages/user/BuyStars.jsx`)
- **Star Packages:**
  - Starter Pack: 50 stars
  - Basic Pack: 100 stars
  - Premium Pack: 250 stars
  - Mega Pack: 500 stars
  - Ultimate Pack: 1000 stars

- **Features:**
  - Display current stars balance with gradient card
  - Grid of star packages with one-click purchase
  - Transaction history table with:
    - Date
    - Type (purchase/spend/refund)
    - Description
    - Amount (with +/- indicators)
    - Balance after transaction
  - Color-coded transaction types

#### Updated Subscription Page (`src/pages/user/Subscription.jsx`)
- **New Features:**
  - Stars balance display at top of confirmation step
  - "Buy Stars" quick link
  - Plan selection cards now show stars cost:
    - Daily: ⭐ 10 stars (1 day)
    - Weekly: ⭐ 60 stars (7 days) - 14% discount
    - Monthly: ⭐ 200 stars (30 days) - 33% discount
  - Insufficient stars warning message
  - Submit button shows stars cost and disables if insufficient balance
  - Auto-refresh stars balance on page load

#### Updated Finance Page (`src/pages/admin/Finance.jsx`)
- **Stars Economy Section:**
  - Purple gradient card with 4 metrics:
    - Stars in circulation
    - Total purchased
    - Total spent
    - Total refunded
  
- **Subscription Revenue by Plan Type:**
  - Shows active subscriptions count per plan
  - Total stars revenue per plan type
  
- **Recent Star Transactions Table:**
  - User name
  - Transaction type (colored badges)
  - Amount with +/- indicators
  - Description
  - Balance after
  - Date/time

#### Updated Dashboard (`src/pages/user/Dashboard.jsx`)
- Added "⭐ Buy Stars" quick action button
- Changed grid from 2 to 3 columns
- Purple gradient styling for stars button

### 4. Pricing Structure

#### Star Costs
```
Daily:    10 stars  = 1 day
Weekly:   60 stars  = 7 days  (14% discount vs daily)
Monthly:  200 stars = 30 days (33% discount vs daily)
```

#### Refund Policy
- Users get 50% of stars back when refunding subscription
- Only active subscriptions can be refunded
- Subscriptions cannot be refunded twice
- Refund transaction is recorded in history

### 5. Routes Updated

#### App.jsx Routes
- Added `/buy-stars` route (protected, user role only)
- Imports `BuyStars` component

### 6. User Flow

#### Purchasing Stars
1. User goes to Dashboard
2. Clicks "⭐ Buy Stars" quick action
3. Selects a star package (50-1000 stars)
4. Stars are instantly added (no payment for now)
5. Transaction appears in history

#### Buying Subscription
1. User navigates through subscription flow (route, time, stops)
2. On confirmation step, sees stars balance and plan costs
3. Selects plan type (daily/weekly/monthly)
4. If insufficient stars, warning appears and button is disabled
5. If sufficient, clicks subscribe button
6. Stars are deducted, subscription is created
7. Transaction recorded in history

#### Refunding Subscription
1. Admin can refund via API (frontend UI pending)
2. User receives 50% of stars back
3. Subscription marked as refunded
4. Cannot be refunded again

### 7. Admin Monitoring

Admins can track the stars economy through the Finance page:
- Monitor total stars in user accounts
- Track purchase patterns
- See spending on different subscription types
- View all recent transactions
- Analyze refund patterns

## Future Enhancements (Not Implemented)

1. **Payment Integration**
   - Connect star purchases to real payment gateway
   - Set real prices for star packages

2. **Subscription Management UI**
   - User interface to view and refund own subscriptions
   - "My Subscriptions" page with refund button

3. **Star Promotions**
   - Bonus stars on large purchases
   - Promotional offers and discounts
   - Referral rewards

4. **Analytics Dashboard**
   - Charts for stars purchase trends
   - Revenue forecasting
   - User spending patterns

5. **Notifications**
   - Low balance warnings
   - Purchase confirmations
   - Refund notifications

## Database Migrations Needed

When deploying to production, ensure:
1. Existing User documents get `stars: 0` field
2. Existing Subscription documents get `starsCost: 0`, `refunded: false`, `refundAmount: 0`
3. StarTransaction collection is created

## Testing Checklist

- [ ] User can purchase stars
- [ ] Stars balance updates correctly
- [ ] Transaction history shows all operations
- [ ] Subscription purchase with sufficient stars works
- [ ] Subscription purchase with insufficient stars is blocked
- [ ] Refund returns 50% stars
- [ ] Refund cannot be processed twice
- [ ] Admin can view stars economy statistics
- [ ] All price tiers calculate correctly
- [ ] Transaction records are accurate
