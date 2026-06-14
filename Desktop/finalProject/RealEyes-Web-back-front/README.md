# RealEyes - Project Setup Guide

RealEyes is a web-based deepfake detection system.
The project contains two main parts:
* `backend` - Flask server for authentication, image upload, VirusTotal checks, metadata extraction, and deepfake model prediction.
* `frontend` - React client for user registration, login, image upload, scan results, and scan history.

## Project Structure

RealEyes-Web-back-front/
│
├── README.md
│
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   └── ...
│
└── frontend/
    ├── package.json
    └── ...
```

## Requirements
Before running the project, make sure you have the following installed:
* Python 3.11
* Node.js
* Git
* VS Code

Important: This project is recommended to run with **Python 3.11**.
Python 3.12 may cause installation issues with TensorFlow.

## Important Note About the Project Path
TensorFlow installation may fail if the project is located inside a very long path.
For example, this path may cause issues:
C:\Users\...\Desktop\finalProject\RealEyes-Web-back-front

It is recommended to move the project to a shorter path, for example:
C:\RealEyes

If you get an error like:
Windows Long Path support is not enabled
move the project to a shorter path and try the installation again.

# Clone the Project from Git
Open VS Code and open a new terminal.
Run:
git clone -b final-website LINK_TO_GITHUB
Replace `LINK_TO_GITHUB` with the actual GitHub repository link.
After the project is cloned, enter the main project folder.
For example:
cd C:\RealEyes

Make sure you can see both folders:
backend
frontend

# Update an Existing Local Project
If the project already exists on your computer, run:
git fetch origin
Switch to the correct branch:
git switch final-website
If this command does not work, run:
git switch -c final-website origin/final-website
Pull the latest code:
git pull origin final-website

# First-Time Installation
After the code is ready on your computer, open two terminals:
* One terminal for the Backend
* One terminal for the Frontend

## Backend Installation
In the first terminal, enter the backend folder:
cd backend
Create a virtual environment using Python 3.11:
py -3.11 -m venv venv

Activate the virtual environment:
.\venv\Scripts\Activate.ps1

If this does not work, try:
.\venv\Scripts\activate

Install the required Python packages:
pip install -r requirements.txt

## Create the Database
The database file is not included in Git, so each user must create it locally.
Make sure you are inside the `backend` folder and that the virtual environment is active.
Run:
$env:FLASK_APP="run.py"
python -m flask db upgrade

If this step is skipped, registration may fail with an error like:
sqlite3.OperationalError: no such table: user

## Run the Backend
After installing the packages and creating the database, run:
python run.py

If everything is working correctly, you should see a message like:
Running on http://127.0.0.1:5000

## Frontend Installation
In the second terminal, enter the frontend folder:
cd frontend

Install the frontend dependencies:
npm install

Run the frontend:
npm run dev

After that, the terminal will show a local URL, usually something like:
http://localhost:3000
Open the URL shown in the frontend terminal.

# Check That the System Works
To make sure everything works correctly, check that:
1. The backend is running without errors.
2. The frontend opens in the browser.
3. User registration works.
4. User login works.
5. Image upload works.
6. The system returns a REAL / FAKE result.

Important: Since the database is not included in Git, there is no predefined user account.
Each user should register a new account locally.

# Running the Project After Initial Setup
After the first-time installation is complete, you only need to run the backend and frontend.
Open two terminals.

## Backend Terminal
cd backend
.\venv\Scripts\Activate.ps1
python run.py

The backend should run on:
http://127.0.0.1:5000

## Frontend Terminal
cd frontend
npm run dev
Open the URL shown in the frontend terminal.

# Common Issues and Solutions
## 1. TensorFlow Installation Fails
Make sure you are using Python 3.11:
py -3.11 --version

If needed, recreate the virtual environment:
py -3.11 -m venv venv

If the error is related to Windows Long Path support, move the project to a shorter path, for example:
C:\RealEyes

Then run the installation again:
pip install -r requirements.txt

## 2. Flask Is Not Recognized in a New Terminal
This usually happens when the virtual environment is not active.
Go to the backend folder and activate it:
.\venv\Scripts\Activate.ps1
Then run:
python run.py

## 3. Registration Fails with Error 500
If registration fails and the terminal shows:
sqlite3.OperationalError: no such table: user
it means the database tables were not created.

Run:
$env:FLASK_APP="run.py"
python -m flask db upgrade

Then run the backend again:
python run.py

## 4. The Website Opens but Cannot Connect to the Server
Make sure both parts are running at the same time:
Backend:
http://127.0.0.1:5000

Frontend:
http://localhost:3000
If only the frontend is running, the website may open, but registration, login, and image upload will not work.

# Summary
The main setup issues are usually:
1. Using Python 3.12 instead of Python 3.11.
2. Keeping the project inside a path that is too long.
3. Missing packages in `requirements.txt`.
4. Not running the database migrations.
5. Opening a new terminal without activating the virtual environment.

After installing the packages, activating the virtual environment, running the migrations, and running both backend and frontend, the system should work correctly.
