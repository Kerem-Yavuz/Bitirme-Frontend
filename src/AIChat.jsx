import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './App.css';
// 1. API dosyamızı import ediyoruz
import api from './api';

function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Merhaba Devrim! Ben senin akıllı asistanınım. Sana nasıl yardımcı olabilirim?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

        try {
            // 2. api instance'ındaki baseURL'i kullanarak dinamik URL oluşturuyoruz
            // api.defaults.baseURL genellikle "http://localhost:8001/api" olur
            const response = await fetch(`${api.defaults.baseURL}/ai/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Eğer api.js'de tanımladığın özel headerlar varsa buraya ekleyebilirsin
                },
                body: JSON.stringify({ question: userMessage }),
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
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                    const message = trimmedLine.replace(/^data: /, '');

                    try {
                        const parsed = JSON.parse(message);
                        const content = parsed.choices[0].delta.content || "";
                        accumulatedText += content;

                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1].text = accumulatedText;
                            return updated;
                        });
                    } catch (e) {
                        partialBuffer = line + partialBuffer;
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
        }
    };

    return (
        <div className="ai-chat-container">
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <h3 style={{ margin: 0 }}>🤖 Akıllı Asistan</h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`ai-message ${msg.sender}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
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

            <button className="ai-chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '×' : 'AI'}
            </button>
        </div>
    );
}

export default AIChat;