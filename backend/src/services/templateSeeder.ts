import { FileNode, detectLanguage } from '../models/FileNode';
import { ProjectTemplate } from '../models/Project';
import mongoose from 'mongoose';

interface SeedItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentPath?: string;
  content?: string;
}

export class TemplateSeeder {
  /**
   * Seed virtual file tree for a newly created project
   */
  static async seedStarterFiles(
    projectId: mongoose.Types.ObjectId,
    template: ProjectTemplate,
    userId: string
  ): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const seedItems = this.getTemplateDefinition(template);

    const createdFolders: Record<string, mongoose.Types.ObjectId> = {};
    let fileCount = 0;

    for (const item of seedItems) {
      const parentId = item.parentPath ? createdFolders[item.parentPath] || null : null;
      const content = item.content || '';
      const language = item.type === 'file' ? detectLanguage(item.name) : 'plaintext';
      const size = Buffer.byteLength(content, 'utf8');

      const node = await FileNode.create({
        projectId,
        name: item.name,
        path: item.path,
        type: item.type,
        parentId,
        content,
        language,
        size,
        lastModifiedBy: userObjectId,
      });

      if (item.type === 'folder') {
        createdFolders[item.path] = node._id as mongoose.Types.ObjectId;
      } else {
        fileCount++;
      }
    }

    return fileCount;
  }

  private static getTemplateDefinition(template: ProjectTemplate): SeedItem[] {
    switch (template) {
      case 'react':
        return [
          {
            name: 'index.html',
            path: '/index.html',
            type: 'file',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeSync React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
          },
          {
            name: 'package.json',
            path: '/package.json',
            type: 'file',
            content: JSON.stringify(
              {
                name: 'codesync-react-app',
                version: '1.0.0',
                type: 'module',
                scripts: {
                  dev: 'vite',
                  build: 'vite build',
                },
                dependencies: {
                  react: '^18.3.1',
                  'react-dom': '^18.3.1',
                  'lucide-react': '^0.475.0',
                },
                devDependencies: {
                  '@vitejs/plugin-react': '^4.3.4',
                  vite: '^6.1.0',
                },
              },
              null,
              2
            ),
          },
          {
            name: 'src',
            path: '/src',
            type: 'folder',
          },
          {
            name: 'main.jsx',
            path: '/src/main.jsx',
            parentPath: '/src',
            type: 'file',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          },
          {
            name: 'App.jsx',
            path: '/src/App.jsx',
            parentPath: '/src',
            type: 'file',
            content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app-container">
      <header>
        <h1>⚡ CodeSync AI Live Workspace</h1>
        <p>Edit this file in real-time with your team.</p>
      </header>

      <main>
        <button onClick={() => setCount((prev) => prev + 1)}>
          Count is: {count}
        </button>
      </main>
    </div>
  );
}`,
          },
          {
            name: 'index.css',
            path: '/src/index.css',
            parentPath: '/src',
            type: 'file',
            content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0b0f17;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.app-container {
  text-align: center;
  padding: 2rem;
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.8);
}

button {
  background: linear-gradient(135deg, #d97706, #fbbf24);
  color: #0b0f17;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 1rem;
}`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# React + Vite Collaborative Workspace

Welcome to your **CodeSync AI** real-time project.

### Features
- ⚡ Ultra-fast Vite HMR
- 👥 Zero-latency collaborative editing
- 🤖 Gemini 2.0 AI pair assistant
`,
          },
        ];

      case 'nodejs':
        return [
          {
            name: 'server.js',
            path: '/server.js',
            type: 'file',
            content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from CodeSync AI Node.js Service!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', memory: process.memoryUsage() });
});

app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});`,
          },
          {
            name: 'package.json',
            path: '/package.json',
            type: 'file',
            content: JSON.stringify(
              {
                name: 'codesync-node-service',
                version: '1.0.0',
                main: 'server.js',
                scripts: {
                  start: 'node server.js',
                  dev: 'nodemon server.js',
                },
                dependencies: {
                  express: '^4.21.2',
                },
                devDependencies: {
                  nodemon: '^3.1.9',
                },
              },
              null,
              2
            ),
          },
          {
            name: '.env.example',
            path: '/.env.example',
            type: 'file',
            content: `PORT=3000\nNODE_ENV=development`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# Node.js Backend API Workspace\n\nRun \`npm start\` to launch your Express application.`,
          },
        ];

      case 'python':
        return [
          {
            name: 'main.py',
            path: '/main.py',
            type: 'file',
            content: `"""
CodeSync AI — Python Sandbox Starter
"""
import sys
import time

def solve():
    print(f"Python Runtime: {sys.version.split()[0]}")
    data = [x ** 2 for x in range(10)]
    print(f"Computed squares: {data}")

if __name__ == "__main__":
    solve()
`,
          },
          {
            name: 'requirements.txt',
            path: '/requirements.txt',
            type: 'file',
            content: `# Core Python Dependencies\nrequests>=2.31.0\npytest>=8.0.0\n`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# Python Workspace\n\nExecute \`python main.py\` inside the CodeSync sandbox.`,
          },
        ];

      case 'c':
        return [
          {
            name: 'main.c',
            path: '/main.c',
            type: 'file',
            content: `#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("CodeSync AI — High Performance C Standard (GCC) Sandbox\\n");
    
    int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int n = sizeof(numbers) / sizeof(numbers[0]);
    int sum = 0;
    
    for (int i = 0; i < n; i++) {
        sum += numbers[i];
    }
    
    printf("Sum of elements: %d\\n", sum);
    return 0;
}
`,
          },
          {
            name: 'Makefile',
            path: '/Makefile',
            type: 'file',
            content: `CC = gcc\nCFLAGS = -std=c17 -O2 -Wall\n\nall:\n\t$(CC) $(CFLAGS) main.c -o main\n\nclean:\n\trm -f main\n`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# C Standard Workspace (Default Compiler)\n\nCompile with \`make\` or GCC and execute \`./main\`.`,
          },
        ];

      case 'cpp':
        return [
          {
            name: 'main.cpp',
            path: '/main.cpp',
            type: 'file',
            content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "CodeSync AI — High Performance C++20 Sandbox" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    
    std::cout << "Sum of elements: " << sum << std::endl;
    return 0;
}
`,
          },
          {
            name: 'Makefile',
            path: '/Makefile',
            type: 'file',
            content: `CXX = g++\nCXXFLAGS = -std=c++20 -O2 -Wall\n\nall:\n\t$(CXX) $(CXXFLAGS) main.cpp -o main\n\nclean:\n\trm -f main\n`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# C++ Workspace\n\nCompile with \`make\` and execute \`./main\`.`,
          },
        ];

      case 'go':
        return [
          {
            name: 'main.go',
            path: '/main.go',
            type: 'file',
            content: `package main

import (
\t"fmt"
\t"time"
)

func main() {
\tfmt.Println("CodeSync AI — Go Concurrent Engine")
\tch := make(chan string)

\tgo func() {
\t\ttime.Sleep(100 * time.Millisecond)
\t\tch <- "Goroutine execution completed successfully."
\t}()

\tmsg := <-ch
\tfmt.Println(msg)
}
`,
          },
          {
            name: 'go.mod',
            path: '/go.mod',
            type: 'file',
            content: `module codesync-go-app\n\ngo 1.22\n`,
          },
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# Go Workspace\n\nRun \`go run main.go\` to execute.`,
          },
        ];

      default:
        return [
          {
            name: 'README.md',
            path: '/README.md',
            type: 'file',
            content: `# Blank Workspace\n\nCraft your custom application files and start pairing in real-time.`,
          },
        ];
    }
  }
}
