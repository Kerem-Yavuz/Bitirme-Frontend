import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './App.css';
// 1. API dosyamızı import ediyoruz
import api from './api';
import { AILogo, XIcon } from './icons';

function AIChat() {
    const [isOpen, setIsOpen] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = storedUser.fullName ? storedUser.fullName.split(' ')[0] : 'öğrenci';

    const [messages, setMessages] = useState([
        { sender: 'ai', text: `Merhaba ${userName}! Ben senin akıllı asistanınım. Sana nasıl yardımcı olabilirim?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);
        setIsThinking(true);
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

        const history = messages
            .filter(msg => msg.text.trim() !== '')
            .map(msg => ({
                role: msg.sender === 'ai' ? 'assistant' : 'user',
                content: msg.text
            }));

        try {
            // 2. api instance'ındaki baseURL'i kullanarak dinamik URL oluşturuyoruz
            // api.defaults.baseURL genellikle "http://localhost:8001/api" olur
            const response = await fetch(`${api.defaults.baseURL}/ai/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Eğer api.js'de tanımladığın özel headerlar varsa buraya ekleyebilirsin
                },
                body: JSON.stringify({ question: userMessage, history: history }),
                // 3. api.js'deki withCredentials ayarına uyum sağlıyoruz
                credentials: api.defaults.withCredentials ? 'include' : 'same-origin'
            });

            // 4. api.js'deki 401 (Unauthorized) kontrolünü burada manuel yapıyoruz 
            // Çünkü fetch, Axios interceptor'larını tetiklemez
            if (response.status === 401) {
                localStorage.removeItem('user');
                window.location.href = '/';
                return;
            }

            if (!response.ok) throw new Error("Sunucu hatası");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let partialBuffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = partialBuffer + decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                partialBuffer = lines.pop();

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    // SSE formatı mı (data: ...) yoksa direkt JSON/Metin mi?
                    const message = trimmedLine.startsWith('data: ')
                        ? trimmedLine.replace(/^data: /, '')
                        : trimmedLine;

                    if (message === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(message);

                        // Farklı formatları kontrol et
                        let content = "";
                        if (parsed.choices?.[0]?.delta?.content) {
                            content = parsed.choices[0].delta.content; // OpenAI formatı
                        } else if (parsed.answer) {
                            content = parsed.answer; // Senin RAG servisinin formatı
                        } else if (typeof parsed === 'string') {
                            content = parsed;
                        }

                        if (content) {
                            setIsThinking(false);
                        }

                        accumulatedText += content;

                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1].text = accumulatedText;
                            return updated;
                        });
                    } catch (e) {
                        // Eğer JSON değilse, düz metin olarak ekle (ham akış)
                        accumulatedText += message;
                        setIsThinking(false);
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1].text = accumulatedText;
                            return updated;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("AI Hatası:", error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = 'Bir hata oluştu.';
                return updated;
            });
        } finally {
            setIsLoading(false);
            setIsThinking(false);
        }
    };

    return (
        <div className="ai-chat-container">
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-title">
                            <AILogo size={24} color="white" className="ai-header-logo" />
                            <h3 style={{ margin: 0 }}>Akıllı Asistan</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="ai-close-btn" title="Kapat">
                            <XIcon size={20} color="white" />
                        </button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`ai-message-wrapper ${msg.sender}`}>
                                {msg.sender === 'ai' && (
                                    <div className={`ai-avatar ${index === messages.length - 1 && isThinking ? 'spinning' : ''}`}>
                                        <AILogo size={18} color="white" />
                                    </div>
                                )}
                                <div className={`ai-message ${msg.sender}`}>
                                    {msg.sender === 'ai' && index === messages.length - 1 && isThinking ? (
                                        <div className="ai-thinking">
                                            <div className="ai-thinking-dots">
                                                <div className="ai-thinking-dot"></div>
                                                <div className="ai-thinking-dot"></div>
                                                <div className="ai-thinking-dot"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="ai-chat-footer">
                        <textarea
                            className="ai-chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Bir soru yazın..."
                            disabled={isLoading}
                            rows="1"
                        />
                        <button type="submit" className="ai-chat-send-btn" disabled={isLoading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button className="ai-chat-toggle-btn" onClick={() => setIsOpen(true)}>
                    <AILogo size={32} />
                </button>
            )}
        </div>
    );
}

export default AIChat;