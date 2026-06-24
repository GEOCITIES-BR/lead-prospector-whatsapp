export class PhoneValidator {
  validate(phone: string | null): { valido: boolean; score: number; mensagem: string } {
    if (!phone || phone.trim().length === 0) {
      return { valido: false, score: 0, mensagem: 'Telefone não informado' };
    }

    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 13) {
      return { valido: false, score: 0, mensagem: `Número de dígitos inválido (${digits.length})` };
    }

    const isMobile = this.isBrazilianMobile(digits);

    return {
      valido: true,
      score: isMobile ? 10 : 7,
      mensagem: isMobile ? 'Telefone celular válido' : 'Telefone fixo válido',
    };
  }

  format(phone: string | null): string | null {
    if (!phone) return null;

    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }

    return digits;
  }

  private isBrazilianMobile(digits: string): boolean {
    if (digits.length === 11 && digits.startsWith('55')) {
      return ['6', '7', '8', '9'].includes(digits[2]);
    }
    if (digits.length === 11) {
      return ['6', '7', '8', '9'].includes(digits[2]);
    }
    if (digits.length === 10) {
      return false;
    }
    return false;
  }
}
