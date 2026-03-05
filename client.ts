import Pusher from 'pusher-js';
import { config } from './config';

interface ChatMessage {
    sender: string;
    content: string;
    timestamp: number;
}

class ChatClient {
    private pusher: Pusher;
    private channel: any;
    private username: string = '';
    private messagesContainer: HTMLElement;
    private connectionStatus: HTMLElement;
    private connectionStatusChat: HTMLElement;
    private welcomeScreen: HTMLElement;
    private chatContainer: HTMLElement;
    private currentUserDisplay: HTMLElement;
    private srAnnouncements: HTMLElement;
    private typingIndicator: HTMLElement;
    private typingIndicatorText: HTMLElement;
    private messageIds: Set<string> = new Set();
    private isConnected: boolean = false;
    private typingTimeout: number | null = null;
    private isTyping: boolean = false;
    private typingUsers: Map<string, number> = new Map();

    constructor() {
        // Initialize Pusher client
        this.pusher = new Pusher(config.pusher.appKey, {
            wsHost: config.pusher.wsHost,
            wsPort: config.pusher.wsPort,
            forceTLS: config.pusher.forceTLS,
            disableStats: true,
            enabledTransports: config.pusher.enabledTransports as ('ws' | 'wss')[],
            cluster: config.pusher.cluster,
        });

        // Get DOM elements
        this.messagesContainer = document.getElementById('messagesContainer')!;
        this.connectionStatus = document.getElementById('connectionStatus')!;
        this.connectionStatusChat = document.getElementById('connectionStatusChat')!;
        this.welcomeScreen = document.getElementById('welcomeScreen')!;
        this.chatContainer = document.getElementById('chatContainer')!;
        this.currentUserDisplay = document.getElementById('currentUser')!;
        this.srAnnouncements = document.getElementById('srAnnouncements')!;
        this.typingIndicator = document.getElementById('typingIndicator')!;
        this.typingIndicatorText = document.getElementById('typingIndicatorText')!;

        this.setupEventListeners();
        this.setupPusherConnection();
    }

    private setupPusherConnection() {
        // Connection state monitoring
        this.pusher.connection.bind('connected', () => {
            console.log('Connected to Soketi server');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.announceToScreenReader('Conectado al servidor');
        });

        this.pusher.connection.bind('disconnected', () => {
            console.log('Disconnected from Soketi server');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.announceToScreenReader('Desconectado del servidor');
        });

        this.pusher.connection.bind('error', (err: any) => {
            console.error('Connection error:', err);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.announceToScreenReader('Error de conexión. Reintentando…');
        });

        // Subscribe to chat channel
        this.channel = this.pusher.subscribe(config.channel.name);

        // Listen for messages
        this.channel.bind('client-message', (data: ChatMessage) => {
            const messageId = `${data.sender}-${data.timestamp}`;

            // Prevent duplicate messages
            if (this.messageIds.has(messageId)) {
                return;
            }

            this.messageIds.add(messageId);
            this.displayMessage(data);
        });

        // Listen for typing events
        this.channel.bind('client-typing', (data: { username: string; isTyping: boolean }) => {
            if (data.username !== this.username) {
                this.handleTypingEvent(data.username, data.isTyping);
            }
        });

        this.channel.bind('pusher:subscription_succeeded', () => {
            console.log('Successfully subscribed to chat-room');
        });

        this.channel.bind('pusher:subscription_error', (err: any) => {
            console.error('Subscription error:', err);
            this.announceToScreenReader('Error al suscribirse al canal de chat');
        });
    }

