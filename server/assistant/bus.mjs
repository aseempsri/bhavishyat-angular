import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

const MAX_LIVE_LOGS = 600;
const MAX_RUN_LOGS = 300;
const MAX_LIVE_RUNS = 40;

export function compact(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 1200 ? `${value.slice(0, 1200)}…` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `<${value.length} bytes>`;
  if (depth > 4) return '…';
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => compact(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (/token|secret|password|authorization/i.test(key)) continue;
      out[key] = compact(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 6) return digits;
  return `${digits.slice(0, 4)}•••${digits.slice(-3)}`;
}

export class AssistantBus extends EventEmitter {
  constructor(runsCollection) {
    super();
    this.setMaxListeners(100);
    this.runs = runsCollection;
    this.liveLogs = [];
    this.liveRuns = new Map();
  }

  emitEvent(event) {
    this.emit('event', { ...event, ts: new Date().toISOString() });
  }

  log(level, msg, { runId = null, step = null, data } = {}) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      runId,
      step,
      msg,
      ...(data === undefined ? {} : { data: compact(data) })
    };
    this.liveLogs.push(entry);
    if (this.liveLogs.length > MAX_LIVE_LOGS) this.liveLogs.splice(0, this.liveLogs.length - MAX_LIVE_LOGS);
    const run = runId ? this.liveRuns.get(runId) : null;
    if (run) {
      run.logs.push(entry);
      if (run.logs.length > MAX_RUN_LOGS) run.logs.shift();
    }
    const line = `[assistant]${runId ? ` ${runId.slice(0, 8)}` : ''}${step ? ` ${step}` : ''} ${msg}`;
    if (level === 'error') console.error(line);
    else if (process.env.ASSISTANT_DEBUG === 'true') console.log(line);
    this.emitEvent({ kind: 'log', log: entry });
    return entry;
  }

  startRun({ phone, name, source, text }) {
    const run = new RunTracker(this, {
      _id: crypto.randomUUID(),
      phone,
      phoneMasked: maskPhone(phone),
      name: name || '',
      source,
      text: compact(text || ''),
      intent: null,
      status: 'running',
      startedAt: new Date(),
      endedAt: null,
      steps: [],
      logs: []
    });
    this.liveRuns.set(run.doc._id, run.doc);
    while (this.liveRuns.size > MAX_LIVE_RUNS) {
      this.liveRuns.delete(this.liveRuns.keys().next().value);
    }
    this.emitEvent({ kind: 'run', run: runSummary(run.doc) });
    this.log('info', `Run started (${source}) for ${maskPhone(phone)}`, { runId: run.doc._id, step: null });
    return run;
  }

  async persist(doc) {
    try {
      await this.runs.replaceOne({ _id: doc._id }, doc, { upsert: true });
    } catch (error) {
      console.error('[assistant] could not persist run', error.message);
    }
  }
}

export function runSummary(doc) {
  return {
    id: doc._id,
    phoneMasked: doc.phoneMasked,
    name: doc.name,
    source: doc.source,
    text: doc.text,
    intent: doc.intent,
    status: doc.status,
    startedAt: doc.startedAt,
    endedAt: doc.endedAt,
    stepCount: doc.steps.length
  };
}

class RunTracker {
  constructor(bus, doc) {
    this.bus = bus;
    this.doc = doc;
  }

  get id() {
    return this.doc._id;
  }

  log(level, msg, step = null, data) {
    return this.bus.log(level, msg, { runId: this.id, step, data });
  }

  setIntent(intent) {
    this.doc.intent = intent;
    this.bus.emitEvent({ kind: 'run', run: runSummary(this.doc) });
  }

  stepRecord(id) {
    let record = this.doc.steps.find((item) => item.id === id);
    if (!record) {
      record = { id, status: 'pending', startedAt: null, endedAt: null, summary: '', input: null, output: null };
      this.doc.steps.push(record);
    }
    return record;
  }

  emitStep(record) {
    this.bus.emitEvent({ kind: 'step', runId: this.id, step: compact(record) });
  }

  async step(id, input, fn) {
    const record = this.stepRecord(id);
    record.status = 'active';
    record.startedAt = new Date();
    record.input = compact(input);
    this.emitStep(record);
    try {
      const result = (await fn()) || {};
      record.status = result.status || 'done';
      record.summary = result.summary || '';
      record.output = compact(result.output ?? null);
      record.endedAt = new Date();
      this.emitStep(record);
      if (record.summary) this.log(record.status === 'warn' ? 'warn' : 'info', record.summary, id);
      return result.output;
    } catch (error) {
      record.status = 'error';
      record.summary = error.message || String(error);
      record.endedAt = new Date();
      this.emitStep(record);
      this.log('error', record.summary, id);
      throw error;
    }
  }

  skip(id, reason) {
    const record = this.stepRecord(id);
    record.status = 'skipped';
    record.summary = reason;
    record.startedAt = record.startedAt || new Date();
    record.endedAt = new Date();
    this.emitStep(record);
  }

  async finish(status = 'done') {
    this.doc.status = status;
    this.doc.endedAt = new Date();
    const ms = this.doc.endedAt - this.doc.startedAt;
    this.log(status === 'error' ? 'error' : 'info', `Run ${status} in ${ms} ms`);
    this.bus.emitEvent({ kind: 'run', run: runSummary(this.doc) });
    await this.bus.persist(this.doc);
  }
}
