import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.userId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if GitHub CLI is available
    try {
      await execAsync('gh --version');
    } catch (error) {
      return NextResponse.json({ 
        error: 'GitHub CLI not installed. Please install GitHub CLI (https://cli.github.com/) and authenticate with "gh auth login"' 
      }, { status: 400 });
    }

    // Check if user is authenticated with GitHub CLI
    try {
      await execAsync('gh auth status');
    } catch (error) {
      return NextResponse.json({ 
        error: 'Not authenticated with GitHub CLI. Please run "gh auth login" to authenticate.' 
      }, { status: 400 });
    }

    // Create temporary directory for project files
    const tempDir = join(tmpdir(), `uigen-export-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Extract and write files from project data
      const projectData = project.data as any;
      const files = projectData.files || {};

      // Create basic project structure
      await mkdir(join(tempDir, 'src'), { recursive: true });
      await mkdir(join(tempDir, 'src', 'components'), { recursive: true });

      // Write package.json
      const packageJson = {
        name: project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '1.0.0',
        description: `Generated components from UIGen project: ${project.name}`,
        main: 'index.js',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint'
        },
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          tailwindcss: '^4.0.0'
        }
      };

      await writeFile(
        join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Write README.md
      const readme = `# ${project.name}

Generated components from UIGen

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## Generated Components

This project contains components generated using UIGen.
`;

      await writeFile(join(tempDir, 'README.md'), readme);

      // Write component files
      for (const [filePath, content] of Object.entries(files)) {
        if (typeof content === 'string') {
          const fullPath = join(tempDir, 'src', filePath);
          const dir = join(fullPath, '..');
          await mkdir(dir, { recursive: true });
          await writeFile(fullPath, content);
        }
      }

      // Initialize git repository and create GitHub repo
      const repoName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      process.chdir(tempDir);
      
      // Initialize git
      await execAsync('git init');
      await execAsync('git add .');
      await execAsync('git commit -m "Initial commit from UIGen"');
      
      // Create GitHub repository
      const { stdout } = await execAsync(`gh repo create ${repoName} --public --source . --push`);
      
      // Extract repository URL from output
      const match = stdout.match(/https:\/\/github\.com\/[^\/]+\/[^\/\s]+/);
      const repositoryUrl = match ? match[0] : `https://github.com/${repoName}`;

      return NextResponse.json({ 
        success: true,
        repositoryUrl,
        message: `Successfully exported project to GitHub repository: ${repositoryUrl}`
      });

    } finally {
      // Clean up temporary directory
      try {
        process.chdir('/');
        await rmdir(tempDir, { recursive: true });
      } catch (error) {
        console.error('Failed to clean up temp directory:', error);
      }
    }

  } catch (error) {
    console.error('GitHub export error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to export to GitHub' 
    }, { status: 500 });
  }
}