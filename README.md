# LYDO Connect — Youth Engagement Management System

A modern web application for the Municipality of San Mateo, Rizal to centralize youth programs, events, and scholarships.

## Features

- **Programs Management**: Browse and manage youth development programs
- **Events Calendar**: View and register for community events
- **Scholarships Portal**: Access scholarship opportunities and application processes
- **User Authentication**: Secure sign-in and registration system
- **Responsive Design**: Works seamlessly across all devices

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **Routing**: React Router DOM
- **State Management**: TanStack Query for data fetching
- **Build Tool**: Vite
- **Development**: SWC for fast compilation

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd youth-connect-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:vercel` - Build optimized for Vercel deployment
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Vercel Deployment

This project is optimized for Vercel deployment:

1. **Deploy to Vercel**: Click the button below to deploy directly to Vercel
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/youth-connect-hub)

2. **Manual Deployment**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy to Vercel
   vercel
   
   # Deploy to production
   vercel --prod
   ```

3. **Environment Variables**: Configure any required environment variables in the Vercel dashboard under Settings > Environment Variables.

**Vercel Configuration**:
- Uses `vercel.json` for routing and build configuration
- Optimized build settings in `vite.config.ts`
- Automatic React Router support with proper fallback routing

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/          # Utility functions
└── App.tsx       # Main application component
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.