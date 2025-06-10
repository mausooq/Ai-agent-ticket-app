import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const token = localStorage.getItem("token");

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        fetchTickets(); // Refresh list
      } else {
        alert(data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) {
      return;
    }

    setDeleteLoading(ticketId);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${ticketId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        fetchTickets(); // Refresh list
      } else {
        alert(data.message || "Failed to delete ticket");
      }
    } catch (err) {
      alert("Error deleting ticket");
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Create Ticket Form */}
      <div className="card bg-gray-800 shadow-xl p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket Title"
              className="input input-bordered w-full bg-gray-700 text-white placeholder-gray-400"
              required
            />
          </div>
          <div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ticket Description"
              className="textarea textarea-bordered w-full bg-gray-700 text-white placeholder-gray-400 min-h-[100px]"
              required
            ></textarea>
          </div>
          <button 
            className="btn btn-primary w-full" 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                Creating...
              </span>
            ) : (
              "Create Ticket"
            )}
          </button>
        </form>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">All Tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No tickets submitted yet.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="card bg-gray-800 shadow-xl hover:shadow-2xl transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="text-xl font-bold text-white hover:text-primary transition-colors"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-gray-300 mt-2 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(ticket._id)}
                    disabled={deleteLoading === ticket._id}
                    className="btn btn-error btn-sm ml-4"
                  >
                    {deleteLoading === ticket._id ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center mt-4">
                  {ticket.status && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  )}
                  {ticket.priority && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority} Priority
                    </span>
                  )}
                  <span className="text-sm text-gray-400 ml-auto">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}