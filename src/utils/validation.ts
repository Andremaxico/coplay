export function getUkrainianErrorMessage(
  input: HTMLInputElement,
  customError?: string
): string | null {
  if (customError) return customError;

  const value = input.value;
  const type = input.type;

  // Custom DateTime check for past dates
  if ((type === 'datetime-local' || type === 'date') && value) {
    const selectedTime = new Date(value).getTime();
    const now = Date.now() - 60000; // 1 minute buffer for form filling
    if (selectedTime < now) {
      return 'Час початку гри не може бути в минулому';
    }
  }

  const validity = input.validity;
  if (!validity || validity.valid) return null;

  if (validity.valueMissing) {
    return "Це поле є обов'язковим для заповнення";
  }

  if (validity.typeMismatch) {
    if (type === 'email') {
      return 'Введіть коректну електронну адресу (наприклад, user@example.com)';
    }
    if (type === 'url') {
      return 'Введіть коректну URL-адресу';
    }
    return 'Введено невірний формат даних';
  }

  if (validity.rangeUnderflow) {
    const min = input.getAttribute('min');
    if (type === 'datetime-local' || type === 'date') {
      return `Дата не може бути раніше за ${min}`;
    }
    return `Значення має бути не менше ніж ${min}`;
  }

  if (validity.rangeOverflow) {
    const max = input.getAttribute('max');
    return `Значення має бути не більше ніж ${max}`;
  }

  if (validity.tooShort) {
    const minLength = input.getAttribute('minlength');
    return `Мінімальна довжина: ${minLength} символів`;
  }

  if (validity.tooLong) {
    const maxLength = input.getAttribute('maxlength');
    return `Максимальна довжина: ${maxLength} символів`;
  }

  if (validity.patternMismatch) {
    return 'Введено невірний формат даних';
  }

  if (validity.badInput) {
    return 'Будь ласка, введіть коректне значення';
  }

  return 'Поле заповнено некоректно';
}
