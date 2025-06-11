import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setTicket(data.ticket);
        } else {
          setError(data.message || "Failed to fetch ticket");
        }
      } catch (err) {
        setError("Something went wrong");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'done':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSkillColor = (skill) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    const index = skill.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  if (!ticket) return <div className="text-center mt-10">Ticket not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Ticket Details</h2>
          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            {ticket.priority && (
              <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Main Ticket Info */}
          <div className="card bg-gray-800 shadow-xl p-6 rounded-lg hover:shadow-2xl transition-shadow duration-200">
            <h3 className="text-2xl font-bold text-white mb-4">{ticket.title}</h3>
            <p className="text-gray-300 text-lg leading-relaxed">{ticket.description}</p>
          </div>

          {/* AI Analysis Section */}
          {ticket.helpfulNotes && (
            <div className="card bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl p-6 rounded-lg hover:shadow-2xl transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-white">AI Analysis</h4>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 text-gray-300">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-300">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-primary font-semibold">{children}</strong>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-white mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold text-white mb-2">{children}</h3>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-900 text-primary px-2 py-1 rounded">{children}</code>
                      ),
                    }}
                  >
                    {ticket.helpfulNotes}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div className="card bg-gray-800 shadow-xl p-6 rounded-lg hover:shadow-2xl transition-shadow duration-200">
            <h4 className="text-xl font-semibold text-white mb-4">Additional Information</h4>
            <div className="grid gap-4">
              {ticket.relatedSkills?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Related Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {ticket.relatedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium text-white ${getSkillColor(skill)} hover:scale-105 transition-transform cursor-default`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.assignedTo && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Assigned To</h5>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {ticket.assignedTo.email[0].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white">{ticket.assignedTo.email}</p>
                  </div>
                </div>
              )}

              {ticket.createdAt && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Created</h5>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-white">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}