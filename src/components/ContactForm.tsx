import React, { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8080/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.', {
          duration: 5000,
          position: 'bottom-center',
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
          },
        });
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again later.', {
        duration: 5000,
        position: 'bottom-center',
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        required
        rows={4}
        className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      ></textarea>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}