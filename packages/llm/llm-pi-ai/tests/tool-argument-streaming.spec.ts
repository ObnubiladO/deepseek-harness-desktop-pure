import { afterEach, describe, expect, it } from 'vitest'
import type { AssistantMessageEvent, Model } from '@earendil-works/pi-ai'
import { stream as streamAnthropic } from '@earendil-works/pi-ai/api/anthropic-messages'
import { stream as streamCompletions } from '@earendil-works/pi-ai/api/openai-completions'
import { stream as streamResponses } from '@earendil-works/pi-ai/api/openai-responses'
import { BlockAssembler } from '@deepseek-ai/dsh-llm'
import { toStreamChunks } from '../src/stream.ts'
import { normalizeContext } from '@earendil-works/pi-ai/utils/transcript'
import { anthropicFrame as frame, anthropicMessageStart, closeMockServers, mockServer } from './mock-server.ts'

afterEach(closeMockServers)

/** A write call whose arguments arrive in many small deltas. */
const args = { file_path: 'notes.md', content: 'x'.repeat(2048) }
const argsJson = JSON.stringify(args)
const fragments = argsJson.match(/.{1,7}/gs) ?? []

function model<A extends 'anthropic-messages' | 'openai-completions' | 'openai-responses'>(api: A, baseUrl: string): Model<A> {
  return {
    id: 'm', name: 'm', api, provider: 'test', baseUrl, reasoning: false, input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 1024,
  }
}

/**
 * The arguments each `toolcall_delta` partial carries, their serialization at emission time, and the
 * finalized arguments.
 */
async function collect(events: AsyncIterable<AssistantMessageEvent>): Promise<{ partials: unknown[]; emitted: string[]; final: unknown }> {
  const partials: unknown[] = []
  const emitted: string[] = []
  let final: unknown
  for await (const event of events) {
    if (event.type === 'toolcall_delta' && event.delta.length > 0) {
      const block = event.partial.content[event.contentIndex]
      const value = block?.type === 'toolCall' ? block.arguments : undefined
      partials.push(value)
      emitted.push(JSON.stringify(value))
    } else if (event.type === 'toolcall_end') {
      final = event.toolCall.arguments
    } else if (event.type === 'error') {
      throw new Error(event.error.errorMessage)
    }
  }
  return { partials, emitted, final }
}

/**
 * pi-ai 1.5 parses streamed arguments incrementally (earendil-works/pi#9265): every delta yields a
 * snapshot that never changes once returned, and the snapshots only grow. This adapter reads only
 * delta strings and finalized arguments, so these are the properties it relies on.
 */
function expectIncrementalSnapshots({ partials, emitted, final }: { partials: unknown[]; emitted: string[]; final: unknown }) {
  expect(partials).toHaveLength(fragments.length)
  expect(partials.map(partial => JSON.stringify(partial))).toEqual(emitted)
  const contentLengths = partials.map((partial) => {
    const content = (partial as { content?: unknown } | undefined)?.content
    return typeof content === 'string' ? content.length : 0
  })
  expect(contentLengths.every((length, index) => index === 0 || length >= contentLengths[index - 1]!)).toBe(true)
  expect(final).toEqual(args)
}

const context = normalizeContext({ messages: [{ role: 'user', content: 'hi', timestamp: 0 }] })

