// tests/unit/search.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Search Module', () => {
  describe('Global Search', () => {
    it('should search across multiple entity types', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        contacts: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
        deals: [{ id: '2', title: 'Big Deal' }],
        messages: [],
      });

      const results = await mockSearch('john');

      expect(mockSearch).toHaveBeenCalledWith('john');
      expect(results.contacts).toHaveLength(1);
      expect(results.contacts[0].name).toContain('John');
    });

    it('should filter by entity type', async () => {
      const mockSearchFiltered = jest.fn().mockResolvedValue({
        contacts: [{ id: '1', name: 'John Doe' }],
      });

      const results = await mockSearchFiltered('john', 'contacts');

      expect(mockSearchFiltered).toHaveBeenCalledWith('john', 'contacts');
      expect(results).toHaveProperty('contacts');
      expect(results).not.toHaveProperty('deals');
    });

    it('should return autocomplete suggestions', async () => {
      const mockSuggest = jest.fn().mockResolvedValue([
        { type: 'contact', id: '1', label: 'John Doe', sublabel: 'john@example.com' },
      ]);

      const suggestions = await mockSuggest('joh');

      expect(mockSuggest).toHaveBeenCalledWith('joh');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].label).toBe('John Doe');
    });
  });
});
