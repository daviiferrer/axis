# ÁXIS API Documentation

**Base URL**: `http://localhost:8000/api/v1`

## Overview
The ÁXIS API manages backend logic for the SaaS platform, including analytics, WhatsApp automation (WAHA), and agent orchestration.

## Authentication
Most endpoints rely on Supabase Auth. Include the JWT in the header:
```http
Authorization: Bearer <YOUR_SUPABASE_ACCESS_TOKEN>
```

---

## 1. System & Health

### Check Health status
**GET** `/health`

Returns the current status of the API and database connections.

**Response**
```json
{
  "status": "online",
  "uptime": 120.4,
  "service": "axis-backend"
}
```

---

## 2. Analytics

### Get Dashboard Stats
**GET** `/analytics/dashboard`

Returns high-level metrics for the user's dashboard (leads, conversions, active agents).

**Response**
```json
{
  "stats": {
    "total_leads": 1240,
    "active_agents": 3,
    "messages_sent": 45020,
    "roi": "310%"
  },
  "recent_activity": [...]
}
```

**Common Errors**
- `401 Unauthorized`: Missing or invalid token.
- `500 Internal Server Error`: Database connection failure.

---

## 3. Agents

### List Agents
**GET** `/agents`

Returns a list of all agents configured for the current account.
