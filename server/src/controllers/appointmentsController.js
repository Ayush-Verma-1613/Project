import { store } from '../store/index.js';
import { STATUSES, validateAppointment, validateStatus } from '../models/appointment.js';

export async function listAppointments(req, res, next) {
  try {
    const { status, search } = req.query;

    if (status && status !== 'All' && !STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status filter.',
        errors: { status: `Status must be All, ${STATUSES.join(', ')}.` },
      });
    }

    const data = await store.findAll({ status, search });
    return res.json({ data, count: data.length });
  } catch (error) {
    return next(error);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const appointment = await store.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    return res.json({ data: appointment });
  } catch (error) {
    return next(error);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const { errors, value } = validateAppointment(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }
    const appointment = await store.create(value);
    return res.status(201).json({ data: appointment });
  } catch (error) {
    return next(error);
  }
}

export async function updateAppointmentStatus(req, res, next) {
  try {
    const { errors, value } = validateStatus(req.body?.status);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }
    const appointment = await store.updateStatus(req.params.id, value);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    return res.json({ data: appointment });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const removed = await store.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
