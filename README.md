# Summit Customer Compass

A modern web application for efficient contact categorization and management, built with React, FastAPI, and PostgreSQL.

## Features

- Contact upload via CSV files
- Automated contact categorization
- Real-time categorization progress tracking
- Filterable and paginated contact list
- Modern, responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Sonner for toast notifications

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL database
- Async batch processing
- RESTful API design

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/summit-customer-compass.git
cd summit-customer-compass
```

2. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Frontend Setup:
```bash
cd frontend
npm install
```

4. Environment Configuration:

Create `.env` files in both backend and frontend directories:

Backend (.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/customer_compass
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Frontend (.env):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development

### Project Structure

```
summit-customer-compass/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   ├── package.json
│   └── .env
└── README.md
```

### Available Scripts

Frontend:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

Backend:
- `uvicorn app.main:app --reload` - Start development server
- `pytest` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
