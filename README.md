# 🛡️ DT/Bug Club Management System

This is a specialized web application built for the **DT/Bug Club** to automate payroll, calculate club commissions, and identify top performers.

## 🤖 Built with Gemini CLI
This project was developed through an interactive session using **Google Gemini CLI**. The entire architecture—from the payroll logic to the UI design—was architected and debugged using AI-driven development.

---

## 💰 Club Rules & Logic
The system automatically applies the following combined-club rules:

| Category | Base Salary | Club Cut | Rules |
| :--- | :--- | :--- | :--- |
| **Normal Staff** | RM 10/hr | 20% | Standard rate |
| **Ace (Top 3)** | RM 14/hr | 25% | Cut applied after deducting RM 4/hr |
| **Gifts** | RM 12/unit | 10% | Total units received from customers |

### The "Ace" Status
"Aces" are the top 3 staff members chosen based on the highest hours worked in the previous month **within each respective club** (3 for DT and 3 for Bug).

---

## 🚀 How to Open and Run Locally

If you want to run this project on your own machine, follow these steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 2. Setup
Clone the repository and install the dependencies for both the frontend and backend:
```bash
# Clone the repo
git clone https://github.com/JoecheleLim/dt-bug-club.git

# Enter the folder
cd dt-bug-club

# Install all dependencies (Root, Frontend, Backend)
npm install && npm run install:all
```

### 3. Start the Development Server
Run the following command to launch **both** the frontend and the backend simultaneously:
```bash
npm run dev
```

The site will be available at ```http://localhost:5173```.

### 🛠️ Tech Stack
 - Frontend: React.js (TypeScript) + Vite
 - Backend: Express.js + SQLite
 - Styling: Tailwind CSS
 - Dev Environment: Google Cloud Shell
 - AI Engine: Google Gemini CLI

### 👤 Author
 - Created by: [JoecheleLim](https://github.com/JoecheleLim)
 - Assistant: Gemini CLI
