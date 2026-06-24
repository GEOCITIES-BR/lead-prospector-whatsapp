import { describe, it, expect } from 'vitest';
import { PhoneValidator } from '../../src/modules/enrichment/phone-validator.js';

const validator = new PhoneValidator();

describe('PhoneValidator', () => {
  describe('validate', () => {
    it('should validate a Brazilian mobile with 11 digits', () => {
      const result = validator.validate('11999999999');
      expect(result.valido).toBe(true);
      expect(result.score).toBe(10);
      expect(result.mensagem).toBe('Telefone celular válido');
    });

    it('should validate a Brazilian landline with 10 digits', () => {
      const result = validator.validate('1133334444');
      expect(result.valido).toBe(true);
      expect(result.score).toBe(7);
      expect(result.mensagem).toBe('Telefone fixo válido');
    });

    it('should reject null phone', () => {
      const result = validator.validate(null);
      expect(result.valido).toBe(false);
      expect(result.score).toBe(0);
      expect(result.mensagem).toBe('Telefone não informado');
    });

    it('should reject phone with too few digits', () => {
      const result = validator.validate('9999');
      expect(result.valido).toBe(false);
    });

    it('should reject phone with too many digits', () => {
      const result = validator.validate('551191234567890');
      expect(result.valido).toBe(false);
    });
  });

  describe('format', () => {
    it('should format 11-digit mobile', () => {
      const result = validator.format('11987654321');
      expect(result).toBe('(11) 9 8765-4321');
    });

    it('should format 10-digit landline', () => {
      const result = validator.format('1133334444');
      expect(result).toBe('(11) 3333-4444');
    });

    it('should return null for null input', () => {
      const result = validator.format(null);
      expect(result).toBeNull();
    });
  });
});
