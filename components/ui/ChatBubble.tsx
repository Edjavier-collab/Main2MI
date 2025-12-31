'use client';

import React from 'react';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
    message: ChatMessage;
    isTyping?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isTyping = false }) => {
    const isUser = message.author === 'user';

    // User bubbles: Primary color with white text
    // Patient bubbles: Light neutral background with dark text
    const bubbleClasses = isUser
        ? 'bg-[var(--color-primary)] text-white self-end rounded-l-[var(--radius-lg)] rounded-t-[var(--radius-lg)]'
        : 'bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] self-start rounded-r-[var(--radius-lg)] rounded-t-[var(--radius-lg)]';

    const typingIndicator = (
        <div className="flex items-center space-x-1.5 py-1" aria-label="Patient is typing">
            <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce"></div>
        </div>
    );

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-fade-in`}>
            <div
                className={`max-w-[85%] md:max-w-md lg:max-w-lg px-4 py-3 shadow-[var(--shadow-sm)] ${bubbleClasses}`}
            >
                {isTyping ? typingIndicator : (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.text}</p>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
