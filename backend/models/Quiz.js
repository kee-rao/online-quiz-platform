const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, auto: true },
        text: { type: String, required: true },
        options: [
          { text: { type: String, required: true }, isCorrect: { type: Boolean } }
        ],
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDefault: { type: Boolean, default: false },
    /*
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    */
  });
  
  module.exports = mongoose.model("Quiz", QuizSchema);