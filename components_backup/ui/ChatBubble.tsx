import React from 'react';
import { ChatMessage } from '../../types';
import './ChatBubble.css';

interface ChatBubbleProps {
    message: ChatMessage;
    isTyping?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isTyping = false }) => {
    const isUser = message.author === 'user';

    const typingIndicator = (
        <div className="chat-bubble__typing-indicator">
            <div className="chat-bubble__typing-dot" style={{ animationDelay: '-0.3s' }}></div>
            <div className="chat-bubble__typing-dot" style={{ animationDelay: '-0.15s' }}></div>
            <div className="chat-bubble__typing-dot"></div>
        </div>
    );

    return (
        <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--patient'}`}>
            <div className={`chat-bubble__content ${isUser ? 'chat-bubble__content--user' : 'chat-bubble__content--patient'}`}>
                {isTyping ? typingIndicator : <p className="chat-bubble__text">{message.text}</p>}
            </div>
        </div>
    );
};

export default ChatBubble;
