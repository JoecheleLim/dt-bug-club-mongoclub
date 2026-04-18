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
"Aces" are the top 3 staff members chosen based on the highest hours worked in the previous month.

---

## 🚀 How to Open and Run Locally

If you want to run this project on your own machine, follow these steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 2. Setup
Clone the repository and install the dependencies:
```bash
# Clone the repo
git clone <your-github-repo-url>

# Enter the folder
cd dt-bug-club

# Install dependencies
npm install
````

### 3. Start the Development Server
Run the following command to launch the web interface:
```bash
npm run dev -- --port 3001
```

The site will be available at ```http://localhost:3001```.

### 🛠️ Tech Stack
 - Frontend: React.js + Vite
 - Styling: CSS3
 - Dev Environment: Google Cloud Shell
 - AI Engine: Google Gemini CLI

### 👤 Author
 - Created by: JoecheleLim
 - Assistant: Gemini CLI
