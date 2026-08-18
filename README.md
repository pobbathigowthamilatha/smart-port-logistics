# Smart Port Logistics

## AI-Powered Smart Port & Logistics Management System

### 🚀 Live Demo

**[Open Smart Port Logistics](https://smart-port-logistics.onrender.com/)**

The live application is deployed on Render and can be accessed using the link above.

---

## 📌 Project Overview

Smart Port Logistics is a web-based port terminal and logistics management system designed to digitize and simplify port operations.

The system provides centralized management of vessels, cargo, trucks, berths, analytics, operational reports, and an AI-powered operations assistant.

The application combines a Flask backend, SQLite database, web interface, and Groq-powered AI to provide operational insights based on current project data.

---

## 🎯 Problem Statement

Port terminals involve multiple interconnected activities such as vessel arrivals, berth allocation, cargo handling, truck movement, and yard management.

Managing these activities manually can make it difficult to monitor operations, identify delays, and make quick operational decisions.

Smart Port Logistics provides a centralized platform that helps port operators manage and monitor these activities from a single system.

---

## ✨ Key Features

### 🚢 Vessel Management

* Add and view vessel records
* Store IMO numbers
* Manage arrival and departure schedules
* Track cargo capacity
* Assign vessels to berths
* Monitor vessel status

### 📦 Cargo Management

* Register cargo shipments
* Store cargo type and weight
* Manage source and destination
* Assign cargo to vessels
* Assign cargo to yards
* Track cargo status
* Identify delayed or held cargo

### ⚓ Berth Management

* View berth availability
* Assign vessels to berths
* Update vessel arrival and departure schedules
* Track occupied berths
* Track available berths
* Track berths under maintenance

### 🚚 Truck & Gate Operations

* Maintain truck information
* Store driver details
* Track cargo references
* Monitor gate status
* Monitor truck queue status

### 📊 Analytics Dashboard

The analytics dashboard provides operational insights including:

* Cargo volume
* Vessel movement
* Berth utilization
* Yard capacity
* Date-range based analysis

Supported analysis ranges include:

* Today
* Last 7 Days
* Last 15 Days
* Last 30 Days
* August 2026

### 🤖 AI Operations Assistant

The system includes an AI-powered Port Intelligence Agent using the Groq API.

The AI assistant uses current operational information from the SQLite database to answer questions about:

* Vessel status
* Cargo status
* Delayed cargo
* Berth occupancy
* Cargo volumes
* Vessel assignments
* Operational issues
* Recommended actions
* Daily operations summaries
* Performance reports

### 🧠 AI Model

The AI Assistant uses:

**OpenAI GPT-OSS 120B through the Groq API**

The application sends the current port operational context to the AI service so that responses are based on the project's operational data.

### 📄 Operational Reports

The reporting module can:

* Generate customer operation reports
* Store reports in SQLite
* Display generated reports
* Calculate operational metrics
* Generate downloadable PDF reports

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────────┐
                    │      Web Interface      │
                    │     HTML/CSS/JavaScript │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      Flask Backend      │
                    │       REST APIs         │
                    └────────┬───────┬────────┘
                             │       │
                    ┌────────▼───┐   │
                    │   SQLite   │   │
                    │  Database  │   │
                    └────────────┘   │
                                     ▼
                            ┌──────────────────┐
                            │    Groq API      │
                            │ GPT-OSS 120B     │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ AI Operational   │
                            │    Insights      │
                            └──────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python
* Flask

### Database

* SQLite

### Artificial Intelligence

* Groq API
* OpenAI GPT-OSS 120B

### PDF Generation

* ReportLab

### Deployment

* Render

### Version Control

* Git
* GitHub

### Production Server

* Gunicorn

---

## 🗄️ Database Modules

The SQLite database contains operational tables including:

* `Users`
* `Vessels`
* `Cargo`
* `Trucks`
* `Berths`
* `Reports`

---

## 🔌 API Endpoints

### Authentication

```text
POST /login
POST /api/login
POST /api/logout
GET  /logout
```

### Vessel Management

```text
GET  /api/vessels
POST /api/vessels
```

### Cargo Management

```text
GET  /api/cargo
POST /api/cargo
```

### Analytics

```text
GET /api/analytics
```

Example:

```text
/api/analytics?range=last_30_days
```

### AI Assistant

```text
GET  /api/ai/config
POST /api/ai/chat
```

### Reports

```text
GET  /api/reports
POST /api/reports
GET  /api/reports/<report_id>/pdf
```

### Berth Assignment

```text
POST /api/berths/<berth_id>/assign
```

### Database Test

```text
GET /api/test-db
```

---

## 📁 Project Structure

```text
smart-port-logistics/
│
├── app.py
├── init_db.py
├── database.db
├── requirements.txt
├── README.md
│
├── templates/
│   ├── index.html
│   └── login.html
│
└── static/
    ├── css/
    ├── js/
    └── images/
```

> The exact files and folders may vary depending on the current project version.

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pobbathigowthamilatha/smart-port-logistics.git
cd smart-port-logistics
```

### 2. Create a Virtual Environment

For Windows:

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Set the following environment variables:

```text
GROQ_API_KEY=your_groq_api_key
FLASK_SECRET_KEY=your_secret_key
```

**Important:** Never upload API keys, passwords, or other secrets to GitHub.

### 5. Run the Application

```bash
python app.py
```

The application will run locally using Flask.

---

## 🌐 Deployment

The application is deployed as a Python Web Service on Render.

Production server:

```bash
gunicorn app:app
```

The Groq API key is configured through Render Environment Variables and is not stored in the source code.

### Live Application

**[Open Smart Port Logistics](https://smart-port-logistics.onrender.com/)**

---

## 🤖 AI Operational Context

The AI assistant receives operational information from the project database, including:

* Vessel records
* Cargo records
* Truck records
* Berth records
* Vessel assignments
* Berth occupancy
* Cargo delays
* Cargo weights

This allows the AI assistant to provide operational responses based on the project's current data.

---

## 💬 Example AI Queries

Users can ask questions such as:

```text
How many vessels are currently tracked?
```

```text
Show delayed cargo shipments.
```

```text
Which vessel handled the highest cargo volume?
```

```text
Generate today's operations summary.
```

```text
What berths are currently available?
```

```text
Which cargo shipments are on hold?
```

```text
Provide a weekly performance report.
```

---

## 🔐 Security

The project follows basic security practices including:

* Password hashing using Werkzeug
* Parameterized SQLite queries
* Environment variables for API credentials
* API keys excluded from source code
* Session-based authentication

---

## 🚀 Future Enhancements

Possible future improvements include:

* Real-time port sensor integration
* Live vessel tracking using AIS data
* Advanced berth optimization
* AI-based arrival and departure prediction
* Port congestion prediction
* Multi-language voice assistant
* Mobile application
* Advanced role-based access control
* Real-time operational notifications
* Cloud database integration
* Advanced predictive analytics

---

## 🎯 Project Objective

The main objective of Smart Port Logistics is to provide a centralized digital platform that helps port operators:

* Monitor terminal activities
* Manage vessel operations
* Track cargo movement
* Monitor berth utilization
* Manage truck and gate operations
* Identify operational issues
* Generate reports
* Obtain AI-assisted operational insights

The system aims to improve visibility, decision-making, and operational efficiency in port terminal management.

---

## 👩‍💻 Author

**Gowthami Latha Pobbathi**

B.Tech — Artificial Intelligence

---

## 📜 License

This project is developed for academic and educational purposes.
