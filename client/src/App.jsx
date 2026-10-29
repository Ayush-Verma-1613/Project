import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppointmentForm from './components/AppointmentForm.jsx';
import AppointmentList from './components/AppointmentList.jsx';
import Toolbar from './components/Toolbar.jsx';
import { CalendarIcon } from './components/Icons.jsx';
import { STATUSES } from './constants.js';
import { api } from './api/client.js';

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  function notify(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (searchTerm) => {
    try {
      // Search runs on the API; the status filter is applied in the browser so
      // the per-status counts stay accurate for the current search.
      const payload = await api.listAppointments({ search: searchTerm });
      setAppointments(payload.data);
      setApiOnline(true);
      setError('');
    } catch (requestError) {
      setApiOnline(false);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(debouncedSearch);
  }, [debouncedSearch, load]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const counts = useMemo(() => {
    const result = { All: appointments.length };
    for (const status of STATUSES) {
      result[status] = appointments.filter((item) => item.status === status).length;
    }
    return result;
  }, [appointments]);

  const visible = useMemo(
    () => (filter === 'All' ? appointments : appointments.filter((item) => item.status === filter)),
    [appointments, filter],
  );

  async function handleCreate(appointment) {
    const payload = await api.createAppointment(appointment);
    setAppointments((previous) =>
      [...previous, payload.data].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)),
    );
    setApiOnline(true);
    setError('');
    notify(`Appointment added for ${payload.data.customerName}.`);
  }

  async function handleStatusChange(id, status) {
    const previous = appointments;
    // Optimistic update, rolled back if the API rejects the change.
    setAppointments((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    try {
      const payload = await api.updateStatus(id, status);
      setAppointments((current) =>
        current.map((item) => (item.id === id ? payload.data : item)),
      );
      notify(`Status changed to ${status}.`);
    } catch (requestError) {
      setAppointments(previous);
      setError(requestError.message);
    }
  }

  async function handleDelete(id) {
    const previous = appointments;
    setAppointments((current) => current.filter((item) => item.id !== id));
    try {
      await api.deleteAppointment(id);
      notify('Appointment deleted.');
    } catch (requestError) {
      setAppointments(previous);
      setError(requestError.message);
    }
  }

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <span className="brand__mark">
            <CalendarIcon width={22} height={22} />
          </span>
          <div>
            <h1 className="brand__title">Appointment Manager</h1>
            <p className="brand__subtitle">Schedule, track and update customer appointments</p>
          </div>
        </div>

        <span className="status-pill">
          <span className={`status-pill__dot${apiOnline ? '' : ' status-pill__dot--off'}`} />
          {apiOnline ? 'API connected' : 'API unreachable'}
        </span>
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <section className="stats" aria-label="Appointment summary">
        <div className="stat">
          <div className="stat__label">Total</div>
          <div className="stat__value">{counts.All}</div>
        </div>
        <div className="stat stat--pending">
          <div className="stat__label">Pending</div>
          <div className="stat__value">{counts.Pending}</div>
        </div>
        <div className="stat stat--confirmed">
          <div className="stat__label">Confirmed</div>
          <div className="stat__value">{counts.Confirmed}</div>
        </div>
        <div className="stat stat--cancelled">
          <div className="stat__label">Cancelled</div>
          <div className="stat__value">{counts.Cancelled}</div>
        </div>
      </section>

      <div className="layout">
        <section className="panel" aria-labelledby="form-title">
          <div className="panel__header">
            <h2 className="panel__title" id="form-title">
              New appointment
            </h2>
            <p className="panel__hint">All fields are required.</p>
          </div>
          <AppointmentForm onCreate={handleCreate} />
        </section>

        <section className="panel" aria-labelledby="list-title">
          <div className="panel__header">
            <h2 className="panel__title" id="list-title">
              Appointments
            </h2>
            <p className="panel__hint">
              Showing {visible.length} of {counts.All}
              {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
            </p>
          </div>

          <Toolbar
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            counts={counts}
          />

          <AppointmentList
            appointments={visible}
            loading={loading}
            filtered={filter !== 'All' || Boolean(debouncedSearch)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </section>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
