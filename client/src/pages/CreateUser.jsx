import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';

const CreateUser = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [positions, setPositions] = useState([]);
  const [studentForm, setStudentForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    class_id: '',
    email: ''
  });
  const [teacherForm, setTeacherForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    position_ids: [],
    email: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchPositions();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/director/classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Ошибка загрузки классов:', err);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get('/director/positions');
      setPositions(res.data);
    } catch (err) {
      console.error('Ошибка загрузки должностей:', err);
    }
  };

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleTeacherChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const posId = parseInt(value);
      setTeacherForm(prev => {
        const newIds = prev.position_ids.includes(posId)
          ? prev.position_ids.filter(id => id !== posId)
          : [...prev.position_ids, posId];
        return { ...prev, position_ids: newIds };
      });
    } else {
      setTeacherForm({ ...teacherForm, [name]: value });
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/director/student', studentForm);
      setResult({ type: 'Ученик', ...res.data });
      setStudentForm({ last_name: '', first_name: '', middle_name: '', class_id: '', email: '' });
    } catch (err) {
      console.error('Ошибка:', err.response?.data);
      if (err.response?.data?.error === 'EMAIL_EXISTS') {
        setError('❌ Этот email уже используется. Пожалуйста, используйте другой email.');
      } else if (err.response?.data?.error === 'LOGIN_EXISTS') {
        setError('❌ Этот логин уже занят. Попробуйте снова.');
      } else {
        setError(err.response?.data?.error || 'Ошибка создания ученика');
      }
    } finally {
      setLoading(false);
    }
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/director/teacher', teacherForm);
      setResult({ type: 'Учитель', ...res.data });
      setTeacherForm({ last_name: '', first_name: '', middle_name: '', position_ids: [], email: '' });
    } catch (err) {
      console.error('Ошибка:', err.response?.data);
      if (err.response?.data?.error === 'EMAIL_EXISTS') {
        setError('❌ Этот email уже используется. Пожалуйста, используйте другой email.');
      } else if (err.response?.data?.error === 'LOGIN_EXISTS') {
        setError('❌ Этот логин уже занят. Попробуйте снова.');
      } else {
        setError(err.response?.data?.error || 'Ошибка создания учителя');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Создание пользователей</h3>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          ← Назад в админку
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {result && (
        <Alert variant="success">
          <strong>{result.type} создан(а)!</strong><br />
          Логин: <code>{result.login}</code><br />
          Пароль: <code>{result.password}</code><br />
          (Сообщите эти данные пользователю)
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <h5>Создать ученика</h5>
          <Form onSubmit={createStudent}>
            <Form.Group className="mb-2">
              <Form.Control
                name="last_name"
                placeholder="Фамилия"
                value={studentForm.last_name}
                onChange={handleStudentChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="first_name"
                placeholder="Имя"
                value={studentForm.first_name}
                onChange={handleStudentChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="middle_name"
                placeholder="Отчество"
                value={studentForm.middle_name}
                onChange={handleStudentChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Select
                name="class_id"
                value={studentForm.class_id}
                onChange={handleStudentChange}
                required
              >
                <option value="">Выберите класс</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.grade} класс
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="email"
                placeholder="Email (необязательно)"
                value={studentForm.email}
                onChange={handleStudentChange}
              />
            </Form.Group>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Создание...' : 'Создать ученика'}
            </Button>
          </Form>
        </Col>

        <Col md={6}>
          <h5>Создать учителя</h5>
          <Form onSubmit={createTeacher}>
            <Form.Group className="mb-2">
              <Form.Control
                name="last_name"
                placeholder="Фамилия"
                value={teacherForm.last_name}
                onChange={handleTeacherChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="first_name"
                placeholder="Имя"
                value={teacherForm.first_name}
                onChange={handleTeacherChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="middle_name"
                placeholder="Отчество"
                value={teacherForm.middle_name}
                onChange={handleTeacherChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Должности (выберите несколько)</Form.Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                {positions.map(p => (
                  <Form.Check
                    key={p.id}
                    type="checkbox"
                    label={p.name}
                    value={p.id}
                    checked={teacherForm.position_ids.includes(p.id)}
                    onChange={handleTeacherChange}
                    name="position_ids"
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="email"
                placeholder="Email (необязательно)"
                value={teacherForm.email}
                onChange={handleTeacherChange}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Создание...' : 'Создать учителя'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateUser;