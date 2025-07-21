const Joi = require('joi');

/**
 * Validation schemas and functions for game inputs
 */

// Joi schemas
const schemas = {
  playerName: Joi.string()
    .trim()
    .min(1)
    .max(20)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.empty': 'Player name is required',
      'string.min': 'Player name must be at least 1 character',
      'string.max': 'Player name must be less than 20 characters',
      'string.pattern.base': 'Player name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),
    
  roomCode: Joi.string()
    .trim()
    .length(6)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Room code is required',
      'string.length': 'Room code must be exactly 6 characters',
      'string.pattern.base': 'Room code can only contain uppercase letters and numbers'
    }),
    
  word: Joi.string()
    .trim()
    .min(2)
    .max(30)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.empty': 'Word is required',
      'string.min': 'Word must be at least 2 characters',
      'string.max': 'Word must be less than 30 characters',
      'string.pattern.base': 'Word can only contain letters and spaces'
    }),
    
  canvasData: Joi.string()
    .pattern(/^data:image\/(png|jpeg|jpg);base64,/)
    .required()
    .messages({
      'string.empty': 'Canvas data is required',
      'string.pattern.base': 'Canvas data must be a valid base64 image'
    }),
    
  socketId: Joi.string()
    .trim()
    .min(10)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Socket ID is required',
      'string.min': 'Invalid socket ID format',
      'string.max': 'Invalid socket ID format'
    })
};

/**
 * Validate player name
 */
function validatePlayerName(playerName) {
  const { error, value } = schemas.playerName.validate(playerName);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
}

/**
 * Validate room code
 */
function validateRoomCode(roomCode) {
  const { error, value } = schemas.roomCode.validate(roomCode);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
}

/**
 * Validate word for voting
 */
function validateWord(word) {
  const { error, value } = schemas.word.validate(word);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
}

/**
 * Validate canvas data (base64 image)
 */
function validateCanvasData(canvasData) {
  const { error, value } = schemas.canvasData.validate(canvasData);
  if (error) {
    throw new Error('Invalid canvas data format');
  }
  
  // Additional size check (prevent extremely large images)
  const sizeInBytes = (canvasData.length * 3) / 4; // Approximate base64 to bytes
  const maxSizeInMB = 5; // 5MB limit
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (sizeInBytes > maxSizeInBytes) {
    throw new Error(`Canvas data too large. Maximum size: ${maxSizeInMB}MB`);
  }
  
  return value;
}

/**
 * Validate socket ID
 */
function validateSocketId(socketId) {
  const { error, value } = schemas.socketId.validate(socketId);
  if (error) {
    throw new Error('Invalid socket ID');
  }
  return value;
}

/**
 * Sanitize player name (remove harmful content)
 */
function sanitizePlayerName(playerName) {
  if (!playerName || typeof playerName !== 'string') {
    return '';
  }
  
  return playerName
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 20); // Truncate to max length
}

/**
 * Check for profanity in player names (basic implementation)
 */
function containsProfanity(text) {
  // Basic profanity filter - in production, use a more comprehensive solution
  const profanityWords = [
    'badword1', 'badword2', 'badword3' // Add actual words as needed
  ];
  
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word));
}

/**
 * Validate and sanitize player name with profanity check
 */
function validateAndSanitizePlayerName(playerName) {
  // First sanitize
  const sanitized = sanitizePlayerName(playerName);
  
  // Check for profanity
  if (containsProfanity(sanitized)) {
    throw new Error('Player name contains inappropriate content');
  }
  
  // Then validate
  return validatePlayerName(sanitized);
}

/**
 * Validate game creation data
 */
function validateCreateRoomData(data) {
  const schema = Joi.object({
    playerName: schemas.playerName
  });
  
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  return value;
}

/**
 * Validate join room data
 */
function validateJoinRoomData(data) {
  const schema = Joi.object({
    roomCode: schemas.roomCode,
    playerName: schemas.playerName
  });
  
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  return value;
}

/**
 * Validate vote data
 */
function validateVoteData(data) {
  const schema = Joi.object({
    roomCode: schemas.roomCode,
    word: schemas.word
  });
  
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  return value;
}

/**
 * Validate drawing submission data
 */
function validateDrawingSubmissionData(data) {
  const schema = Joi.object({
    roomCode: schemas.roomCode,
    canvasData: schemas.canvasData
  });
  
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  
  return value;
}

/**
 * Rate limiting helper
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // socketId -> array of timestamps
  }
  
  isAllowed(socketId) {
    const now = Date.now();
    const userRequests = this.requests.get(socketId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(socketId, validRequests);
    
    return true;
  }
  
  cleanup() {
    const now = Date.now();
    for (const [socketId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(socketId);
      } else {
        this.requests.set(socketId, validRequests);
      }
    }
  }
}

module.exports = {
  validatePlayerName,
  validateRoomCode,
  validateWord,
  validateCanvasData,
  validateSocketId,
  sanitizePlayerName,
  containsProfanity,
  validateAndSanitizePlayerName,
  validateCreateRoomData,
  validateJoinRoomData,
  validateVoteData,
  validateDrawingSubmissionData,
  RateLimiter,
  schemas
};