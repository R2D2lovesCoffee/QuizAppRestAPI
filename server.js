//SETUP
const app = require('express')();
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Acces-Control-Allow-Methods', 'GET,POST,DELETE,PUT');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const sequelize = new Sequelize('quiz-app', 'root', '', {
  dialect: 'mysql',
  define: {
    timestamps: false
  }
})

sequelize.authenticate();

const Answer = sequelize.define('answer', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  text: Sequelize.STRING,
  isCorrect: Sequelize.BOOLEAN,
});
const Question = sequelize.define('question', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  text: Sequelize.STRING,
})
Question.hasMany(Answer);

const Quiz = sequelize.define('quiz', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  time: Sequelize.INTEGER,
  active: Sequelize.BOOLEAN,
  privat: Sequelize.BOOLEAN,
  code: Sequelize.INTEGER,
})
Quiz.hasMany(Question);

const Student = sequelize.define('student', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING },
  email: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
})

const Teacher = sequelize.define('teacher', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING },
  email: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
})

Teacher.hasMany(Quiz);

const TakenQuiz = sequelize.define('takenquiz', {
  score: Sequelize.INTEGER,
  remainingTries: Sequelize.INTEGER
});
Student.belongsToMany(Quiz, { through: TakenQuiz });
Quiz.belongsToMany(Student, { through: TakenQuiz });

sequelize.sync();

