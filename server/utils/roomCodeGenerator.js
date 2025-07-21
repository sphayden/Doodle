/**
 * Generate unique room codes for game rooms
 */

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_LENGTH = 6;

/**
 * Generate a random room code
 */
function generateRoomCode(length = DEFAULT_LENGTH) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
}

/**
 * Generate a room code that avoids confusing characters
 */
function generateFriendlyRoomCode(length = DEFAULT_LENGTH) {
  // Remove confusing characters: 0, O, I, 1, L
  const friendlyChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += friendlyChars.charAt(Math.floor(Math.random() * friendlyChars.length));
  }
  return result;
}

/**
 * Validate room code format
 */
function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Check length
  if (code.length !== DEFAULT_LENGTH) {
    return false;
  }
  
  // Check characters (alphanumeric uppercase)
  const validPattern = /^[A-Z0-9]+$/;
  return validPattern.test(code);
}

/**
 * Generate multiple unique room codes
 */
function generateMultipleRoomCodes(count, length = DEFAULT_LENGTH) {
  const codes = new Set();
  
  while (codes.size < count) {
    codes.add(generateFriendlyRoomCode(length));
  }
  
  return Array.from(codes);
}

/**
 * Generate room code with checksum (for future use)
 */
function generateRoomCodeWithChecksum(length = DEFAULT_LENGTH - 1) {
  const baseCode = generateFriendlyRoomCode(length);
  const checksum = calculateChecksum(baseCode);
  return baseCode + checksum;
}

/**
 * Calculate simple checksum for room code validation
 */
function calculateChecksum(code) {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += code.charCodeAt(i);
  }
  return CHARACTERS.charAt(sum % CHARACTERS.length);
}

/**
 * Validate room code with checksum
 */
function validateRoomCodeWithChecksum(code) {
  if (!code || code.length < 2) {
    return false;
  }
  
  const baseCode = code.slice(0, -1);
  const providedChecksum = code.slice(-1);
  const calculatedChecksum = calculateChecksum(baseCode);
  
  return providedChecksum === calculatedChecksum;
}

module.exports = {
  generateRoomCode,
  generateFriendlyRoomCode,
  isValidRoomCode,
  generateMultipleRoomCodes,
  generateRoomCodeWithChecksum,
  validateRoomCodeWithChecksum,
  DEFAULT_LENGTH
};