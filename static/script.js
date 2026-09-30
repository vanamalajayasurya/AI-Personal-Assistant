const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const footerText = document.getElementById("footerText");

let busy = false;


/* =================================
   BUSY STATE (blocks double sends)
================================= */

function setBusy(active) {
    busy = active;
    input.disabled = active;
    sendButton.disabled = active;
}


/* =================================
   SEND MESSAGE
================================= */

async function sendMessage() {

    if (busy) {
        return;
    }

    const message = input.value.trim();

    if (!message) {
        return;
    }

    addMessage(message, "user");

    input.value = "";

    setBusy(true);

    const thinking = addMessage("Thinking...", "assistant");

    const controller = new AbortController();
    const timer = setTimeout(function () {
        controller.abort();
    }, 200000);

    let reply = "";
    let succeeded = false;

    try {

        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            }),
            signal: controller.signal
        });

        let data = {};

        try {
            data = await response.json();
        } catch (parseError) {
            data = {};
        }

        if (!response.ok && !data.response) {
            throw new Error("Server returned " + response.status);
        }

        reply = data.response || "I didn't get a response.";
        succeeded = response.ok;

    } catch (error) {

        console.error("Chat error:", error);

        reply = error.name === "AbortError"
            ? "That took too long. Please try again."
            : "I couldn't reach the Aelyra server. " +
              "Make sure app.py is running at http://127.0.0.1:5000.";

    } finally {

        clearTimeout(timer);
        thinking.remove();
        setBusy(false);

    }

    addMessage(reply, "assistant");

    if (succeeded) {
        speak(reply);
    }
}


/* =================================
   ADD MESSAGE
================================= */

function addMessage(text, type) {

    const message = document.createElement("div");

    message.className = `message ${type}`;

    const content = document.createElement("div");

    content.className = "message-content";

    if (type === "assistant") {

        renderMarkdown(content, text);

    } else {

        content.textContent = text;

    }

    message.appendChild(content);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

    return message;
}


/* =================================
   RENDER MODEL TEXT
   (safe: uses textContent only)
================================= */

function renderMarkdown(element, text) {

    String(text)
        .split(/(```[\s\S]*?```)/g)
        .forEach(function (segment) {

            if (
                segment.length >= 6 &&
                segment.startsWith("```") &&
                segment.endsWith("```")
            ) {

                const pre = document.createElement("pre");
                const code = document.createElement("code");

                code.textContent = segment
                    .slice(3, -3)
                    .replace(/^[a-zA-Z0-9_+-]*\n/, "")
                    .replace(/\n$/, "");

                pre.appendChild(code);
                element.appendChild(pre);

            } else {

                renderInline(element, segment);

            }

        });
}


