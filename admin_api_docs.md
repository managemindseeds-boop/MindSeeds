# MindSeed Staff Attendance — Admin API Documentation

**Base URL:** `https://staffattendance-api.onrender.com`

This is a Node.js + Express + MongoDB backend for a BLE-based staff attendance system. The admin panel needs to consume these API endpoints to manage staff and view attendance data.

---

## Database Info

- **MongoDB:** Shared `Mindseed` database on MongoDB Atlas
- **Collections:** `staffmembers` (staff data), `staffattendances` (attendance records)

---

## 1. Dashboard — Full Overview

### `GET /api/admin/dashboard`

Returns complete stats, all staff with their attendance for a given date, and available branches.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | No | Date in `YYYY-MM-DD` format. Defaults to today. |
| `branch` | `string` | No | Filter by branch name (single branch). |

**Example Request:**
```
GET /api/admin/dashboard?date=2026-03-29&branch=Mawaddah
```

**Response:**
```json
{
  "date": "2026-03-29",
  "branch": "Mawaddah",
  "serverTime": "29/3/2026, 1:30:00 pm",
  "branches": ["Mawaddah", "E Ward", "Aghadi", "Gordon Hall"],
  "stats": {
    "totalStaff": 15,
    "present": 10,
    "absent": 5,
    "activeNow": 3,
    "completed": 5,
    "cronClosed": 2,
    "autoClosed": 0
  },
  "staff": [
    {
      "name": "Ravi Kumar",
      "phone": "9876543210",
      "branch": ["Mawaddah", "Gordon Hall"],
      "employeeId": "MS-0001",
      "deviceRegistered": true,
      "todayStatus": "active",
      "totalHoursToday": "5h 45m",
      "sessions": [
        {
          "checkIn": "29/3/2026, 9:15:00 am",
          "checkOut": null,
          "duration": "ongoing",
          "status": "checked-in",
          "lastSeen": "29/3/2026, 1:28:00 pm"
        }
      ]
    },
    {
      "name": "Priya Sharma",
      "phone": "9876543211",
      "branch": ["E Ward"],
      "employeeId": "MS-0002",
      "deviceRegistered": false,
      "todayStatus": "absent",
      "totalHoursToday": "0h 0m",
      "sessions": []
    }
  ]
}
```

**Field Details:**

| Field | Values | Description |
|-------|--------|-------------|
| `todayStatus` | `"active"` / `"present"` / `"absent"` | `active` = currently checked-in, `present` = has sessions today but checked-out, `absent` = no session today |
| `status` (session) | `"checked-in"` / `"completed"` / `"auto-closed"` / `"cron-closed"` | `checked-in` = live now, `completed` = normal checkout, `auto-closed` = app auto-checkout (beacon lost), `cron-closed` = server closed (no heartbeat for 1hr) |
| `branch` | `string[]` | Array of branch names (staff can belong to multiple branches) |

---

## 2. Add Staff

### `POST /api/admin/add-staff`

Admin creates a new staff member who can then login via the mobile app.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Full name of staff |
| `phone` | `string` | ✅ | Phone number (used as login username, must be unique) |
| `password` | `string` | ✅ | Login password (gets bcrypt hashed automatically) |
| `branch` | `string[]` or `string` | ✅ | Branch(es) assigned. Can be single string `"Mawaddah"` or array `["Mawaddah", "Gordon Hall"]` |

**Example Request:**
```json
POST /api/admin/add-staff
Content-Type: application/json

{
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "password": "secure123",
  "branch": ["Mawaddah", "Gordon Hall"]
}
```

**Success Response (201):**
```json
{
  "message": "Staff added ✅",
  "staff": {
    "id": "69c8d6527607689b",
    "name": "Ravi Kumar",
    "phone": "9876543210",
    "branch": ["Mawaddah", "Gordon Hall"],
    "employeeId": "MS-0003"
  }
}
```

**Error Responses:**
- `400` — `{ "message": "name, phone, password, branch are required" }`
- `400` — `{ "message": "Phone already registered" }`

> **Note:** `employeeId` is auto-generated as `MS-XXXX` format.

---

## 3. List All Staff (Full Details)

