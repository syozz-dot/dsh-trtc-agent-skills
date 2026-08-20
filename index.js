// dsh-trtc-agent-skills — bundled skill provider for DeepSeek Harness.
//
// Registers multiple TRTC skills on ctx.skills, mirroring the official
// `@deepseek-ai/dsh-skill-badge` provider pattern. Skills and resources
// live in assets/trtc/ and are synced verbatim from Tencent-RTC/agent-skills
// at a pinned release tag (see scripts/sync-deps.sh).
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { BUNDLED_SKILL_RANK } from '@deepseek-ai/dsh-skill'

const PROVIDER_NAME = 'trtc'
const SKILLS_DIR = fileURLToPath(new URL('./assets/trtc/skills/', import.meta.url))

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const fm = {}
  const lines = match[1].split('\n')
  let currentKey = null
  let currentVal = ''
  let multiline = false

  for (const line of lines) {
    if (multiline) {
      if (line.match(/^\S/) && line.includes(':')) {
        fm[currentKey] = currentVal.trim().replace(/\s+/g, ' ')
        multiline = false
      } else {
        currentVal += ' ' + line.trim()
        continue
      }
    }
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 1).trim()
    if (val === '>' || val === '|') {
      currentKey = key
      currentVal = ''
      multiline = true
      continue
    }
    val = val.replace(/^['"]|['"]$/g, '')
    if (key && val) fm[key] = val
  }
  if (multiline && currentKey) {
    fm[currentKey] = currentVal.trim().replace(/\s+/g, ' ')
  }
  return fm
}

async function discoverSkills() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true })
  const skills = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillMdPath = join(SKILLS_DIR, entry.name, 'SKILL.md')
    try {
      const content = await readFile(skillMdPath, 'utf8')
      const fm = parseFrontmatter(content)
      const name = fm.name || entry.name
      const description = fm.description || `TRTC ${entry.name} skill`

      skills.push({
        name,
        description,
        dirName: entry.name,
        content,
        invocation: { modelInvocable: true, userInvocable: true },
        provider: PROVIDER_NAME,
        source: 'bundled',
        rank: BUNDLED_SKILL_RANK,
        resourceBase: {
          kind: 'directory',
          path: join(SKILLS_DIR, entry.name),
        },
        locator: new URL(`./assets/trtc/skills/${entry.name}/SKILL.md`, import.meta.url),
      })
    } catch {
      // skip directories without SKILL.md
    }
  }

  return skills
}

let _cachedSkills = null

async function getSkills() {
  if (!_cachedSkills) {
    _cachedSkills = await discoverSkills()
  }
  return _cachedSkills
}

const provider = {
  name: PROVIDER_NAME,
  async list() {
    return getSkills()
  },
  async get(candidate) {
    const skills = await getSkills()
    const found = skills.find(s => s.name === candidate.name)
    if (!found) return undefined
    const content = await readFile(fileURLToPath(found.locator), 'utf8')
    return { ...found, content }
  },
}

export const name = 'trtc-agent-skills'
export const inject = ['skills']

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}
