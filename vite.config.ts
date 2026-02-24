import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

/**
 * Vite plugin that acts as a server-side API gateway.
 * Intercepts /api/anthropic/* and /api/openai/* requests,
 * makes the real API call from Node (no CORS), and returns the result.
 */
function apiGatewayPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-gateway',
    configureServer(server) {
      // Anthropic API gateway
      server.middlewares.use('/api/anthropic', async (req, res) => {
        const targetPath = req.url || '/'
        const targetUrl = `https://api.anthropic.com${targetPath}`

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const body = Buffer.concat(chunks).toString()

          const response = await fetch(targetUrl, {
            method: req.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01',
            },
            body: body || undefined,
          })

          const responseText = await response.text()
          res.writeHead(response.status, {
            'Content-Type': response.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(responseText)
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Gateway error', details: String(err) }))
        }
      })

      // OpenAI API gateway
      server.middlewares.use('/api/openai', async (req, res) => {
        const targetPath = req.url || '/'
        const targetUrl = `https://api.openai.com${targetPath}`

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const body = Buffer.concat(chunks).toString()

          const response = await fetch(targetUrl, {
            method: req.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.OPENAI_API_KEY || ''}`,
            },
            body: body || undefined,
          })

          const responseText = await response.text()
          res.writeHead(response.status, {
            'Content-Type': response.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(responseText)
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Gateway error', details: String(err) }))
        }
      })
    },
  }
}

// ─── Auto-versioning from git ────────────────────────────────────────────────

function getGitVersion(): string {
  try {
    const commitCount = execSync('git rev-list --count HEAD').toString().trim()
    const shortHash = execSync('git rev-parse --short HEAD').toString().trim()
    return `1.0.${commitCount}-${shortHash}`
  } catch {
    return '1.0.0-dev'
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appVersion = getGitVersion()

  return {
    plugins: [react(), apiGatewayPlugin(env)],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
