#  SupportOps – Enterprise IT Help Desk & Ticketing Management System

SupportOps is a full-stack enterprise IT Help Desk and Ticketing Management System developed to streamline IT support operations within an organization. The platform enables employees to submit support requests, allows IT teams to manage and resolve tickets efficiently, and provides administrators with analytics, reporting, and system management tools.

The system was built using **React**, **ASP.NET Core Web API**, **SQL Server**, and **Entity Framework Core**, following a modern client-server architecture with secure authentication and role-based access control.

---

#  Features

##  Authentication & Security

* JWT Authentication
* Role-Based Access Control (RBAC)
* Remember Me
* Forgot Password
* Email Verification Code
* Password Reset
* Secure Password Hashing
* Session Management

---

##  User Roles

### Admin

* Manage users
* Manage categories
* Manage priorities
* Manage system settings
* View reports and analytics
* Monitor all tickets

### Manager

* Assign tickets
* Monitor team workload
* Track ticket progress
* View reports

### IT Support Agent

* View assigned tickets
* Resolve issues
* Add comments
* Update ticket status

### Employee

* Create tickets
* Track ticket progress
* View ticket history
* Receive notifications

---

#  Ticket Management

* Create Ticket
* Edit Ticket
* Delete Ticket
* Assign Ticket
* Ticket History
* Internal Notes
* Comments
* File Attachments
* Status Tracking
* Priority Management
* Category Management
* Search & Filtering

---

#  AI Features

## AI Ticket Assistant

Employees can describe their issue in natural language.

The AI assistant analyzes keywords and automatically suggests:

* Ticket Title
* Ticket Description
* Ticket Category
* Ticket Priority

The user reviews the generated information before manually submitting the ticket.

---

## AI Knowledge Assistant

The AI Knowledge Assistant searches the Knowledge Base for matching articles based on user keywords.

If a solution exists, the system displays:

* Troubleshooting steps
* Related articles
* Suggested solutions

If no solution is found, users can directly create a support ticket from the assistant.

---

#  Notifications

* In-App Notifications
* Email Notifications
* Ticket Assignment Alerts
* Ticket Status Updates
* New Comment Notifications
* Password Reset Emails

---

#  Knowledge Base

* Knowledge Categories
* Troubleshooting Articles
* Related Articles
* Search Functionality
* Popular Topics

---

#  Dashboard & Reports

* Ticket Statistics
* Recent Tickets
* Recent Activities
* Ticket Status Overview
* Priority Distribution
* Category Distribution
* Team Performance
* Analytics Dashboard

---

#  System Settings

* Application Settings
* Email Settings
* Notification Settings
* Session Timeout
* Change Password

---

#  Technologies Used

## Frontend

* React
* JavaScript
* HTML5
* CSS3

## Backend

* ASP.NET Core Web API (.NET)
* C#

## Database

* SQL Server
* Entity Framework Core

## Authentication

* JWT (JSON Web Token)
* Password Hashing

## Email

* Gmail SMTP

## Development Tools

* Visual Studio 2022
* Visual Studio Code
* SQL Server Management Studio (SSMS)
* Swagger
* Git
* GitHub

---

#  Database

Main database tables include:

* Users
* Tickets
* TicketComments
* TicketHistory
* TicketAttachments
* Notifications
* KnowledgeBaseArticles
* KnowledgeBaseCategories
* Categories
* Priorities
* Statuses
* SystemSettings

---

# Project Structure

```
SupportOps
│
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   └── assets
│
├── backend
│   ├── Controllers
│   ├── Models
│   ├── DTOs
│   ├── Services
│   ├── Data
│   └── Migrations
│
└── Database
```

---

# Getting Started

## Backend

```bash
cd backend
dotnet restore
dotnet run
```

Backend runs on:

```
http://localhost:5227
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

#  Screenshots

Included in the project 

# Future Improvements

* Google Sign-In
* Microsoft Azure AD Authentication
* Two-Factor Authentication (2FA)
* Mobile Application
* Real AI Integration using OpenAI API
* SLA Monitoring
* Live Chat Support
* Advanced Analytics
* Dark Mode

---

# Developer

**Daniella Jaber**

Computer Science Student

Full Stack Software Developer

---

#  License

This project was developed for educational and internship purposes.
