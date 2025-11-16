# Project Sales

Project Sales is a web-based application designed to manage user registration and creation of dedicated 1C database instances. The system allows users to register, open their own database, and interact with it through a React frontend and Django backend for seamless operational management.

## Purpose

Project Sales aims to simplify business operations by providing a user-friendly web interface. Registered users can create new 1C databases, access them via the web, and manage their records efficiently.

## Key Features

- User registration and authentication.
- Each user can create and open their own 1C database instance.
- Full integration with 1C for data management and synchronization.
- React (.tsx) frontend with interactive components.
- Django backend handling business logic and API endpoints.

## Technologies

- Frontend: React (.tsx)
- Backend: Django, Django REST Framework
- Language: TypeScript (frontend), Python (backend)
- Database: 1C, db.sqllite3 
- State management / API calls: Axios or Fetch
- Authentication: JWT or session-based

## Installation (Development)

Follow these steps to set up the project locally. Ensure Node.js, npm, and Python are installed.

1. Clone the repository:

```bash
git clone https://github.com/WhyJamal/project-sales.git
cd project.sales.system
```

2. Install backend dependencies:

```bash
cd backend.base.d
python -m venv env
source env/bin/activate      # Linux / Mac
env\Scriptsctivate         # Windows
pip install -r requirements.txt
```

3. Apply migrations and run backend:

```bash
python manage.py migrate
python manage.py runserver
```

4. Install frontend dependencies:

```bash
cd frontend.base.r
npm install
npm start
```

5. For a production build:

```bash
npm run build 
```

---

## Usage

- Register a new user on the login page.
- After registration, each user can open their own 1C database instance.
- Manage and interact with the database through the web interface.
- Backend synchronizes all operations with 1C to maintain accurate records.

---

## Structure and Modules

- `backend/` — Django backend project and APIs.
- `frontend/` — React (.tsx) frontend.
- Registration module — handles user sign-up and database creation.
- 1C integration module — handles communication and synchronization with 1C databases.

---

## 1C Integration

The system integrates frontend operations with 1C databases to ensure accurate and consistent data. Communication is performed via RESTful HTTP requests.

Key concepts:

- Data exchange via GET/POST requests.
- Automatic database creation and synchronization.
- Error handling and logging to ensure reliability.

Detailed API endpoints, authentication, and field mapping are documented in the integration guide.

---

## Contributing

To contribute:

1. Fork the repository → create a new branch → commit your changes → open a Pull Request.
2. Keep commit messages concise and meaningful (e.g., `Add: registration module` or `Fix: database creation bug`).

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Author & Contact

- **Author:** WhyJamal  
- **Project Name:** Project Sales  
- **Description:** Django + React web application for creating and managing 1C database instances.  
- **Contact:** Add your preferred contact (email, Telegram, or Slack) here.
