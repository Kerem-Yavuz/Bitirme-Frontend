import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import './App.css';
// 1. API dosyamızı import ediyoruz
import api from './api';
import { AILogo, XIcon, MaximizeIcon, MinimizeIcon, ClockIcon } from './icons';

const GUNLER = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function formatHour(hourStr) {
    if (!hourStr) return '-';
    const parts = hourStr.split(':');
    const h = parseInt(parts[0]);
    return `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
}

function extractRecommendations(text) {
    if (!text) return { cleanText: "", recommendations: null };

    const regex = /```recommendations\s*([\s\S]*?)(?:```|$)/;
    const match = text.match(regex);

    let cleanText = text;
    let recommendations = null;

    if (match) {
        cleanText = text.replace(/```recommendations[\s\S]*?(?:```|$)/g, '').trim();
        const jsonStr = match[1].trim();
        if (jsonStr) {
            try {
                if (text.includes('```', match.index + 19)) {
                    recommendations = JSON.parse(jsonStr);
                }
            } catch (e) {
                // Incomplete JSON or parsing error, wait until stream closes
            }
        }
    }
    return { cleanText, recommendations };
}

function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Modal ve ders seçimi durumları
    const [selectedCourse, setSelectedCourse] = useState(null); // { lessonID, lessonName }
    const [courseGroups, setCourseGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [enrolledGroups, setEnrolledGroups] = useState([]);

    const handleShowCourseGroups = async (course) => {
        setSelectedCourse(course);
        setGroupsLoading(true);
        setCourseGroups([]);
        try {
            const [groupsRes, myGroupsRes] = await Promise.all([
                api.get(`/lessonGroups?lessonID=${course.lessonID}`),
                api.get('/lessonGroups/my')
            ]);
            setCourseGroups(groupsRes.data?.data || []);
            setEnrolledGroups(myGroupsRes.data?.data || []);
        } catch (err) {
            console.error("Gruplar çekilemedi:", err);
        } finally {
            setGroupsLoading(false);
        }
    };

    const derseKayitOl = async (grup) => {
        try {
            const response = await api.post('/lessonGroups/register', {
                lessonGroupID: grup.lessonGroupID
            });

            if (response.data && response.data.status) {
                const res = await api.get('/lessonGroups/my');
                if (res.data && res.data.status) {
                    setEnrolledGroups(res.data.data || []);
                }
                alert(`${grup.lessonGroupName} dersine başarıyla kaydoldunuz!`);
            }
        } catch (error) {
            const mesaj = error.response?.data?.message || "Kayıt olurken bir hata oluştu veya zaten kayıtlısınız.";
            alert(mesaj);
        }
    };

    const kayitliIdler = enrolledGroups.map(d => d.lessonGroupID);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = storedUser.fullName ? storedUser.fullName.split(' ')[0] : 'öğrenci';

    const [messages, setMessages] = useState([
        { sender: 'ai', text: `Merhaba ${userName}! Ben senin akıllı asistanınım. Sana nasıl yardımcı olabilirim?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const handleScroll = () => {
        if (!chatMessagesRef.current) return;
        const { scrollHeight, clientHeight, scrollTop } = chatMessagesRef.current;
        // Eğer kullanıcı alttan 50px'den daha fazla yukarı scroll yaptıysa otomatik aşağı kaydırmayı durdur
        const isAtBottom = scrollHeight - clientHeight - scrollTop < 50;
        shouldAutoScrollRef.current = isAtBottom;
    };

    useEffect(() => {
        if (shouldAutoScrollRef.current && chatMessagesRef.current) {
            const lastMessage = messages[messages.length - 1];
            // Kullanıcı kendi mesaj gönderdiğinde yumuşak, stream gelirken anlık scroll yapalım
            const behavior = lastMessage?.sender === 'user' ? 'smooth' : 'auto';
            chatMessagesRef.current.scrollTo({
                top: chatMessagesRef.current.scrollHeight,
                behavior
            });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        shouldAutoScrollRef.current = true; // Yeni mesaj gönderildiğinde en alta kaydır
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

                        if (parsed.route) {
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    route: parsed.route
                                };
                                return updated;
                            });
                        }

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
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                text: accumulatedText
                            };
                            return updated;
                        });
                    } catch (e) {
                        // Eğer JSON değilse, düz metin olarak ekle (ham akış)
                        accumulatedText += message;
                        setIsThinking(false);
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                text: accumulatedText
                            };
                            return updated;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("AI Hatası:", error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    text: 'Bir hata oluştu.'
                };
                return updated;
            });
        } finally {
            setIsLoading(false);
            setIsThinking(false);
        }
    };

    return (
        <div className={`ai-chat-container ${isFullScreen ? 'fullscreen-container' : ''}`}>
            {isOpen && (
                <div className={`ai-chat-window ${isFullScreen ? 'fullscreen' : ''}`}>
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-title">
                            <AILogo size={24} color="white" className="ai-header-logo" />
                            <h3 style={{ margin: 0 }}>Akıllı Asistan</h3>
                        </div>
                        <div className="ai-chat-header-actions">
                            <button 
                                type="button" 
                                onClick={() => setIsFullScreen(!isFullScreen)} 
                                className="ai-action-btn" 
                                title={isFullScreen ? "Küçült" : "Tam Ekran"}
                            >
                                {isFullScreen ? <MinimizeIcon size={18} color="white" /> : <MaximizeIcon size={18} color="white" />}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsFullScreen(false);
                                }} 
                                className="ai-close-btn" 
                                title="Kapat"
                            >
                                <XIcon size={20} color="white" />
                            </button>
                        </div>
                    </div>

                    <div 
                        className="ai-chat-messages" 
                        ref={chatMessagesRef}
                        onScroll={handleScroll}
                    >
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
                                        <>
                                            {(() => {
                                                const { cleanText, recommendations } = extractRecommendations(msg.text);
                                                return (
                                                    <>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkMath, remarkGfm]}
                                                            rehypePlugins={[rehypeKatex]}
                                                            components={{
                                                                p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
                                                                table: ({ node, ...props }) => (
                                                                    <div style={{ overflowX: 'auto', width: '100%', margin: '12px 0' }}>
                                                                        <table {...props} />
                                                                    </div>
                                                                ),
                                                            }}
                                                        >
                                                            {cleanText}
                                                        </ReactMarkdown>
                                                        {msg.route && (
                                                            <div className="ai-route-badge">
                                                                {msg.route === 'easy' ? '⚡ Kolay Soru Modeli' : '🧠 Detaylı Analiz Modeli'}
                                                            </div>
                                                        )}
                                                        {recommendations && recommendations.recommended_courses && recommendations.recommended_courses.length > 0 && (
                                                            <div className="ai-course-recommendations">
                                                                <p className="ai-recommendation-title">Önerilen Dersler:</p>
                                                                <div className="ai-recommendation-buttons">
                                                                    {recommendations.recommended_courses.map((course, cIdx) => (
                                                                        <button 
                                                                            key={cIdx} 
                                                                            onClick={() => handleShowCourseGroups(course)}
                                                                            className="ai-recommend-btn"
                                                                        >
                                                                            📘 {course.lessonName} Al/İncele
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </>
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

            {/* DERS SEÇİM MODALİ */}
            {selectedCourse && (
                <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
                    <div className="modal-icerik" style={{ width: '750px', maxWidth: '95%', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: '0', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                            {selectedCourse.lessonName} — Grup Seçimi
                        </h3>

                        {groupsLoading ? (
                            <p style={{ padding: '20px 0', textAlign: 'center' }}>Gruplar aranıyor...</p>
                        ) : courseGroups.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="modern-table" style={{ marginTop: '15px', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Grup Adı</th>
                                            <th>Kontenjan</th>
                                            <th>Saatler</th>
                                            <th style={{ textAlign: 'center' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courseGroups.map(grup => {
                                            const isSelected = kayitliIdler.includes(grup.lessonGroupID);
                                            const hours = grup.hours || [];

                                            return (
                                                <tr key={grup.lessonGroupID} style={{
                                                    backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                                                    transition: 'background-color 0.3s'
                                                }}>
                                                    <td style={{ fontWeight: 'bold' }}>{grup.lessonGroupName}</td>
                                                    <td style={{ textAlign: 'center' }}>{grup.maxNumber || '-'}</td>
                                                    <td>
                                                        {hours.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {hours.map((h, idx) => (
                                                                    <span key={idx} style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                        fontSize: '12px', backgroundColor: '#f1f3f5',
                                                                        padding: '3px 8px', borderRadius: '4px', color: '#495057'
                                                                    }}>
                                                                        <ClockIcon size={12} color="#868e96" />
                                                                        {GUNLER[h.day] || '?'} {formatHour(h.hour)}
                                                                        {h.room && <span style={{ color: '#868e96' }}>({h.room})</span>}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isSelected ? (
                                                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
                                                                ✓ Seçildi
                                                            </span>
                                                        ) : (
                                                            <button className="btn-kayit-ol" onClick={() => derseKayitOl(grup)}>
                                                                Seç ve Kaydol
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: '#e74c3c', margin: '30px 0', fontWeight: 'bold', textAlign: 'center' }}>
                                Bu ders için henüz tanımlanmış bir grup/saat bulunmuyor.
                            </p>
                        )}

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setSelectedCourse(null)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIChat;