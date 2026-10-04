import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CodexUnavailableError,
  buildCodexArgs,
  classifyCodexFailure,
  isCodexAvailable,
  parseCodexEvents,
} from './codexRunner.ts';

test('buildCodexArgs runs an isolated, read-only, ephemeral exec reading the prompt from stdin', () => {
  const args = buildCodexArgs({ model: 'gpt-6-sol', reasoningEffort: 'low', outputFile: '/tmp/out.txt', imagePaths: [] });
  assert.equal(args[0], 'exec');
  for (const flag of ['--ephemeral', '--ignore-user-config', '--ignore-rules', '--skip-git-repo-check', '--json']) {
    assert.ok(args.includes(flag), `missing ${flag}`);
  }
  assert.deepEqual(args.slice(args.indexOf('-s'), args.indexOf('-s') + 2), ['-s', 'read-only']);
  assert.ok(args.includes('model_reasoning_effort="low"'));
  assert.ok(args.includes('features.hooks=false'));
  assert.equal(args.at(-1), '-');
  assert.ok(!args.includes('-i'));
});

test('buildCodexArgs ends the image list before the stdin marker', () => {
  const args = buildCodexArgs({ model: 'm', reasoningEffort: 'low', outputFile: '/tmp/o', imagePaths: ['/tmp/a.jpg', '/tmp/b.png'] });
  assert.deepEqual(args.slice(-5), ['-i', '/tmp/a.jpg', '/tmp/b.png', '--', '-']);
});

test('parseCodexEvents finds the thread id and the failure message', () => {
  const stdout = [
    'some warning line',
    JSON.stringify({ type: 'thread.started', thread_id: '01a1-thread' }),
    JSON.stringify({ type: 'turn.started' }),
    JSON.stringify({ type: 'turn.failed', error: { message: 'You have hit your usage limit' } }),
  ].join('\n');
  assert.deepEqual(parseCodexEvents(stdout), { threadId: '01a1-thread', errorMessage: 'You have hit your usage limit' });
});

test('classifyCodexFailure pauses Codex for usage limits and sign-out, not for ordinary errors', () => {
  const limit = classifyCodexFailure('You have hit your usage limit. Try again later.');
  assert.ok(limit instanceof CodexUnavailableError);
  assert.equal(limit.retryAfterMs, 15 * 60_000);

  const signedOut = classifyCodexFailure('Error: not logged in');
  assert.ok(signedOut instanceof CodexUnavailableError);

  assert.equal(classifyCodexFailure('stream disconnected before completion'), null);
});

test('Codex is never used on Vercel', () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    assert.equal(isCodexAvailable(), false);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});
