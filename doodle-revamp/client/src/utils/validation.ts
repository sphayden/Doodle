/**
 * Validation Utilities
 * 
 * Provides validation functions for game data to ensure type safety
 * and data integrity throughout the application.
 */

import { Player, GameState, GameError, GameErrorCode, createGameError } from '../interfaces';

/**
 * Validates a player name
 * @param name Player name to validate
 * @throws GameError if validation fails
 */
export function validatePlayerName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Player name is required',
      { name },
      true
    );
  }
  
  if (name.trim().length === 0) {
    throw createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Player name cannot be empty',
      { name },
      true
    );
  }
  
  if (name.length > 50) {
    throw createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Player name must be 50 characters or less',
      { name, length: name.length },
      true
    );
  }
  
  // Check for invalid characters
  const invalidChars = /[<>"'&]/;
  if (invalidChars.test(name)) {
    throw createGameError(
      GameErrorCode.INVALID_PLAYER_NAME,
      'Player name contains invalid characters',
      { name, invalidChars: name.match(invalidChars) },
      true
    );
  }
}

/**
 * Validates a room code
 * @param roomCode Room code to validate
 * @throws GameError if validation fails
 */
export function validateRoomCode(roomCode: string): void {
  if (!roomCode || typeof roomCode !== 'string') {
    throw createGameError(
      GameErrorCode.INVALID_ROOM_CODE,
      'Room code is required',
      { roomCode },
      true
    );
  }
  
  const trimmedCode = roomCode.trim().toUpperCase();
  
  if (trimmedCode.length !== 6) {
    throw createGameError(
      GameErrorCode.INVALID_ROOM_CODE,
      'Room code must be exactly 6 characters',
      { roomCode, length: trimmedCode.length },
      true
    );
  }
  
  // Check if it's alphanumeric
  const validFormat = /^[A-Z0-9]{6}$/;
  if (!validFormat.test(trimmedCode)) {
    throw createGameError(
      GameErrorCode.INVALID_ROOM_CODE,
      'Room code must contain only letters and numbers',
      { roomCode },
      true
    );
  }
}

/**
 * Validates canvas data
 * @param canvasData Base64 encoded canvas data
 * @throws GameError if validation fails
 */
export function validateCanvasData(canvasData: string): void {
  if (!canvasData || typeof canvasData !== 'string') {
    throw createGameError(
      GameErrorCode.INVALID_DRAWING_DATA,
      'Canvas data is required',
      { canvasData },
      true
    );
  }
  
  // Check if it's a valid data URL
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  if (!dataUrlPattern.test(canvasData)) {
    throw createGameError(
      GameErrorCode.INVALID_DRAWING_DATA,
      'Canvas data must be a valid image data URL',
      { canvasData: canvasData.substring(0, 100) + '...' },
      true
    );
  }
  
  // Check size (limit to 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (canvasData.length > maxSize) {
    throw createGameError(
      GameErrorCode.INVALID_DRAWING_DATA,
      'Canvas data is too large (max 5MB)',
      { size: canvasData.length, maxSize },
      true
    );
  }
}

/**
 * Validates a vote word
 * @param word Word to vote for
 * @param availableWords List of available words to vote for
 * @throws GameError if validation fails
 */
export function validateVote(word: string, availableWords: string[]): void {
  if (!word || typeof word !== 'string') {
    throw createGameError(
      GameErrorCode.INVALID_VOTE,
      'Vote word is required',
      { word },
      true
    );
  }
  
  if (!availableWords.includes(word)) {
    throw createGameError(
      GameErrorCode.INVALID_VOTE,
      'Vote must be for one of the available words',
      { word, availableWords },
      true
    );
  }
}

/**
 * Validates a Player object
 * @param player Player object to validate
 * @returns true if valid, false otherwise
 */
export function isValidPlayer(player: any): player is Player {
  return (
    player &&
    typeof player === 'object' &&
    typeof player.id === 'string' &&
    typeof player.name === 'string' &&
    typeof player.isHost === 'boolean' &&
    typeof player.isConnected === 'boolean' &&
    typeof player.hasVoted === 'boolean' &&
    typeof player.hasSubmittedDrawing === 'boolean' &&
    typeof player.score === 'number'
  );
}

/**
 * Validates a GameState object
 * @param gameState GameState object to validate
 * @returns true if valid, false otherwise
 */
export function isValidGameState(gameState: any): gameState is GameState {
  if (!gameState || typeof gameState !== 'object') {
    return false;
  }
  
  const requiredStringFields = ['roomCode', 'connectionStatus', 'hostId', 'gamePhase', 'chosenWord'];
  for (const field of requiredStringFields) {
    if (typeof gameState[field] !== 'string') {
      return false;
    }
  }
  
  const requiredBooleanFields = ['isConnected'];
  for (const field of requiredBooleanFields) {
    if (typeof gameState[field] !== 'boolean') {
      return false;
    }
  }
  
  const requiredNumberFields = ['playerCount', 'maxPlayers', 'timeRemaining', 'drawingTimeLimit', 'submittedDrawings'];
  for (const field of requiredNumberFields) {
    if (typeof gameState[field] !== 'number') {
      return false;
    }
  }
  
  const requiredArrayFields = ['players', 'wordOptions', 'results'];
  for (const field of requiredArrayFields) {
    if (!Array.isArray(gameState[field])) {
      return false;
    }
  }
  
  // Validate players array
  if (!gameState.players.every(isValidPlayer)) {
    return false;
  }
  
  // Validate voteCounts is an object
  if (typeof gameState.voteCounts !== 'object' || gameState.voteCounts === null) {
    return false;
  }
  
  return true;
}

/**
 * Sanitizes a player name by removing invalid characters and trimming
 * @param name Player name to sanitize
 * @returns Sanitized player name
 */
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .trim()
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .substring(0, 50); // Limit length
}

/**
 * Sanitizes a room code by converting to uppercase and removing invalid characters
 * @param roomCode Room code to sanitize
 * @returns Sanitized room code
 */
export function sanitizeRoomCode(roomCode: string): string {
  if (!roomCode || typeof roomCode !== 'string') {
    return '';
  }
  
  return roomCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Keep only alphanumeric
    .substring(0, 6); // Limit to 6 characters
}

/**
 * Creates a validation error with consistent formatting
 * @param field Field name that failed validation
 * @param value Value that failed validation
 * @param reason Reason for validation failure
 * @returns GameError object
 */
export function createValidationError(field: string, value: any, reason: string): GameError {
  return createGameError(
    GameErrorCode.INVALID_PLAYER_NAME, // Default to player name, can be overridden
    `Validation failed for ${field}: ${reason}`,
    { field, value, reason },
    true
  );
}