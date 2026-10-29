import { useState } from 'react';
import { STATUSES } from '../constants.js';
import { formatDateTime, initials } from '../utils/format.js';
import { TrashIcon } from './Icons.jsx';

export default function AppointmentRow({ appointment, onStatusChange, onDelete }) {
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(event) {
    const status = event.target.value;
    setBusy(true);
    try {
      await onStatusChange(appointment.id, status);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(appointment.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="appointment">
      <div className="appointment__who">
        <span className="avatar" aria-hidden="true">
          {initials(appointment.customerName)}
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="appointment__name">{appointment.customerName}</p>
          <p className="appointment__meta">
            <span>{appointment.service}</span>
            <span className="appointment__sep">•</span>
            <span>{formatDateTime(appointment.dateTime)}</span>
          </p>
        </div>
      </div>

      <div className="appointment__actions">
        <span className={`badge badge--${appointment.status}`}>{appointment.status}</span>

        <label className="sr-only" htmlFor={`status-${appointment.id}`}>
          Change status for {appointment.customerName}
        </label>
        <select
          id={`status-${appointment.id}`}
          className="status-select"
          value={appointment.status}
          onChange={handleStatusChange}
          disabled={busy}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="icon-btn"
          onClick={handleDelete}
          disabled={busy}
          title={`Delete appointment for ${appointment.customerName}`}
          aria-label={`Delete appointment for ${appointment.customerName}`}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
