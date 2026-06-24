import { describe, it, expect } from 'vitest';
import { EmailValidator } from '../../src/modules/enrichment/email-validator.js';

const validator = new EmailValidator();

describe('EmailValidator', () => {
  it('should validate a correct email', () => {
    const result = validator.validate('joao@empresa.com.br');
    expect(result.valido).toBe(true);
    expect(result.score).toBe(10);
    expect(result.mensagem).toBe('Email válido');
  });

  it('should reject null email', () => {
    const result = validator.validate(null);
    expect(result.valido).toBe(false);
    expect(result.score).toBe(0);
    expect(result.mensagem).toBe('Email não informado');
  });

  it('should reject empty email', () => {
    const result = validator.validate('');
    expect(result.valido).toBe(false);
  });

  it('should reject email without @', () => {
    const result = validator.validate('joaoempresa.com');
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBe('Formato de email inválido');
  });

  it('should reject email without domain', () => {
    const result = validator.validate('joao@');
    expect(result.valido).toBe(false);
  });

  it('should detect disposable domain', () => {
    const result = validator.validate('teste@tempmail.com');
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBe('Domínio descartável detectado');
  });

  it('should detect throwaway domain', () => {
    const result = validator.validate('teste@mailinator.com');
    expect(result.valido).toBe(false);
    expect(result.mensagem).toBe('Domínio descartável detectado');
  });

  it('should be case insensitive', () => {
    const result = validator.validate('Joao@Empresa.Com');
    expect(result.valido).toBe(true);
  });
});
