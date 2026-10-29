import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { formatDateTime } from './utils/format.js';
import { api } from './api/client.js';

vi.mock('./api/client.js', () => ({
  api: {
    listAppointments: vi.fn(),
    createAppointment: vi.fn(),
    updateStatus: vi.fn(),
    deleteAppointment: vi.fn(),
  },
}));

const seed = [
  { id: '1', customerName: 'Alex Morgan', service: 'Consultation', dateTime: '2026-11-02T10:00', status: 'Pending' },
  { id: '2', customerName: 'Jamie Lee', service: 'Follow-up', dateTime: '2026-11-02T11:30', status: 'Confirmed' },
  { id: '3', customerName: 'Taylor Smith', service: 'Review', dateTime: '2026-11-03T14:00', status: 'Cancelled' },
];

function filterButton(name) {
  const group = screen.getByRole('group', { name: /filter appointments by status/i });
  return within(group).getByRole('button', { name: new RegExp('^' + name) });
}

function list() {
  return screen.getByRole('list');
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listAppointments.mockImplementation(async ({ search = '' } = {}) => {
    const needle = search.trim().toLowerCase();
    const data = needle
      ? seed.filter((item) => item.customerName.toLowerCase().includes(needle))
      : seed;
    return { data, count: data.length };
  });
});

describe('Appointment Manager', () => {
  it('renders the seeded appointments with service, date and status', async () => {
    render(<App />);

    expect(await screen.findByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('Jamie Lee')).toBeInTheDocument();
    expect(screen.getByText('Taylor Smith')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText(formatDateTime('2026-11-02T10:00'))).toBeInTheDocument();
    expect(within(list()).getAllByText('Pending')).not.toHaveLength(0);
  });

  it('shows the per-status counters', async () => {
    render(<App />);
    await screen.findByText('Alex Morgan');

    const total = screen.getByText('Total appointments').parentElement;
    expect(within(total).getByText('3')).toBeInTheDocument();
  });

  it('blocks an empty submit and shows a message for every required field', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.click(screen.getByRole('button', { name: /add appointment/i }));

    expect(await screen.findByText('Customer name is required.')).toBeInTheDocument();
    expect(screen.getByText('Service is required.')).toBeInTheDocument();
    expect(screen.getByText('Date and time are required.')).toBeInTheDocument();
    expect(api.createAppointment).not.toHaveBeenCalled();
  });

  it('rejects a one-character customer name', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.type(screen.getByLabelText('Customer name'), 'A');
    await user.click(screen.getByRole('button', { name: /add appointment/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(api.createAppointment).not.toHaveBeenCalled();
  });

  it('adds a valid appointment and clears the form', async () => {
    const user = userEvent.setup();
    api.createAppointment.mockResolvedValue({
      data: {
        id: '4',
        customerName: 'Priya Nair',
        service: 'Consultation',
        dateTime: '2026-11-04T09:15',
        status: 'Pending',
      },
    });

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.type(screen.getByLabelText('Customer name'), 'Priya Nair');
    await user.type(screen.getByLabelText(/^service$/i), 'Consultation');
    await user.type(screen.getByLabelText(/date and time/i), '2026-11-04T09:15');
    await user.click(screen.getByRole('button', { name: /add appointment/i }));

    expect(await screen.findByText('Priya Nair')).toBeInTheDocument();
    expect(api.createAppointment).toHaveBeenCalledWith({
      customerName: 'Priya Nair',
      service: 'Consultation',
      dateTime: '2026-11-04T09:15',
      status: 'Pending',
    });
    expect(screen.getByLabelText('Customer name')).toHaveValue('');
  });

  it('surfaces a field error returned by the API', async () => {
    const user = userEvent.setup();
    const error = new Error('Validation failed.');
    error.fieldErrors = { service: 'Service is required.' };
    api.createAppointment.mockRejectedValue(error);

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.type(screen.getByLabelText('Customer name'), 'Priya Nair');
    await user.type(screen.getByLabelText(/^service$/i), 'Consultation');
    await user.type(screen.getByLabelText(/date and time/i), '2026-11-04T09:15');
    await user.click(screen.getByRole('button', { name: /add appointment/i }));

    expect(await screen.findByText('Service is required.')).toBeInTheDocument();
  });

  it('changes an appointment status through the API', async () => {
    const user = userEvent.setup();
    api.updateStatus.mockResolvedValue({ data: { ...seed[0], status: 'Confirmed' } });

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.selectOptions(screen.getByLabelText(/change status for Alex Morgan/i), 'Confirmed');

    await waitFor(() => expect(api.updateStatus).toHaveBeenCalledWith('1', 'Confirmed'));
    expect(await screen.findByText(/status changed to confirmed/i)).toBeInTheDocument();
  });

  it('rolls the status back when the API rejects the change', async () => {
    const user = userEvent.setup();
    api.updateStatus.mockRejectedValue(new Error('Appointment not found.'));

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.selectOptions(screen.getByLabelText(/change status for Alex Morgan/i), 'Confirmed');

    expect(await screen.findByText('Appointment not found.')).toBeInTheDocument();
    expect(screen.getByLabelText(/change status for Alex Morgan/i)).toHaveValue('Pending');
  });

  it('filters the list by status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.click(filterButton('Confirmed'));

    expect(screen.getByText('Jamie Lee')).toBeInTheDocument();
    expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
    expect(screen.queryByText('Taylor Smith')).not.toBeInTheDocument();
  });

  it('shows an empty state when a filter matches nothing', async () => {
    const user = userEvent.setup();
    api.listAppointments.mockResolvedValue({ data: [seed[0]], count: 1 });

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.click(filterButton('Cancelled'));

    expect(screen.getByText(/no matching appointments/i)).toBeInTheDocument();
  });

  it('searches by customer name through the API', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.type(screen.getByLabelText(/search by customer name/i), 'jam');

    await waitFor(() => expect(api.listAppointments).toHaveBeenCalledWith({ search: 'jam' }));
    expect(await screen.findByText('Jamie Lee')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument());
  });

  it('combines search with the status filter', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.type(screen.getByLabelText(/search by customer name/i), 'a');
    await screen.findByText('Taylor Smith');
    await user.click(filterButton('Pending'));

    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.queryByText('Taylor Smith')).not.toBeInTheDocument();
  });

  it('deletes an appointment', async () => {
    const user = userEvent.setup();
    api.deleteAppointment.mockResolvedValue(null);

    render(<App />);
    await screen.findByText('Alex Morgan');

    await user.click(screen.getByRole('button', { name: /delete appointment for Alex Morgan/i }));

    await waitFor(() => expect(api.deleteAppointment).toHaveBeenCalledWith('1'));
    expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
  });

  it('reports an unreachable API', async () => {
    api.listAppointments.mockRejectedValue(new Error('Cannot reach the API. Is the server running on port 4000?'));

    render(<App />);

    expect(await screen.findByText(/cannot reach the api/i)).toBeInTheDocument();
    expect(screen.getByText('API Unreachable')).toBeInTheDocument();
  });
});
