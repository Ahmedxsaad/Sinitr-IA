/**
 * Public core surface of the gateway, exposed so the pipeline can be embedded
 * and tested in-process (see the e2e test package) without going over HTTP.
 */
export * from './authz.js';
export * from './clients.js';
export * from './metrics.js';
export * from './pipeline.js';
export * from './decision.js';
export * from './store.js';
export * from './twin.js';
