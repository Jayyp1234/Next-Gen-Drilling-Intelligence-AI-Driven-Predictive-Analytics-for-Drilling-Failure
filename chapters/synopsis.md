# PROJECT SYNOPSIS

**Title:** Next-Gen Drilling Intelligence: AI-Driven Predictive Analytics for Drilling Failure Prevention, Optimization and Real-Time Alerts

**Student:** Okeke Johnpaul Ebube
**Matric No:** 180808058
**Department:** Petroleum & Gas Engineering, Faculty of Engineering
**University:** University of Lagos
**Supervisor:** Dr Etaje Darlington

---

## 1. Introduction

When oil wells are being drilled, things go wrong — pipes get stuck, drilling fluid leaks into the rock formation, the wellbore walls collapse. These failures are called **drilling failures**, and they are extremely expensive. The industry loses over **$8 billion every year** to time wasted dealing with these problems, known as Non-Productive Time (NPT). A single stuck pipe incident can cost anywhere from $100,000 to $10 million to fix.

The current approach to handling these failures is **reactive** — engineers watch their screens, and when a number goes red, they scramble to respond. By that point, the problem is usually already serious. What if the system could warn them **before** the failure happens?

That is what this project does.

**DrillGuard** is an AI-powered system that predicts drilling failures before they occur and sends real-time alerts to engineers on their computers and phones. Instead of reacting to failures, engineers can now **prevent** them.

---

## 2. The Problem

Five specific problems exist with how drilling failures are currently handled:

1. **Detection is reactive, not predictive.** Engineers only know something is wrong after it has already started happening. By then, there is limited time to respond.

2. **AI models exist but work alone.** Researchers have built machine learning models that can predict stuck pipe or lost circulation individually, but nobody has combined multiple models into one system that covers all major failure types.

3. **Academic models never reach the field.** Papers report impressive accuracy numbers, but those models sit in Jupyter notebooks. Nobody has built the full pipeline — from raw sensor data to an alert on an engineer's phone.

4. **There is no unified risk score.** Different models output different things in different formats. There is no single number that tells an engineer "how bad is it right now?"

5. **Alerts do not reach the right people.** Even when anomalies are detected, there is no automated system to send warnings to the right engineer through the right channel (dashboard, phone, SMS) at the right time.

---

## 3. What DrillGuard Does

DrillGuard is a complete system with three main parts:

### Part 1: Three AI Models Working Together

DrillGuard uses three different machine learning models, each looking at the drilling data from a different angle:

| Model | What It Does | How It Works |
|-------|-------------|--------------|
| **Random Forest** | Checks if current drilling conditions are normal | Learns what "normal" looks like from historical data, then flags when things deviate |
| **LSTM Autoencoder** | Detects unusual patterns over time | A deep learning model that learns normal sequences of sensor readings; when it cannot reconstruct what it sees, something is wrong |
| **Dynamic Time Warping** | Matches current data against known failure signatures | Compares what is happening now to patterns from past failures to see if they look similar |

Each model catches things the others might miss. The Random Forest is good at spotting sudden deviations. The LSTM catches slow, creeping changes. The DTW recognizes patterns that have led to failures before.

### Part 2: Risk Score and Time-to-Impact

The outputs from all three models are combined into a single **Risk Score** from 0 to 100:

| Score | Level | What It Means | What Happens |
|-------|-------|--------------|--------------|
| 0-29 | NORMAL | Everything looks fine | Routine monitoring |
| 30-50 | WATCH | Something unusual detected | Increased monitoring, prepare contingency |
| 51-70 | ELEVATED | Likely developing problem | Active investigation, prepare equipment |
| 71-100 | ACTION | Failure likely imminent | Immediate intervention required |

The system also estimates **how much time is left** before the situation becomes critical (Time-to-Impact), so engineers know if they have 45 minutes or 5 minutes to act.

### Part 3: Real-Time Alerts

