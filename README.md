# Student Productivity SaaS

A full-stack web application for students to manage tasks, notes, and track productivity with analytics.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL
- **Auth**: JWT + bcrypt

## Project Structure

```
student-productivity-saas/
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── frontend/          # React App
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup
```sql
CREATE DATABASE student_productivity;
```

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env
npm run dev
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

## Features

- [x] User authentication (JWT)
- [x] Task management (CRUD, filtering, priorities)
- [x] Notes system
- [x] Dashboard with analytics
- [x] Responsive design
- [ ] Dark mode

## License

MIT
