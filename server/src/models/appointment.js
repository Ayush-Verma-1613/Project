export const STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

export const SERVICES = ['Consultation', 'Follow-up', 'Review'];

/**
 * Validates the payload used to create an appointment.
 * Returns a map of field -> message. An empty map means the payload is valid.
 */
export function validateAppointment(payload = {}) {
  const errors = {};
  const customerName = typeof payload.customerName === 'string' ? payload.customerName.trim() : '';
  const service = typeof payload.service === 'string' ? payload.service.trim() : '';
  const dateTime = typeof payload.dateTime === 'string' ? payload.dateTime.trim() : '';
  const status = typeof payload.status === 'string' ? payload.status.trim() : '';

  if (!customerName) {
    errors.customerName = 'Customer name is required.';
  } else if (customerName.length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters.';
  } else if (customerName.length > 80) {
    errors.customerName = 'Customer name must be 80 characters or fewer.';
  }

  if (!service) {
    errors.service = 'Service is required.';
  } else if (service.length > 80) {
    errors.service = 'Service must be 80 characters or fewer.';
  }

  if (!dateTime) {
    errors.dateTime = 'Date and time are required.';
  } else if (Number.isNaN(new Date(dateTime).getTime())) {
    errors.dateTime = 'Date and time must be a valid date.';
  }

  if (!status) {
    errors.status = 'Status is required.';
  } else if (!STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${STATUSES.join(', ')}.`;
  }

  return { errors, value: { customerName, service, dateTime, status } };
}

export function validateStatus(status) {
  if (typeof status !== 'string' || !status.trim()) {
    return { errors: { status: 'Status is required.' } };
  }
  if (!STATUSES.includes(status.trim())) {
    return { errors: { status: `Status must be one of: ${STATUSES.join(', ')}.` } };
  }
  return { errors: {}, value: status.trim() };
}
