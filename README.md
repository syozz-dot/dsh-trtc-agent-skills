# dsh-trtc-agent-skills

[![npm](https://img.shields.io/npm/v/dsh-trtc-agent-skills)](https://www.npmjs.com/package/dsh-trtc-agent-skills)

DSH skill plugin: TRTC agent skills synced verbatim from [Tencent-RTC/agent-skills](https://github.com/Tencent-RTC/agent-skills).

One install gives your DeepSeek Harness agent the ability to guide TRTC SDK integration across multiple platforms and scenarios.

## Skills included

| Skill | Description |
|-------|-------------|
| `trtc` | Root dispatcher — routes queries to the correct domain skill |
| `trtc-conference` | Video conference integration (Web) |
| `trtc-chat` | IM / Chat integration |
| `trtc-call` | Voice/video call integration (Flutter) |
| `trtc-docs` | TRTC documentation lookup |
| `trtc-push` | TIMPush offline notification integration |
| `trtc-ai-service` | AI Customer Service agent |
| `trtc-ai-oral-coach` | AI Oral Coach agent |
| `trtc-ai-realtime-interpreter` | AI Real-time Interpreter agent |

## Install

```bash
dsh plugin --profile web add dsh-trtc-agent-skills
```

If you encounter pnpm workspace issues, add `-w`:

```bash
dsh plugin --profile web add dsh-trtc-agent-skills -w
```

Restart your profile after installation. The TRTC skills will appear in the skill catalog.

## Prerequisites

- DeepSeek Harness runtime
- Python 3.8+ with PyYAML (`pip install pyyaml`)

## Usage

Simply describe your needs in natural language:

- "帮我在 Vue 项目里接入 TRTC 视频会议"
- "I want to add IM chat to my React app"
- "Flutter 项目接入音视频通话"
- "搭建一个 AI 智能客服"

The root dispatcher (`trtc`) will route your request to the appropriate domain skill and guide you step by step.

## How it works

This plugin registers a bundled skill provider on `ctx.skills` and configures Claude Code-compatible hooks via `dsh-hooks-claude-code` for guardrail enforcement (phase gating, apply verification).

Content is synced verbatim from [Tencent-RTC/agent-skills](https://github.com/Tencent-RTC/agent-skills) at a pinned release tag — zero rewrite, no drift.

## License

MIT
