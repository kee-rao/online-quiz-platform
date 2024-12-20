import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchQuizById, submitQuizResponses } from '../api';
import Question from '../component/Question';
import QuestionTimer from '../component/QuestionTimer';
import '../styles/Start.css'; // Import CSS for styling

const QuizPage = () => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState([]);
  const navigate = useNavigate();
  const { quizId } = useParams();
  const location = useLocation();
  const timePerQuestion = location.state?.timePerQuestion || 30;

  useEffect(() => {
    const getQuiz = async () => {
      try {
        const response = await fetchQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
      }
    };
    getQuiz();
  }, [quizId]);

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const handleOptionChange = (questionId, selectedOption) => {
    setResponses((prevResponses) => {
      const existingResponse = prevResponses.find(
        (response) => response.questionId === questionId
      );
      if (existingResponse) {
        return prevResponses.map((response) =>
          response.questionId === questionId
            ? { ...response, selectedOption }
            : response
        );
      } else {
        return [...prevResponses, { questionId, selectedOption }];
      }
    });
  };

  const submitQuiz = async () => {
    try {
      const payload = {
        userId: localStorage.getItem('userId'),
        quizId,
        responses,
      };
  
      const response = await submitQuizResponses(payload);
      const result = response.data;
      if (response.status === 201) {
        // Make sure result contains responseId
        const responseId = result.responseId;
        if (!responseId) {
          throw new Error('No response ID found');
        }
        navigate('/quiz/results', { state: { score: result.score, responseId } });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };
  

  if (!quiz) return <div>Loading quiz...</div>;

  return (
    <div className="page-container">
      <div className="quiz-container">
        <QuestionTimer onTimeUp={handleNextQuestion} resetKey={currentQuestion} initialTime={timePerQuestion} />
        <div className="question-box">
          <Question
            question={quiz.questions[currentQuestion]}
            questionNumber={currentQuestion + 1} 
            handleOptionChange={handleOptionChange}
          />
        </div>
        <button className="next-button" onClick={handleNextQuestion}>
          {currentQuestion < quiz.questions.length - 1 ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