////////////////
//ANSWERS ROUTE
app.get('/answers', async (req, res) => {
  try {
    let answers = await Answer.findAll({ where: req.query });
    res.status(200).send(JSON.stringify({ answers: answers }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.get('/answers/:id', async (req, res) => {
  try {
    let answer = await Answer.findByPk(req.params.id);
    if (answer) {
      delete answer.dataValues.questionId;
      res.status(200).send(JSON.stringify(answer));
    }
    else
      res.status(404).send(JSON.stringify({ message: 'not found!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).json({ message: 'server error' });
  }
})
app.post('/answers', async (req, res) => {
  try {
    let answer = req.body.answer;
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (answer) {
        // await Answer.create(answer);
        console.log(answer);
        res.status(201).send(JSON.stringify({ message: 'created!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.put('/answers/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body.answer) {
        let answer = await Answer.findByPrimary(req.params.id);
        if (answer) {
          await answer.update(req.body.answer);
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.delete('/answers/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body.answer) {
        let answer = await Answer.findByPrimary(req.params.id);
        if (answer) {
          await answer.destroy();
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
////////////
//QUESTIONS ROUTE//
app.get('/questions/:id', async (req, res) => {
  try {
    let question = await Question.findByPk(req.params.id);
    if (question) {
      let answers = await Answer.findAll({ where: { questionId: question.id }, raw: true });
      question.dataValues.answers = answers;
      // question.answers = answers;
      res.status(200).send(JSON.stringify(question));
      console.log(question);
    }
    else
      res.status(404).send(JSON.stringify({ message: 'not found!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).json({ message: 'server error' });
  }
})
app.post('/questions', async (req, res) => {
  try {
    let question = req.body.question;
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (question) {
        await Question.create(question);
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
      res.status(201).send(JSON.stringify({ message: 'created!' }))
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.put('/questions/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body.question) {
        let question = await Question.findByPrimary(req.params.id);
        if (question) {
          await question.update(req.body.question);
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.delete('/questions/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body.question) {
        let question = await Question.findByPrimary(req.params.id);
        if (question) {
          await question.destroy();
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
//////////////////
//QUIZES ROUTE/////////////
app.get('/lastQuiz', async (req, res) => {
  try {
    let quizes = await Quiz.findAll({ raw: true });
    lastQuiz = quizes[quizes.length - 1];
    lastQuiz.privat = lastQuiz.privat == 1 ? true : false;
    lastQuiz.active = lastQuiz.active == 1 ? true : false;
    res.status(200).send(JSON.stringify(lastQuiz));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.get('/lastQuestion', async (req, res) => {
  try {
    let questions = await Question.findAll({ raw: true });
    res.status(200).send(JSON.stringify(questions[questions.length - 1]));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.get('/quizes', async (req, res) => {
  try {
    let query = req.query;
    let quizes = await Quiz.findAll({ where: query });
    if (quizes) {
      for (let i = 0; i < quizes.length; i++) {
        let questions = await Question.findAll({ where: { quizId: quizes[i].id }, raw: true });
        for (let j = 0; j < questions.length; j++) {
          let answers = await Answer.findAll({ where: { questionId: questions[j].id }, raw: true });
          answers.forEach((answer) => {
            delete answer.questionId;
            answer.isCorrect = answer.isCorrect == 1 ? true : false;
          });
          questions[j].answers = answers;
        }
        quizes[i].dataValues.questions = questions;
      }
      res.status(200).send(JSON.stringify(quizes));
    }
    else
      res.status(404).send(JSON.stringify('not found!'));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }))
  }
})
app.get('/quizes/:id', async (req, res) => {
  try {
    let quiz = await Quiz.findByPk(req.params.id);
    if (quiz) {
      let questions = await Question.findAll({ where: { quizId: quiz.id }, raw: true });
      for (let i = 0; i < questions.length; i++) {
        let answers = await Answer.findAll({ where: { questionId: questions[i].id }, raw: true });
        answers.forEach((answer) => {
          delete answer.questionId;
          answer.isCorrect = answer.isCorrect == 1 ? true : false;
        });
        questions[i].answers = answers;
        delete questions[i].quizId;
      }
      quiz.dataValues.questions = questions;
      delete quiz.dataValues.teacherId;
      console.log(quiz);
      res.status(200).send(JSON.stringify(quiz));
    }
    else
      res.status(404).send(JSON.stringify({ message: 'not found!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).json({ message: 'server error' });
  }
})
app.post('/quizes', async (req, res) => {
  try {
    let quiz = req.body;
    if (quiz) {
      if (quiz.id != 0)
        await Quiz.destroy({ where: { id: quiz.id } });
      await Quiz.create({
        id: null,
        name: quiz.name,
        time: quiz.time,
        active: quiz.active,
        privat: quiz.privat,
        description: quiz.description,
        code: quiz.code,
        teacherId: quiz.teacherId
      });
      let quizDB = await Quiz.findOne({ where: { code: quiz.code } });
      quiz.id = quizDB.id;

      let answersDB = await Answer.findAll();
      let answerDB = answersDB[answersDB.length - 1];
      let questionsDB = await Question.findAll();
      let questionDB = questionsDB[questionsDB.length - 1];

      console.log(answerDB);
      console.log(questionDB);
      for (let i = 0; i < quiz.questions.length; i++) {

        let question = quiz.questions[i];
        quiz.questions[i].id = questionDB.id + i + 1;

        await Question.create({
          id: questionDB.id + i + 1,
          text: question.text,
          quizId: quizDB.id
        });
        for (let j = 0; j < question.answers.length; j++) {

          await Answer.create({
            id: answerDB.id + j + 1 + i * 4,
            text: question.answers[j].text,
            isCorrect: question.answers[j].isCorrect,
            questionId: questionDB.id + i + 1
          });
          quiz.questions[i].answers[j].id = answerDB.id + j + 1 + i * 4;
        }
      }
      res.status(201).send(JSON.stringify(quiz));
    }
    else
      res.status(500).send(JSON.stringify({ message: 'failed!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.post('/updateQuizes/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body) {
        let quizDB = { id: req.body.id, name: req.body.name, description: req.body.description, time: req.body.time, active: req.body.active, privat: req.body.privat, code: req.body.code, teacherId: req.body.teacherId };
        console.warn(quizDB);
        let quiz = await Quiz.findByPrimary(req.params.id);
        if (quiz) {
          await quiz.update(quizDB);
          for (let i = 0; i < req.body.questions.length; i++) {
            let question = req.body.questions[i];
            let questionDB = { id: question.id, text: question.text, quizId: quizDB.id };
            q = await Question.findByPrimary(questionDB.id); q.update(questionDB);
            for (let j = 0; j < question.answers; j++) {
              let answerDB = { id: question.answers[j].id, text: question.answers[j].text, isCorrect: question.answers[j].isCorrect, questionId: questionDB.id };
              let answer = await Answer.findByPrimary(answerDB.id);
              await Answer.update(answer);
            }

          }
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.get('/teachers/:id', async (req, res) => {
  try {
    let quizes = await Quiz.findAll({ where: { teacherId: req.params.id } });
    res.send(JSON.stringify({ no: quizes.length }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.delete('/quizes/:id', async (req, res) => {
  try {
    let credentials = req.body.credentials;
    if (checkTeacherCredentials(credentials)) {
      if (req.body.quiz) {
        let quiz = await Quiz.findByPrimary(req.params.id);
        if (quiz) {
          await quiz.destroy();
          res.status(202).send(JSON.stringify({ message: 'accepted!' }))
        }
        else
          res.status(404).send(JSON.stringify({ message: 'not found!' }))
      }
      else
        res.status(400).send(JSON.stringify({ message: 'failed!' }));
    }
    else
      res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.post('/login/student', async (req, res) => {
  try {
    if (req.body.email && req.body.password) {
      let student = await Student.find({ where: { email: req.body.email, password: req.body.password }, raw: true })
      if (student) {
        let takenQuizes = await TakenQuiz.findAll({ where: { studentId: student.id } })
        for (let i = 0; i < takenQuizes.length; i++) {
          let quiz = await Quiz.findByPrimary(takenQuizes[i].quizId);
          let questions = await Question.findAll({ where: { quizId: quiz.id }, raw: true });
          for (let i = 0; i < questions.length; i++) {
            let answers = await Answer.findAll({ where: { questionId: questions[i].id }, raw: true });
            answers.forEach(answer => {
              delete answer.questionId;
              answer.isCorrect = answer.isCorrect == 1 ? true : false
            })
            questions[i].answers = answers;
            delete questions[i].quizId;
          }
          quiz.dataValues.questions = questions;
          delete quiz.dataValues.teacherId;
          takenQuizes[i].dataValues.quiz = quiz;
          delete takenQuizes[i].dataValues.studentId;
          delete takenQuizes[i].dataValues.quizId;
        }
        student.takenQuizes = takenQuizes;
        res.status(200).send(JSON.stringify(student));
      }
      else
        res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
    }
    else
      res.status(400).send(JSON.stringify({ message: 'failed!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})

app.post('/takenQuizes', async (req, res) => {
  try {
    if (req.body) {
      let takenQuiz = await TakenQuiz.find({ where: { studentId: req.body.studentId, quizId: req.body.quizId }, limit: 1 });
      if (takenQuiz) {
        await takenQuiz.update(req.body);
        console.log(req.body);
        res.status(202).send(JSON.stringify({ message: 'accepted!' }));
      }
      else {
        await TakenQuiz.create(req.body);
        res.status(201).send(JSON.stringify({ message: 'created!' }));
      }
    }
    else
      res.status(400).send(JSON.stringify({ message: 'failed!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.get('/takenQuizes', async (req, res) => {
  try {
    let takenQuizes = await TakenQuiz.findAll({ where: req.query });
    res.status(200).send(JSON.stringify(takenQuizes));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})



app.post('/login/teacher', async (req, res) => {
  try {
    if (req.body.email && req.body.password) {
      let teacher = await Teacher.find({ where: { email: req.body.email, password: req.body.password }, raw: true })
      if (teacher) {
        let quizes = await Quiz.findAll({ where: { teacherId: teacher.id } })
        for (let i = 0; i < quizes.length; i++) {
          let questions = await Question.findAll({ where: { quizId: quizes[i].id }, raw: true });
          for (let j = 0; j < questions.length; j++) {
            let answers = await Answer.findAll({ where: { questionId: questions[j].id }, raw: true });
            answers.forEach(answer => {
              delete answer.questionId;
              answer.isCorrect = answer.isCorrect == 1 ? true : false;
            })
            questions[j].answers = answers;
            delete questions[j].quizId;
          }
          quizes[i].dataValues.questions = questions;
          delete quizes[i].dataValues.teacherId;
          delete quizes[i].dataValues.quizId;
        }
        teacher.quizes = quizes;
        res.status(200).send(JSON.stringify(teacher));
      }
      else
        res.status(403).send(JSON.stringify({ message: 'you have no authorization!' }));
    }
    else
      res.status(400).send(JSON.stringify({ message: 'failed!' }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
app.post('/teacherName', async (req, res) => {
  try {
    let quiz = req.body;
    let q = await Quiz.find({ where: { id: quiz.id }, raw: true });
    console.warn(q);
    let teacherId = q.teacherId;
    let teacher = await Teacher.findOne({ where: { id: teacherId }, raw: true })
    console.warn(teacher.name);
    res.status(200).send(JSON.stringify({ creator: teacher.name }));
  }
  catch (e) {
    console.warn(e);
    res.status(500).send(JSON.stringify({ message: 'server error!' }));
  }
})
// app.get('/students/:id/takenQuizes', async (req, res) => {
//   try {
//     let student = await Student.findByPrimary(req.params.id);
//     if (student) {
//       let takenQuizes = await TakenQuiz.findAll({ where: { studentId: student.dataValues.id } })
//       for (let i = 0; i < takenQuizes.length; i++) {
//         let quiz = await Quiz.findByPrimary(takenQuizes[i].quizId);
//         let questions = await Question.findAll({ where: { quizId: quiz.id }, raw: true });
//         for (let i = 0; i < questions.length; i++) {
//           let answers = await Answer.findAll({ where: { questionId: questions[i].id }, raw: true });
//           questions[i].answers = answers;
//         }
//         quiz.dataValues.questions = questions;
//         takenQuizes[i].dataValues.quiz = quiz;
//         delete takenQuizes[i].dataValues.studentId;
//         delete takenQuizes[i].dataValues.quizId;
//       }
//       res.status(200).send(JSON.stringify(takenQuizes));
//     }
//     else
//       res.status(404).send(JSON.stringify({ message: 'not found!' }));
//   }
//   catch (e) {
//     console.warn(e);
//     res.status(500).send(JSON.stringify({ message: 'server error!' }));
//   }
// })

function checkTeacherCredentials(credentials) {
  return true;
}
app.listen(8000, () => {
  console.log('server started on port 8000...');
})