### `GET /api/admin/staff`

Returns all staff members with complete details including device info and history.

**Example Request:**
```
GET /api/admin/staff
```

**Response:**
```json
{
  "total": 3,
  "staff": [
    {
      "id": "69c8d6527607689b",
      "name": "Ravi Kumar",
      "phone": "9876543210",
      "branch": ["Mawaddah", "Gordon Hall"],
      "employeeId": "MS-0001",
      "isActive": true,
      "registeredDeviceId": "FLUTTER-1774766842035",
      "previousDevices": [
        {
          "deviceId": "FLUTTER-1774500000000",
          "replacedAt": "27/3/2026, 10:30:00 am"
        }
      ],
      "createdAt": "29/3/2026, 12:35:53 pm",
      "updatedAt": "29/3/2026, 1:10:00 pm"
    }
  ]
}
```

**Field Details:**

| Field | Description |
|-------|-------------|
| `isActive` | Whether staff account is active (can be deactivated by admin) |
| `registeredDeviceId` | The device currently registered for this staff (auto-set on first login from app) |
| `previousDevices` | History of previously used devices (tracked when staff switches phone) |
| `createdAt` | Account creation timestamp (IST) |
| `updatedAt` | Last update timestamp (IST) |

---

## 4. Update Staff

### `PUT /api/admin/staff/:id`

Update staff name, phone, branch, or active status.

**URL Params:**

| Param | Description |
|-------|-------------|
| `:id` | MongoDB ObjectId of the staff member |

**Request Body (JSON) — all fields optional:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | New name |
| `phone` | `string` | New phone number |
| `branch` | `string[]` or `string` | New branch(es) |
| `isActive` | `boolean` | `true` to activate, `false` to deactivate |

**Example Request:**
```json
PUT /api/admin/staff/69c8d6527607689b
Content-Type: application/json

{
  "branch": ["Mawaddah", "E Ward", "Aghadi"],
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Updated ✅",
  "staff": {
    "_id": "69c8d6527607689b",
    "name": "Ravi Kumar",
    "phone": "9876543210",
    "branch": ["Mawaddah", "E Ward", "Aghadi"],
    "isActive": true,
    "employeeId": "MS-0001"
  }
}
```

**Error:** `404` — `{ "message": "Staff not found" }`

---

## 5. Delete Staff

### `DELETE /api/admin/staff/:id`

Permanently remove a staff member.

**URL Params:**

| Param | Description |
|-------|-------------|
| `:id` | MongoDB ObjectId of the staff member |

**Example Request:**
```
DELETE /api/admin/staff/69c8d6527607689b
```

**Response:**
```json
{
  "message": "Ravi Kumar removed ✅"
}
```

**Error:** `404` — `{ "message": "Staff not found" }`

---

## 6. Other Utility Endpoints

### `GET /` — Health Check
```json
{ "message": "Staff Attendance API Running" }
```

### `GET /api/test-cron` — View Open Sessions (dry run)
Shows all open sessions and which ones the cron would auto-close. Does NOT close anything.

### `GET /api/run-cron` — Force Close Dead Sessions
Actually closes sessions with no heartbeat for 1+ hour.

### `GET /api/fix-indexes` — One-Time Index Cleanup
Drops old conflicting indexes from the attendances collection. Run once if there are index conflicts.

---

## Branch Names (Currently in use)

These are the branches from the MindSeed organization:
- **Mawaddah**
- **E Ward**
- **Aghadi**
- **Gordon Hall**

---

## Admin Panel Features Needed

The admin panel should support:

1. **Dashboard** — Today's overview with stats (present/absent/active), filterable by date and branch
2. **Staff Management** — Add/Edit/Delete staff, assign multiple branches, view device info
3. **Attendance Table** — Date-wise attendance records with check-in/out times, duration, status
4. **Branch Filter** — Filter everything by branch
5. **Export** — CSV/Excel export of attendance data
6. **Real-time Status** — Show who is currently active (checked-in) vs absent

---

## Authentication Note

Currently these admin endpoints have **NO authentication**. The admin panel should be deployed as a separate app with its own login. Consider adding admin auth middleware later for production security.
