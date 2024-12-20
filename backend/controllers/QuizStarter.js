const Quiz = require('../models/Quiz');
const Response = require('../models/Response');
const User=require('../models/User');
//stores responses when user starts quiz
exports.storeResponses = async (req, res) => {
  try {
    const { userId, quizId, responses } = req.body;

    let totalScore = 0;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Check correctness and calculate score
    const formattedResponses = responses.map((response) => {
      const question = quiz.questions.id(response.questionId);
      const isCorrect = question.options.some(
        (option) => option.text === response.selectedOption && option.isCorrect
      );
      if (isCorrect) totalScore += 10; // Add to score for each correct answer
      return { ...response, isCorrect };
    });

    // Find the existing response document
    const existingResponse = await Response.findOne({ user: userId, quiz: quizId });

    if (existingResponse) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      user.score -= existingResponse.score;
      // Update the existing response with new data
      existingResponse.responses = formattedResponses;
      existingResponse.score = totalScore;
      existingResponse.submittedAt = new Date(); // Update timestamp
      await existingResponse.save();

      // Update User model: increase score and quizzes played
      
      user.score += totalScore; // Add total score to user's score
      await user.save(); // Save the updated user

      res.status(201).json({
        message: "Quiz retaken and response updated",
        score: totalScore,
        responseId: existingResponse._id,
      });
    } else {
      // Create a new response if no previous attempt exists
      const newResponse = await Response.create({
        user: userId,
        quiz: quizId,
        responses: formattedResponses,
        score: totalScore,
      });

      // Update User model: increase score and quizzes played
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.score += totalScore; // Add total score to user's score
      user.quizzesPlayed += 1; // Increment quizzes played
      await user.save(); // Save the updated user

      res.status(201).json({
        message: "Response saved",
        score: totalScore,
        responseId: newResponse._id,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//gets number of responses in a quiz
exports.getNumberOfQuestions = async (req, res) => {
  try {
      const { quizId } = req.params;
      const quiz = await Quiz.findById(quizId);

      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      const numberOfQuestions = quiz.questions.length;
      res.status(200).json({ numberOfQuestions });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Fetch the quiz result for a specific response (user's quiz submission)
exports.getQuizResults = async (req, res) => {
  const { responseId } = req.params;
  try {
    const response = await Response.findById(responseId)
      .populate({
        path: 'quiz',
        select: 'title questions',
        populate: {
          path: 'questions.options',
          select: 'text isCorrect'
        }
      })
      .lean();

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const correctResponses = [];
    const incorrectResponses = [];
    const skippedQuestions = [];

    const totalQuestions = response.quiz.questions.length;

    // Track answered questions by index
    const answeredQuestionIds = new Set(response.responses.map((resp) => resp.questionId.toString()));

    response.quiz.questions.forEach((question, index) => {
      const userResponse = response.responses.find((resp) => resp.questionId.toString() === question._id.toString());
      if (!userResponse) {
        // If no response, mark as skipped
        skippedQuestions.push({
          questionText: question.text
        });
        return;
      }

      // Check the correctness of the user's response
      const selectedOption = question.options.find((opt) => opt.text === userResponse.selectedOption);
      if (selectedOption && selectedOption.isCorrect) {
        correctAnswers++;
        correctResponses.push({
          questionText: question.text,
          selectedOption: userResponse.selectedOption,
        });
      } else {
        incorrectAnswers++;
        incorrectResponses.push({
          questionText: question.text,
          selectedOption: userResponse.selectedOption,
        });
      }
    });

    const scorePercentage = (correctAnswers / totalQuestions) * 100;

    // Prepare response
    const result = {
      score: response.score,
      totalQuestions,
      correctResponses,
      incorrectResponses,
      skippedQuestions, // Explicitly list skipped questions
      scorePercentage: scorePercentage.toFixed(2),
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ message: 'Error fetching quiz results' });
  }
};

// Check if the user has already taken a specific quiz
exports.hasUserTakenQuiz = async (req, res) => {
  try {
    const { userId, quizId } = req.body;

    const existingResponse = await Response.findOne({ user: userId, quiz: quizId });

    if (existingResponse) {
      res.status(200).json({ taken: true, score: existingResponse.score });
    } else {
      res.status(200).json({ taken: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





