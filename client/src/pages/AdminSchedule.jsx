import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Form, Button, Table, Alert, Modal, Spinner, Row, Col } from 'react-bootstrap';

const AdminSchedule = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [scheduleTemplate, setScheduleTemplate] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    day_of_week: 'ПН',
    lesson_number: 1,
    subject_id: '',
    teacher_id: ''
  });

  // Поиск учителя
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  // Фильтрация учителей по поиску
  const filteredTeachers = teachers.filter(t => {
    if (!teacherSearchTerm) return true;
    const fullName = `${t.last_name || ''} ${t.first_name || ''} ${t.middle_name || ''}`.toLowerCase();
    return fullName.includes(teacherSearchTerm.toLowerCase());
  });

  // Сортировка учителей по ФИО
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    const lastNameA = a.last_name || '';
    const lastNameB = b.last_name || '';
    if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
    const firstNameA = a.first_name || '';
    const firstNameB = b.first_name || '';
    return firstNameA.localeCompare(firstNameB);
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTemplate(selectedClass);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/director/classes'),
        api.get('/schedule/subjects'),
        api.get('/director/teachers')
      ]);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
      if (classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0].id);
      }
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (classId) => {
    setLoading(true);
    try {
      const res = await api.get('/schedule/template', {
        params: { class_id: classId }
      });
      setScheduleTemplate(res.data);
    } catch (err) {
      setError('Ошибка загрузки расписания');
    } finally {
      setLoading(false);
    }
  };

  const addLesson = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/schedule/template/item', {
        class_id: selectedClass,
        day_of_week: lessonForm.day_of_week,
        lesson_number: lessonForm.lesson_number,
        subject_id: lessonForm.subject_id,
        teacher_id: lessonForm.teacher_id
      });
      setSuccess('Урок добавлен!');
      setShowModal(false);
      fetchTemplate(selectedClass);
      setLessonForm({
        day_of_week: 'ПН',
        lesson_number: 1,
        subject_id: '',
        teacher_id: ''
      });
      setTeacherSearchTerm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка добавления урока');
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id) => {
    if (!window.confirm('Удалить урок?')) return;
    try {
      await api.delete(`/schedule/template/item/${id}`);
      setSuccess('Урок удалён');
      fetchTemplate(selectedClass);
    } catch (err) {
      setError('Ошибка удаления урока');
    }
  };

  const getTeacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    return t ? `${t.last_name} ${t.first_name}` : 'Не назначен';
  };

  const getSubjectName = (id) => {
    const s = subjects.find(s => s.id === id);
    return s ? s.name : 'Не назначен';
  };

  const sortedLessons = [...scheduleTemplate].sort((a, b) => {
    const dayA = weekDays.indexOf(a.day_of_week);
    const dayB = weekDays.indexOf(b.day_of_week);
    if (dayA !== dayB) return dayA - dayB;
    return a.lesson_number - b.lesson_number;
  });

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Управление расписанием</h3>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          ← Назад в админку
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.grade} класс</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={8}>
          <Button variant="primary" onClick={() => setShowModal(true)} className="me-2">
            + Добавить урок
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Spinner animation="border" />
      ) : sortedLessons.length === 0 ? (
        <Alert variant="info">Нет уроков в расписании</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>День недели</th>
                <th>№ урока</th>
                <th>Предмет</th>
                <th>Учитель</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedLessons.map(item => (
                <tr key={item.id}>
                  <td>{item.day_of_week}</td>
                  <td>{item.lesson_number}</td>
                  <td>{getSubjectName(item.subject_id)}</td>
                  <td>{getTeacherName(item.teacher_id)}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => deleteLesson(item.id)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Добавить урок</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={addLesson}>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>День недели</Form.Label>
                  <Form.Select
                    value={lessonForm.day_of_week}
                    onChange={e => setLessonForm({ ...lessonForm, day_of_week: e.target.value })}
                    required
                  >
                    {weekDays.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Номер урока</Form.Label>
                  <Form.Select
                    value={lessonForm.lesson_number}
                    onChange={e => setLessonForm({ ...lessonForm, lesson_number: parseInt(e.target.value) })}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label>Предмет</Form.Label>
              <Form.Select
                value={lessonForm.subject_id}
                onChange={e => setLessonForm({ ...lessonForm, subject_id: parseInt(e.target.value) })}
                required
              >
                <option value="">Выберите предмет</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* ПОИСК УЧИТЕЛЯ */}
            <Form.Group className="mb-2">
              <Form.Label>Поиск учителя</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите фамилию, имя или отчество..."
                value={teacherSearchTerm}
                onChange={e => setTeacherSearchTerm(e.target.value)}
              />
            </Form.Group>

            {/* СПИСОК УЧИТЕЛЕЙ С RADIO */}
            <Form.Group className="mb-2">
              <Form.Label>Выберите учителя (только одного)</Form.Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                {sortedTeachers.length === 0 ? (
                  <p className="text-muted">
                    {teacherSearchTerm ? 'Учитель не найден' : 'Нет учителей'}
                  </p>
                ) : (
                  sortedTeachers.map(t => (
                    <Form.Check
                      key={t.id}
                      type="radio"
                      name="teacher_id"
                      label={`${t.last_name} ${t.first_name} ${t.middle_name || ''}`}
                      value={t.id}
                      checked={lessonForm.teacher_id === t.id}
                      onChange={() => setLessonForm({ ...lessonForm, teacher_id: t.id })}
                    />
                  ))
                )}
              </div>
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Добавить'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminSchedule;