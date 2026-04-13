# Deployment Guide

## Frontend (Vercel)

1. Push code to GitHub
2. Connect Vercel to your repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables from `.env.example`

## Backend (Render)

1. Create a Web Service on Render
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Create MySQL database (Render or external)

## Database Setup

### MySQL on Render
1. Create a MySQL instance
2. Copy connection string to backend env

### Self-hosted MySQL
```bash
# Run MySQL container
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=yourpassword \
  -e MYSQL_DATABASE=student_productivity \
  -p 3306:3306 \
  mysql:8.0
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=10000
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=student_productivity
DB_USER=your-user
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS only
- [ ] Set CORS properly for production domain
- [ ] Use strong database passwords
- [ ] Enable MySQL SSL connections
