# Django DRF + React + XAMPP (MariaDB) Local Setup Guide

I've generated a clean Django project folder with basic DRF configuration, JWT authentication, and Custom User models matching your basic setup.

## 1. Export the Files
Since you want to set this up on your local PC:
1. Click the **gear icon (Settings)** in the top right of this AI Studio interface.
2. Select **Export as ZIP**.
3. Extract the ZIP file in your local `htdocs` or any desired documents folder.

## 2. Set up XAMPP (MariaDB & Apache)
1. Open XAMPP Control Panel.
2. Start **Apache** and **MySQL** (MariaDB).
3. Click the "Admin" button next to MySQL to open **phpMyAdmin** (or go to `http://localhost/phpmyadmin`).
4. Click on **New** in the left sidebar.
5. Create a new database named `django_react_db`.
6. Leave the collation as default.

## 3. Set up the Django Backend
Open a terminal (Command Prompt, PowerShell, or VS Code Terminal) and navigate to the extracted `django_backend` folder.

```bash
# Navigate to the folder you exported
cd path/to/extracted/zip/django_backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies (Rest Framework, SimpleJWT, MySQLclient, CORS)
pip install -r requirements.txt
```

> **Note on `mysqlclient`:** If `pip install mysqlclient` fails on Windows, you may need to install the MariaDB C Connector or use `pip install pymysql` and add `import pymysql; pymysql.install_as_MySQLdb()` to your `manage.py` file.

### Initialize the Database
```bash
# Create the database tables
python manage.py makemigrations api
python manage.py migrate

# Create a Superuser (Admin) account
python manage.py createsuperuser
# Enter: admin@example.com, Admin123 as requested previously

# Start the Django Server
python manage.py runserver
```
Your backend API is now running on `http://127.0.0.1:8000`.

## 5. Running the App
The project is configured to be fully automatic. Just run:
```bash
npm install
npm run dev
```

What this command does:
1. Installs Node.js dependencies.
2. Installs Python dependencies in `django_backend`.
3. Runs Django migrations (using SQLite `db.sqlite3` for portability).
4. Seeds initial users:
   - **Admin**: `admin` / `admin123`
   - **Staff**: `staff` / `staff123`
5. Starts BOTH the React frontend and Django backend.

You can now login to the admin dashboard at `/admin/login` using the credentials above.
