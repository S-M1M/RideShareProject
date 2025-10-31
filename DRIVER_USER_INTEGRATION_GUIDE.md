# Driver-User Integration Quick Guide

## 🎯 Overview
Drivers can now see which users need to be picked up, and users only see routes they've subscribed to.

---

## 🚗 FOR DRIVERS

### Dashboard Features

#### 1. Date Selector
```
┌─────────────────────────────────┐
│ Driver Information              │
│ [  2025-11-01  ] ← Select Date  │
└─────────────────────────────────┘
```

#### 2. Tab Navigation
```
┌─────────────────────────────────┐
│ [My Assignments] [Passengers (5)]│
└─────────────────────────────────┘
```

#### 3. Passengers Tab - NEW!
```
╔══════════════════════════════════════════════╗
║ 🗺️  Gulshan to Motijheel                     ║
║ Express route via Tejgaon                    ║
║ 🕒 08:00 AM  👥 3 passenger(s)               ║
╠══════════════════════════════════════════════╣
║ 1. John Doe                     [Monthly]    ║
║    📞 +880123456789                          ║
║    ✉️  john@example.com                      ║
║                                              ║
║    📍 Pickup: Gulshan Circle 1              ║
║       23.7808, 90.4176                       ║
║                                              ║
║    📍 Drop: Motijheel                        ║
║       23.7338, 90.4065                       ║
║    🕒 Schedule: 08:00 AM                     ║
╠══════════════════════════════════════════════╣
║ 2. Jane Smith                   [Weekly]     ║
║    📞 +880987654321                          ║
║    ✉️  jane@example.com                      ║
║    ...                                        ║
╚══════════════════════════════════════════════╝
```

### How to Use

**Step 1**: Login as driver
```
URL: /driver/login
```

**Step 2**: View today's assignments
```
- Automatically shows today
- Or select a different date
```

**Step 3**: Click "Passengers" tab
```
- See all subscribed users
- Grouped by route
- Contact info visible
```

**Step 4**: Contact passengers
```
- Click phone number to call
- See pickup/drop locations
- Check subscription type
```

---

## 👤 FOR USERS

### Map View Changes

#### Before (Mock Data)
```
❌ Saw all 3 routes even without subscription
❌ Couldn't tell which were subscribed
❌ No connection to actual route assignments
```

#### After (Dynamic)
```
✅ Only see subscribed routes
✅ Real-time route information
✅ Linked to driver assignments
✅ Empty state if no subscriptions
```

### Empty State
```
┌─────────────────────────────────┐
│         🚌                      │
│   No Subscribed Routes          │
│                                 │
│ You haven't subscribed to any   │
│ routes yet.                     │
│                                 │
│    [Subscribe to a Route]       │
└─────────────────────────────────┘
```

### With Subscriptions
```
┌─────────────────────────────────┐
│ Route List (Sidebar)            │
├─────────────────────────────────┤
│ ● Gulshan to Motijheel          │
│   8 stops • 45 min • ৳35        │
│                                 │
│ ● Dhanmondi to Uttara           │
│   10 stops • 55 min • ৳45       │
└─────────────────────────────────┘
```

### How to Use

**Step 1**: Subscribe to routes
```
URL: /subscription
- Select route
- Choose time slot
- Pick stops
- Confirm
```

**Step 2**: View your routes
```
URL: /map
- Only YOUR routes appear
- Click to view on map
- See route details
```

---

## 🔄 Complete Flow

### Scenario: New User Subscription

```
1. ADMIN
   │
   ├─ Creates "Gulshan to Motijheel" route
   │  - Start: Gulshan Circle 1
   │  - Stops: [Banani, Mohakhali, ...]
   │  - End: Motijheel
   │
   └─ Assigns to Driver "John" with Vehicle "ABC-123"
      - Date: 2025-11-01
      - Time: 08:00 AM

2. USER "Alice"
   │
   ├─ Visits Subscription page
   │  - Sees "Gulshan to Motijheel" route
   │
   ├─ Subscribes
   │  - Pickup: Gulshan Circle 1
   │  - Drop: Banani
   │  - Plan: Monthly (200 stars)
   │
   └─ Subscription Created
      - preset_route_id: Gulshan to Motijheel
      - active: true
      - stars deducted

3. USER "Alice" visits MapView
   │
   └─ Sees "Gulshan to Motijheel" route
      - Can view on map
      - See all stops
      - Check schedule

4. DRIVER "John" logs in
   │
   ├─ Views Dashboard
   │  - Sees assignment for 08:00 AM
   │
   ├─ Clicks "Passengers" tab
   │
   └─ Sees Alice's details
      - Name: Alice
      - Phone: +880123456789
      - Pickup: Gulshan Circle 1 (23.7808, 90.4176)
      - Drop: Banani (23.7741, 90.4067)
      - Plan: Monthly
```

