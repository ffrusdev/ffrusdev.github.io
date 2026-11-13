---
title: "Alter"
role: "Solo developer · design & code"
status: shipped # active = in development, shipped = finished, paused = on hold
section: tools
year: "2026"
summary: "An app for Windows and Linux that runs separate copies of any app, each with its own sign-in, settings, icon and taskbar button. A second Claude, a work Chrome next to a personal one, two Discord accounts."
tags: ["Windows", "Linux", "PowerShell", "C#", "WPF", "Python"]
order: 1
link: "/alter/"
linkLabel: "↓ DOWNLOAD ALTER (WINDOWS & LINUX)"
gallery:
  - src: "/projects/alter/card.webp"
    caption: "ALTER"
    alt: "The Alter logo, coral ALT letters on a black tile, next to the name Alter and three example copy tiles: CL2, SC and CHW"
---

<img src="/projects/alter/icon.webp" alt="The Alter app icon: coral block letters ALT on a black rounded tile" width="160" height="160">

Alter has its own page, with downloads for Windows and Linux: **[ffrusdev.github.io/alter](/alter/)**. The source is on [GitHub](https://github.com/ffrusdev/alter).

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
- **Alter for Linux** is a separate command-line tool: one Python 3 script that gives each copy its own data folder and app-menu entry, and handles Flatpak apps too.
- Every release is **built and tested on real Windows and Linux machines** by a GitHub Actions workflow, including two Chrome copies running side by side.

Inspired by Parall on macOS.

## Install

Downloads and install steps for both systems are on **[Alter's page](/alter/#install)**.

- **Windows:** extract Alter.zip and double-click **Alter.exe**. Windows may warn that the app isn't signed: click **More info**, then **Run anyway**.
- **Linux:** extract alter-linux.tar.gz, run `./install.sh`, then `alter new "Chrome Work" --app google-chrome`.

## Limits

- Apps with a hard "only one copy" lock (some games, Spotify, many game launchers) still refuse to open twice.
- Copies are separate profiles, not a security sandbox: every copy can still see your files.
