# ChatGPT Chat Searcher 🔍  
**ChatGPT experience with instant, private, local search.**

Userscript that adds advanced search to your ChatGPT Web. Instantly find any conversation and or message without sending data to any external server. Everything is stored 100% locally in your browser.

---

<img width="915" height="421" alt="Image" src="https://github.com/user-attachments/assets/dc03973c-821c-4b61-ba34-e057104e4a8c" />
<img width="922" height="422" alt="Image" src="https://github.com/user-attachments/assets/7f85ab8d-cd6b-4e5e-adda-3671b0aedac5" />

---

## 🌟  Features

- ⚡ **Instant Search**: Quickly find messages or titles in your entire chat history.  
- 🧠 **Local Caching**: Chat titles and content are cached locally for lightning-fast searches.  
- 🖱️ **Draggable Interface**: Move the search button anywhere on the screen.  
- ⌨️ **Keyboard Shortcuts**:  
  - Open search: `Ctrl + Shift + F`  
  - Close search: `Esc`  
- 📜 **Recent Searches**: Quickly access your latest queries.  
- ✨ **Result Highlighting**: See your search terms highlighted in results.  
- 🚀 **Jump to Message**: Click to scroll directly to any matching message.   
- 🛠️ **Cache Management**: Build, refresh, or clear the local cache anytime.  
- 🔒 **100% Private & Secure**: All data stays in your browser—no external requests.

---

## ⚙️ Installation

You'll need a userscript manager browser extension. Choose one:

- [Tampermonkey](https://www.tampermonkey.net/) (Recommended for Chrome, Firefox, Edge, Safari)  
- [Violentmonkey](https://violentmonkey.github.io/) (Open-source, Chrome/Firefox/Edge)  
- [Greasemonkey](https://www.greasespot.net/) (Firefox only)

### 🔘  One Click Install

[**➡️ Click here to install ChatGPT Conversation Searcher**](https://raw.githubusercontent.com/HeyItzAine/ChatGPT-Searcher/main/ChatGPT-Search-Tool.user.js
)  
> Your userscript manager will open a new tab. Click **Install**.

---

## 📖 How to Use

### Step-by-Step:

1. **Open ChatGPT**: Go to [chatgpt.com](https://chatgpt.com/).  
2. **Find the Search Button**: A floating 🔍 icon appears on the left side.  
3. **Drag & Drop**: Reposition the button however you like—it's saved automatically.  
4. **Open the Search Modal**:  
   - Click the 🔍 button  
   - Or press `Ctrl + Shift + F`  
5. **Build the Cache**:  
   - On first use (or after cache expires), click **Build Cache**  
   - Your chats will be indexed locally  
6. **Search**: Start typing. Results appear instantly.  
7. **Navigate Results**:  
   - Click a result to jump to the conversation  
   - Click a **message preview** to scroll to that exact message  
8. **Close the Modal**:  
   - Click the `×`  
   - Press `Esc`  
   - Click outside the modal

---

## ⌨️ Keyboard Shortcuts

| Action       | Shortcut           |
|--------------|--------------------|
| Open Search  | `Ctrl + Shift + F` |
| Close Search | `Esc`              |

---

## 🔧 Configuration

Tweak script behavior via the `CONFIG` object at the top of the script:

```js
const CONFIG = {
  CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  MAX_PREVIEW_LENGTH: 150,
  SEARCH_DEBOUNCE: 300,
  MAX_RECENT_SEARCHES: 10,
  STORAGE_KEYS: {
    CHAT_CACHE: 'chatgpt_search_cache',
    RECENT_SEARCHES: 'chatgpt_recent_searches',
    BUTTON_POSITION: 'chatgpt_search_btn_position',
    CACHE_TIMESTAMP: 'chatgpt_cache_timestamp'
  }
};
```
Note: If you wish to not have your cache expire simply set 
```js
  CACHE_EXPIRY: Infinity,
```


## 🚨 Troubleshooting

**🔘 Search button doesn't appear?**

- Ensure your userscript manager is enabled.  
- Wait for ChatGPT to fully load (especially on slow connections).  
- Check for conflicts with other ChatGPT scripts or extensions.

**🔍 Search results are empty?**

- You **must build the cache** before your first search.

**💥 Script broke after a ChatGPT update?**

- Check the repository for updates.  
- Open an issue or request a fix if one doesn’t exist.

---

## 🔒 Privacy & Security

- ✅ **No Data Collection**: No tracking, no analytics.  
- ✅ **Local Storage Only**: All data stays in your browser.  
- ✅ **Open Source**: Transparent and inspectable source code.

---

## 🤝 Contributing

Want to help improve this project?

1. **Fork** the repo  
2. `git checkout -b feature/your-feature-name`  
3. Make your changes  
4. `git commit -m 'Add some feature'`  
5. `git push origin feature/your-feature-name`  
6. **Open a Pull Request**

---

## 📝 Changelog

**v1.0 – Initial Release**  
- Search by title or content  
- Local caching  
- Draggable button  
- Keyboard shortcuts  
- Instant result navigation

---

## 📜 License

Licensed under the **MIT License**. See the `LICENSE` file for details.

---

<div align="center">
  <p>⭐ If you find this script useful, please consider starring the repository! ⭐</p>
</div>
