# Task Management UI

A modern, responsive React application for task management built with TypeScript, Tailwind CSS, and Vite.

## Features

- 🚀 **Modern Stack**: React 18, TypeScript, Vite
- 🎨 **Styling**: Tailwind CSS with custom design system
- 🔐 **Authentication**: JWT-based authentication with Zustand state management
- 📱 **Responsive**: Mobile-first design with responsive layouts
- 🧩 **Component Library**: Reusable UI components with consistent design
- 🔍 **Type Safety**: Full TypeScript support with strict type checking
- 🛠 **Developer Experience**: ESLint, Prettier, and hot reload
- 📊 **State Management**: Zustand for lightweight state management
- 🌐 **API Integration**: Axios for HTTP requests with interceptors
- 📝 **Form Handling**: React Hook Form with Zod validation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── forms/          # Form components
│   └── common/         # Common components
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── teams/          # Team management pages
│   ├── projects/       # Project management pages
│   └── tasks/          # Task management pages
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
│   ├── api/            # API client and endpoints
│   └── auth/           # Authentication services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── lib/                # Configuration and setup
```

## Getting Started

### Prerequisites

- Node.js (v14.18.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-management-ui
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts

## Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### State Management
- **Zustand** - Lightweight state management

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### HTTP Client
- **Axios** - HTTP requests

### Routing
- **React Router DOM** - Client-side routing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Design System

The application uses a custom design system built on top of Tailwind CSS with:

- **Color Palette**: Primary, success, warning, error colors with multiple shades
- **Typography**: Inter font family with consistent sizing
- **Spacing**: 4px grid system
- **Components**: Reusable UI components with consistent styling
- **Dark Mode**: Support for light and dark themes

## API Integration

The application integrates with a Spring Boot backend API:

- **Base URL**: Configurable via environment variables
- **Authentication**: JWT tokens with automatic refresh
- **Error Handling**: Global error handling with user-friendly messages
- **Request/Response Interceptors**: Automatic token attachment and error processing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.