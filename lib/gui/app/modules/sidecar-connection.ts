/*
 * Copyright 2016 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { v4 as uuidV4 } from 'uuid';
import type { SourceMetadata } from '../../../shared/typings/source-selector';
import { spawnChildAndConnect } from './api';

export enum ConnectionState {
	CONNECTING = 'CONNECTING',
	CONNECTED = 'CONNECTED',
	FAILED = 'FAILED',
	DISCONNECTED = 'DISCONNECTED',
}

interface PendingRequest {
	resolve: (value: SourceMetadata) => void;
	reject: (error: Error) => void;
	timeout: NodeJS.Timeout;
}

interface EventHandler {
	(event: string, data: any): void;
}

export class SidecarConnectionManager {
	private state: ConnectionState = ConnectionState.CONNECTING;
	private connectionReadyPromise: Promise<void> | null = null;
	private connectionReadyResolve: (() => void) | null = null;
	private connectionReadyReject: ((error: Error) => void) | null = null;
	private emit: ((type: string, payload: any) => void) | null = null;
	private registerHandler: ((event: string, handler: any) => void) | null = null;
	private pendingRequests: Map<string, PendingRequest> = new Map();
	private eventHandlers: Map<string, Set<EventHandler>> = new Map();
	private queuedHandlers: Array<{ event: string; handler: any }> = [];
	private readonly connectionTimeoutMs = 10500; // 10.5 seconds
	private readonly requestTimeoutMs = 10000; // 10 seconds

	constructor() {
		this.initialize();
	}

	private async initialize(): Promise<void> {
		try {
			const { emit, registerHandler } = await spawnChildAndConnect({
				withPrivileges: false,
			});

			this.emit = emit;
			this.registerHandler = registerHandler;

			// Register any handlers that were queued before connection was ready
			for (const { event, handler } of this.queuedHandlers) {
				registerHandler(event, handler);
			}
			this.queuedHandlers = [];

			// Set up handler for sourceMetadata responses with request correlation
			registerHandler('sourceMetadata', (data: any) => {
				try {
					const parsed = JSON.parse(data);
					const requestId = parsed.requestId;

					if (requestId && this.pendingRequests.has(requestId)) {
						const pending = this.pendingRequests.get(requestId)!;
						clearTimeout(pending.timeout);
						this.pendingRequests.delete(requestId);
						pending.resolve(parsed);
					} else if (!requestId && this.pendingRequests.size === 1) {
						// Fallback for responses without requestId (backward compatibility)
						// If there's only one pending request, resolve it
						const nextEntry = this.pendingRequests.entries().next();
						if (!nextEntry.done) {
							const [pendingRequestId, pending] = nextEntry.value;
							clearTimeout(pending.timeout);
							this.pendingRequests.delete(pendingRequestId);
							pending.resolve(parsed);
						}
					} else {
						// Multiple pending requests but no requestId - can't correlate
						console.warn(
							'Received sourceMetadata response without requestId and multiple pending requests',
							`Pending requests: ${this.pendingRequests.size}`,
							`Response path: ${parsed.path || 'N/A'}`,
						);
					}
				} catch (error: any) {
					console.error(
						'Error parsing sourceMetadata response',
						`Error: ${error.message}`,
						`Stack: ${error.stack}`,
					);
				}
			});

			// Set up handler for fail messages
			registerHandler('fail', (error: any) => {
				// Try to find a pending request to reject
				// Since fail doesn't include requestId, we'll reject the oldest pending request
				// In practice, there should only be one pending request at a time
				if (this.pendingRequests.size > 0) {
					const nextEntry = this.pendingRequests.entries().next();
					if (!nextEntry.done) {
						const [requestId, pending] = nextEntry.value;
						clearTimeout(pending.timeout);
						this.pendingRequests.delete(requestId);
						const errorObj = new Error(
							error?.message || 'Sidecar process reported an error',
						);
						console.error(
							'Sidecar process reported an error',
							`Request ID: ${requestId}`,
							`Error: ${errorObj.message}`,
						);
						pending.reject(errorObj);
					}
				}
			});

			// Start scanning for drives
			emit('scan', {});

			this.setState(ConnectionState.CONNECTED);
			if (this.connectionReadyResolve) {
				this.connectionReadyResolve();
			}

			console.log('Sidecar connection established');
		} catch (error: any) {
			this.setState(ConnectionState.FAILED);
			if (this.connectionReadyReject) {
				this.connectionReadyReject(
					new Error(
						`Failed to start sidecar process: ${error.message}`,
					),
				);
			}
			console.error('Failed to initialize sidecar connection', error);
		}
	}

	private setState(newState: ConnectionState): void {
		if (this.state !== newState) {
			const oldState = this.state;
			this.state = newState;

			// Emit state change event
			this.emitEvent('stateChange', { oldState, newState });

			if (newState === ConnectionState.FAILED) {
				console.error('Sidecar connection failed');
			} else if (newState === ConnectionState.DISCONNECTED) {
				console.warn('Sidecar connection disconnected');
			}
		}
	}

	getState(): ConnectionState {
		return this.state;
	}

	getConnectionReady(): Promise<void> {
		if (this.state === ConnectionState.CONNECTED) {
			return Promise.resolve();
		}

		if (this.state === ConnectionState.FAILED) {
			return Promise.reject(
				new Error('Sidecar connection failed'),
			);
		}

		if (!this.connectionReadyPromise) {
			this.connectionReadyPromise = new Promise((resolve, reject) => {
				this.connectionReadyResolve = resolve;
				this.connectionReadyReject = reject;

				// Set connection timeout
				setTimeout(() => {
					if (this.state !== ConnectionState.CONNECTED) {
						this.setState(ConnectionState.FAILED);
						reject(
							new Error(
								`Sidecar connection timeout after ${this.connectionTimeoutMs}ms`,
							),
						);
					}
				}, this.connectionTimeoutMs);
			});
		}

		return this.connectionReadyPromise;
	}

	async requestMetadata(params: {
		selected: string;
		SourceType: string;
		auth?: any;
	}): Promise<SourceMetadata> {
		// Wait for connection to be ready
		await this.getConnectionReady();

		if (!this.emit) {
			throw new Error('Sidecar connection not available');
		}

		// Capture emit function to avoid null check issues in Promise callback
		const emit = this.emit;

		// Generate unique request ID
		const requestId = uuidV4();

		return new Promise<SourceMetadata>((resolve, reject) => {
			// Set up request timeout
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestId);

				const error = new Error(
					`Metadata request timeout after ${this.requestTimeoutMs}ms for ${params.selected}`,
				);
				console.warn(error.message);
				reject(error);
			}, this.requestTimeoutMs);

			// Store pending request
			this.pendingRequests.set(requestId, {
				resolve,
				reject,
				timeout,
			});

			// Send request with requestId
			try {
				const requestPayload = {
					...params,
					requestId,
				};
				emit('sourceMetadata', JSON.stringify(requestPayload));
			} catch (error: any) {
				clearTimeout(timeout);
				this.pendingRequests.delete(requestId);
				reject(
					new Error(`Failed to send metadata request: ${error.message}`),
				);
			}
		});
	}

	registerDrivesHandler(handler: (data: any) => void): void {
		if (this.registerHandler) {
			// Connection is ready, register immediately
			this.registerHandler('drives', handler);
		} else {
			// Connection not ready yet, queue the handler
			this.queuedHandlers.push({ event: 'drives', handler });
		}
	}

	on(event: string, handler: EventHandler): void {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, new Set());
		}
		this.eventHandlers.get(event)!.add(handler);
	}

	off(event: string, handler: EventHandler): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.delete(handler);
		}
	}

	private emitEvent(event: string, data: any): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach((handler) => {
				try {
					handler(event, data);
				} catch (error: any) {
					console.error(`Error in event handler for ${event}`, error);
				}
			});
		}
	}
}

