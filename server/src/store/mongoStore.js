import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { config } from '../config.js';

let client;
let appointments;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function withoutMongoId({ _id, ...appointment }) {
  return appointment;
}

export const mongoStore = {
  name: 'mongo',

  async init() {
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is required when PERSISTENCE=mongo.');
    }

    client = new MongoClient(config.mongodbUri);
    await client.connect();
    appointments = client.db().collection('appointments');
    await appointments.createIndex({ id: 1 }, { unique: true });
    await appointments.createIndex({ dateTime: 1 });
  },

  async findAll({ status, search } = {}) {
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (search?.trim()) filter.customerName = { $regex: escapeRegex(search.trim()), $options: 'i' };

    const records = await appointments.find(filter).sort({ dateTime: 1 }).toArray();
    return records.map(withoutMongoId);
  },

  async findById(id) {
    const record = await appointments.findOne({ id });
    return record ? withoutMongoId(record) : null;
  },

  async create(data) {
    const now = new Date().toISOString();
    const appointment = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    await appointments.insertOne(appointment);
    return appointment;
  },

  async updateStatus(id, status) {
    const updatedAt = new Date().toISOString();
    const result = await appointments.updateOne({ id }, { $set: { status, updatedAt } });
    return result.matchedCount ? this.findById(id) : null;
  },

  async remove(id) {
    const result = await appointments.deleteOne({ id });
    return result.deletedCount === 1;
  },
};
