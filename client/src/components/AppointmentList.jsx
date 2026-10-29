import AppointmentRow from './AppointmentRow.jsx';
import { InboxIcon } from './Icons.jsx';

function Skeletons() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div className="skeleton" key={row}>
          <div className="skeleton__block" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton__block" style={{ width: '38%', height: 13 }} />
            <div className="skeleton__block" style={{ width: '58%', height: 11, marginTop: 8 }} />
          </div>
          <div className="skeleton__block" style={{ width: 88, height: 26, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

export default function AppointmentList({ appointments, loading, filtered, onStatusChange, onDelete }) {
  if (loading) return <Skeletons />;

  if (appointments.length === 0) {
    return (
      <div className="empty">
        <InboxIcon />
        <p className="empty__title">{filtered ? 'No matching appointments' : 'No appointments yet'}</p>
        <p className="empty__text">
          {filtered
            ? 'Try a different status filter or clear the search.'
            : 'Add the first appointment using the form.'}
        </p>
      </div>
    );
  }

  return (
    <ul className="list">
      {appointments.map((appointment) => (
        <AppointmentRow
          key={appointment.id}
          appointment={appointment}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
