# Bookmark Tool

A modern, responsive bookmark management application built with React and TypeScript.

## Introduction

Bookmark Tool is a web-based application designed to help you organize, manage, and import/export your bookmarks efficiently. With a clean, responsive interface, it provides an intuitive way to browse and organize your bookmark collection, supporting hierarchical folder structures and import/export functionality for Edge browser bookmark files.

## Why This Project

Managing bookmarks across different browsers and devices can be challenging. Many users accumulate a large number of bookmarks over time but lack effective tools to organize them. This project was created to provide:

- A unified interface for managing bookmarks across different sources
- Support for hierarchical folder structures similar to traditional bookmark managers
- Import/export functionality for easy migration between browsers
- A modern, responsive design that works well on both desktop and mobile devices
- Pin important bookmarks for quick access

## Features

- **Hierarchical Folder Management**: Organize bookmarks into nested folder structures
- **Responsive Design**: Clean, modern interface that adapts to different screen sizes
- **Pin Important Bookmarks**: Highlight and prioritize your most important bookmarks
- **Import/Export**: Import bookmarks from Edge browser HTML exports and export your collection
- **Add/Edit/Delete**: Full CRUD operations for managing bookmarks
- **URL-based Navigation**: Shareable deep links to specific folders via URL

## How to Run

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Environment Setup

The project uses Vite as the build tool. No additional environment variables are required for basic usage.

## How to Contribute

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/qiuziz/bookmark.git
   ```
3. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes following the project's coding conventions
5. Test your changes thoroughly
6. Submit a pull request

### Coding Conventions

- Follow TypeScript best practices
- Use functional components with React hooks
- Maintain consistent naming conventions (kebab-case for files)
- Add appropriate type definitions for all new components and functions
- Write meaningful commit messages
- Ensure all tests pass before submitting

### Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Browser and operating system information
- Relevant screenshots or error messages

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contact

For questions or suggestions, please open an issue on GitHub.
