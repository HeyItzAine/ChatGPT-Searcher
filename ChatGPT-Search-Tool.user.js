// ==UserScript==
// @name         ChatGPT Search Tool
// @namespace    https://github.com/HeyItzAine/ChatGPT-Searcher
// @version      1
// @description  Advanced search for ChatGPT with chat content caching, and local storage
// @author       HeyItzAine https://discord.com/users/458981292332285953
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
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

    // Storage utilities
    const Storage = {
        get: (key) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from storage:', e);
                return null;
            }
        },

        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error writing to storage:', e);
                return false;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from storage:', e);
                return false;
            }
        }
    };

    // Add comprehensive styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Search Button Styles */
            #chatgpt-search-btn {
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 9999;
                background: #2d2d2d;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
                padding: 12px;
                cursor: grab;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                user-select: none;
                touch-action: none;
            }

            #chatgpt-search-btn:hover {
                background: #3d3d3d;
                border-color: #4d4d4d;
                transform: translateY(-50%) scale(1.05);
            }

            #chatgpt-search-btn:active {
                cursor: grabbing;
                transform: translateY(-50%) scale(0.95);
            }

            #chatgpt-search-btn.dragging {
                cursor: grabbing;
                transform: scale(0.95);
                transition: none;
            }

            #chatgpt-search-btn svg {
                width: 20px;
                height: 20px;
                fill: #ffffff;
            }

            /* Search Modal Styles */
            #chatgpt-search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            #chatgpt-search-container {
                background: #2d2d2d;
                border-radius: 12px;
                width: 700px;
                max-width: 90vw;
                max-height: 80vh;
                border: 1px solid #3d3d3d;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                animation: slideIn 0.3s ease;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            /* Search Header */
            #chatgpt-search-header {
                padding: 20px;
                border-bottom: 1px solid #3d3d3d;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #252525;
                flex-shrink: 0;
            }

            #chatgpt-search-title {
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            #chatgpt-search-close {
                background: none;
                border: none;
                color: #999;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            #chatgpt-search-close:hover {
                background: #3d3d3d;
                color: #fff;
            }

            /* Search Controls */
            #chatgpt-search-controls {
                padding: 20px;
                border-bottom: 1px solid #3d3d3d;
                background: #252525;
                flex-shrink: 0;
            }

            #chatgpt-search-input {
                width: 100%;
                background: #1a1a1a;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
                padding: 12px 16px;
                color: #ffffff;
                font-size: 16px;
                outline: none;
                transition: all 0.2s ease;
                margin-bottom: 12px;
            }

            #chatgpt-search-input:focus {
                border-color: #10a37f;
                box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
            }

            #chatgpt-search-input::placeholder {
                color: #666;
            }

            /* Control Buttons */
            .search-controls {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }

            .search-btn {
                background: #10a37f;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .search-btn:hover {
                background: #0d8a6b;
            }

            .search-btn:disabled {
                background: #3d3d3d;
                color: #666;
                cursor: not-allowed;
            }

            .search-btn.secondary {
                background: #3d3d3d;
                color: #fff;
            }

            .search-btn.secondary:hover {
                background: #4d4d4d;
            }

            /* Cache Status */
            .cache-status {
                color: #666;
                font-size: 12px;
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .cache-status.fresh {
                color: #10a37f;
            }

            .cache-status.building {
                color: #ffa500;
            }

            /* Recent Searches */
            .recent-searches {
                margin-top: 10px;
            }

            .recent-searches-title {
                color: #999;
                font-size: 12px;
                margin-bottom: 8px;
            }

            .recent-search-item {
                display: inline-block;
                background: #1a1a1a;
                border: 1px solid #3d3d3d;
                border-radius: 4px;
                padding: 4px 8px;
                margin-right: 8px;
                margin-bottom: 4px;
                font-size: 12px;
                color: #ccc;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .recent-search-item:hover {
                background: #3d3d3d;
                color: #fff;
            }

            /* Search Results */
            #chatgpt-search-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                min-height: 0;
            }

            #chatgpt-search-results::-webkit-scrollbar {
                width: 6px;
            }

            #chatgpt-search-results::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-radius: 3px;
            }

            #chatgpt-search-results::-webkit-scrollbar-thumb {
                background: #4d4d4d;
                border-radius: 3px;
            }

            /* Search Stats */
            .search-stats {
                color: #666;
                font-size: 14px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .search-result-item {
                background: #1a1a1a;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }

            .search-result-item:hover {
                background: #252525;
                border-color: #10a37f;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(16, 163, 127, 0.1);
            }

            .search-result-title {
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .search-result-preview {
                color: #999;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .search-result-meta {
                color: #666;
                font-size: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .search-highlight {
                background: #10a37f;
                color: #ffffff;
                padding: 2px 4px;
                border-radius: 4px;
                font-weight: 600;
            }

            .search-empty {
                text-align: center;
                padding: 40px;
                color: #666;
                font-size: 16px;
            }

            .search-loading {
                text-align: center;
                padding: 20px;
                color: #999;
            }

            .search-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #3d3d3d;
                border-radius: 50%;
                border-top-color: #10a37f;
                animation: spin 1s ease-in-out infinite;
                margin-right: 10px;
                vertical-align: middle;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
            }

            /* Progress Bar */
            .progress-bar {
                width: 100%;
                height: 4px;
                background: #3d3d3d;
                border-radius: 2px;
                overflow: hidden;
                margin-top: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10a37f, #0d8a6b);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }

            @keyframes highlight-message {
                0%, 100% { background: transparent; }
                50% { background: rgba(16, 163, 127, 0.1); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                #chatgpt-search-container {
                    width: 95vw;
                    max-height: 85vh;
                }

                #chatgpt-search-btn {
                    left: 15px;
                    padding: 10px;
                }

                #chatgpt-search-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .search-controls {
                    flex-direction: column;
                    align-items: stretch;
                }

                .search-btn {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Cache Manager
    class CacheManager {
        constructor() {
            this.cache = Storage.get(CONFIG.STORAGE_KEYS.CHAT_CACHE) || {};
            this.cacheTimestamp = Storage.get(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP) || 0;
        }

        isExpired() {
            return Date.now() - this.cacheTimestamp > CONFIG.CACHE_EXPIRY;
        }

        getCache() {
            if (this.isExpired()) {
                this.clearCache();
                return {};
            }
            return this.cache;
        }

        setCache(data) {
            this.cache = data;
            this.cacheTimestamp = Date.now();
            Storage.set(CONFIG.STORAGE_KEYS.CHAT_CACHE, this.cache);
            Storage.set(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP, this.cacheTimestamp);
        }

        clearCache() {
            this.cache = {};
            this.cacheTimestamp = 0;
            Storage.remove(CONFIG.STORAGE_KEYS.CHAT_CACHE);
            Storage.remove(CONFIG.STORAGE_KEYS.CACHE_TIMESTAMP);
        }

        updateChatInCache(chatId, chatData) {
            this.cache[chatId] = chatData;
            Storage.set(CONFIG.STORAGE_KEYS.CHAT_CACHE, this.cache);
        }

        getChatData() {
            return this.cache;
        }

        isCacheEmpty() {
            return Object.keys(this.cache).length === 0;
        }

        getCacheAge() {
            if (this.cacheTimestamp === 0) return Infinity;
            return Date.now() - this.cacheTimestamp;
        }
    }

    // Recent searches manager
    class RecentSearchesManager {
        constructor() {
            this.searches = Storage.get(CONFIG.STORAGE_KEYS.RECENT_SEARCHES) || [];
        }

        add(query) {
            if (!query.trim()) return;

            // Remove if already exists
            this.searches = this.searches.filter(s => s.query !== query);

            // Add to beginning with timestamp
            this.searches.unshift({
                query: query,
                timestamp: Date.now()
            });

            // Keep only last N searches
            this.searches = this.searches.slice(0, CONFIG.MAX_RECENT_SEARCHES);

            Storage.set(CONFIG.STORAGE_KEYS.RECENT_SEARCHES, this.searches);
        }

        get() {
            return this.searches;
        }

        clear() {
            this.searches = [];
            Storage.remove(CONFIG.STORAGE_KEYS.RECENT_SEARCHES);
        }
    }

    // Chat Content Extractor
    class ChatExtractor {
        constructor() {
            this.isExtracting = false;
        }

        async extractCurrentChatContent() {
            try {
                // Get all message elements in the current chat
                const messages = [];

                // Look for message containers - ChatGPT uses different structures
                const messageContainers = document.querySelectorAll('[data-message-author-role], .group, .text-base');

                messageContainers.forEach((container, index) => {
                    let role = 'unknown';
                    let content = '';

                    // Try to determine role
                    if (container.hasAttribute('data-message-author-role')) {
                        role = container.getAttribute('data-message-author-role');
                    } else if (container.classList.contains('group')) {
                        // Check for user/assistant indicators
                        if (container.querySelector('.bg-white, .dark\\:bg-gray-800')) {
                            role = 'assistant';
                        } else {
                            role = 'user';
                        }
                    }

                    // Extract text content
                    const textElements = container.querySelectorAll('.markdown, .whitespace-pre-wrap, p, .text-base');
                    textElements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text && text.length > 0) {
                            content += text + ' ';
                        }
                    });

                    content = content.trim();

                    if (content) {
                        messages.push({
                            role: role,
                            content: content,
                            index: index
                        });
                    }
                });

                return messages;
            } catch (error) {
                console.error('Error extracting chat content:', error);
                return [];
            }
        }

        async extractChatMessages(chatId, href) {
            try {
                // Save current URL
                const currentUrl = window.location.href;

                // Navigate to the chat
                window.location.href = href;

                // Wait for chat to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Wait for messages to appear
                let attempts = 0;
                while (attempts < 10) {
                    const messages = await this.extractCurrentChatContent();
                    if (messages.length > 0) {
                        return messages;
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                    attempts++;
                }

                return [];
            } catch (error) {
                console.error(`Error extracting messages for chat ${chatId}:`, error);
                return [];
            }
        }

        async extractAllChats(onProgress, existingCache = {}, updateOnly = false) {
            const chatData = updateOnly ? { ...existingCache } : {};
            let processed = 0;
            let newChatsFound = 0;

            try {
                // Get all chat links from the sidebar
                const chatLinks = document.querySelectorAll('nav a[href^="/c/"], nav li a[href*="/c/"]');
                const totalChats = chatLinks.length;

                console.log(`Found ${totalChats} chats to process`);

                // Create a list of chats to process
                const chatsToProcess = [];

                for (const link of chatLinks) {
                    const href = link.getAttribute('href');
                    if (!href || !href.includes('/c/')) continue;

                    const chatId = href.split('/c/')[1]?.split('?')[0];
                    if (!chatId) continue;

                    // Skip if update only and chat already exists
                    if (updateOnly && existingCache[chatId]) {
                        processed++;
                        continue;
                    }

                    // Get chat title
                    const titleElement = link.querySelector('div:not([class*="absolute"]):not([class*="relative"])') ||
                                       link.querySelector('.overflow-hidden') ||
                                       link.querySelector('.truncate');
                    const title = titleElement ? titleElement.textContent.trim() : `Chat ${processed + 1}`;

                    chatsToProcess.push({ chatId, href, title });
                }

                newChatsFound = chatsToProcess.length;

                if (updateOnly && newChatsFound === 0) {
                    console.log('No new chats found to update');
                    return { chatData, newChatsFound: 0 };
                }

                // Process each chat
                for (const chat of chatsToProcess) {
                    try {
                        // Note: We store basic info here. Full message content is extracted when:
                        // 1. User visits the chat
                        // 2. The periodic updater runs while user is in a chat
                        // This approach avoids disruptive page navigation
                        chatData[chat.chatId] = {
                            id: chat.chatId,
                            title: chat.title,
                            href: chat.href,
                            messages: [],
                            lastUpdated: Date.now()
                        };

                        processed++;
                        if (onProgress) {
                            const progressText = updateOnly
                                ? `Adding ${processed}/${newChatsFound} new chats...`
                                : `Indexing ${processed}/${totalChats} chats...`;
                            onProgress(processed, updateOnly ? newChatsFound : totalChats, progressText);
                        }

                        // Small delay to avoid overwhelming
                        await new Promise(resolve => setTimeout(resolve, 10));
                    } catch (err) {
                        console.error('Error processing chat:', err);
                    }
                }

                console.log(`Processed ${processed} chats, found ${newChatsFound} new chats`);
                return { chatData, newChatsFound };
            } catch (error) {
                console.error('Error in extractAllChats:', error);
                return { chatData, newChatsFound };
            }
        }

        async extractMessagesForChat(chatId, chatData) {
            try {
                const currentPath = window.location.pathname;

                // If we're already on this chat, extract messages directly
                if (currentPath.includes(`/c/${chatId}`)) {
                    const messages = await this.extractCurrentChatContent();
                    if (messages.length > 0) {
                        chatData[chatId].messages = messages;
                        chatData[chatId].lastUpdated = Date.now();
                    }
                    return chatData[chatId];
                }

                // Otherwise, we'd need to navigate (future enhancement)
                return chatData[chatId];
            } catch (error) {
                console.error(`Error extracting messages for chat ${chatId}:`, error);
                return chatData[chatId];
            }
        }
    }

    // Search Engine
    class SearchEngine {
        constructor(cacheManager) {
            this.cacheManager = cacheManager;
        }

        search(query, chatData) {
            if (!query.trim()) return [];

            const searchTerm = query.toLowerCase();
            const results = [];

            Object.values(chatData).forEach(chat => {
                const titleMatch = chat.title.toLowerCase().includes(searchTerm);
                let contentMatches = [];
                let score = 0;

                // Search through messages if available
                if (chat.messages && chat.messages.length > 0) {
                    chat.messages.forEach((message, index) => {
                        const contentMatch = message.content.toLowerCase().includes(searchTerm);
                        if (contentMatch) {
                            contentMatches.push({
                                messageIndex: index,
                                role: message.role,
                                content: message.content,
                                preview: this.generatePreview(message.content, searchTerm)
                            });
                            score += 5;
                        }
                    });
                }

                if (titleMatch) score += 10;
                if (chat.title.toLowerCase() === searchTerm) score += 20;

                if (titleMatch || contentMatches.length > 0) {
                    results.push({
                        ...chat,
                        score: score,
                        titleMatch: titleMatch,
                        contentMatches: contentMatches,
                        highlightedTitle: this.highlightText(chat.title, query),
                        totalMatches: contentMatches.length + (titleMatch ? 1 : 0)
                    });
                }
            });

            return results.sort((a, b) => b.score - a.score);
        }

        generatePreview(content, searchTerm) {
            const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
            if (index === -1) return content.substring(0, CONFIG.MAX_PREVIEW_LENGTH) + '...';

            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + searchTerm.length + 50);
            let preview = content.substring(start, end);

            if (start > 0) preview = '...' + preview;
            if (end < content.length) preview = preview + '...';

            return this.highlightText(preview, searchTerm);
        }

        highlightText(text, searchTerm) {
            if (!searchTerm) return text;

            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<span class="search-highlight">$1</span>');
        }
    }

    // Create search button
    function createSearchButton() {
        const button = document.createElement('button');
        button.id = 'chatgpt-search-btn';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        button.title = 'Search Chats (Ctrl+Shift+F) - Drag to move';

        // Load saved position
        const savedPosition = Storage.get(CONFIG.STORAGE_KEYS.BUTTON_POSITION);
        if (savedPosition) {
            const { left, top } = savedPosition;
            button.style.left = left + 'px';
            button.style.top = top + 'px';
            button.style.transform = 'none';
        }

        document.body.appendChild(button);
        return button;
    }

    // Make button draggable
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        let hasMoved = false;
        const DRAG_THRESHOLD = 5;

        function startDrag(e) {
            isDragging = true;
            hasMoved = false;
            element.classList.add('dragging');

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            startX = clientX;
            startY = clientY;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', stopDrag);

            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > DRAG_THRESHOLD) {
                hasMoved = true;
            }

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            const buttonRect = element.getBoundingClientRect();
            const maxLeft = window.innerWidth - buttonRect.width;
            const maxTop = window.innerHeight - buttonRect.height;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.transform = 'none';

            e.preventDefault();
        }

        function stopDrag(e) {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');

                if (hasMoved) {
                    const position = {
                        left: element.offsetLeft,
                        top: element.offsetTop
                    };
                    Storage.set(CONFIG.STORAGE_KEYS.BUTTON_POSITION, position);
                }

                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('touchend', stopDrag);

                if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false });

        return {
            wasLastActionDrag: () => hasMoved
        };
    }

    // Create search modal
    function createSearchModal() {
        const modal = document.createElement('div');
        modal.id = 'chatgpt-search-modal';
        modal.innerHTML = `
            <div id="chatgpt-search-container">
                <div id="chatgpt-search-header">
                    <h2 id="chatgpt-search-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Search Conversations
                    </h2>
                    <button id="chatgpt-search-close">&times;</button>
                </div>

                <div id="chatgpt-search-controls">
                    <input type="text" id="chatgpt-search-input" placeholder="Search conversations by title or content..." />

                    <div class="search-controls">
                        <button class="search-btn" id="update-cache-btn" title="Add only new chats to the cache">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2v4"/>
                                <path d="M12 18v4"/>
                                <path d="M4.93 4.93l2.83 2.83"/>
                                <path d="M16.24 16.24l2.83 2.83"/>
                                <path d="M2 12h4"/>
                                <path d="M18 12h4"/>
                                <path d="M4.93 19.07l2.83-2.83"/>
                                <path d="M16.24 7.76l2.83-2.83"/>
                            </svg>
                            Update Cache
                        </button>

                        <button class="search-btn secondary" id="rebuild-cache-btn" title="Rebuild the entire cache from scratch">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12c0 4.97-4.03 9-9 9-2.49 0-4.74-1.01-6.36-2.64"/>
                                <path d="M3 12c0-4.97 4.03-9 9-9 2.49 0 4.74 1.01 6.36 2.64"/>
                                <path d="M21 8l-4 4-4-4"/>
                                <path d="M3 16l4-4 4 4"/>
                            </svg>
                            Rebuild All
                        </button>

                        <button class="search-btn secondary" id="clear-cache-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Clear Cache
                        </button>

                        <button class="search-btn secondary" id="clear-recent-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            Clear Recent
                        </button>

                        <div class="cache-status" id="cache-status">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            No cache
                        </div>
                    </div>

                    <div class="recent-searches" id="recent-searches">
                        <div class="recent-searches-title">Recent searches:</div>
                        <div id="recent-searches-list"></div>
                    </div>
                </div>

                <div id="chatgpt-search-results">
                    <div class="search-stats" id="chatgpt-search-stats"></div>
                    <div id="search-results-content"></div>
                    <div style="padding: 10px; margin-top: 20px; border-top: 1px solid #3d3d3d; color: #666; font-size: 12px; text-align: center;">
                        💡 Tip: Message content is indexed when you visit each chat. Titles are indexed immediately.
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    // Format timestamp
    function formatTimestamp(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    // Initialize the extension
    function initializeSearch() {
        // Add styles
        addStyles();

        // Create UI elements
        const searchButton = createSearchButton();
        const searchModal = createSearchModal();
        const dragHandler = makeDraggable(searchButton);

        // Initialize managers
        const cacheManager = new CacheManager();
        const searchEngine = new SearchEngine(cacheManager);
        const recentSearches = new RecentSearchesManager();
        const chatExtractor = new ChatExtractor();

        // DOM elements
        const elements = {
            modal: document.getElementById('chatgpt-search-modal'),
            input: document.getElementById('chatgpt-search-input'),
            results: document.getElementById('search-results-content'),
            stats: document.getElementById('chatgpt-search-stats'),
            close: document.getElementById('chatgpt-search-close'),
            updateCache: document.getElementById('update-cache-btn'),
            rebuildCache: document.getElementById('rebuild-cache-btn'),
            clearCache: document.getElementById('clear-cache-btn'),
            clearRecent: document.getElementById('clear-recent-btn'),
            cacheStatus: document.getElementById('cache-status'),
            recentList: document.getElementById('recent-searches-list'),
            recentSearchesContainer: document.getElementById('recent-searches')
        };

        let searchTimeout;

        // Update cache status
        function updateCacheStatus() {
            const isEmpty = cacheManager.isCacheEmpty();
            const age = cacheManager.getCacheAge();
            const ageText = age === Infinity ? 'No cache' :
                          age < 60000 ? 'Just now' :
                          age < 3600000 ? `${Math.floor(age / 60000)}m ago` :
                          age < 86400000 ? `${Math.floor(age / 3600000)}h ago` :
                          `${Math.floor(age / 86400000)}d ago`;

            elements.cacheStatus.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                ${isEmpty ? 'No cache' : ageText}
            `;

            elements.cacheStatus.className = isEmpty ? 'cache-status' : 'cache-status fresh';
        }

        // Update recent searches list
        function updateRecentSearches() {
            const searches = recentSearches.get();
            if (searches.length === 0) {
                elements.recentSearchesContainer.style.display = 'none';
                return;
            }

            elements.recentSearchesContainer.style.display = 'block';
            elements.recentList.innerHTML = searches.map(item => `
                <span class="recent-search-item" data-query="${item.query}">
                    ${item.query}
                </span>
            `).join('');
        }

        // Show/hide modal
        function showModal() {
            elements.modal.style.display = 'flex';
            elements.input.focus();
            updateCacheStatus();
            updateRecentSearches();
        }

        function hideModal() {
            elements.modal.style.display = 'none';
        }

        // Perform search
        function performSearch(query) {
            if (!query.trim()) {
                elements.results.innerHTML = '';
                elements.stats.textContent = '';
                return;
            }

            const results = searchEngine.search(query, cacheManager.getChatData());

            if (results.length === 0) {
                elements.results.innerHTML = `
                    <div class="search-empty">
                        No results found for "${query}"
                    </div>
                `;
                elements.stats.textContent = 'No results found';
                return;
            }

            elements.stats.textContent = `Found ${results.length} conversation${results.length !== 1 ? 's' : ''}`;

            elements.results.innerHTML = results.map(result => {
                const hasMessages = result.messages && result.messages.length > 0;
                const messageStatus = hasMessages
                    ? `<span style="color: #10a37f; font-size: 11px;">✓ Content indexed</span>`
                    : `<span style="color: #666; font-size: 11px;">Title only (visit chat to index content)</span>`;

                return `
                    <div class="search-result-item" data-href="${result.href}">
                        <div class="search-result-title">${result.highlightedTitle}</div>
                        ${result.contentMatches.slice(0, 2).map(match => `
                            <div class="search-result-preview" data-message-index="${match.messageIndex}">
                                ${match.preview}
                            </div>
                        `).join('')}
                        <div class="search-result-meta">
                            <span>${result.totalMatches} match${result.totalMatches !== 1 ? 'es' : ''} • ${messageStatus}</span>
                            <span>Updated ${formatTimestamp(result.lastUpdated)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Build cache
        async function buildCache(updateOnly = false) {
            const button = updateOnly ? elements.updateCache : elements.rebuildCache;
            const originalText = button.innerHTML;

            button.disabled = true;
            elements.cacheStatus.className = 'cache-status building';
            button.innerHTML = `
                <span class="search-spinner"></span>
                ${updateOnly ? 'Updating...' : 'Building cache...'}
            `;

            try {
                const existingCache = updateOnly ? cacheManager.getChatData() : {};
                const result = await chatExtractor.extractAllChats((current, total, progressText) => {
                    button.innerHTML = `
                        <span class="search-spinner"></span>
                        ${progressText || `Processing ${current}/${total}...`}
                    `;
                }, existingCache, updateOnly);

                if (updateOnly && result.newChatsFound === 0) {
                    button.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        No new chats
                    `;
                    setTimeout(() => {
                        button.innerHTML = originalText;
                    }, 2000);
                } else {
                    cacheManager.setCache(result.chatData);
                    updateCacheStatus();

                    // Success feedback
                    button.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        ${updateOnly ? `Added ${result.newChatsFound} chats` : 'Cache built!'}
                    `;

                    setTimeout(() => {
                        button.innerHTML = originalText;
                    }, 2000);
                }

                // If search input has value, perform search
                if (elements.input.value) {
                    performSearch(elements.input.value);
                }
            } catch (error) {
                console.error('Error building cache:', error);
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                    Error
                `;
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            } finally {
                button.disabled = false;
                updateCacheStatus();
            }
        }

        // Event listeners
        searchButton.addEventListener('click', (e) => {
            if (!dragHandler.wasLastActionDrag()) {
                showModal();
            }
        });

        elements.close.addEventListener('click', hideModal);

        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                hideModal();
            }
        });

        elements.input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;

            searchTimeout = setTimeout(() => {
                if (query.trim()) {
                    recentSearches.add(query);
                    updateRecentSearches();
                }
                performSearch(query);
            }, CONFIG.SEARCH_DEBOUNCE);
        });

        elements.updateCache.addEventListener('click', () => buildCache(true));
        elements.rebuildCache.addEventListener('click', () => buildCache(false));

        elements.clearCache.addEventListener('click', () => {
            cacheManager.clearCache();
            updateCacheStatus();
            elements.results.innerHTML = '';
            elements.stats.textContent = '';
        });

        elements.clearRecent.addEventListener('click', () => {
            recentSearches.clear();
            updateRecentSearches();
        });

        elements.recentList.addEventListener('click', (e) => {
            const item = e.target.closest('.recent-search-item');
            if (item) {
                const query = item.dataset.query;
                elements.input.value = query;
                performSearch(query);
            }
        });

        elements.results.addEventListener('click', async (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (!resultItem) return;

            const href = resultItem.dataset.href;
            const messageIndex = e.target.closest('.search-result-preview')?.dataset.messageIndex;

            // Navigate to the chat
            window.location.href = href;

            // If a specific message was clicked, store it for scrolling
            if (messageIndex) {
                sessionStorage.setItem('chatgpt-search-scroll-target', messageIndex);
            }

            hideModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+F to open search
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                showModal();
            }

            // Escape to close modal
            if (e.key === 'Escape' && elements.modal.style.display === 'flex') {
                hideModal();
            }
        });

        // Check for scroll target after navigation
        function checkScrollTarget() {
            const targetIndex = sessionStorage.getItem('chatgpt-search-scroll-target');
            if (targetIndex) {
                sessionStorage.removeItem('chatgpt-search-scroll-target');

                // Wait for messages to load
                setTimeout(() => {
                    const messages = document.querySelectorAll('[data-message-author-role], .group');
                    const index = parseInt(targetIndex);

                    if (messages[index]) {
                        messages[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        messages[index].style.animation = 'highlight-message 2s ease-in-out';
                    }
                }, 1500);
            }
        }

        // Check on page load
        checkScrollTarget();

        // Update cache for current chat periodically
        setInterval(async () => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/c/')) {
                const chatId = currentPath.split('/c/')[1]?.split('?')[0];
                if (chatId) {
                    const messages = await chatExtractor.extractCurrentChatContent();
                    if (messages.length > 0) {
                        const chatData = cacheManager.getChatData();

                        // If this chat isn't in cache yet, add it
                        if (!chatData[chatId]) {
                            // Find the chat link to get the title
                            const chatLink = document.querySelector(`nav a[href*="/c/${chatId}"]`);
                            const titleElement = chatLink?.querySelector('div:not([class*="absolute"]):not([class*="relative"])');
                            const title = titleElement ? titleElement.textContent.trim() : 'Current Chat';

                            chatData[chatId] = {
                                id: chatId,
                                title: title,
                                href: `/c/${chatId}`,
                                messages: messages,
                                lastUpdated: Date.now()
                            };

                            console.log(`Added new chat ${chatId} to cache`);
                        } else {
                            // Update existing chat
                            chatData[chatId].messages = messages;
                            chatData[chatId].lastUpdated = Date.now();
                        }

                        cacheManager.updateChatInCache(chatId, chatData[chatId]);
                        updateCacheStatus();
                    }
                }
            }

            // Also check for new chats in the sidebar
            const chatLinks = document.querySelectorAll('nav a[href^="/c/"], nav li a[href*="/c/"]');
            const currentCache = cacheManager.getChatData();
            let newChatsFound = false;

            chatLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes('/c/')) {
                    const chatId = href.split('/c/')[1]?.split('?')[0];
                    if (chatId && !currentCache[chatId]) {
                        newChatsFound = true;
                    }
                }
            });

            // Update the Update Cache button to show indicator if new chats are found
            if (newChatsFound && elements.updateCache) {
                elements.updateCache.style.position = 'relative';
                const existingIndicator = elements.updateCache.querySelector('.new-chat-indicator');
                if (!existingIndicator) {
                    const indicator = document.createElement('span');
                    indicator.className = 'new-chat-indicator';
                    indicator.style.cssText = `
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        width: 8px;
                        height: 8px;
                        background: #10a37f;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    `;
                    elements.updateCache.appendChild(indicator);
                }
            }
        }, 30000); // Update every 30 seconds

        // Initial cache check
        if (cacheManager.isCacheEmpty() || cacheManager.isExpired()) {
            console.log('Cache is empty or expired, building initial cache...');
            setTimeout(() => buildCache(false), 1000);
        }
    }

    // Wait for page to be ready
    function waitForChatGPT() {
        const checkInterval = setInterval(() => {
            // Check if ChatGPT UI is loaded
            if (document.querySelector('nav') &&
                (document.querySelector('[href^="/c/"]') || document.querySelector('main'))) {
                clearInterval(checkInterval);
                initializeSearch();
            }
        }, 1000);

        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    // Start initialization
    waitForChatGPT();
})();
