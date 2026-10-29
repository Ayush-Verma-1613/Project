import { randomUUID } from 'node:crypto';
import { seedAppointments } from './seed.js';

/**
 * In-memory repository.
 *
 * It exposes the same async surface a Mongo/Mongoose repository would, so
 * swapping persistence later means adding a mongoStore.js with these five
 * methods and selecting it in store/index.js - no route or controller changes.
 */
let appointments = [];

function clone(appointment) {
  return { ...appointment };
}

function sortByDateTime(list) {
  return [...list].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

export const memoryStore = {
  name: 'memory',

  async init() {
    appointments = seedAppointments.map((appointment) => ({
      id: randomUUID(),
      ...appointment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  },

  async findAll({ status, search } = {}) {
    let result = appointments;

    if (status && status !== 'All') {
      result = result.filter((appointment) => appointment.status === status);
    }

    if (search) {
      const needle = search.trim().toLowerCase();
      if (needle) {
        result = result.filter((appointment) =>
          appointment.customerName.toLowerCase().includes(needle),
        );
      }
    }

    return sortByDateTime(result).map(clone);
  },

  async findById(id) {
    const found = appointments.find((appointment) => appointment.id === id);
    return found ? clone(found) : null;
  },

  async create(data) {
    const now = new Date().toISOString();
    const appointment = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    appointments.push(appointment);
    return clone(appointment);
  },

  async updateStatus(id, status) {
    const found = appointments.find((appointment) => appointment.id === id);
    if (!found) return null;
    found.status = status;
    found.updatedAt = new Date().toISOString();
    return clone(found);
  },

  async remove(id) {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) return false;
    appointments.splice(index, 1);
    return true;
  },
};
