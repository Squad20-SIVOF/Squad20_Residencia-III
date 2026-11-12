import { spawnSync } from 'node:child_process'
import { cpSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const app = process.env.VERCEL_APP || 'gestor'
if (!['gestor', 'motorista'].includes(app)) {
  throw new Error('VERCEL_APP deve ser gestor ou motorista')
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
for (const script of ['typecheck', `build:${app}`]) {
  const result = spawnSync(npm, ['run', script], { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const output = new URL('../dist/vercel/', import.meta.url)
rmSync(output, { recursive: true, force: true })
cpSync(new URL(`../dist/${app}/`, import.meta.url), output, { recursive: true })
console.log(`Aplicativo ${app} preparado em dist/vercel`)
