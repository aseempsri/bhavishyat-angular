import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StepStatus = 'pending' | 'active' | 'done' | 'warn' | 'skipped' | 'error';
export type RunStatus = 'running' | 'done' | 'paused' | 'error';

export interface StepRecord {
  id: string;
  status: StepStatus;
  startedAt: string | null;
  endedAt: string | null;
  summary: string;
  input: unknown;
  output: unknown;
}

export interface RunSummary {
  id: string;
  phoneMasked: string;
  name: string;
  source: string;
  text: string;
  intent: string | null;
  status: RunStatus;
  startedAt: string;
  endedAt: string | null;
  stepCount: number;
}

export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  runId: string | null;
  step: string | null;
  msg: string;
  data?: unknown;
}

export interface RunDetail extends RunSummary {
  steps: StepRecord[];
  logs: LogEntry[];
}

export interface ChatMessage {
  id: string;
  phone: string;
  direction: 'in' | 'out';
  author: 'customer' | 'bot' | 'team';
  channel: 'whatsapp' | 'simulator';
  text: string;
  attachment: { reportId: string; filename: string; bytes: number } | null;
  runId: string | null;
  demo: boolean;
  createdAt: string;
}

export interface Booking {
  reference: string;
  phone: string;
  phoneMasked: string;
  name: string;
  packageName: string;
  amountInr: number;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  paymentUrl: string;
  demo: boolean;
  createdAt: string;
  paidAt: string | null;
  reportId: string | null;
}

export interface Integration {
  id: string;
  label: string;
  live: boolean;
  detail: string;
}

export interface AssistantStatus {
  integrations: Integration[];
  packages: { code: string; name: string; amountInr: number; summary: string }[];
  webhooks: { whatsapp: string; razorpay: string };
  stats: { customers: number; runs: number; confirmedBookings: number; openHandoffs: number };
  demoPhone: string;
}

export interface ConversationSummary {
  phone: string;
  phoneMasked: string;
  name: string;
  channel: 'whatsapp' | 'simulator';
  lastIntent: string | null;
  stage: string | null;
  messageCount: number;
  hasBirth: boolean;
  handoff: boolean;
  handoffReason: string | null;
  lastSeenAt: string;
}

export interface ConversationDetail {
  customer: {
    phone: string;
    name: string;
    channel: 'whatsapp' | 'simulator';
    language: string;
    birth: { date: string | null; time: string | null; place: string | null } | null;
    stage: string | null;
    lastIntent: string | null;
    handoff: { active: boolean; reason?: string };
  };
  messages: ChatMessage[];
  bookings: Booking[];
}

export type AssistantEvent =
  | { kind: 'connection'; state: 'open' | 'closed' }
  | { kind: 'hello'; logs: LogEntry[]; runs: RunSummary[] }
  | { kind: 'run'; run: RunSummary }
  | { kind: 'step'; runId: string; step: StepRecord }
  | { kind: 'log'; log: LogEntry }
  | { kind: 'chat'; message: ChatMessage }
  | { kind: 'booking'; booking: Booking }
  | { kind: 'handoff'; phone: string; active: boolean }
  | { kind: 'reset' };

const TOKEN_KEY = 'bhavishyat_admin_token';
const BASE = '/api/admin/assistant';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);

  status() {
    return this.http.get<AssistantStatus>(`${BASE}/status`, { headers: this.headers() });
  }

  runs(limit = 40) {
    return this.http.get<{ runs: RunSummary[] }>(`${BASE}/runs?limit=${limit}`, { headers: this.headers() });
  }

  run(id: string) {
    return this.http.get<{ run: RunDetail }>(`${BASE}/runs/${encodeURIComponent(id)}`, { headers: this.headers() });
  }

  simulate(body: { phone: string; name: string; text: string }) {
    return this.http.post<{ ok: boolean; phone: string }>(`${BASE}/simulate`, body, { headers: this.headers() });
  }

  conversations() {
    return this.http.get<{ conversations: ConversationSummary[] }>(`${BASE}/conversations`, { headers: this.headers() });
  }

  conversation(phone: string) {
    return this.http.get<ConversationDetail>(`${BASE}/conversations/${encodeURIComponent(phone)}`, { headers: this.headers() });
  }

  reply(phone: string, text: string) {
    return this.http.post<{ message: ChatMessage }>(`${BASE}/conversations/${encodeURIComponent(phone)}/reply`, { text }, { headers: this.headers() });
  }

  setHandoff(phone: string, active: boolean) {
    return this.http.post<{ ok: boolean }>(`${BASE}/conversations/${encodeURIComponent(phone)}/handoff`, { active }, { headers: this.headers() });
  }

  bookings() {
    return this.http.get<{ bookings: Booking[] }>(`${BASE}/bookings`, { headers: this.headers() });
  }

  markPaid(reference: string) {
    return this.http.post<{ ok: boolean }>(`${BASE}/bookings/${encodeURIComponent(reference)}/mark-paid`, {}, { headers: this.headers() });
  }

  resetDemo() {
    return this.http.post<{ ok: boolean; cleared: number }>(`${BASE}/reset-demo`, {}, { headers: this.headers() });
  }

  report(reportId: string) {
    return this.http.get(`${BASE}/reports/${encodeURIComponent(reportId)}`, { headers: this.headers(), responseType: 'blob' });
  }

  stream(): Observable<AssistantEvent> {
    return new Observable<AssistantEvent>((subscriber) => {
      let stopped = false;
      let controller: AbortController | null = null;
      let retryMs = 1000;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const connect = async () => {
        controller = new AbortController();
        try {
          const token = sessionStorage.getItem(TOKEN_KEY);
          const res = await fetch(`${BASE}/stream`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'same-origin',
            signal: controller.signal
          });
          if (res.status === 401) {
            subscriber.error(new Error('unauthorized'));
            return;
          }
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          retryMs = 1000;
          subscriber.next({ kind: 'connection', state: 'open' });
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let index: number;
            while ((index = buffer.indexOf('\n\n')) >= 0) {
              const chunk = buffer.slice(0, index);
              buffer = buffer.slice(index + 2);
              const line = chunk.split('\n').find((item) => item.startsWith('data: '));
              if (!line) continue;
              try {
                subscriber.next(JSON.parse(line.slice(6)) as AssistantEvent);
              } catch {
                /* ignore malformed frame */
              }
            }
          }
        } catch {
          if (stopped) return;
        }
        if (stopped) return;
        subscriber.next({ kind: 'connection', state: 'closed' });
        timer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 15000);
      };

      connect();
      return () => {
        stopped = true;
        if (timer) clearTimeout(timer);
        controller?.abort();
      };
    });
  }

  private headers(): HttpHeaders {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
