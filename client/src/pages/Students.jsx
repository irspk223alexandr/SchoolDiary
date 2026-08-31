import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← добавлено
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { Container, Table, Button, Alert, Modal, Spinner } from 'react-bootstrap';

const Students = () => {
  const navigate = useNavigate(); // ← добавлено
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);

  const isDirector = useSelector(state => state.auth.roles || []).includes('Директор');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/director/classes'),
        api.get('/director/students')
      ]);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const openClassModal = (cls) => {
    setSelectedClass(cls);
    const filtered = students.filter(s => s.class_id === cls.id);
    setClassStudents(filtered);
    setShowModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Удалить ученика?')) return;
    try {
      await api.delete(`/director/student/${studentId}`);
      const updatedStudents = students.filter(s => s.id !== studentId);
      setStudents(updatedStudents);
      setClassStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const getTeacherName = (cls) => {
    if (cls.teacher_id && cls.teacher_full_name) {
      return cls.teacher_full_name;
    }
    return 'Не назначен';
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard?.writeText(text);
      alert('Скопировано в буфер обмена!');
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Загрузка...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h3>Ученики по классам</h3>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Класс</th>
            <th>Классный руководитель</th>
            <th>Количество учеников</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(cls => {
            const count = students.filter(s => s.class_id === cls.id).length;
            return (
              <tr key={cls.id}>
                <td><strong>{cls.grade}</strong></td>
                <td>{getTeacherName(cls)}</td>
                <td>{count}</td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => openClassModal(cls)}>
                    Открыть
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      Класс {selectedClass?.grade} — Классный руководитель: {getTeacherName(selectedClass || {})}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {classStudents.length === 0 ? (
      <Alert variant="info">В этом классе пока нет учеников</Alert>
    ) : (
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>ФИО</th>
            {/* Показываем колонку "Действия" только для директора */}
            {isDirector && <th>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {classStudents.map(s => (
            <tr 
              key={s.id} 
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate(`/student/${s.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td>{s.last_name} {s.first_name} {s.middle_name}</td>
              {isDirector && (
                <td>
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s.id); }}>
                    Удалить
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Закрыть
    </Button>
  </Modal.Footer>
</Modal>
    </Container>
  );
};

export default Students;