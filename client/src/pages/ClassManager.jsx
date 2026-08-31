import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Table, Button, Alert, Modal, Form, Spinner } from 'react-bootstrap';

const ClassManager = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes, studentsRes] = await Promise.all([
        api.get('/director/classes'),
        api.get('/director/teachers'),
        api.get('/director/students')
      ]);
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setSelectedTeacher(cls.teacher_id || '');
    const studentIds = students
      .filter(s => s.class_id === cls.id)
      .map(s => s.id);
    setSelectedStudents(studentIds);
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put(`/director/class/${editingClass.id}`, {
        teacher_id: selectedTeacher || null
      });

      await api.put('/director/students/bulk-class', {
        class_id: null,
        student_ids: students.filter(s => s.class_id === editingClass.id).map(s => s.id)
      });

      if (selectedStudents.length > 0) {
        await api.put('/director/students/bulk-class', {
          class_id: editingClass.id,
          student_ids: selectedStudents
        });
      }

      setMessage('Класс успешно обновлён!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromoteAll = async () => {
    if (!window.confirm('Перевести все классы в следующий? Ученики 9-го класса будут удалены.')) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/director/promote-all');
      setMessage(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка перевода');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (cls) => {
    if (cls.teacher_id && cls.teacher_full_name) {
      return cls.teacher_full_name;
    }
    return 'Не назначен';
  };

  return (
    <Container className="mt-4">
      <h3>Управление классами</h3>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          ← Назад в админку
        </Button>

        <Button
          variant="warning"
          onClick={handlePromoteAll}
          disabled={loading}
        >
          Перевести все классы в следующий
        </Button>
      </div>

      {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Класс</th>
            <th>Классный руководитель</th>
            <th>Количество учеников</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(cls => (
            <tr key={cls.id}>
              <td><strong>{cls.grade}</strong></td>
              <td>{getTeacherName(cls)}</td>
              <td>{students.filter(s => s.class_id === cls.id).length}</td>
              <td><Button variant="outline-primary" size="sm" onClick={() => openEditModal(cls)}>Редактировать</Button></td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Редактирование класса {editingClass?.grade}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Классный руководитель</Form.Label>
              <Form.Select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Не назначен</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.last_name} {t.first_name} {t.middle_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Ученики в классе</Form.Label>
              <Form.Control
                type="text"
                placeholder="Поиск по фамилии, имени или отчеству"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                {filteredStudents.length === 0 ? (
                  <p className="text-muted">Нет учеников, соответствующих поиску</p>
                ) : (
                  filteredStudents.map(s => (
                    <Form.Check
                      key={s.id}
                      type="checkbox"
                      label={`${s.last_name} ${s.first_name} ${s.middle_name || ''}`}
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                  ))
                )}
              </div>
              <small className="text-muted">Отметьте учеников, которые должны быть в этом классе</small>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClassManager;