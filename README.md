<div align="center">

# 🌌 Aelyra

### A private AI personal assistant that runs entirely on your own computer.

Voice in. Voice out. No cloud. No API keys. Your data stays with you.

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?logo=flask&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-llama3.2%3A3b-1f1f1f)
![SQLite](https://img.shields.io/badge/SQLite-Local%20DB-003B57?logo=sqlite&logoColor=white)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-2ea44f)

</div>

---

## 📑 Table of Contents

- [About](#-about)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Requirements](#-requirements)
- [Quick Start](#-quick-start)
- [Commands You Can Type or Say](#-commands-you-can-type-or-say)
- [Configuration](#%EF%B8%8F-configuration)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Safety](#-safety)
- [Troubleshooting](#-troubleshooting)
- [Limitations](#-limitations)
- [Roadmap Ideas](#-roadmap-ideas)
- [Tech Stack](#-tech-stack)
- [Author](#-author)

---

## ✨ About

Aelyra is a personal assistant built for people who want the convenience of an AI helper without sending their conversations to a third party. It combines a **Flask** backend, a local **Ollama** model (`llama3.2:3b` by default) and a browser interface with **voice input and spoken replies**.

Everything runs on your machine. No cloud AI service or API key is needed.

## 🚀 Features

| | Feature | Details |
|---|---|---|
| 💬 | **Local chat** | Talk to an LLM served by Ollama, fully offline for the AI part |
| 🎙️ | **Voice in, voice out** | Microphone input and text-to-speech replies, with an on/off toggle |
| 🧠 | **Long-term memory** | Remembers your name, preferences and facts you tell it |
| ✅ | **Tasks, notes, reminders** | Stored in a local SQLite database |
| ⏰ | **Reminder alerts** | Due reminders pop up in the chat and are spoken aloud |
| 🔎 | **Web search** | DuckDuckGo results, summarised by the model |
| 🧮 | **Safe calculator** | Parses expressions without `eval` |
| 🖥️ | **Computer tools** | Open a small allowlist of apps and websites, and read files inside the project folder |
| 🎛️ | **Options panel** | Quick access to memory, tasks, notes, reminders, dashboard and more |

## 🔧 How It Works

```
┌────────────────────────┐        ┌──────────────────────────┐        ┌──────────────┐
│  Browser (Chrome/Edge) │  HTTP  │      Flask backend       │  HTTP  │    Ollama    │
│  Chat UI, voice input, │ ─────▶ │  Intent routing, tools,  │ ─────▶ │ llama3.2:3b  │
│  TTS, reminder alerts  │ ◀───── │  memory, Ollama client   │ ◀───── │  (local LLM) │
└────────────────────────┘        └────────────┬─────────────┘        └──────────────┘
                                               │
                                        ┌──────▼──────┐
                                        │  SQLite DB  │
                                        │  aelyra.db  │
                                        └─────────────┘
```

1. You type or speak a message in the browser.
2. The Flask backend checks whether it is a command (task, note, reminder, calculator, search, file read, app launch) or ordinary chat.
3. Commands are handled by built-in tools and stored in SQLite. Chat is sent to your local Ollama model along with relevant memories.
4. The reply is shown in the chat and, if enabled, spoken aloud.

## 📋 Requirements

- **Python** 3.9 or newer
- **[Ollama](https://ollama.com)** installed and running
- **Google Chrome or Microsoft Edge** (needed for voice input)

## ⚡ Quick Start

**1. Install the Python packages**

```bash
pip install -r requirements.txt
```

**2. Download the model**

```bash
ollama pull llama3.2:3b
```

**3. Start Ollama** (skip this if it already runs in the background)

```bash
ollama serve
```

**4. Start Aelyra**

```bash
python app.py
```

**5. Open** <http://127.0.0.1:5000> in Chrome or Edge.

> [!IMPORTANT]
> Always use the Flask address above. Opening `index.html` directly, or through VS Code Live Server, will not work because the page needs the Flask backend.

## 🗣️ Commands You Can Type or Say

| What you want | Example |
| --- | --- |
| Chat | `Explain what a REST API is` |
| Save a memory | `My name is Sam`, `I like football`, `Remember that my exam is on Friday` |
| Add a task | `Add task: finish resume` |
| Complete a task | `Complete task 1` |
| Add a note | `Add note: idea for project` |
| Set a reminder | `Remind me to stretch in 10 minutes`, `Remind me to call mom tomorrow at 5pm` |
| Show saved items | `Show my tasks`, `notes`, `reminders`, `memories` |
| Calculate | `Calculate 2^3 + 10` |
| Search the web | `Search the web for latest Python version` |
| Open an app | `Open calculator`, `Open notepad`, `Open paint`, `Open explorer`, `Open terminal` |
| Open a website | `Open https://www.google.com` |
| Read a project file | `Read file app.py` |
| Computer info | `System info` |

**Supported reminder times:** `in 10 minutes`, `in 2 hours`, `at 5pm`, `at 17:30`, `today 6pm`, `tomorrow 9am`.

**Readable file types:** TXT, MD, PY, JS, HTML, CSS, JSON, CSV, XML, YAML, PDF, DOCX and XLSX.

## ⚙️ Configuration

All environment variables are optional. Set them before running `python app.py`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AELYRA_MODEL` | `llama3.2:3b` | Ollama model to use |
| `AELYRA_OLLAMA_URL` | `http://localhost:11434/api/chat` | Ollama chat endpoint |
| `AELYRA_NUM_CTX` | `8192` | Context window size sent to Ollama |
| `AELYRA_DEBUG` | `1` | Set to `0` to turn Flask debug mode off |

**Windows (PowerShell)**

```powershell
$env:AELYRA_MODEL = "llama3.2:1b"
python app.py
```

**macOS / Linux**

```bash
AELYRA_MODEL=llama3.2:1b python app.py
```

## 📁 Project Structure

```
AI Personal Assistant/
├── app.py              # Flask backend, tools, memory, Ollama client
├── requirements.txt    # Python dependencies
├── aelyra.db           # SQLite database (created automatically)
├── templates/
│   └── index.html      # Page layout
└── static/
    ├── style.css       # Theme and styling
    └── script.js       # Chat, voice, options panel, reminders
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Web interface |
| `POST` | `/chat` | Send a message (`{"message": "..."}`) |
| `POST` | `/clear` | Clear the conversation (memories are kept) |
| `GET` | `/api/dashboard` | Memories, tasks, notes, reminders and model |
| `GET`, `DELETE` | `/api/memories` | List or clear memories |
| `GET` | `/api/tasks` | List tasks |
| `POST` | `/api/tasks/<id>/done` | Mark a task done |
| `GET` | `/api/notes` | List notes |
| `GET` | `/api/reminders` | List reminders |
| `GET` | `/api/reminders/due` | Return due reminders (each is delivered once) |
| `GET` | `/api/health` | Flask and Ollama status |

**Example**

```bash
curl -X POST http://127.0.0.1:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Add task: finish resume"}'
```

## 🛡️ Safety

- File reading is limited to the project folder.
- Only a fixed allowlist of apps can be opened.
- Only `http` and `https` links can be opened.
- The calculator parses expressions safely and never uses `eval`.
- Web search results and file text are passed to the model as untrusted data, not as instructions.

## 🩺 Troubleshooting

| Problem | Fix |
| --- | --- |
| "I can't connect to Ollama" | Start Ollama (`ollama serve`) and check that the model is installed with `ollama list` |
| "model not found" | Run `ollama pull llama3.2:3b` |
| Replies are slow | Use a smaller model (for example `llama3.2:1b`), or close other heavy programs |
| Microphone does not work | Use Chrome or Edge, allow microphone access, and check your internet connection (voice recognition needs it) |
| Reminder did not alert | Use a supported time format, and keep the Aelyra page open in a browser tab |
| Page loads without styling | Make sure `style.css` and `script.js` are inside the `static/` folder |
| Database errors after an update | Delete `aelyra.db` and restart. Aelyra also archives old tables automatically as `*_legacy_<timestamp>` |

You can also check `http://127.0.0.1:5000/api/health` to see whether Flask and Ollama are both reachable.

## ⚠️ Limitations

- Reminders only alert while the Aelyra page is open in a browser.
- Conversation history is shared by all open tabs and keeps only the most recent messages.
- Web search depends on DuckDuckGo's public HTML page, which may change or rate-limit.
- Voice recognition in Chrome and Edge uses the browser's speech service, which needs an internet connection.
- A small local model can make mistakes, so check important answers.

## 🗺️ Roadmap Ideas

- [ ] Background reminders that alert even when the page is closed
- [ ] Separate conversation history per browser tab or session
- [ ] Offline speech recognition
- [ ] Model picker in the options panel
- [ ] Export and import for memories, notes and tasks

## 🧰 Tech Stack

**Python** · **Flask** · **SQLite** · **Ollama** (`llama3.2:3b`) · **Requests** · **BeautifulSoup** · **HTML** · **CSS** · **JavaScript** (Web Speech API)

## 👤 Author

**Vanamala Jayasurya**

- Portfolio: [jayasuryaportfilio.vercel.app](https://jayasuryaportfilio.vercel.app)
- LinkedIn: [vanamala-jayasurya](https://linkedin.com/in/vanamala-jayasurya-5b1138324)

---

<div align="center">

If Aelyra is useful to you, consider giving the repo a ⭐

</div>
