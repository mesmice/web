import { describe, expect, it } from 'vitest';
import { conversationKeys } from './conversation-query-keys.js';

describe('conversationKeys', () => {
  it('centralizes stable list keys and includes the server limit', () => {
    expect(conversationKeys.all).toEqual(['conversations']);
    expect(conversationKeys.lists()).toEqual(['conversations', 'list']);
    expect(conversationKeys.list()).toEqual(['conversations', 'list', { limit: 50 }]);
    expect(conversationKeys.list(20)).toEqual(['conversations', 'list', { limit: 20 }]);
  });
});
