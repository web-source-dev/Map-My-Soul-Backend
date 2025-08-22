# Map My Soul Backend

This is the backend API for the Map My Soul spiritual wellness marketplace.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

1. Copy the environment example file:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your configuration values (see Environment Variables section below)

3. Generate a secure JWT secret:
   ```bash
   node scripts/generate-secret.js
   ```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Set `MONGODB_URI=mongodb://localhost:27017/mapmysoul` in your `.env`

#### Option B: MongoDB Atlas (Recommended for Production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Set `MONGODB_URI=your-atlas-connection-string` in your `.env`

### 4. Email Configuration

For Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password
3. Set `EMAIL_USER=your-email@gmail.com`
4. Set `EMAIL_PASSWORD=your-app-password`

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `EMAIL_SERVICE` | Email service provider | No | gmail |
| `EMAIL_USER` | Email account username | Yes | - |
| `EMAIL_PASSWORD` | Email account password | Yes | - |
| `FRONTEND_URL` | Frontend application URL | No | http://localhost:3000 |
| `SUPPORT_EMAIL` | Support email address | No | support@mapmysoul.com |
| `NODE_ENV` | Node environment | No | development |

## 📧 Email Templates

The application includes three email templates:
- **Welcome Email**: Sent to new users upon registration
- **Password Reset**: Sent when users request password reset
- **Email Verification**: Sent for email verification (if implemented)

Templates are located in `emailTemplates/` directory.

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (user/admin)
- Secure password reset tokens
- Email verification system

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify` - Verify JWT token

### Health Check
- `GET /api/health` - Server health status

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure production MongoDB instance
4. Set up proper email service credentials
5. Update `FRONTEND_URL` to production domain
6. Enable HTTPS
7. Set up environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
