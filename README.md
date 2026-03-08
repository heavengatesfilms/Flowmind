# 🌀 FlowMind

> A personal productivity web app for tracking habits, managing tasks, timing focus sessions, and chatting with an AI assistant — built to run on iPhone from your home screen.

**Live app:** [heavengatesfilms.github.io/Flowmind](https://heavengatesfilms.github.io/Flowmind)

-----

## ✨ Features

|Feature            |Description                                                               |
|-------------------|--------------------------------------------------------------------------|
|🏠 **Dashboard**    |Daily overview — habits, pending tasks, and focus time at a glance        |
|⭐️ **Habit Tracker**|Add habits with emojis, track daily streaks, and mark completions         |
|📋 **Task Manager** |Priority-based task list with due dates and completion tracking           |
|⏱ **Focus Timer**  |Pomodoro-style timer with Focus, Short Break, and Long Break modes        |
|✨ **AI Assistant** |Powered by Claude — knows your habits and tasks, gives personalised advice|

-----

## 📱 How to Install on iPhone

1. Open [gatesfilms.github.io/Flowmind](https://gatesfilms.github.io/Flowmind) in **Safari**
1. Tap the **Share** button (box with arrow icon at the bottom)
1. Scroll down and tap **Add to Home Screen**
1. Tap **Add** — FlowMind will appear as an app icon on your home screen!

> Works best in Safari on iOS. Must be added via Safari to get the full-screen app experience.

-----

## 🤖 Setting Up the AI Assistant

FlowMind’s AI is powered by [Claude](https://anthropic.com) via the Anthropic API.

1. Create a free account at [console.anthropic.com](https://console.anthropic.com)
1. Go to **API Keys** and generate a new key
1. Open FlowMind → tap the **AI** tab
1. Paste your key into the banner at the top and tap **Save**

Your API key is stored locally on your device only and never shared.

-----

## 👨‍👩‍👧 Multi-User Support

FlowMind stores all data locally in each device’s browser storage. This means:

- **You and your wife each have completely separate data** — habits, tasks, and sessions don’t overlap
- No account or login needed
- Data is private to each device
- Just open the app on each iPhone and add it to the home screen individually

-----

## 🗂 Project Structure

```
Flowmind/
├── index.html      # The entire app — HTML, CSS, and JavaScript in one file
└── README.md       # This file
```

This is an intentionally simple, single-file project. No frameworks, no build tools, no dependencies — just one HTML file that runs anywhere.

-----

## 🛣 Roadmap

Ideas for future versions — tracked as [GitHub Issues](../../issues):

- [ ] Dark mode toggle
- [ ] Weekly habit completion view / calendar
- [ ] Task categories and tags
- [ ] Export data as CSV
- [ ] Custom Pomodoro durations
- [ ] Shared habit challenges between users
- [ ] Offline AI fallback responses

-----

## 📖 What I Learned Building This

This project was built as a learning experience. Key concepts explored:

- **Single-page web apps** using vanilla HTML, CSS, and JavaScript
- **LocalStorage** for saving data in the browser without a backend
- **CSS custom properties** (variables) for consistent theming
- **SVG** for the mascot character and timer ring
- **REST APIs** — connecting to the Anthropic Claude API for AI chat
- **GitHub Pages** for free static site hosting
- **Progressive Web Apps (PWA)** — making a website installable as an iPhone app

-----

## 🎨 Design

Brand colors used throughout the app:

|Color |Hex      |Usage                              |
|------|---------|-----------------------------------|
|Blue  |`#1A73E8`|Primary actions, links, focus timer|
|Teal  |`#66A69A`|Habit completion, short breaks     |
|Purple|`#9C27B0`|Long breaks, accents               |
|Amber |`#FFBB6A`|Warnings, API key banner           |
|Orange|`#FF6B35`|Urgent priority tasks              |

-----

## 📄 License

This project is for personal use. Feel free to fork it and make it your own!

-----

*Built with ❤️ using HTML, CSS, JavaScript, and the [Claude API](https://anthropic.com)*
