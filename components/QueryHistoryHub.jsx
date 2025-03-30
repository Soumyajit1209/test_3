import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Send, Mic, MessageSquare, Users, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const QueryHistoryHub = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Single API endpoint
  const API_ENDPOINT = '/api/query-history';

  // Fetch all data at component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINT);
      const data = response.data;
      
      // Extract companies from the response
      const extractedCompanies = data.companies.map(company => ({
        id: company.id,
        name: company.name,
        userCount: company.users.length,
        users: company.users.map(user => ({
          id: user.id,
          name: user.name,
          messageCount: user.messages.length,
          messages: user.messages
        }))
      }));
      
      setCompanies(extractedCompanies);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setSelectedUser(null);
    // Extract users for the selected company
    setUsers(company.users);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // Extract messages for the selected user
    setMessages(user.messages);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    try {
      const response = await axios.post(API_ENDPOINT, {
        companyId: selectedCompany.id,
        userId: selectedUser.id,
        message: {
          text: newMessage,
          type: 'text'
        }
      });
      
      // Replace temp message with actual message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {...response.data.message, pending: false} : msg
      ));
      
      // Update local data structures to reflect the new message
      updateLocalData(selectedCompany.id, selectedUser.id, response.data.message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error - mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {...msg, failed: true, pending: false} : msg
      ));
    }
  };

  // Update local data structures with new message
  const updateLocalData = (companyId, userId, message) => {
    // Update companies state
    setCompanies(prevCompanies => 
      prevCompanies.map(company => {
        if (company.id === companyId) {
          const updatedUsers = company.users.map(user => {
            if (user.id === userId) {
              return {
                ...user,
                messageCount: user.messageCount + 1,
                messages: [...user.messages, message]
              };
            }
            return user;
          });
          
          return {
            ...company,
            users: updatedUsers
          };
        }
        return company;
      })
    );
    
    // Update current users list if needed
    if (selectedCompany && selectedCompany.id === companyId) {
      setUsers(prevUsers => 
        prevUsers.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              messageCount: user.messageCount + 1,
              messages: [...user.messages, message]
            };
          }
          return user;
        })
      );
    }
  };

  const handleVoiceMessage = () => {
    setIsRecording(!isRecording);
    // In production, this would handle voice recording and API calls
  };

  const handleAddUser = async () => {
    // In a real implementation, you would:
    // 1. Show a modal to collect user details
    // 2. Send request to add user via the API
    // 3. Update local state
    
    alert('Add user functionality would go here');
  };

  const handleBack = () => {
    if (selectedUser) {
      setSelectedUser(null);
    } else if (selectedCompany) {
      setSelectedCompany(null);
    }
  };

  // Animation variants
  const panelVariants = {
    hidden: (custom) => ({
      x: custom === 'right' ? '100%' : custom === 'left' ? '-100%' : 0,
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1
      }
    },
    exit: (custom) => ({
      x: custom === 'right' ? '100%' : custom === 'left' ? '-100%' : 0,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    })
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1, 
      y: 0,
      transition: { 
        delay: custom * 0.1,
        duration: 0.4
      }
    })
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Companies Panel */}
        {!selectedCompany && (
          <motion.div
            key="companies-panel"
            className="flex-shrink-0 w-72 bg-gray-800 border-r border-gray-700 shadow-lg z-10"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom="left"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center">
                <Building className="text-blue-400 mr-2" size={20} />
                <h2 className="text-xl font-bold">Companies</h2>
              </div>
            </div>
            
            <div className="p-3 overflow-y-auto h-full">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <motion.div 
                    className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {companies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-all transform hover:scale-102 border border-transparent hover:border-gray-500"
                      onClick={() => handleCompanySelect(company)}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium text-lg">{company.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{company.userCount} users</div>
                    </motion.div>
                  ))}
                  
                  {companies.length === 0 && !loading && (
                    <motion.div 
                      className="text-center py-8 text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p>No companies found</p>
                    </motion.div>
                  )}
                </div>
              )}
              
              <motion.div 
                className="mt-8 p-4 bg-gray-700 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="font-medium flex items-center">
                  <MessageSquare size={16} className="mr-2 text-blue-400" />
                  Query History Hub
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Select your company to view user conversations and analytics.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Users Panel */}
        {selectedCompany && !selectedUser && (
          <motion.div
            key="users-panel"
            className="flex-shrink-0 w-72 bg-gray-800 border-r border-gray-700 shadow-lg z-20"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={selectedCompany && !selectedUser ? "left" : "right"}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center">
                <motion.button 
                  onClick={handleBack}
                  className="p-2 rounded-full hover:bg-gray-700 mr-2 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <div className="flex items-center">
                  <Users className="text-blue-400 mr-2" size={20} />
                  <h2 className="text-xl font-bold">Users</h2>
                </div>
              </div>
              
              <motion.button 
                onClick={handleAddUser}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300"
                title="Add new user"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={20} />
              </motion.button>
            </div>
            
            <div className="p-3 overflow-y-auto h-full">
              <div className="space-y-2">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-all transform hover:scale-102 border border-transparent hover:border-gray-500"
                    onClick={() => handleUserSelect(user)}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-medium text-lg">{user.name}</div>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <MessageSquare size={14} className="mr-1" />
                      {user.messageCount} messages
                    </div>
                  </motion.div>
                ))}
                
                {users.length === 0 && (
                  <motion.div 
                    className="text-center py-8 text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p>No users found</p>
                  </motion.div>
                )}
              </div>
              
              {selectedCompany && (
                <motion.div 
                  className="mt-8 p-4 bg-gray-700 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="font-medium">{selectedCompany.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{selectedCompany.userCount} users total</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Chat Panel */}
        {selectedUser && (
          <motion.div
            key="chat-panel"
            className="flex-grow bg-gray-900 relative z-30"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom="right"
          >
            <div className="flex flex-col h-full">
              {/* Chat header */}
              <div className="flex items-center p-5 border-b border-gray-800 bg-gray-800">
                <motion.button 
                  onClick={handleBack}
                  className="p-2 rounded-full hover:bg-gray-700 mr-3 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <div>
                  <div className="font-medium text-lg">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400">{selectedUser.messageCount} messages</div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <motion.div 
                    className="flex flex-col items-center justify-center h-full text-gray-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <MessageSquare size={48} className="mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation by sending a message</p>
                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div 
                      key={message.id} 
                      className={`max-w-md ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                      <div 
                        className={`p-4 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-700 rounded-bl-none'
                        } ${message.pending ? 'opacity-70' : ''} ${message.failed ? 'border-red-500 border' : ''}`}
                      >
                        <div>{message.text}</div>
                      </div>
                      <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'} text-gray-400`}>
                        {message.timestamp}
                        {message.pending && <span className="ml-2">Sending...</span>}
                        {message.failed && <span className="ml-2 text-red-400">Failed to send</span>}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              {/* Input area */}
              <motion.div 
                className="p-4 border-t border-gray-800 bg-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-grow bg-transparent px-4 py-3 focus:outline-none text-white"
                  />
                  <motion.button 
                    onClick={handleVoiceMessage}
                    className={`p-3 mx-1 rounded-full transition-colors ${
                      isRecording ? 'text-red-500 bg-gray-600' : 'text-gray-400 hover:bg-gray-600'
                    }`}
                    title="Record voice message"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isRecording ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.5 }} : {}}
                  >
                    <Mic size={20} />
                  </motion.button>
                  <motion.button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 mx-1 rounded-full transition-colors ${
                      newMessage.trim() 
                        ? 'text-blue-400 hover:bg-gray-600 hover:text-blue-300' 
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                    whileHover={newMessage.trim() ? { scale: 1.1 } : {}}
                    whileTap={newMessage.trim() ? { scale: 0.9 } : {}}
                  >
                    <Send size={20} />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Empty state when no panels are active */}
        {!selectedUser && selectedCompany && (
          <motion.div 
            key="empty-state"
            className="flex items-center justify-center flex-grow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.3
                }}
              >
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
              </motion.div>
              <motion.h3 
                className="text-xl font-medium text-gray-300 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Query History Hub
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Select a user to view conversation history
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QueryHistoryHub;