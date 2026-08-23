---
title: 'Second Brain | My AI Chief of Staff'
emoji: '🧠'
summary: 'An AI chief of staff I built on top of two years of journals, notes, learnings and todos. Sensitive data runs offline on my laptop; frontier models do the execution. It helps me get work done quickly and keeps me on track.'
# 20 Aug 2026 (queue r3): tile bullets, replacing the one-line summary on the card.
bullets:
  - 'Built locally on top of two years of notes, learnings and todos from my Notion.'
  - 'Sensitive data runs offline on my laptop; execution is done by frontier models with improved context. Executes tasks from my to-do list, saving 1-2 hrs/day.'
tags: ['AI', 'Automation']
status: 'live'
order: 3
date: 2025-06-01
images: ['work/second-brain-1.webp', 'work/second-brain-2.webp']
---

> An AI chief of staff I built on top of two years of journals, notes, learnings and todos. Sensitive data runs offline on my laptop and the execution is done by frontier models. It helps me get work done quickly and keeps me on track.

## ⚡ The gist

- What it is: a second brain that coaches and advises me from my own notes, rather than acting like a generic chatbot.
- What I built: a suite of Claude Code commands, a local search layer over my journals, and memory that updates itself.
- The stack: Obsidian, Claude Code, local embeddings through Ollama, MCP, and a little Python running on a schedule.
- The hard part: keeping it private and cheap, while letting memory update itself without becoming inconsistent.

## 🔍 The detail

### The problem

- Two years of journals, notes and decisions were sitting in a folder, mostly unused.
- I also wanted to fix a habit: I would resolve something clearly one night, then lose the thread by the next morning.
- Generic AI could not help much. It did not know my context, and I was not going to put years of private writing into someone else's cloud.

### How I built it (five choices, each fixing one problem)

- Substrate. Local Markdown in Obsidian, so I own the data, it stays portable, and there is no lock-in.
- Retrieval. Search over my own journals with local embeddings through Ollama, so the advice is grounded in what I actually wrote. Nothing leaves the machine.
- Interface. A Claude Code command suite instead of a chat box: reflection over my history, morning and evening continuity, weekly review, briefings, and memory consolidation. It has a job to do, rather than just being there to talk.
- Automation. A two-way Notion sync and a weekly job that re-indexes the system and checks the health of the link graph. The brain can maintain itself.
- Memory. Single-writer ownership by type, so each kind of fact has one owner and self-updating memory does not start contradicting itself.

### Under the hood

- Local semantic search runs over the full journal history, so answers point back to real entries rather than made-up advice.
- Commands cover reflection, continuity through resume and checkout, briefings posted to Notion, weekly review, memory consolidation, and building the link graph.
- One rule I kept coming back to: do the cheapest thing that works, and only read what the task needs. Loading the whole vault every time gets expensive quickly.

### What it adds up to

- This is a daily driver: an AI advisor over two years of journals, fully local, with near-zero running cost and memory that becomes more useful over time.
- It is also the clearest example of the kind of AI work I want to do: build systems around real context, understand where they can fail, and make deliberate trade-offs around cost, privacy, and memory consistency.