When risk goes up, DrillGuard sends alerts through multiple channels:

- **Web Dashboard** — real-time charts, risk gauges, and recommendations on the engineer's computer
- **Mobile App** — push notifications to the engineer's phone, even on the rig floor
- **SMS** — text messages for critical ACTION-level alerts
- **Email** — detailed alert reports for ELEVATED and ACTION levels

The system is smart about alerts — it does not spam. It groups related alerts, suppresses duplicates, and escalates only when the situation worsens.

---

## 4. How It Works (Technical Overview)

### Architecture

DrillGuard is built as a set of independent services (microservices) that communicate with each other:

```
Sensor Data → Ingestion Service → Database → AI Models → Risk Engine → Alert Service → Dashboard/Mobile/SMS
```

**Key technologies:**
- **Backend:** Python, FastAPI
- **AI/ML:** TensorFlow, Scikit-learn
- **Database:** TimescaleDB (for time-series sensor data), PostgreSQL
- **Frontend:** React (web), React Native (mobile)
- **Messaging:** RabbitMQ, Redis
- **Notifications:** Firebase (push), Twilio (SMS), SendGrid (email)

### Data

The system is trained and validated using the **Equinor Volve field dataset** — a publicly available dataset from a real well (Well 31/5-7) in the Norwegian North Sea. This dataset contains 535 MB of logging-while-drilling data recorded at 10-second intervals, including:

- Gamma Ray, Collar RPM, Block Position
- Stick-Slip vibration, Shock vibration
- Downhole pressure and temperature
- Equivalent Circulating Density (ECD)

A secondary dataset from two Nigerian wells (Niger Delta) is used to test whether models trained on North Sea data can generalize to different geological settings.

### Processing Pipeline

1. **Ingest** raw data files (CSV, LAS, DLIS, PDF)
2. **Clean** the data — fill gaps, remove impossible values, classify operational state
3. **Engineer features** — compute rolling averages, rates of change, cross-parameter ratios (~130 features total)
4. **Run all three AI models** on every 10-second data window
5. **Fuse model outputs** into a single 0-100 risk score
6. **Generate alerts** when risk crosses thresholds
7. **Deliver notifications** through the appropriate channels

---

## 5. What Makes This Different

| Existing Approaches | DrillGuard |
|---|---|
| Single ML model for one failure type | Three models combined covering multiple failure types |
| Model accuracy reported in papers | Full working system from data to alert delivery |
| No unified risk metric | Single 0-100 risk score with time-to-impact |
| No alert system | Multi-channel alerts (dashboard, mobile, SMS, email) |
| Desktop-only monitoring | Web dashboard + mobile app for field engineers |
| Reactive threshold alarms | Predictive AI-driven warnings before failure occurs |

---

## 6. Validation Plan

The system is validated by streaming the Volve test data through the full pipeline in real-time simulation. Performance targets:

| Metric | Target |
|--------|--------|
| Detection rate (recall) | > 80% |
| False positive rate | < 15% |
| Alert delivery time | < 10 seconds |
| Prediction lead time | > 30 minutes before failure |

The ensemble (all three models together) is compared against each individual model and against traditional threshold-based detection to prove that the combined approach works better.

---

## 7. Expected Outcomes

1. A working DrillGuard platform that predicts drilling failures using real sensor data
2. Demonstrated improvement of the ensemble approach over individual models
3. A web dashboard and mobile app for real-time monitoring and alerts
4. Validation results showing the system can provide meaningful advance warning of drilling failures
5. A deployable architecture that could be integrated into real drilling operations

---

## 8. Project Significance

- **For the industry:** A tool that can reduce billions in NPT costs and improve drilling safety
- **For academia:** A reference implementation showing how to bridge the gap between ML research and operational deployment in petroleum engineering
- **As a product:** A startup-ready platform with clear commercial value for E&P companies and drilling contractors worldwide
