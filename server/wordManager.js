class WordManager {
  constructor() {
    // Comprehensive word lists by difficulty
    this.wordLists = {
      easy: [
        'cat', 'dog', 'house', 'tree', 'car', 'sun', 'moon', 'star', 'fish', 'bird',
        'flower', 'apple', 'cake', 'book', 'phone', 'chair', 'table', 'door', 'window', 'hat',
        'ball', 'cup', 'pen', 'key', 'clock', 'shoe', 'hand', 'eye', 'nose', 'smile',
        'heart', 'cloud', 'rain', 'snow', 'fire', 'water', 'rock', 'grass', 'leaf', 'egg'
      ],
      
      medium: [
        'butterfly', 'mountain', 'guitar', 'piano', 'camera', 'bicycle', 'airplane', 'boat',
        'castle', 'bridge', 'rainbow', 'lightning', 'elephant', 'giraffe', 'penguin', 'dolphin',
        'hamburger', 'pizza', 'sandwich', 'chocolate', 'basketball', 'football', 'tennis', 'swimming',
        'telescope', 'microscope', 'calculator', 'computer', 'television', 'refrigerator',
        'escalator', 'backpack', 'umbrella', 'sunglasses', 'necklace', 'bracelet', 'painting', 'sculpture'
      ],
      
      hard: [
        'metamorphosis', 'synchronization', 'photosynthesis', 'constellation', 'archipelago',
        'democracy', 'philosophy', 'psychology', 'archaeology', 'geography', 'astronomy',
        'microscopic', 'kaleidoscope', 'thermometer', 'stethoscope', 'periscope',
        'helicopter', 'submarine', 'astronaut', 'scientist', 'architect', 'engineer',
        'ecosystem', 'biodiversity', 'renewable', 'sustainable', 'gravitational', 'electromagnetic'
      ],
      
      animals: [
        'cat', 'dog', 'elephant', 'giraffe', 'lion', 'tiger', 'bear', 'rabbit', 'fox', 'wolf',
        'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'duck', 'goose', 'turkey', 'peacock',
        'eagle', 'hawk', 'owl', 'parrot', 'flamingo', 'penguin', 'dolphin', 'whale', 'shark', 'octopus',
        'turtle', 'frog', 'lizard', 'snake', 'butterfly', 'bee', 'spider', 'ant', 'ladybug', 'dragonfly'
      ],
      
      objects: [
        'chair', 'table', 'lamp', 'phone', 'computer', 'television', 'refrigerator', 'oven',
        'car', 'bicycle', 'airplane', 'boat', 'train', 'bus', 'motorcycle', 'skateboard',
        'guitar', 'piano', 'violin', 'drums', 'trumpet', 'flute', 'camera', 'telescope',
        'book', 'pen', 'pencil', 'scissors', 'hammer', 'screwdriver', 'paintbrush', 'mirror'
      ],
      
      food: [
        'apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon', 'pineapple', 'mango',
        'pizza', 'hamburger', 'hotdog', 'sandwich', 'pasta', 'sushi', 'tacos', 'burrito',
        'cake', 'cookie', 'ice cream', 'chocolate', 'candy', 'donut', 'pie', 'cupcake',
        'bread', 'cheese', 'milk', 'eggs', 'chicken', 'fish', 'steak', 'salad'
      ],
      
      nature: [
        'tree', 'flower', 'grass', 'mountain', 'river', 'ocean', 'lake', 'forest',
        'desert', 'volcano', 'island', 'beach', 'cave', 'waterfall', 'valley', 'hill',
        'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'lightning', 'rainbow',
        'wind', 'storm', 'tornado', 'earthquake', 'sunrise', 'sunset', 'aurora', 'galaxy'
      ]
    };
    
    this.allWords = [
      ...this.wordLists.easy,
      ...this.wordLists.medium,
      ...this.wordLists.hard
    ];
    
    // Remove duplicates
    this.allWords = [...new Set(this.allWords)];
  }

  /**
   * Get random words for voting
   */
  getRandomWords(count = 4, difficulty = 'mixed', category = 'all') {
    let sourceWords = [];
    
    if (category === 'all') {
      if (difficulty === 'mixed') {
        sourceWords = this.allWords;
      } else if (this.wordLists[difficulty]) {
        sourceWords = this.wordLists[difficulty];
      } else {
        sourceWords = this.allWords;
      }
    } else if (this.wordLists[category]) {
      sourceWords = this.wordLists[category];
    } else {
      sourceWords = this.allWords;
    }
    
    // Shuffle and return requested count
    const shuffled = this.shuffleArray([...sourceWords]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get words by specific difficulty
   */
  getWordsByDifficulty(difficulty, count = 10) {
    if (!this.wordLists[difficulty]) {
      throw new Error(`Unknown difficulty: ${difficulty}`);
    }
    
    const shuffled = this.shuffleArray([...this.wordLists[difficulty]]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get words by category
   */
  getWordsByCategory(category, count = 10) {
    if (!this.wordLists[category]) {
      throw new Error(`Unknown category: ${category}`);
    }
    
    const shuffled = this.shuffleArray([...this.wordLists[category]]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get balanced word selection (mix of difficulties)
   */
  getBalancedWords(count = 4) {
    const result = [];
    const difficulties = ['easy', 'medium', 'hard'];
    
    // Distribute words across difficulties
    const wordsPerDifficulty = Math.floor(count / difficulties.length);
    const remainder = count % difficulties.length;
    
    for (let i = 0; i < difficulties.length; i++) {
      const difficulty = difficulties[i];
      const wordsNeeded = wordsPerDifficulty + (i < remainder ? 1 : 0);
      
      if (wordsNeeded > 0) {
        const words = this.getWordsByDifficulty(difficulty, wordsNeeded);
        result.push(...words);
      }
    }
    
    // Shuffle final result
    return this.shuffleArray(result);
  }

  /**
   * Validate if word exists in word lists
   */
  isValidWord(word) {
    return this.allWords.includes(word.toLowerCase());
  }

  /**
   * Get word difficulty
   */
  getWordDifficulty(word) {
    const lowerWord = word.toLowerCase();
    
    for (const [difficulty, words] of Object.entries(this.wordLists)) {
      if (words.includes(lowerWord)) {
        return difficulty;
      }
    }
    
    return 'unknown';
  }

  /**
   * Get word category
   */
  getWordCategory(word) {
    const lowerWord = word.toLowerCase();
    
    const categories = ['animals', 'objects', 'food', 'nature'];
    for (const category of categories) {
      if (this.wordLists[category].includes(lowerWord)) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Add custom words (for future extensibility)
   */
  addCustomWords(words, difficulty = 'medium') {
    if (!this.wordLists[difficulty]) {
      this.wordLists[difficulty] = [];
    }
    
    const newWords = words.filter(word => !this.allWords.includes(word.toLowerCase()));
    this.wordLists[difficulty].push(...newWords.map(w => w.toLowerCase()));
    this.allWords.push(...newWords.map(w => w.toLowerCase()));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalWords: this.allWords.length,
      byDifficulty: {
        easy: this.wordLists.easy.length,
        medium: this.wordLists.medium.length,
        hard: this.wordLists.hard.length
      },
      byCategory: {
        animals: this.wordLists.animals.length,
        objects: this.wordLists.objects.length,
        food: this.wordLists.food.length,
        nature: this.wordLists.nature.length
      }
    };
  }

  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get available difficulties
   */
  getAvailableDifficulties() {
    return ['easy', 'medium', 'hard'];
  }

  /**
   * Get available categories
   */
  getAvailableCategories() {
    return ['animals', 'objects', 'food', 'nature'];
  }
}

module.exports = WordManager;