describe('streamed tool-call arguments (pi-ai incremental parser)', () => {
  it('preserves an empty Responses message after parallel tool calls with its replay metadata', async () => {
    const calls = [0, 1, 2].map(index => ({ type: 'function_call', call_id: `call_${index}`, id: `item_${index}`, name: 'read', arguments: '{}' }))
    const empty = { type: 'message', id: 'message_empty', role: 'assistant', content: [{ type: 'output_text', text: '', annotations: [] }] }
    const server = await mockServer([{ events: [
      '{"type":"response.created","response":{"id":"response_empty_text"}}',
      ...[...calls, empty].flatMap((item, output_index) => [
        JSON.stringify({ type: 'response.output_item.added', output_index, item }),
        JSON.stringify({ type: 'response.output_item.done', output_index, item }),
      ]),
      JSON.stringify({ type: 'response.completed', response: {
        id: 'response_empty_text', status: 'completed', output: [...calls, empty], usage: { input_tokens: 3, output_tokens: 1, total_tokens: 4 },
      } }),
    ] }])
    const assembler = new BlockAssembler()
    for await (const chunk of toStreamChunks(streamResponses(model('openai-responses', server.url), context, { apiKey: 'test-key' }))) {
      assembler.push(chunk)
    }
    expect(assembler.blocks()).toEqual([
      ...calls.map(call => ({ type: 'tool-call', id: `${call.call_id}|${call.id}`, name: 'read', arguments: '{}' })),
      { type: 'text', text: '' },
    ])
    expect(assembler.replayState?.blocks).toEqual([
      ...calls.map(() => ({ type: 'tool-call' })),
      { type: 'text', textSignature: JSON.stringify({ v: 1, id: 'message_empty' }) },
    ])
    expect(assembler.finish).toEqual({ kind: 'tool-calls' })
    expect(server.requests).toHaveLength(1)
  })

  it('openai-completions streams immutable, growing argument snapshots', async () => {
    const server = await mockServer([{ events: [
      JSON.stringify({ choices: [{
        delta: {
          role: 'assistant',
          tool_calls: [{ index: 0, id: 'call_1', type: 'function', function: { name: 'write', arguments: '' } }],
        },
        index: 0, finish_reason: null,
      }] }),
      ...fragments.map(fragment => JSON.stringify({
        choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: fragment } }] }, index: 0, finish_reason: null }],
      })),
      '{"choices":[{"delta":{},"index":0,"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":3,"completion_tokens":1}}',
      '[DONE]',
    ] }])
    const events = streamCompletions(model('openai-completions', server.url), context, { apiKey: 'test-key' })
    expectIncrementalSnapshots(await collect(events))
  })

  it('anthropic-messages streams immutable, growing argument snapshots', async () => {
    const server = await mockServer([{ events: [
      anthropicMessageStart,
      frame({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_1', name: 'write', input: {} } }),
      ...fragments.map(fragment => frame({
        type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: fragment },
      })),
      frame({ type: 'content_block_stop', index: 0 }),
      frame({ type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 5 } }),
      frame({ type: 'message_stop' }),
    ] }])
    const events = streamAnthropic(model('anthropic-messages', server.url), context, { apiKey: 'test-key' })
    expectIncrementalSnapshots(await collect(events))
  })

  it('anthropic-messages keeps a multi-megabyte argument stream linear', async () => {
    // A per-delta re-parse of the whole accumulated JSON would take several seconds here and stall
    // every session in the process; an incremental parser finishes well inside the budget.
    const large = JSON.stringify({ file_path: 'large.md', content: 'y'.repeat(4 * 1024 * 1024) })
    const chunks = large.match(/.{1,4096}/gs) ?? []
    const server = await mockServer([{ events: [
      anthropicMessageStart,
      frame({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_large', name: 'write', input: {} } }),
      ...chunks.map(chunk => frame({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: chunk } })),
      frame({ type: 'content_block_stop', index: 0 }),
      frame({ type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 5 } }),
      frame({ type: 'message_stop' }),
    ] }])
    const started = performance.now()
    let final: unknown
    for await (const event of streamAnthropic(model('anthropic-messages', server.url), context, { apiKey: 'test-key' })) {
      if (event.type === 'toolcall_end') final = event.toolCall.arguments
      else if (event.type === 'error') throw new Error(event.error.errorMessage)
    }
    expect(performance.now() - started).toBeLessThan(3000)
    expect(JSON.stringify(final)).toBe(large)
  }, 20_000)

  it('openai-responses streams immutable, growing argument snapshots', async () => {
    const item = { type: 'function_call', call_id: 'call_1', id: 'fc_1', name: 'write' }
    const server = await mockServer([{ events: [
      '{"type":"response.created","response":{"id":"resp_1"}}',
      JSON.stringify({ type: 'response.output_item.added', output_index: 0, item: { ...item, arguments: '' } }),
      ...fragments.map(fragment => JSON.stringify({ type: 'response.function_call_arguments.delta', output_index: 0, delta: fragment })),
      JSON.stringify({ type: 'response.function_call_arguments.done', output_index: 0, arguments: argsJson }),
      JSON.stringify({ type: 'response.output_item.done', output_index: 0, item: { ...item, arguments: argsJson } }),
      JSON.stringify({ type: 'response.completed', response: {
        id: 'resp_1', status: 'completed', output: [], usage: { input_tokens: 3, output_tokens: 1, total_tokens: 4 },
      } }),
    ] }])
    const events = streamResponses(model('openai-responses', server.url), context, { apiKey: 'test-key' })
    expectIncrementalSnapshots(await collect(events))
  })
})
