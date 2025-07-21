const OpenAI = require('openai');

class AIJudge {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Evaluate all drawings and return ranked results
   */
  async evaluateDrawings(drawingSubmissions) {
    if (!drawingSubmissions || drawingSubmissions.length === 0) {
      return [];
    }

    console.log(`🤖 AI Judge: Evaluating ${drawingSubmissions.length} drawings for word: "${drawingSubmissions[0].word}"`);
    
    try {
      // Evaluate each drawing
      const evaluations = await Promise.all(
        drawingSubmissions.map(submission => this.evaluateDrawing(submission))
      );
      
      // Sort by score (highest first)
      evaluations.sort((a, b) => b.score - a.score);
      
      // Assign ranks
      evaluations.forEach((evaluation, index) => {
        evaluation.rank = index + 1;
      });
      
      console.log('🏆 AI Judge: Evaluation complete');
      evaluations.forEach(result => {
        console.log(`   ${result.rank}. ${result.playerName}: ${result.score}/100`);
      });
      
      return evaluations;
    } catch (error) {
      console.error('❌ AI Judge: Evaluation failed:', error);
      
      // Fallback: Return random rankings to prevent game from breaking
      return this.generateFallbackResults(drawingSubmissions);
    }
  }

  /**
   * Evaluate a single drawing
   */
  async evaluateDrawing(submission) {
    const { playerId, playerName, canvasData, word } = submission;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.generateEvaluationPrompt(word)
              },
              {
                type: "image_url",
                image_url: {
                  url: canvasData,
                  detail: "low" // Use low detail to reduce costs and improve speed
                }
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0.1 // Low temperature for consistent scoring
      });
      
      const aiResponse = response.choices[0].message.content;
      const score = this.parseScore(aiResponse);
      const feedback = this.parseFeedback(aiResponse);
      
      return {
        playerId,
        playerName,
        score,
        feedback,
        canvasData,
        rank: 0 // Will be set after sorting
      };
      
    } catch (error) {
      console.error(`❌ AI Judge: Failed to evaluate drawing for ${playerName}:`, error);
      
      // Fallback scoring
      return {
        playerId,
        playerName,
        score: Math.floor(Math.random() * 50) + 25, // Random score 25-75
        feedback: "Unable to evaluate drawing due to technical issues.",
        canvasData,
        rank: 0
      };
    }
  }

  /**
   * Generate evaluation prompt for GPT-4V
   */
  generateEvaluationPrompt(word) {
    return `You are judging a drawing in a multiplayer game. Rate this drawing of "${word}" on a scale of 1-100.

Consider these criteria:
1. Recognizability: How clearly does this represent "${word}"?
2. Artistic effort: Is there detail and creativity?
3. Accuracy: How well does it match the actual appearance of "${word}"?

Please respond in exactly this format:
SCORE: [number from 1-100]
FEEDBACK: [brief 1-2 sentence explanation of the score]

Be fair but critical. Average drawings should score 40-60. Only exceptional drawings deserve 80+.`;
  }

  /**
   * Parse score from AI response
   */
  parseScore(response) {
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      return Math.max(1, Math.min(100, score)); // Clamp between 1-100
    }
    
    // Fallback: try to find any number in response
    const numberMatch = response.match(/(\d+)/);
    if (numberMatch) {
      const score = parseInt(numberMatch[1]);
      if (score >= 1 && score <= 100) {
        return score;
      }
    }
    
    // Final fallback
    console.warn('⚠️ AI Judge: Could not parse score from response:', response);
    return Math.floor(Math.random() * 40) + 30; // Random 30-70
  }

  /**
   * Parse feedback from AI response
   */
  parseFeedback(response) {
    const feedbackMatch = response.match(/FEEDBACK:\s*(.+)/i);
    if (feedbackMatch) {
      return feedbackMatch[1].trim();
    }
    
    // If no explicit feedback found, use the whole response (truncated)
    const cleanResponse = response.replace(/SCORE:\s*\d+/i, '').trim();
    return cleanResponse.slice(0, 100) + (cleanResponse.length > 100 ? '...' : '');
  }

  /**
   * Generate fallback results when AI fails
   */
  generateFallbackResults(drawingSubmissions) {
    console.log('🎲 AI Judge: Using fallback random scoring');
    
    const results = drawingSubmissions.map(submission => ({
      playerId: submission.playerId,
      playerName: submission.playerName,
      score: Math.floor(Math.random() * 60) + 20, // Random 20-80
      feedback: "Technical difficulties prevented AI evaluation. Score is randomly assigned.",
      canvasData: submission.canvasData,
      rank: 0
    }));
    
    // Sort and rank
    results.sort((a, b) => b.score - a.score);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    return results;
  }

  /**
   * Test method for validating AI connection
   */
  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello, this is a test." }],
        max_tokens: 10
      });
      
      return { success: true, message: "OpenAI connection successful" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = AIJudge;