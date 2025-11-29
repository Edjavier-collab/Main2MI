import React, { useState, useEffect } from 'react';

interface DevEmail {
    id: string;
    timestamp: string;
    to: string;
    subject: string;
    preview: string;
    html?: string;
    text?: string;
}

const DevEmailViewer: React.FC = () => {
    const [emails, setEmails] = useState<DevEmail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEmail, setSelectedEmail] = useState<DevEmail | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/api/dev/emails`);
            if (!res.ok) throw new Error('Failed to fetch emails');
            const data = await res.json();
            setEmails(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dev emails:', err);
            setError('Could not connect to backend dev inbox');
        } finally {
            setLoading(false);
        }
    };

    const clearInbox = async () => {
        if (!confirm('Clear all intercepted emails?')) return;
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            await fetch(`${backendUrl}/api/dev/emails`, { method: 'DELETE' });
            setEmails([]);
            setSelectedEmail(null);
        } catch (err) {
            console.error('Error clearing inbox:', err);
        }
    };

    useEffect(() => {
        if (isOpen) fetchEmails();
    }, [isOpen]);

    if (!isDev) return null;

    if (!isOpen) {
        return (
            <div className="mt-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase px-4 mb-2">Developer Tools</h2>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div 
                        onClick={() => setIsOpen(true)}
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-amber-600 font-medium">
                            <i className="fa-solid fa-envelope mr-2"></i>
                            View Intercepted Emails
                        </span>
                        <i className="fa fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">
                        <i className="fa-solid fa-inbox mr-2 text-amber-500"></i>
                        Dev Email Inbox
                    </h2>
                    <div className="flex space-x-2">
                        <button 
                            onClick={fetchEmails} 
                            className="p-2 text-gray-600 hover:text-sky-500 transition"
                            title="Refresh"
                        >
                            <i className="fa fa-refresh"></i>
                        </button>
                        <button 
                            onClick={clearInbox} 
                            className="p-2 text-gray-600 hover:text-red-500 transition"
                            title="Clear Inbox"
                        >
                            <i className="fa fa-trash"></i>
                        </button>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 text-gray-600 hover:text-gray-900 transition"
                        >
                            <i className="fa fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Email List */}
                    <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
                        {loading && <p className="p-4 text-center text-gray-500">Loading...</p>}
                        {error && <p className="p-4 text-center text-red-500 text-sm">{error}</p>}
                        {!loading && !error && emails.length === 0 && (
                            <p className="p-8 text-center text-gray-400">No emails found</p>
                        )}
                        {emails.map(email => (
                            <div 
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`p-3 border-b cursor-pointer hover:bg-sky-50 transition ${selectedEmail?.id === email.id ? 'bg-sky-100 border-l-4 border-l-sky-500' : ''}`}
                            >
                                <p className="font-semibold text-sm text-gray-800 truncate">{email.subject}</p>
                                <p className="text-xs text-gray-500 mb-1">{new Date(email.timestamp).toLocaleTimeString()}</p>
                                <p className="text-xs text-gray-600 truncate">To: {email.to}</p>
                            </div>
                        ))}
                    </div>

                    {/* Email Content */}
                    <div className="w-2/3 overflow-y-auto bg-white p-6">
                        {selectedEmail ? (
                            <div>
                                <div className="mb-6 border-b pb-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedEmail.subject}</h3>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <p><strong>To:</strong> {selectedEmail.to}</p>
                                        <p>{new Date(selectedEmail.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="prose max-w-none">
                                    {selectedEmail.html ? (
                                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-sans text-gray-700">{selectedEmail.text}</pre>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>Select an email to view</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevEmailViewer;

