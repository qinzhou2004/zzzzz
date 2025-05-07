import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import config from '../templates/bot-config';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const chatContainerRef = useRef(null);

  // 初始化对话线程
  useEffect(() => {
    const initializeThread = async () => {
      try {
        const response = await fetch('/api/init-thread');
        const data = await response.json();
        setThreadId(data.threadId);
        setMessages([{
          role: 'assistant',
          content: config.welcomeMessage || '¡Hola! Soy tu asistente. ¿En qué puedo ayudarte hoy?'
        }]);
      } catch (error) {
        console.error('Error initializing thread:', error);
        setMessages([{
          role: 'assistant',
          content: config.errorMessage || 'Disculpa, estoy teniendo problemas. ¿Podrías intentarlo de nuevo?'
        }]);
      }
    };
    
    initializeThread();
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          threadId: threadId 
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: config.errorMessage || 'Disculpa, estoy teniendo dificultades. ¿Podrías intentarlo de nuevo?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={styles.container}
      style={{
        '--color-primary': config.cssConfig.primaryColor,
        '--color-secondary': config.cssConfig.secondaryColor,
        '--message-radius': config.cssConfig.messageRadius,
        '--input-radius': config.cssConfig.inputRadius,
        '--chat-width': config.cssConfig.chatWidth,
        '--chat-height': config.cssConfig.chatHeight,
        '--font-family': config.cssConfig.fontFamily,
        '--font-size': config.cssConfig.fontSize,
        maxWidth: config.cssConfig.chatWidth,
        fontFamily: config.cssConfig.fontFamily,
        fontSize: config.cssConfig.fontSize
      }}
    >
      <Head>
        <title>{config.pageTitle || 'Chatbot'}</title>
        <meta name="description" content={config.subHeading || ''} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header 
        className={styles.header}
        style={{
          background: `linear-gradient(to right, ${config.cssConfig.secondaryColor}, ${config.cssConfig.primaryColor})`
        }}
      >
        <h1>{config.mainHeading || 'Chatbot'}</h1>
        {config.subHeading && <p>{config.subHeading}</p>}
      </header>

      <div className={styles.chatLayout}>
        <div 
          ref={chatContainerRef}
          className={styles.chatContainer}
        >
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage
              } ${index === 0 ? styles.firstMessage : ''}`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && config.cssConfig.showTypingIndicator && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.inputPlaceholder || 'Escribe tu mensaje aquí...'}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {config.submitButtonText || 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}