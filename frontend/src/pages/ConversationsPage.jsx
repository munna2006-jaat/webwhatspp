import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { HiOutlineSearch, HiOutlinePaperClip, HiOutlineEmojiHappy, HiOutlinePaperAirplane, HiOutlineDotsVertical, HiOutlineTag, HiOutlineUser, HiOutlineCalendar, HiOutlinePhotograph, HiOutlineDocumentText, HiOutlineVideoCamera, HiOutlineX, HiOutlineLocationMarker } from 'react-icons/hi';

// Common emoji set grouped by category
const EMOJI_DATA = {
  'Smileys': ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😠','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'Gestures': ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  'Objects': ['🎉','🎊','🎈','🎁','🏆','🥇','⭐','🌟','💫','✨','🔥','💯','🎯','💡','📌','📎','✅','❌','⚡','🚀','💰','📱','💻','⌚','📷','🎵','🎶'],
  'Faces': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦅','🦋','🌸','🌺','🌻','🌹','🌷']
};

export default function ConversationsPage() {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('Smileys');
  const [sendingFile, setSendingFile] = useState(false);
  const [filePreview, setFilePreview] = useState(null); // { file, type, previewUrl, caption }
  const messagesEndRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Close emoji/attach dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === data.contact._id);
        const updated = [...prev];
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...data.contact };
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        } else {
          updated.unshift(data.contact);
        }
        return updated;
      });

      if (selectedContact?._id === data.message.contact || selectedContact?._id === data.contact._id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    });

    socket.on('message_status', (data) => {
      setMessages(prev =>
        prev.map(m => m.metaMessageId === data.metaMessageId ? { ...m, status: data.status } : m)
      );
    });

    return () => {
      socket.off('new_message');
      socket.off('message_status');
    };
  }, [socket, selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations/list');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (contact) => {
    setSelectedContact(contact);
    setFilePreview(null);
    try {
      const res = await api.get(`/messages/${contact._id}`);
      setMessages(res.data.messages || []);
      await api.post('/messages/mark-read', { contactId: contact._id }).catch(() => {});
      setConversations(prev =>
        prev.map(c => c._id === contact._id ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    try {
      await api.post('/messages/send', {
        contactId: selectedContact._id,
        type: 'text',
        content: { body: newMessage }
      });
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (filePreview) {
        sendFileMessage();
      } else {
        sendMessage();
      }
    }
  };

  // --- Emoji ---
  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // --- File Attachment ---
  const handleAttachClick = (acceptType) => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let type = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    const previewUrl = type === 'image' ? URL.createObjectURL(file) : null;

    setFilePreview({ file, type, previewUrl, caption: '' });
    e.target.value = ''; // Reset input
  };

  const cancelFilePreview = () => {
    if (filePreview?.previewUrl) URL.revokeObjectURL(filePreview.previewUrl);
    setFilePreview(null);
  };

  const sendFileMessage = async () => {
    if (!filePreview || !selectedContact || sendingFile) return;
    setSendingFile(true);

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', filePreview.file);

      const uploadRes = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const mediaUrl = uploadRes.data.url;

      // Send via WhatsApp API
      await api.post('/messages/send', {
        contactId: selectedContact._id,
        type: filePreview.type,
        content: {
          mediaUrl,
          caption: filePreview.caption || '',
          filename: filePreview.file.name
        }
      });

      cancelFilePreview();
    } catch (err) {
      console.error('Send file error:', err);
      alert('File send karne mein error aaya. File size check karo (max 16MB).');
    } finally {
      setSendingFile(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 86400000 * 7) {
      return d.toLocaleDateString('en-IN', { weekday: 'short' });
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' });
  };

  const getStatusTicks = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '🕐';
    }
  };

  // Render message content (text, image, document, video, etc.)
  const renderMessageContent = (msg) => {
    switch (msg.type) {
      case 'image':
        return (
          <div>
            {msg.content?.mediaUrl && (
              <img
                src={msg.content.mediaUrl}
                alt="Shared image"
                style={{ maxWidth: 260, borderRadius: 8, marginBottom: msg.content?.caption ? 6 : 0, cursor: 'pointer' }}
                onClick={() => window.open(msg.content.mediaUrl, '_blank')}
              />
            )}
            {msg.content?.caption && <div>{msg.content.caption}</div>}
            {!msg.content?.mediaUrl && <div>📷 Image</div>}
          </div>
        );
      case 'video':
        return (
          <div>
            {msg.content?.mediaUrl ? (
              <video
                src={msg.content.mediaUrl}
                controls
                style={{ maxWidth: 260, borderRadius: 8, marginBottom: msg.content?.caption ? 6 : 0 }}
              />
            ) : (
              <div>🎥 Video</div>
            )}
            {msg.content?.caption && <div>{msg.content.caption}</div>}
          </div>
        );
      case 'document':
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 4px' }}
            onClick={() => msg.content?.mediaUrl && window.open(msg.content.mediaUrl, '_blank')}
          >
            <HiOutlineDocumentText style={{ fontSize: 22, flexShrink: 0, color: 'var(--brand-primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{msg.content?.filename || 'Document'}</div>
              {msg.content?.caption && <div style={{ fontSize: 12, opacity: 0.8 }}>{msg.content.caption}</div>}
            </div>
          </div>
        );
      case 'location':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlineLocationMarker style={{ fontSize: 18, color: 'var(--status-error)' }} />
            <span>📍 {msg.content?.name || 'Location'}</span>
          </div>
        );
      default:
        return <div>{msg.content?.body || msg.content?.caption || `[${msg.type}]`}</div>;
    }
  };

  const filteredConversations = conversations.filter(c =>
    !search || (c.name || c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="conversations-layout">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Chat List Panel */}
      <div className="chat-list-panel">
        <div className="chat-list-search">
          <div style={{ position: 'relative' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 36 }}
            />
          </div>
        </div>
        <div className="chat-list-items">
          {filteredConversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">No Conversations</div>
              <div className="empty-state-text">Conversations will appear here when contacts message you.</div>
            </div>
          ) : (
            filteredConversations.map(contact => (
              <div
                key={contact._id}
                className={`chat-list-item ${selectedContact?._id === contact._id ? 'active' : ''}`}
                onClick={() => selectConversation(contact)}
              >
                <div className="chat-avatar">
                  {getInitials(contact.name || contact.phone)}
                </div>
                <div className="chat-list-info">
                  <div className="chat-list-name">
                    <span>{contact.name || contact.phone}</span>
                    <span className="chat-list-time">{formatTime(contact.lastMessageAt)}</span>
                  </div>
                  <div className="chat-list-preview">
                    <span>{contact.lastMessagePreview || 'No messages yet'}</span>
                    {contact.unreadCount > 0 && (
                      <span className="chat-unread">{contact.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window-panel">
        {selectedContact ? (
          <>
            <div className="chat-window-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="chat-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                  {getInitials(selectedContact.name || selectedContact.phone)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedContact.name || selectedContact.phone}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selectedContact.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-icon btn-secondary"><HiOutlineSearch /></button>
                <button className="btn btn-icon btn-secondary"><HiOutlineDotsVertical /></button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={msg._id || i}
                  className={`message-bubble ${msg.direction === 'outgoing' ? 'outgoing' : 'incoming'}`}
                >
                  {renderMessageContent(msg)}
                  <div className="message-time">
                    <span>{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.direction === 'outgoing' && (
                      <span className={`message-ticks ${msg.status === 'read' ? 'read' : ''}`}>
                        {getStatusTicks(msg.status)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview Bar */}
            {filePreview && (
              <div className="file-preview-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  {filePreview.type === 'image' && filePreview.previewUrl ? (
                    <img src={filePreview.previewUrl} alt="Preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {filePreview.type === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {filePreview.file.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {(filePreview.file.size / 1024).toFixed(1)} KB • {filePreview.type}
                    </div>
                  </div>
                </div>
                <button onClick={cancelFilePreview} className="btn btn-icon btn-secondary" style={{ flexShrink: 0 }}>
                  <HiOutlineX />
                </button>
              </div>
            )}

            {/* Message Input Bar */}
            <div className="message-input-bar">
              {/* Emoji Picker */}
              <div style={{ position: 'relative' }} ref={emojiRef}>
                <button
                  className={`btn btn-icon btn-secondary ${showEmojiPicker ? 'active-btn' : ''}`}
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
                >
                  <HiOutlineEmojiHappy />
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <div className="emoji-categories">
                      {Object.keys(EMOJI_DATA).map(cat => (
                        <button
                          key={cat}
                          className={`emoji-cat-btn ${emojiCategory === cat ? 'active' : ''}`}
                          onClick={() => setEmojiCategory(cat)}
                        >
                          {cat === 'Smileys' ? '😀' : cat === 'Gestures' ? '👋' : cat === 'Hearts' ? '❤️' : cat === 'Objects' ? '🎉' : '🐶'}
                        </button>
                      ))}
                    </div>
                    <div className="emoji-grid">
                      {EMOJI_DATA[emojiCategory].map((emoji, i) => (
                        <button
                          key={i}
                          className="emoji-btn"
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachment Menu */}
              <div style={{ position: 'relative' }} ref={attachRef}>
                <button
                  className={`btn btn-icon btn-secondary ${showAttachMenu ? 'active-btn' : ''}`}
                  onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
                >
                  <HiOutlinePaperClip />
                </button>
                {showAttachMenu && (
                  <div className="attach-menu">
                    <button className="attach-menu-item" onClick={() => handleAttachClick('image/*')}>
                      <div className="attach-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}><HiOutlinePhotograph /></div>
                      <span>Photo</span>
                    </button>
                    <button className="attach-menu-item" onClick={() => handleAttachClick('video/*')}>
                      <div className="attach-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}><HiOutlineVideoCamera /></div>
                      <span>Video</span>
                    </button>
                    <button className="attach-menu-item" onClick={() => handleAttachClick('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar')}>
                      <div className="attach-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}><HiOutlineDocumentText /></div>
                      <span>Document</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input or Caption Input */}
              <input
                ref={inputRef}
                className="input"
                placeholder={filePreview ? "Add a caption..." : "Type a message..."}
                value={filePreview ? filePreview.caption : newMessage}
                onChange={(e) => {
                  if (filePreview) {
                    setFilePreview(prev => ({ ...prev, caption: e.target.value }));
                  } else {
                    setNewMessage(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
              />

              {/* Send Button */}
              <button
                className="message-send-btn"
                onClick={filePreview ? sendFileMessage : sendMessage}
                disabled={sendingFile}
                style={{ opacity: sendingFile ? 0.5 : 1 }}
              >
                {sendingFile ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <HiOutlinePaperAirplane style={{ transform: 'rotate(90deg)' }} />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">Select a Conversation</div>
            <div className="empty-state-text">Choose a contact from the left to start chatting</div>
          </div>
        )}
      </div>

      {/* Contact Detail Panel */}
      <div className="contact-detail-panel">
        {selectedContact ? (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="chat-avatar" style={{ width: 64, height: 64, fontSize: 24, margin: '0 auto 12px' }}>
                {getInitials(selectedContact.name || selectedContact.phone)}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedContact.name || 'Unknown'}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedContact.phone}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
                <span className="tag tag-blue">{selectedContact.status?.replace(/_/g, ' ') || 'Not Connected'}</span>
              </div>

              {selectedContact.tags?.length > 0 && (
                <div className="card" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectedContact.tags.map(tag => (
                      <span key={tag} className="tag tag-orange">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedContact.email && (
                <div className="card" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Email</div>
                  <div style={{ fontSize: 13 }}>{selectedContact.email}</div>
                </div>
              )}

              <div className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm"><HiOutlineTag style={{ fontSize: 14 }} /> Add Tag</button>
                  <button className="btn btn-secondary btn-sm"><HiOutlineUser style={{ fontSize: 14 }} /> Assign Agent</button>
                  <button className="btn btn-secondary btn-sm"><HiOutlineCalendar style={{ fontSize: 14 }} /> Schedule Follow-up</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">Contact Details</div>
            <div className="empty-state-text">Select a conversation to view contact info</div>
          </div>
        )}
      </div>
    </div>
  );
}
