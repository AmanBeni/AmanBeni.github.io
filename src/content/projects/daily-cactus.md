---
title: 'The Daily Cactus'
emoji: '🌵'
summary: 'A daily newspaper based on my interests and preferred sources. An AI agent handles the data sourcing, editing, and publishing via automated cron tasks.'
tags: ['AI', 'Automation', 'Product']
status: 'live'
order: 1
date: 2025-01-15
images: ['work/daily-cactus.webp']
---

> A daily newspaper based on my interests and preferred sources. An AI agent handles the data sourcing, editing, and publishing via automated cron tasks.

## ⚡ The gist

- What it is: a personal newspaper, built around the things I genuinely want to keep up with, from the sources I trust and prefer.
- What I built: the editorial system, including the sources and rules, and the pipeline that fetches, edits, and publishes the paper on its own.
- The stack: scheduled Claude Code routines, GitHub Actions, a Python RSS pipeline, and a JSON + JavaScript renderer on GitHub Pages.
- The hard part: the editorial selection — choosing the best, most relevant stories from 200+ articles; the agent cannot access the internet from its sandbox; and an earlier version was too expensive to run every day.

## 🔍 The detail

### The problem

- I wanted one daily link. Fresh reporting on my interests, already curated, with no work required from me each morning.
- The obvious version did not work. A scheduled agent runs in a sandbox with no real internet access, so every attempt to fetch a news feed was blocked. For a while, the paper was quietly falling back on web search. That was not what I had set out to build.

### How I built it

- I found the real constraint first. Fetching was not easily possible, so I moved feed collection to GitHub Actions, which has internet access, and had the agent read the digest it produces. Simple, and reliable. The model only edits now.
- I made it cheap enough to run. An earlier version was expensive. I used AI to help think through the problem, then reshaped the pipeline: the model writes a small structured draft, with the chosen stories and copy, while a separate step assembles the finished paper and adds the links.
- I designed out a whole class of error. The model never writes the URLs itself, so it cannot invent one, which it used to do occasionally.
- The editorial side is the part I care about most. I chose sources across a dozen sections and wrote the rules the paper follows: signal over noise, why it matters over what happened, an India lens where it is relevant, and no padding on a thin day just to make the edition look full.

### Under the hood

- The flow: a fetch job turns feeds into a clean digest, the scheduled routine writes a draft, and a publish job assembles the edition and deploys it to GitHub Pages.
- Content lives as JSON. The renderer is written once and does not need to be regenerated, so changing the layout is cheap.
- Past editions are saved with a date picker, so the paper has a proper archive.

### What it adds up to

- It is live, and I read it most mornings. Some days are thin. I would rather have that than a page full of filler.
- The project is a good snapshot of how I work with AI: use it to find a better system, then make the system simple enough to understand and reliable enough to trust. I remain the publisher. The model is the editor.
