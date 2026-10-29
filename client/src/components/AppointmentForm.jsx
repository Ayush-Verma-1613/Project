import { useState } from 'react';
import { STATUSES, SERVICES } from '../constants.js';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  SendIcon,
  UserIcon,
  XCircleIcon,
} from './Icons.jsx';

const emptyForm = { customerName: '', service: '', dateTime: '', status: 'Pending' };

/**
 * Client-side validation mirrors the rules enforced by the API so the user
 * gets instant feedback; the server stays the source of truth.
 */
function validate(form) {
  const errors = {};
  if (!form.customerName.trim()) errors.customerName = 'Customer name is required.';
  else if (form.customerName.trim().length < 2)
    errors.customerName = 'Customer name must be at least 2 characters.';

  if (!form.service.trim()) errors.service = 'Service is required.';

  if (!form.dateTime) errors.dateTime = 'Date and time are required.';
  else if (Number.isNaN(new Date(form.dateTime).getTime()))
    errors.dateTime = 'Date and time must be a valid date.';

  if (!STATUSES.includes(form.status)) errors.status = 'Choose a status.';

  return errors;
}

export default function AppointmentForm({ onCreate }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        customerName: form.customerName.trim(),
        service: form.service.trim(),
        dateTime: form.dateTime,
        status: form.status,
      });
      setForm(emptyForm);
      setErrors({});
    } catch (error) {
      // Surface per-field messages returned by the API, else a form-level one.
      setErrors(
        Object.keys(error.fieldErrors || {}).length > 0
          ? error.fieldErrors
          : { form: error.message },
      );
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field) => (errors[field] ? 'field__control field__control--invalid' : 'field__control');
  const describedBy = (field) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form className="panel__body" onSubmit={handleSubmit} noValidate>
      {errors.form && (
        <p className="alert" role="alert">
          {errors.form}
        </p>
      )}

      <div className="field">
        <label className="field__label" htmlFor="customerName">
          Customer name
        </label>
        <div className="field__input-wrap">
          <span className="field__icon" aria-hidden="true"><UserIcon /></span>
          <input
            id="customerName"
            className={`${invalid('customerName')} field__control--with-icon`}
            value={form.customerName}
            onChange={(event) => setField('customerName', event.target.value)}
            placeholder="e.g. Alex Morgan"
            aria-invalid={Boolean(errors.customerName)}
            aria-describedby={describedBy('customerName')}
          />
        </div>
        {errors.customerName && (
          <p className="field__error" id="customerName-error" role="alert">
            {errors.customerName}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="service">
          Service
        </label>
        <div className="field__input-wrap">
          <span className="field__icon" aria-hidden="true"><BriefcaseIcon /></span>
          <input
            id="service"
            className={`${invalid('service')} field__control--with-icon`}
            list="service-options"
            value={form.service}
            onChange={(event) => setField('service', event.target.value)}
            placeholder="e.g. Consultation"
            aria-invalid={Boolean(errors.service)}
            aria-describedby={describedBy('service')}
          />
        </div>
        <datalist id="service-options">
          {SERVICES.map((service) => (
            <option key={service} value={service} />
          ))}
        </datalist>
        {errors.service && (
          <p className="field__error" id="service-error" role="alert">
            {errors.service}
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="dateTime">
          Date and time
        </label>
        <div className="field__input-wrap">
          <span className="field__icon" aria-hidden="true"><CalendarIcon /></span>
          <input
            id="dateTime"
            type="datetime-local"
            className={`${invalid('dateTime')} field__control--with-icon`}
            value={form.dateTime}
            onChange={(event) => setField('dateTime', event.target.value)}
            aria-invalid={Boolean(errors.dateTime)}
            aria-describedby={describedBy('dateTime')}
          />
        </div>
        {errors.dateTime && (
          <p className="field__error" id="dateTime-error" role="alert">
            {errors.dateTime}
          </p>
        )}
      </div>

      <div className="field">
        <span className="field__label" id="status-label">
          Status
        </span>
        <div className="segmented" role="group" aria-labelledby="status-label">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="segmented__option"
              aria-pressed={form.status === status}
              onClick={() => setField('status', status)}
            >
              {status === 'Pending' && <ClockIcon />}
              {status === 'Confirmed' && <CheckCircleIcon />}
              {status === 'Cancelled' && <XCircleIcon />}
              {status}
            </button>
          ))}
        </div>
        {errors.status && (
          <p className="field__error" role="alert">
            {errors.status}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {!submitting && <SendIcon />}
        {submitting ? 'Adding…' : 'Add appointment'}
        {!submitting && <ArrowRightIcon />}
      </button>
    </form>
  );
}
