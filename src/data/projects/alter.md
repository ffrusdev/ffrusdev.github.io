---
title: "Alter"
role: "Solo developer · design & code"
status: shipped # active = in development, shipped = finished, paused = on hold
section: tools
year: "2026"
summary: "A Windows app that runs separate copies of any app, each with its own sign-in, settings, icon and taskbar button. A second Claude, a work Chrome next to a personal one, two Discord accounts."
tags: ["Windows", "PowerShell", "C#", "WPF"]
order: 1
link: "/downloads/Alter.zip"
linkLabel: "↓ DOWNLOAD ALTER FOR WINDOWS (ZIP, 750 KB)"
gallery:
  - src: "/projects/alter/card.webp"
    caption: "ALTER"
    alt: "The Alter logo, coral ALT letters on a black tile, next to the name Alter and three example copy tiles: CL2, SC and CHW"
---

<img src="/projects/alter/icon.webp" alt="The Alter app icon: coral block letters ALT on a black rounded tile" width="160" height="160">

Alter has its own page: **[ffrusdev.github.io/alter](/alter/)**.

## What it does

Most apps only let you run one copy, signed in to one account. Alter makes as many separate copies as you want. Each copy:

- keeps its own sign-in and settings, in its own data folder
- gets its own name, icon and taskbar button
- has its own Desktop and Start Menu shortcut, so you can pin it

Pick an app, give the copy a name, click **Create copy**. Alter works out how to keep the copy's data apart: Chrome, Edge, Brave and Electron apps like VS Code, Slack, Notion and Claude get their own profile folder; Firefox gets its own profile; other apps get their own AppData folders.

## How it's built

- **Windows PowerShell 5.1**, which ships with every Windows 10 and 11 PC, so there's nothing to install.
- Each copy gets a **tiny C# launcher** that Alter compiles on your own PC with the .NET compiler built into Windows. It starts the app with the copy's settings and gives its windows their own taskbar ID.
- The window is **WPF**, in a dark design with Rubik, Inter and JetBrains Mono.
- It also handles **Microsoft Store apps** (like the Claude desktop app) through their launch aliases, and follows apps that move to a new folder every update (Discord, Slack).

Inspired by Parall on macOS.

## Install

1. Download the zip above and extract it anywhere, for example to Documents.
2. Double-click **Start Alter.cmd**. After the first start, Alter is also in the Start Menu.
3. Windows may warn that the app is from an unknown publisher, because it isn't signed. Click **More info**, then **Run anyway**.

Needs Windows 10 or 11.

## Limits

- Apps with a hard "only one copy" lock (some games, Spotify, many game launchers) still refuse to open twice.
- Copies are separate profiles, not a security sandbox: every copy can still see your files.
