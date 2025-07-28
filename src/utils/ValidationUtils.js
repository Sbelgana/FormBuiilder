const ValidationUtils = {
  isValidEmail(email) {
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return emailPattern.test(email);
  },
  isValidPhoneNumber(phoneNumber) {
    const phonePattern = /^(\(\d{3}\)|\d{3})[- ]?\d{3}[- ]?\d{4}$/;
    return phonePattern.test(phoneNumber);
  },
  isValidUrl(url) {
    if (!url || url.trim() === '') return false;
    let testUrl = url.trim();
    if (!testUrl.match(/^https?:\/\//)) {
      testUrl = 'https://' + testUrl;
    }
    try {
      new URL(testUrl);
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:\/?#[\]@!$&'()*+,;=%]*)?$/;
      return urlPattern.test(url.trim());
    } catch (e) {
      return false;
    }
  },
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  },
  normalizeUrl(url) {
    if (!url || url.trim() === '') return '';
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//)) {
      if (normalized.startsWith('www.') || normalized.split('.').length > 2) {
        normalized = 'https://' + normalized;
      } else {
        normalized = 'https://www.' + normalized;
      }
    }
    return normalized;
  }
};
export default ValidationUtils;