---

## 📊 API Endpoints

### Driver APIs
```
GET /drivers/passengers?date=2025-11-01
→ Returns passengers for driver's routes

GET /drivers/my-routes
→ Returns driver's assigned routes

GET /drivers/assignments?date=2025-11-01
→ Returns driver's assignments
```

### User APIs
```
GET /users/my-routes
→ Returns user's subscribed routes

POST /subscriptions/create-with-stars
→ Creates subscription

GET /users/routes
→ Returns all available routes (for subscription page)
```

---

## 🎨 UI Components

### Driver Dashboard

**Passengers Tab Layout:**
```
┌─────────────────────────────────────────────────┐
│ [📅 Date Selector]                              │
├─────────────────────────────────────────────────┤
│ [My Assignments] [Passengers (5)] ← Tabs        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ╔═══════════════════════════════════════════╗ │
│ ║ 🗺️ Route Name              🕒 08:00 AM   ║ │
│ ║ Description                👥 3 passengers ║ │
│ ╠═══════════════════════════════════════════╣ │
│ ║ 1. Passenger Name         [Plan Type]     ║ │
│ ║    📞 Phone | ✉️ Email                    ║ │
│ ║    📍 Pickup ↓ Drop                       ║ │
│ ╠═══════════════════════════════════════════╣ │
│ ║ 2. Passenger Name         [Plan Type]     ║ │
│ ║    ...                                    ║ │
│ ╚═══════════════════════════════════════════╝ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### User MapView

**With Subscriptions:**
```
┌────────────┬─────────────────────────────────┐
│ Routes     │ Map Area                        │
│            │                                 │
│ ● Route 1  │   [Interactive Map]             │
│   Info     │   - Markers for stops           │
│            │   - Route line                  │
│ ○ Route 2  │   - Selected stop highlight     │
│   Info     │                                 │
│            │                                 │
│            │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

**No Subscriptions:**
```
┌─────────────────────────────────────────────────┐
│                     🚌                          │
│          No Subscribed Routes                   │
│                                                 │
│  You haven't subscribed to any routes yet.      │
│                                                 │
│        [Subscribe to a Route]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Data Flow

**Driver Passengers Query:**
```
Driver Login
    ↓
GET /drivers/passengers
    ↓
Find DriverAssignments(driver_id)
    ↓
Get presetRoute_ids
    ↓
Find Subscriptions(preset_route_id in [ids])
    ↓
Populate User details
    ↓
Return grouped by route
```

**User Routes Query:**
```
User Login
    ↓
GET /users/my-routes
    ↓
Find Subscriptions(user_id, active=true)
    ↓
Get unique preset_route_ids
    ↓
Populate PresetRoute details
    ↓
Return routes array
```

### Route Matching Logic

```javascript
// Subscription links to PresetRoute
Subscription.preset_route_id === PresetRoute._id

// Assignment also links to PresetRoute
DriverAssignment.presetRoute_id === PresetRoute._id

// Driver sees passenger if:
Subscription.preset_route_id === DriverAssignment.presetRoute_id
AND DriverAssignment.driver_id === current_driver._id
```

---

## 🚦 Status Indicators

### Subscription Status
- ✅ **Active**: end_date >= today
- ❌ **Expired**: end_date < today
- 🔄 **Processing**: Payment pending

### Assignment Status
- 📅 **Scheduled**: Not started
- 🚗 **In Progress**: Driver on route
- ✅ **Completed**: Route finished
- ❌ **Cancelled**: Assignment cancelled

### Plan Types
- 📆 **Daily**: 10 stars
- 📅 **Weekly**: 60 stars
- 📆 **Monthly**: 200 stars

---

## 📱 Mobile Responsive

All features work on mobile:
- Tabs stack vertically
- Contact info clickable
- Maps are touch-friendly
- Cards collapse properly

---

## ⚡ Performance

- Queries optimized with population
- Date filtering on database level
- No N+1 queries
- Efficient route grouping

---

## 🔒 Security

- Driver can only see their passengers
- User can only see their routes
- Auth required for all endpoints
- No data leakage between users

---

**Ready to use!** 🎉
