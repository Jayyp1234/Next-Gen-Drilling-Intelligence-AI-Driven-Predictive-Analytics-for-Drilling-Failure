# Data Request Checklist for Engineer
**Project:** EDIM Platform - Drilling Intelligence Module  
**Date:** January 28, 2026

---

## Quick Reference: What We Need

### 🔴 CRITICAL (Required for ML Development)

#### 1. Time-Indexed Sensor Data
- [ ] **Format:** CSV, Parquet, or database export
- [ ] **Frequency:** 1-second intervals (10-second acceptable for ROP)
- [ ] **Time Range:** Full well duration (spud to TD)
- [ ] **Required Columns:**
  - [ ] `timestamp` (ISO 8601 format)
  - [ ] `well_id`
  - [ ] `depth_md`, `depth_tvd`
  - [ ] `spp` (standpipe pressure, psi)
  - [ ] `flow_in` (gpm or bbl/min)
  - [ ] `flow_out` (gpm or bbl/min)
  - [ ] `pit_volume` (bbl)
  - [ ] `torque` (ft-lbs or units)
  - [ ] `rpm` (revolutions per minute)
  - [ ] `wob` (weight on bit, klbs)
  - [ ] `rop` (rate of penetration, ft/hr)
- [ ] **Completeness:** >95% (max 5% missing data acceptable)

#### 2. Event Labels
- [ ] **Format:** CSV or Excel spreadsheet
- [ ] **Required Columns:**
  - [ ] `well_id`
  - [ ] `event_type` (stuck_pipe, lost_circulation, kick, equipment_failure, etc.)
  - [ ] `event_start_time` (timestamp)
  - [ ] `event_end_time` (timestamp)
  - [ ] `event_start_depth` (ft MD)
  - [ ] `event_end_depth` (ft MD)
  - [ ] `severity` (minor, major, critical)
  - [ ] `description` (free text)
- [ ] **Event Types Needed:**
  - [ ] Stuck pipe incidents
  - [ ] Lost circulation events
  - [ ] Kicks (gas/fluid influx)
  - [ ] Equipment failures
  - [ ] Well control events

#### 3. Multiple Wells
- [ ] **Minimum:** 5-10 wells from same field/basin
- [ ] **Ideal:** 15-20 wells
- [ ] **Mix Required:**
  - [ ] 60-70% normal wells (no major incidents)
  - [ ] 30-40% problem wells (with documented incidents)
- [ ] **Well List:** Provide spreadsheet with:
  - [ ] Well IDs/names
  - [ ] Spud dates
  - [ ] TD (Total Depth)
  - [ ] Major incidents (yes/no, type)

---

### 🟡 HIGH PRIORITY (Important for Full Capabilities)

#### 4. Daily Drilling Reports (DDR/IADC Format)
- [ ] **24-Hour Activity Breakdown:**
  - [ ] Drilling hours
  - [ ] Tripping hours
  - [ ] Circulating hours
  - [ ] Connection time
  - [ ] NPT (Non-Productive Time) breakdown
- [ ] **NPT Event Details:**
  - [ ] Type (stuck pipe, lost circulation, equipment failure)
  - [ ] Start/end time
  - [ ] Duration
  - [ ] Cause
  - [ ] Resolution

#### 5. Operational Context
- [ ] **Well Plans/Profiles:**
  - [ ] Planned vs. actual well path
  - [ ] Casing points and depths
  - [ ] Mud program (weight, type, additives by section)
  - [ ] BHA configurations (by hole section)
- [ ] **Formation Data:**
  - [ ] Formation tops
  - [ ] Lithology logs
  - [ ] Geological markers

---

### 🟢 NICE TO HAVE (Can Enhance Features)

#### 6. Additional Sensor Data
- [ ] Hookload
- [ ] Block height
- [ ] Mud temperature (flowline, suction)
- [ ] Gamma Ray (from MWD/LWD)
- [ ] Resistivity (from MWD/LWD)

#### 7. Historical Reports
- [ ] Post-well reports
- [ ] Lessons learned documents
- [ ] Incident investigation reports

---

## Data Delivery Options

**Preferred Formats:**
1. **CSV/Parquet files** (easiest to process)
2. **Database export** (PostgreSQL, MySQL dump)
3. **WITSML files** (if available)
4. **Excel spreadsheets** (acceptable, but CSV preferred)

**Delivery Methods:**
- [ ] S3 bucket (AWS)
- [ ] SFTP server
- [ ] Database connection (read-only access)
- [ ] File share/network drive
- [ ] Email/cloud storage (for small files)

---

## Questions to Answer

### Data Availability
1. **Do you have time-indexed sensor data?** (WITSML, CSV exports, database)
   - Answer: _________________

2. **How many wells do you have data for?** (total count, with incidents)
   - Answer: _________________

3. **What format is the sensor data in?** (WITSML, CSV, database, Excel)
   - Answer: _________________

4. **What time resolution is available?** (1-second, 10-second, 1-minute)
   - Answer: _________________

### Event Data
5. **Do you have incident reports or event logs?** (stuck pipe, lost circulation, kicks)
   - Answer: _________________

6. **Are events documented with timestamps and depths?**
   - Answer: _________________

7. **What percentage of wells had major incidents?** (need both normal and problem wells)
   - Answer: _________________

### Operational Context
8. **Do you have well plans/profiles?** (planned vs. actual)
   - Answer: _________________

9. **Are casing points and mud programs documented?**
   - Answer: _________________

10. **Do you have formation tops and lithology logs?**
    - Answer: _________________

### Data Access
11. **How can we access the data?** (S3, SFTP, database connection, file share)
    - Answer: _________________

12. **What's the data volume?** (file sizes, record counts)
    - Answer: _________________

13. **Are there any data privacy/security restrictions?**
    - Answer: _________________

---

## Sample Data Request Email Template

```
Subject: Data Request for EDIM Platform - Drilling Intelligence Module

Dear [Engineer Name],

We're developing an AI-driven drilling intelligence platform and need access to 
historical drilling data for ML model training. 

CRITICAL REQUIREMENTS:
1. Time-indexed sensor data (1-second frequency) for 5-10+ wells
   - SPP, flow rates, pit volume, torque, RPM, WOB, ROP
   - CSV/Parquet format preferred
   
2. Event labels (stuck pipe, lost circulation, kicks, equipment failures)
   - With timestamps and depths
   - CSV/Excel format

3. Multiple wells (5-10 minimum, ideally 15-20)
   - Mix of normal and problem wells

HIGH PRIORITY:
4. Daily Drilling Reports (DDR/IADC format)
5. Well plans, casing points, mud programs
6. Formation tops and lithology

Please see attached checklist for complete requirements.

Questions:
- What format is your sensor data in?
- How many wells do you have available?
- What's the best way to access the data?

Thank you for your support!

Best regards,
[Your Name]
```

---

**Document Version:** 1.0  
**Last Updated:** January 28, 2026
