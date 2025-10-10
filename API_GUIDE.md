# Bathing Waters API Guide

## 🌊 About

Retrieve information about 4,352 bathing sites in Sweden from the Swedish Agency for Marine and Water Management API.

**Base URL:** `http://localhost:3000/api`

---

## 📡 Endpoints

### 1. Health Check
```
GET /api/health
```
Check if the external API is accessible.

---

### 2. Get All Bathing Sites
```
GET /api/bathing-waters
```
Returns all active bathing sites (~4,352 sites).

---

### 3. Get Specific Site
```
GET /api/bathing-waters/:id
```
Get detailed information about a specific site.

**ID Format:** `SE[A-Z0-9]{4}[0-9]{12}`  
**Example:** `SE0441264000000306`

---

### 4. Get Site Profile
```
GET /api/bathing-waters/:id/profile
```
Get complete profile including season, classifications, and pollution sources.

---

### 5. Get Monitoring Results
```
GET /api/bathing-waters/:id/results
```
Get water quality analysis results (bacteria, algae, temperature).

---

### 6. Get Temperature Forecasts
```
GET /api/forecasts?bathingWaterId=...&municName=...
```
Get water temperature forecasts. Optional filters: `bathingWaterId`, `municId`, `municName`.

---

## 💻 Usage Example

```javascript
const service = require('./services/bathingWatersService');

// Get all sites
const sites = await service.getAllBathingWaters();

// Get specific site
const site = await service.getBathingWaterById('SE0441264000000306');

// Get profile
const profile = await service.getBathingWaterProfile('SE0441264000000306');

// Filter by city
const filtered = sites.watersAndAdvisories.filter(
  item => item.bathingWater.municipality.name === 'Stockholm'
);
```

---

## 📊 Data Reference

**Water Types:**
- `Hav`: Sea/Ocean
- `Sjö`: Lake  
- `Vattendrag`: Watercourse

**Quality Classifications:**
- `Utmärkt kvalitet`: Excellent
- `God kvalitet`: Good
- `Tillfredsställande kvalitet`: Satisfactory
- `Dålig kvalitet`: Poor

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Server runs on port defined in `.env` file.

---

## ⚠️ Important

- **Rate Limit:** 1000 requests/minute
- **Production API:** Using production URL (test API has errors)
- **Documentation:** https://www.havochvatten.se/data-kartor-och-rapporter/data-och-statistik/data-och-apier.html
