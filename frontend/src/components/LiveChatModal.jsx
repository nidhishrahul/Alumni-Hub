import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { X, Send, Loader2, Sparkles, MessageSquare, Circle } from 'lucide-react';
import api from '../services/api';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export default function LiveChatModal({
    isOpen,
    onClose,
    requestId,
    otherPartyName,
    receiverId,
    currentUserId,
    initialMessage,
}) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [connected, setConnected] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !requestId) return;

        // Fetch chat message history from backend
        fetchHistory();

        // Connect Socket.IO
        const socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setConnected(true);
            socket.emit('join_room', { requestId });
        });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => {
                // Prevent duplicate messages if already present
                if (prev.some((m) => m.id === msg.id && m.id !== undefined)) return prev;
                return [...prev, msg];
            });
            scrollToBottom();
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        return () => {
            socket.emit('leave_room', { requestId });
            socket.disconnect();
        };
    }, [isOpen, requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await api.get(`/api/alumni-directory/requests/${requestId}/messages`);
            let loaded = res.data;

            // If no messages exist yet, prepopulate with initial request message if present
            if (loaded.length === 0 && initialMessage) {
                loaded = [
                    {
                        id: 'init-1',
                        message: initialMessage,
                        sender: { name: otherPartyName || 'Requester', role: 'STUDENT' },
                        createdAt: new Date().toISOString(),
                    },
                ];
            }

            setMessages(loaded);
        } catch (err) {
            console.error('Failed to load chat history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text) return;

        setInputText('');

        const messageData = {
            requestId,
            senderId: currentUserId,
            receiverId,
            message: text,
        };

        if (socketRef.current && socketRef.current.connected) {
            // Emit real-time WebSocket message
            socketRef.current.emit('send_message', messageData);
        } else {
            // Fallback to HTTP REST API if socket is connecting/reconnecting
            try {
                const res = await api.post(`/api/alumni-directory/requests/${requestId}/reply`, { replyMessage: text });
                if (res.data?.chatMessage) {
                    setMessages((prev) => [...prev, res.data.chatMessage]);
                }
            } catch (err) {
                console.error('Failed to send message fallback:', err);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="card w-full max-w-xl h-[600px] flex flex-col p-0 overflow-hidden border-primary-500/30 shadow-2xl">
                {/* Modal Header */}
                <div className="p-4 bg-surface-800/80 border-b border-surface-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                            {otherPartyName?.[0] || 'M'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                {otherPartyName}
                                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${connected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400'}`}>
                                    <Circle className={`w-2 h-2 fill-current ${connected ? 'text-green-400 animate-pulse' : 'text-amber-400'}`} />
                                    {connected ? 'Live Socket Connected' : 'Connecting...'}
                                </span>
                            </h3>
                            <p className="text-xs text-surface-400">Two-way real-time mentorship chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-700/50 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-900/40">
                    {loadingHistory ? (
                        <div className="flex items-center justify-center h-full gap-2 text-surface-400 text-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                            Loading conversation history...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-surface-400 text-sm gap-2">
                            <MessageSquare className="w-10 h-10 text-surface-600" />
                            <p>No messages yet. Send a message to start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId === currentUserId || (msg.sender && msg.sender.id === currentUserId);
                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                                >
                                    <div className="flex items-center gap-1.5 text-[10px] text-surface-400 mb-1">
                                        <span>{msg.sender?.name || (isMe ? 'You' : otherPartyName)}</span>
                                        <span>·</span>
                                        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div
                                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg ${isMe
                                            ? 'bg-primary-600 text-white rounded-tr-none'
                                            : 'bg-surface-800 text-surface-100 border border-surface-700/50 rounded-tl-none'
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Controls */}
                <div className="p-3 bg-surface-800/80 border-t border-surface-700/50 flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Type a message to ${otherPartyName || 'mentee'}...`}
                        className="input-field text-sm py-2.5 flex-1"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="btn-primary py-2.5 px-4 flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs font-bold">Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