    private setupEventListeners() {
        const usernameField = document.getElementById('usernameField') as HTMLInputElement;
        const setUsernameBtn = document.getElementById('setUsernameBtn') as HTMLButtonElement;
        const messageField = document.getElementById('messageField') as HTMLInputElement;
        const messageForm = document.getElementById('messageForm') as HTMLFormElement;

        // Set username
        setUsernameBtn.addEventListener('click', () => {
            const username = usernameField.value.trim();
            if (username.length >= 2) {
                this.setUsername(username);
            } else {
                this.announceToScreenReader('El nombre de usuario debe tener al menos 2 caracteres');
            }
        });

        usernameField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const username = usernameField.value.trim();
                if (username.length >= 2) {
                    this.setUsername(username);
                } else {
                    this.announceToScreenReader('El nombre de usuario debe tener al menos 2 caracteres');
                }
            }
        });

        // Typing indicator on message input
        messageField.addEventListener('input', () => {
            this.handleTypingInput();
        });

        // Send message via form submission
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = messageField.value.trim();

            if (!this.isConnected) {
                this.announceToScreenReader('No conectado. Esperando conexión…');
                return;
            }

            if (message) {
                // Stop typing indicator when sending
                this.sendTypingEvent(false);
                this.sendMessage(message);
                messageField.value = '';
            }
        });
    }

    private setUsername(username: string) {
        if (!this.isConnected) {
            this.announceToScreenReader('Esperando conexión al servidor…');
            setTimeout(() => {
                if (this.isConnected) {
                    this.setUsername(username);
                }
            }, 1000);
            return;
        }

        this.username = username;

        // Hide welcome screen and show chat
        this.welcomeScreen.classList.add('hidden');
        this.chatContainer.classList.add('active');

        this.currentUserDisplay.textContent = `Chateando como ${username}`;

        // Focus on message input
        const messageField = document.getElementById('messageField') as HTMLInputElement;
        messageField.focus();

        // Send join message
        this.channel.trigger('client-message', {
            sender: 'Sistema',
            content: `${username} se unió al chat`,
            timestamp: Date.now()
        });

        this.announceToScreenReader(`Conectado como ${username}`);
    }

    private sendMessage(content: string) {
        const message: ChatMessage = {
            sender: this.username,
            content: content,
            timestamp: Date.now()
        };

        // Display message locally first (optimistic update)
        this.displayMessage(message);

        // Trigger client event to send to others
        this.channel.trigger('client-message', message);
    }

    private displayMessage(message: ChatMessage) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        const isOwnMessage = message.sender === this.username;
        const isSystemMessage = message.sender === 'Sistema';

        if (isOwnMessage) {
            messageDiv.classList.add('own');
        }

        if (isSystemMessage) {
            messageDiv.classList.add('system');
        }

        if (!isSystemMessage) {
            // Message header with sender name (only for received messages)
            if (!isOwnMessage) {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';

                const senderDiv = document.createElement('div');
                senderDiv.className = 'message-sender';
                senderDiv.textContent = message.sender;

                headerDiv.appendChild(senderDiv);
                messageDiv.appendChild(headerDiv);
            }

            // Message content bubble
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            const textDiv = document.createElement('div');
            textDiv.className = 'message-content-text';
            textDiv.textContent = message.content;

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-content-time';
            timeDiv.textContent = this.formatTimestamp(message.timestamp);
            timeDiv.setAttribute('aria-label', this.formatTimestampForScreenReader(message.timestamp));

            contentDiv.appendChild(textDiv);
            contentDiv.appendChild(timeDiv);

            messageDiv.appendChild(contentDiv);
        } else {
            // System message (simplified)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = message.content;
            messageDiv.appendChild(contentDiv);
        }

        this.messagesContainer.appendChild(messageDiv);

        // Auto-scroll only if user is near bottom
        const isNearBottom = this.messagesContainer.scrollHeight - this.messagesContainer.scrollTop - this.messagesContainer.clientHeight < 100;
        if (isNearBottom) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        // Announce new messages to screen readers (but not own messages)
        if (!isOwnMessage) {
            this.announceToScreenReader(`Nuevo mensaje de ${message.sender}: ${message.content}`);
        }
    }

    private formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    private formatTimestampForScreenReader(timestamp: number): string {
        const date = new Date(timestamp);
        return `Enviado a las ${date.getHours()} horas ${date.getMinutes()} minutos`;
    }

    private announceToScreenReader(message: string) {
        this.srAnnouncements.textContent = message;
        // Clear after announcement to allow repeated messages
        setTimeout(() => {
            this.srAnnouncements.textContent = '';
        }, 1000);
    }

    private updateConnectionStatus(connected: boolean) {
        const statusText = connected ? 'en línea' : 'desconectado';
        const statusClass = connected ? 'connection-status connected' : 'connection-status disconnected';

        this.connectionStatus.textContent = statusText;
        this.connectionStatus.className = statusClass;
        this.connectionStatusChat.textContent = statusText;
        this.connectionStatusChat.className = statusClass;

        // Update aria-label for better accessibility
        const ariaLabel = connected ? 'Estado: Conectado al servidor' : 'Estado: Desconectado del servidor';
        this.connectionStatus.setAttribute('aria-label', ariaLabel);
        this.connectionStatusChat.setAttribute('aria-label', ariaLabel);
    }

    private handleTypingInput() {
        if (!this.isConnected || !this.username) {
            return;
        }

        // Send typing event if not already typing
        if (!this.isTyping) {
            this.isTyping = true;
            this.sendTypingEvent(true);
        }

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set timeout to stop typing after 2 seconds of inactivity
        this.typingTimeout = window.setTimeout(() => {
            this.isTyping = false;
            this.sendTypingEvent(false);
        }, 2000);
    }

    private sendTypingEvent(isTyping: boolean) {
        if (!this.isConnected || !this.channel || !this.username) {
            return;
        }

        try {
            this.channel.trigger('client-typing', {
                username: this.username,
                isTyping: isTyping
            });
        } catch (error) {
            console.error('Error sending typing event:', error);
        }
    }

    private handleTypingEvent(username: string, isTyping: boolean) {
        if (isTyping) {
            // Add user to typing users map with timestamp
            this.typingUsers.set(username, Date.now());

            // Clear existing timeout for this user
            const existingTimeout = this.typingUsers.get(`${username}-timeout`);
            if (existingTimeout) {
                clearTimeout(existingTimeout as number);
            }

            // Set timeout to remove user after 3 seconds
            const timeout = window.setTimeout(() => {
                this.typingUsers.delete(username);
                this.updateTypingIndicator();
            }, 3000);

            this.typingUsers.set(`${username}-timeout`, timeout);
        } else {
            // Remove user from typing users
            this.typingUsers.delete(username);
            const timeout = this.typingUsers.get(`${username}-timeout`);
            if (timeout) {
                clearTimeout(timeout as number);
                this.typingUsers.delete(`${username}-timeout`);
            }
        }

        this.updateTypingIndicator();
    }

    private updateTypingIndicator() {
        // Get list of typing users (excluding timeout entries)
        const typingUsernames = Array.from(this.typingUsers.keys()).filter(
            key => !key.endsWith('-timeout')
        );

        if (typingUsernames.length === 0) {
            // Hide indicator
            this.typingIndicator.classList.remove('active');
            this.typingIndicatorText.textContent = '';
        } else {
            // Show indicator with appropriate text
            let text = '';
            if (typingUsernames.length === 1) {
                text = `${typingUsernames[0]} está escribiendo`;
            } else if (typingUsernames.length === 2) {
                text = `${typingUsernames[0]} y ${typingUsernames[1]} están escribiendo`;
            } else {
                text = `${typingUsernames.length} personas están escribiendo`;
            }

            this.typingIndicatorText.textContent = text;
            this.typingIndicator.classList.add('active');
        }
    }
}

// Initialize chat when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatClient();
    });
} else {
    new ChatClient();
}
