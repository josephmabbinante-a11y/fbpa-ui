# FBPA UI - Freight Bill Payment Audit Application

A full-stack freight bill payment audit application built with React, Vite, and Node.js/Express.

## Overview

FBPA UI is a comprehensive freight bill payment audit platform that helps manage invoices, customers, carriers, and rate confirmations. The application features real-time analytics, exception handling, and automated messaging capabilities.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/josephmabbinante-a11y/fbpa-ui.git
   cd fbpa-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following variables:
   ```env
   # Frontend - API URL
   VITE_API_URL=http://localhost:4000
   
   # Backend - Set these in your environment or .env
   MONGODB_URI=mongodb://localhost:27017/fbpa-db
   JWT_SECRET=your_dev_secret_key
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development servers**
   
   Terminal 1 - Start backend:
   ```bash
   npm run server
   ```
   
   Terminal 2 - Start frontend:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/health

### Default Login Credentials

For development:
- Email: `admin@opscale.ai`
- Password: `password123`

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run server` - Start backend API server
- `npm run lint` - Run ESLint

## Project Structure

```
fbpa-ui/
├── src/                    # React frontend source
│   ├── api/               # API client functions
│   ├── components/        # Reusable React components
│   ├── pages/            # Page components
│   └── App.jsx           # Main app component
├── server/                # Node.js/Express backend
│   ├── index.js          # Main server file
│   ├── customers.js      # Customer routes
│   ├── messages.js       # Messaging routes
│   ├── rateLogic.js      # Rate calculation routes
│   └── models.js         # MongoDB models
├── public/               # Static assets
├── dist/                 # Production build output
├── .env.example          # Example environment variables
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
└── render.yml            # Render deployment config
```

## Features

- **Dashboard Analytics** - Real-time KPIs and performance metrics
- **Invoice Management** - Upload, verify, and manage freight invoices
- **Customer Portal** - Customer information and communication
- **Exception Handling** - Track and resolve billing exceptions
- **Rate Logic Tool** - Calculate freight rates with custom logic
- **Carrier Scorecards** - Performance tracking for carriers
- **Automated Messaging** - Email notifications and customer updates
- **EDI Integration** - Connect with EDI systems
- **Secure Authentication** - JWT-based authentication

## Environment Variables

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:4000` |

### Backend (Environment or .env)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `NODE_ENV` | Environment mode | No (defaults to development) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No (defaults to localhost) |
| `SERVE_STATIC` | Serve frontend from backend | No (defaults to false) |
| `PORT` | Server port | No (defaults to 4000) |

## Deployment

This application is configured for deployment on Render with separate frontend and backend services.

### Quick Deploy to Render

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render for the backend
3. Create a new Static Site on Render for the frontend
4. Configure environment variables in Render dashboard
5. Deploy both services

### Detailed Deployment Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive step-by-step deployment instructions, including:
- Environment variables setup
- Render dashboard configuration
- MongoDB setup
- CORS configuration
- Troubleshooting guide
- Production checklist

### Live Demo

🚀 Once deployed, your application will be available at:
- Frontend: `https://your-app-name.onrender.com`
- Backend API: `https://your-backend-name.onrender.com`

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **CORS** - Cross-origin resource sharing

## Development Tips

### Working with the API

The frontend uses a centralized API client (`src/api/client.js`) that handles:
- API URL configuration via `VITE_API_URL`
- Authentication headers
- Error handling
- Mock mode for development

### Proxy Configuration

Vite is configured to proxy `/api` requests to the backend during development. This is configured in `vite.config.js`.

### Mock Mode

The application supports a mock mode for frontend development without a backend. Toggle it in the UI settings or via localStorage:
```javascript
localStorage.setItem('mockMode', 'true');
```

## Security

- **No Hardcoded Credentials** - All sensitive data is in environment variables
- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Configurable origin restrictions
- **Environment Separation** - Different configs for dev/prod

⚠️ **Important:** Never commit `.env` files or expose sensitive credentials. Use `.env.example` as a template.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review existing issues and discussions

## License

This project is private and proprietary.

---

Built with ❤️ using React and Node.js
