# Error Screen Fix - Frontend

A professional React-based frontend for the Error Screen Fix platform that provides AI-powered error analysis and solutions.

## 🚀 Features

- **Professional UI/UX**: Beautiful, responsive design with modern styling
- **File Upload**: Drag & drop and click upload for error screenshots
- **AI Analysis**: Integration with backend API for error analysis
- **Export Features**: JSON and text export of analysis results
- **Responsive Design**: Works perfectly on mobile and desktop
- **Navigation**: Complete navigation with Home, How it Works, Pricing, Help pages
- **Authentication UI**: Sign-in modal and user management interface

## 🛠️ Tech Stack

- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **shadcn/ui** components

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

Update the API base URL in `src/App.jsx`:

```javascript
const API_BASE_URL = 'your-backend-url-here'
```

## 🌐 Deployment

The app is built as a static React application and can be deployed to:
- Netlify
- Vercel
- Firebase Hosting
- GitHub Pages
- Any static hosting service

## 📱 Usage

1. **Upload**: Drag & drop or click to upload error screenshots
2. **Analyze**: Get instant AI-powered solutions
3. **Export**: Save results in JSON or text format
4. **Share**: Use built-in sharing features

## 🎯 Key Components

- **HomePage**: Landing page with features and call-to-action
- **UploadPage**: File upload and analysis interface
- **Navigation**: Header with responsive mobile menu
- **AuthModal**: Sign-in and registration interface
- **AnalysisResults**: Display of AI analysis results

## 🔗 Backend Integration

This frontend integrates with the Error Screen Fix backend API:
- `POST /api/analyze-error` - Upload and analyze error screenshots
- Authentication endpoints for user management
- Community features for solution sharing

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

