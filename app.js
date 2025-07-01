const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// 로컬 유저 저장용 변수 (DB 대신)
const users = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true
}));

// 메인 페이지
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('index', { user: req.session.user });
});

// 회원가입 페이지
app.get('/register', (req, res) => {
  res.render('register');
});

// 회원가입 처리
app.post('/register', (req, res) => {
  const { name, student_id } = req.body;

  if (!name || !student_id) {
    return res.send('이름과 학번을 모두 입력해주세요.');
  }

  // 중복 체크
  const existing = users.find(u => u.student_id === student_id);
  if (existing) {
    return res.send('이미 등록된 학번입니다.');
  }

  users.push({ name, student_id });
  res.redirect('/login');
});

// 로그인 페이지
app.get('/login', (req, res) => {
  res.render('login');
});

// 로그인 처리
app.post('/login', (req, res) => {
  const { name, student_id } = req.body;

  if (!name || !student_id) {
    return res.send('이름과 학번을 모두 입력해주세요.');
  }

  const user = users.find(u => u.name === name && u.student_id === student_id);
  if (!user) {
    return res.send('로그인 정보가 잘못되었습니다.');
  }

  req.session.user = user;
  res.redirect('/');
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 실행 중: http://localhost:${port}`);
});

// 대여 목록 (메모리 사용)
const rentals = [];

// 대여 페이지
app.get('/borrow', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const today = new Date();
  const weekdayRentals = rentals.filter(r => {
    const date = new Date(r.date);
    return date >= today;
  });

  res.render('borrow', {
    user: req.session.user,
    rentals: weekdayRentals
  });
});

// 대여 처리
app.post('/borrow', (req, res) => {
  const { laptopNumber, date, timeSlot } = req.body;

  // 이미 대여된 노트북인지 확인
  const alreadyRented = rentals.find(
    r => r.laptopNumber === laptopNumber && r.date === date && r.timeSlot === timeSlot
  );

  if (alreadyRented) {
    return res.send('이미 대여된 노트북입니다.');
  }

  rentals.push({
    name: req.session.user.name,
    student_id: req.session.user.student_id,
    laptopNumber,
    date,
    timeSlot
  });

  res.send('대여가 완료되었습니다!');
});