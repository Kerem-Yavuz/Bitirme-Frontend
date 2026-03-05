import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookIcon, UsersIcon } from './icons';
import './App.css';

const teacherCards = [
    { title: 'Derslerim', icon: BookIcon, desc: 'Atanmış derslerinizi ve saatlerini görüntüleyin', path: '/teacher-panel/lessons', color: '#27ae60' },
];

const TeacherPanel = () => {
    const navigate = useNavigate();

    return (
        <div style={{ width: '100%', padding: '40px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>Öğretmen Paneli</h1>
            <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '40px' }}>Derslerinizi ve öğrenci listelerinizi görüntüleyin</p>

            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '24px',
                justifyContent: 'center', maxWidth: '900px', margin: '0 auto'
            }}>
                {teacherCards.map((card, i) => {
                    const IconComponent = card.icon;
                    return (
                        <div
                            key={i}
                            onClick={() => navigate(card.path)}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '30px',
                                width: '250px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                borderTop: `5px solid ${card.color}`,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                textAlign: 'center'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                            }}
                        >
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                <IconComponent size={40} color={card.color} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{card.title}</h3>
                            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '13px' }}>{card.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeacherPanel;