function renderInline(element, text) {

    const cleaned = text
        .replace(/^[ \t]*[*-][ \t]+/gm, "\u2022 ")
        .replace(/^#{1,6}[ \t]*/gm, "");

    cleaned
        .split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g)
        .forEach(function (part) {

            if (/^\*\*[^*]+\*\*$/.test(part)) {

                const bold = document.createElement("strong");
                bold.textContent = part.slice(2, -2);
                element.appendChild(bold);

            } else if (/^`[^`\n]+`$/.test(part)) {

                const code = document.createElement("code");
                code.textContent = part.slice(1, -1);
                element.appendChild(code);

            } else {

                // Single asterisks are kept, so "5 * 5" stays "5 * 5".
                element.appendChild(
                    document.createTextNode(part.replace(/\*\*/g, ""))
                );

            }

        });
}


function cleanForSpeech(text) {

    return text
        .replace(/```[\s\S]*?```/g, " code block. ")
        .replace(/https?:\/\/\S+/g, " link ")
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}[ \t]*/gm, "")
        .replace(/`/g, "")
        .replace(/^[ \t]*[\u2022*-][ \t]+/gm, "");

}


/* =================================
   SEND BUTTON
================================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* =================================
   ENTER KEY
================================= */

input.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =================================
   VOICE RECOGNITION
================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isListening = false;


function setListening(active) {

    isListening = active;

    micButton.classList.toggle(
        "listening",
        active
    );

    micButton.textContent =
        active ? "🔴" : "🎤";

}


function micError(text) {

    addMessage(
        text,
        "assistant"
    );

}


if (!SpeechRecognition) {

    micButton.addEventListener(
        "click",
        function () {

            micError(
                "Voice input isn't supported in this browser. " +
                "Please open Aelyra in Google Chrome or Microsoft Edge."
            );

        }
    );

} else {

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;


    recognition.onstart = function () {
        setListening(true);
    };


    recognition.onend = function () {
        setListening(false);
    };


    recognition.onresult = function (event) {

        const text = event.results[0][0].transcript.trim();

        if (!text) {
            return;
        }

        input.value = text;

        sendMessage();

    };


    recognition.onerror = function (event) {

        console.log("Voice error:", event.error);

        setListening(false);

        switch (event.error) {

            case "not-allowed":
            case "service-not-allowed":

                micError(
                    "Microphone access is blocked. " +
                    "Allow microphone access and refresh the page."
                );

                break;

            case "no-speech":

                micError(
                    "I didn't hear anything. " +
                    "Tap the mic and try again."
                );

                break;

            case "audio-capture":

                micError(
                    "No microphone was found. " +
                    "Check your microphone."
                );

                break;

            case "network":

                micError(
                    "Voice recognition needs an internet connection."
                );

                break;

            case "aborted":

                break;

            default:

                micError(
                    "Voice input error: " +
                    event.error
                );

        }

    };


    micButton.addEventListener(
        "click",
        function () {

            if (isListening) {

                recognition.stop();

                return;

            }

            if (window.speechSynthesis) {

                window.speechSynthesis.cancel();

            }

            try {

                recognition.start();

            } catch (error) {

                console.error(
                    "Could not start recognition:",
                    error
                );

                setListening(false);

            }

        }
    );

}


/* =================================
   TEXT TO SPEECH
================================= */

let aelyraVoice = null;

let voiceMuted = false;

try {
    voiceMuted = localStorage.getItem("aelyraMuted") === "1";
} catch (error) {
    voiceMuted = false;
}


const PREFERRED_VOICES = [
    "Microsoft Aria",
    "Microsoft Jenny",
    "Microsoft Sonia",
    "Microsoft Ava",
    "Google UK English Female",
    "Google US English",
    "Microsoft Zira",
    "Microsoft Hazel",
    "Samantha"
];


function pickVoice() {

    if (!window.speechSynthesis) {
        return;
    }

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
        return;
    }

    const english = voices.filter(function (voice) {

        return (
            voice.lang &&
            voice.lang.toLowerCase().startsWith("en")
        );

    });

    for (const name of PREFERRED_VOICES) {

        const match = english.find(function (voice) {
            return voice.name.includes(name);
        });

        if (match) {

            aelyraVoice = match;

            return;

        }

    }

    aelyraVoice = english[0] || null;

}


if (window.speechSynthesis) {

    pickVoice();

    window.speechSynthesis.onvoiceschanged = pickVoice;

}


function speak(text) {

    if (!window.speechSynthesis || voiceMuted || !text) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
        cleanForSpeech(text)
    );

    if (aelyraVoice) {

        speech.voice = aelyraVoice;

    }

    speech.lang = "en-US";
    speech.pitch = 1.1;
    speech.rate = 1.05;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);

}


/* =========================================================
   AELYRA OPTIONS
========================================================= */

const optionsButton = document.getElementById("optionsButton");
const optionsPanel = document.getElementById("optionsPanel");
const optionsBackdrop = document.getElementById("optionsBackdrop");
const closeOptions = document.getElementById("closeOptions");
const toolResult = document.getElementById("toolResult");


// The closed panel must not be reachable with the Tab key.
if (optionsPanel) {
    optionsPanel.inert = true;
}


function openOptions() {

    document.body.classList.add("options-open");

    optionsPanel.inert = false;

    optionsPanel.setAttribute("aria-hidden", "false");

    if (closeOptions) {
        closeOptions.focus();
    }

}


function closeOptionsPanel() {

    const wasOpen = document.body.classList.contains("options-open");

    document.body.classList.remove("options-open");

    optionsPanel.inert = true;

    optionsPanel.setAttribute("aria-hidden", "true");

    if (wasOpen && optionsButton) {
        optionsButton.focus();
    }

}


if (optionsButton) {
    optionsButton.addEventListener("click", openOptions);
}

if (closeOptions) {
    closeOptions.addEventListener("click", closeOptionsPanel);
}

if (optionsBackdrop) {
    optionsBackdrop.addEventListener("click", closeOptionsPanel);
}

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeOptionsPanel();

        }

    }
);


/* =================================
   SHOW TOOL RESULT
================================= */

function showToolResult(title, value) {

    if (!toolResult) {
        return;
    }

    toolResult.hidden = false;

    toolResult.textContent =
        title +
        "\n\n" +
        (
            typeof value === "string"
                ? value
                : JSON.stringify(value, null, 2)
        );

}


async function loadTool(url) {

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error("Request failed: " + response.status);

    }

    return await response.json();

}


function formatTool(tool, data) {

    if (!Array.isArray(data)) {
        return data;
    }

    if (!data.length) {
        return "Nothing saved yet.";
    }

    switch (tool) {

        case "memory":
            return data.map(function (m) {
                return "\u2022 [" + m.category + "] " + m.content;
            }).join("\n");

        case "tasks":
            return data.map(function (t) {
                return (t.completed ? "\u2611" : "\u2610") +
                    " #" + t.id + "  " + t.title;
            }).join("\n");

        case "notes":
            return data.map(function (n) {
                return "\u2022 #" + n.id + " " + n.title + ": " + n.content;
            }).join("\n");

        case "reminders":
            return data.map(function (r) {
                return (r.completed ? "\u2611" : "\u23F0") +
                    " " + r.remind_at + " \u2014 " + r.text;
            }).join("\n");

    }

    return data;

}


function updateVoiceCard() {

    const description = document.querySelector(
        '.tool-card[data-tool="voice"] .tool-description'
    );

    if (description) {

        description.textContent =
            "Spoken replies: " + (voiceMuted ? "off" : "on");

    }

}


updateVoiceCard();


/* =================================
   TOOL CARDS
================================= */

const TOOL_ENDPOINTS = {
    memory: ["\uD83E\uDDE0 Memory", "/api/memories"],
    tasks: ["\u2705 Tasks", "/api/tasks"],
    notes: ["\uD83D\uDCDD Notes", "/api/notes"],
    reminders: ["\u23F0 Reminders", "/api/reminders"],
    dashboard: ["\uD83D\uDCCA Dashboard", "/api/dashboard"]
};

const TOOL_PROMPTS = {
    web: "Search the web for ",
    calculator: "Calculate ",
    computer: "Open "
};


document
    .querySelectorAll(".tool-card")
    .forEach(function (button) {

        button.addEventListener("click", async function () {

            const tool = button.dataset.tool;

            try {

                if (TOOL_ENDPOINTS[tool]) {

                    const entry = TOOL_ENDPOINTS[tool];

                    const data = await loadTool(entry[1]);

                    showToolResult(entry[0], formatTool(tool, data));

                } else if (TOOL_PROMPTS[tool] !== undefined) {

                    input.value = TOOL_PROMPTS[tool];

                    input.focus();

                    closeOptionsPanel();

                } else if (tool === "voice") {

                    voiceMuted = !voiceMuted;

                    try {
                        localStorage.setItem(
                            "aelyraMuted",
                            voiceMuted ? "1" : "0"
                        );
                    } catch (storageError) {
                        // Storage can be blocked; the toggle still works
                        // for this page load.
                    }

                    if (voiceMuted && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }

                    updateVoiceCard();

                } else if (tool === "clear") {

                    const response = await fetch(
                        "/clear",
                        { method: "POST" }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Could not clear chat: " + response.status
                        );
                    }

                    location.reload();

                }

            } catch (error) {

                showToolResult(
                    "\u274C Aelyra Error",
                    error.message
                );

                console.error("Tool error:", error);

            }

        });

    });


/* =================================
   REMINDER ALERTS
   Polls the server; a due reminder
   is delivered once, then marked done.
================================= */

async function checkReminders() {

    try {

        const response = await fetch("/api/reminders/due");

        if (!response.ok) {
            return;
        }

        const due = await response.json();

        due.forEach(function (item) {

            const text = "\u23F0 Reminder: " + item.text;

            addMessage(text, "assistant");

            speak(text);

        });

    } catch (error) {

        // Server offline; try again on the next tick.

    }

}


checkReminders();

setInterval(checkReminders, 30000);


/* =================================
   FOOTER: SHOW THE REAL MODEL NAME
================================= */

fetch("/api/health")
    .then(function (response) {
        return response.json();
    })
    .then(function (health) {

        if (footerText && health.model) {

            footerText.textContent =
                "Powered by Ollama \u2022 " + health.model +
                (health.ollama ? "" : " \u2022 Ollama offline");

        }

    })
    .catch(function () {});