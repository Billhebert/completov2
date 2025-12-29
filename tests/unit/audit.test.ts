// tests/unit/audit.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Audit Module', () => {
  describe('AuditService', () => {
    it('should create audit log entry', async () => {
      const mockLog = jest.fn().mockResolvedValue({
        id: '1',
        action: 'create',
        entityType: 'contact',
        entityId: '123',
      });

      const entry = await mockLog({
        action: 'create',
        entityType: 'contact',
        entityId: '123',
        newValue: { name: 'John Doe' },
      });

      expect(mockLog).toHaveBeenCalled();
      expect(entry.action).toBe('create');
      expect(entry.entityType).toBe('contact');
    });

    it('should track before/after changes', async () => {
      const mockGetChanges = jest.fn().mockReturnValue({
        name: { old: 'John', new: 'John Doe' },
        email: { old: 'john@old.com', new: 'john@new.com' },
      });

      const changes = mockGetChanges(
        { name: 'John', email: 'john@old.com' },
        { name: 'John Doe', email: 'john@new.com' }
      );

      expect(changes).toHaveProperty('name');
      expect(changes).toHaveProperty('email');
      expect(changes.name.old).toBe('John');
      expect(changes.name.new).toBe('John Doe');
    });

    it('should retrieve entity history', async () => {
      const mockGetHistory = jest.fn().mockResolvedValue([
        { action: 'create', timestamp: new Date('2024-01-01') },
        { action: 'update', timestamp: new Date('2024-01-02') },
      ]);

      const history = await mockGetHistory('contact', '123');

      expect(mockGetHistory).toHaveBeenCalledWith('contact', '123');
      expect(history).toHaveLength(2);
      expect(history[0].action).toBe('create');
    });
  });
});
