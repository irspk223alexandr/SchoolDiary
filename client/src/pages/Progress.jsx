import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { Container, Table, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';

const Progress = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // ← поиск
  const roles = useSelector(state => state.auth.roles || []);
  const user = useSelector(state => state.auth.user);

  const isStudent = roles.includes('Ученик');
  const isTeacher = roles.includes('Преподаватель');
  const isDirector = roles.includes('Директор');

  // Фильтрация учеников по ФИО
  const filteredStudents = studentsList.filter(s => {
    const fullName = `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Загружаем список учеников для учителя/директора
  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (isDirector) {
          const res = await api.get('/director/students');
          setStudentsList(res.data);
        } else if (isTeacher) {
          const res = await api.get('/progress/students');
          setStudentsList(res.data);
        }
      } catch (err) {
        console.error('Ошибка загрузки учеников:', err);
      }
    };
    if (!isStudent) {
      loadStudents();
    }
  }, [isStudent, isTeacher, isDirector]);

  // Загружаем оценки при выборе ученика или при первом рендере
  useEffect(() => {
    fetchGrades();
  }, [selectedStudentId]);

  const fetchGrades = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedStudentId) {
        params.student_id = selectedStudentId;
      }
      const res = await api.get('/progress', { params });
      setGrades(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки успеваемости');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (e) => {
    setSelectedStudentId(e.target.value);
    setSearchTerm(''); // очищаем поиск после выбора
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Загрузка успеваемости...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <h3>Успеваемость</h3>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h3>Успеваемость</h3>
      
      {/* Поиск и выбор ученика для учителя/директора */}
      {!isStudent && (
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Поиск ученика</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите фамилию, имя или отчество..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Выберите ученика</Form.Label>
              <Form.Select 
                value={selectedStudentId} 
                onChange={handleStudentChange}
              >
                <option value="">-- Выберите ученика --</option>
                {filteredStudents.length === 0 ? (
                  <option disabled>Ничего не найдено</option>
                ) : (
                  filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} {s.middle_name || ''}
                    </option>
                  ))
                )}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}

      {grades.length === 0 ? (
        <Alert variant="info">
          {!isStudent && !selectedStudentId 
            ? 'Выберите ученика для просмотра успеваемости' 
            : 'Нет оценок'}
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Предмет</th>
              <th>1 четверть</th>
              <th>2 четверть</th>
              <th>3 четверть</th>
              <th>4 четверть</th>
              <th>Годовая</th>
              <th>Экзамен</th>
              <th>Итоговая</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(subj => (
              <tr key={subj.subject_id}>
                <td><strong>{subj.subject_name}</strong></td>
                <td>{subj.q1 || '—'}</td>
                <td>{subj.q2 || '—'}</td>
                <td>{subj.q3 || '—'}</td>
                <td>{subj.q4 || '—'}</td>
                <td>{subj.year_grade || '—'}</td>
                <td>{subj.exam_grade || '—'}</td>
                <td>{subj.final_grade || '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Progress;