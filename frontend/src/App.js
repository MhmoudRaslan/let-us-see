import React, { useState, useRef, useEffect } from 'react';
import { Send, Moon, Sun, Menu, Plus, Trash2, Copy, Check } from 'lucide-react';
import { fetchHealthCheck, callAnthropicProxy } from './services/api';
import './App.css';

export default function AskRaslan() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [conversations, setConversations] = useState([{ id: 1, name: 'New Chat', messages: [] }]);
  const [currentConvId, setCurrentConvId] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [status, setStatus] = useState('Loading...');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const currentConv = conversations.find(c => c.id === currentConvId);
    if (currentConv) {
      setMessages(currentConv.messages);
    }
  }, [currentConvId, conversations]);

  useEffect(() => {
    fetchHealthCheck()
      .then(data => setStatus(data.status))
      .catch(err => setStatus('Error: ' + err.message));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      };

      // Call backend proxy instead of api.anthropic.com
      const data = await callAnthropicProxy(payload);

      if (data.content && data.content[0]) {
        const assistantMessage = {
          role: 'assistant',
          content: data.content[0].text,
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);

        // Update conversation
        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConvId
              ? { ...conv, messages: updatedMessages, name: conv.name === 'New Chat' ? input.slice(0, 30) + '...' : conv.name }
              : conv
          )
        );
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. Make sure the Claude API is properly configured.`,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const newConversation = () => {
    const newId = Math.max(...conversations.map(c => c.id), 0) + 1;
    setConversations([...conversations, { id: newId, name: 'New Chat', messages: [] }]);
    setCurrentConvId(newId);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) return;
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (currentConvId === id) {
      setCurrentConvId(filtered[0].id);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConvId ? { ...conv, messages: [], name: 'New Chat' } : conv
      )
    );
  };

  const copyMessage = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.map((part, i) => {
      if (part.type === 'code') {
        return (
          <pre key={i} className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-4 rounded-lg overflow-x-auto my-2`}>
            <code className="text-sm">{part.content}</code>
          </pre>
        );
      }
      return (
        <div key={i} className="whitespace-pre-wrap">
          {part.content.split('\n').map((line, j) => (
            <React.Fragment key={j}>
              {line}
              {j < part.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    });
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-r ${darkMode ? 'border-gray-800' : 'border-gray-200'} overflow-hidden flex flex-col`}>
        <div className="p-4 space-y-2 flex-1 overflow-hidden flex flex-col">
          <button
            onClick={newConversation}
            className={`w-full flex items-center gap-2 p-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition`}
          >
            <Plus size={20} />
            <span>New Chat</span>
          </button>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${currentConvId === conv.id ? (darkMode ? 'bg-gray-800' : 'bg-gray-200') : (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100')} transition group`}
              >
                <div className="flex-1 truncate" onClick={() => setCurrentConvId(conv.id)}>
                  {conv.name}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Ask Raslan
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
              title="Clear chat"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                  Ask Raslan
                </h2>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Your AI assistant powered by Claude
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">{renderMessage(msg.content)}</div>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition flex-shrink-0`}
                        title="Copy message"
                      >
                        {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className={`flex gap-2 max-w-4xl mx-auto p-2 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Raslan anything..."
              className={`flex-1 bg-transparent outline-none resize-none p-2 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              rows="1"
              style={{ maxHeight: '200px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-xl transition ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <p className={`text-center text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}