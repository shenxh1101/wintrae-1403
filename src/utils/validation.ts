export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNumber = (value: string, min: number = 1, max: number = 10): boolean => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return false;
  return new Date(startDate) <= new Date(endDate);
};

export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
};

export const validateBookingCode = (code: string): boolean => {
  const codeRegex = /^EXH-[A-Z2-9]{8}-\d{4}$/;
  return codeRegex.test(code.toUpperCase());
};

export const getPhoneError = (phone: string): string => {
  if (!validateRequired(phone)) return '请输入手机号';
  if (!validatePhone(phone)) return '请输入正确的手机号';
  return '';
};

export const getNameError = (name: string): string => {
  if (!validateRequired(name)) return '请输入姓名';
  if (name.length < 2) return '姓名至少2个字符';
  return '';
};

export const getCountError = (count: number, remaining: number): string => {
  if (count < 1) return '请输入预约人数';
  if (count > remaining) return `余票不足，仅剩${remaining}张`;
  if (count > 10) return '单次预约最多10人';
  return '';
};
