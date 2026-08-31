import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import './Profile.css';
import { Container, Card, Row, Col, Image, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const roles = useSelector(state => state.auth.roles || []);
  const isDirector = roles.includes('Директор');
  const isTeacher = roles.includes('Преподаватель');
  const isStudent = !isDirector && !isTeacher;

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Модальное окно для редактирования профиля
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    phone: '',
    email: '',
    position_ids: []
  });
  const [allPositions, setAllPositions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Загрузка учителя
  useEffect(() => {
    fetchTeacher();
  }, [id]);

  // Загрузка списка должностей
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const res = await api.get('/director/positions');
        setAllPositions(res.data);
      } catch (err) {
        console.error('Ошибка загрузки должностей:', err);
      }
    };
    loadPositions();
  }, []);

  // Заполнение формы редактирования при загрузке учителя и должностей
  useEffect(() => {
    if (teacher && allPositions.length > 0) {
      setEditForm({
        last_name: teacher.last_name || '',
        first_name: teacher.first_name || '',
        middle_name: teacher.middle_name || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        position_ids: teacher.positions
          ? teacher.positions.map(p => {
              const pos = allPositions.find(pos => pos.name === p);
              return pos ? pos.id : null;
            }).filter(Boolean)
          : []
      });
    }
  }, [teacher, allPositions]);

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teachers/${id}`);
      setTeacher(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных учителя');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard?.writeText(text);
      alert('Скопировано в буфер обмена!');
    }
  };

  const handleDeleteTeacher = async () => {
    if (!window.confirm('Удалить учителя?')) return;
    try {
      await api.delete(`/director/teacher/${id}`);
      navigate('/teachers', { state: { message: 'Учитель успешно удалён' } });
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.message || ''));
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const posId = parseInt(value);
      setEditForm(prev => ({
        ...prev,
        position_ids: prev.position_ids.includes(posId)
          ? prev.position_ids.filter(id => id !== posId)
          : [...prev.position_ids, posId]
      }));
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      // Обновляем основные поля профиля
      await api.put('/user/profile', {
        targetUserId: teacher.id,
        last_name: editForm.last_name,
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        phone: editForm.phone,
        email: editForm.email
      });
      // Обновляем должности
      await api.put(`/director/teacher/${teacher.id}/positions`, {
        position_ids: editForm.position_ids
      });
      // Обновляем данные на странице
      const updated = await api.get(`/teachers/${teacher.id}`);
      setTeacher(updated.data);
      setShowEditModal(false);
      alert('Профиль обновлён');
    } catch (err) {
      alert('Ошибка обновления: ' + (err.response?.data?.message || ''));
    } finally {
      setSaving(false);
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
        <Button variant="secondary" onClick={() => navigate('/teachers')}>
          ← Назад к списку учителей
        </Button>
      </Container>
    );
  }

  if (!teacher) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Учитель не найден</Alert>
        <Button variant="secondary" onClick={() => navigate('/teachers')}>
          ← Назад к списку учителей
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Информация об учителе</h2>

      <Row>
        <Col md={3}>
          <Image
            src={`http://localhost:8080/uploads/${teacher.avatar || 'default.png'}`}
            className="avatar-profile"
            fluid
          />
        </Col>
        <Col md={9}>
          <Card>
            <Card.Body>
              <h4>{teacher.last_name} {teacher.first_name} {teacher.middle_name}</h4>

              <hr />

              <Row>
                <Col md={6}>
                  <p>
                    <strong>Классы:</strong>{' '}
                    {teacher.taught_classes?.length > 0
                      ? teacher.taught_classes.sort((a,b) => a-b).map(c => (
                          <Badge key={c} bg="info" className="me-1">{c} класс</Badge>
                        ))
                      : 'Не назначены'
                    }
                  </p>
                  <p><strong>Телефон:</strong> {teacher.phone || 'Не указан'}</p>
                  <p><strong>Email:</strong> {teacher.email}</p>
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <p><strong>Предметы:</strong> {teacher.subjects.map(s => s.name).join(', ')}</p>
                  )}

                  <p>
                    <strong>Должности:</strong>{' '}
                    {teacher.positions && teacher.positions.length > 0
                      ? teacher.positions.join(', ')
                      : 'Не указаны'}
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Школа:</strong> {teacher.school_name || 'Не указана'}</p>
                  <p><strong>Адрес школы:</strong> {teacher.school_address || 'Не указан'}</p>
                  <p><strong>Телефон школы:</strong> {teacher.school_phone || 'Не указан'}</p>
                </Col>
              </Row>

              {isDirector && (
                <>
                  <hr />
                  <h5>Данные для входа</h5>
                  <Row>
                    <Col md={6}>
                      <p>
                        <strong>Логин:</strong>{' '}
                        <code
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(teacher.login)}
                          title="Нажмите, чтобы скопировать"
                        >
                          {teacher.login}
                        </code>
                      </p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <strong>Пароль:</strong>{' '}
                        <code
                          style={{ cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}
                          onClick={() => copyToClipboard(teacher.plain_password)}
                          title="Нажмите, чтобы скопировать"
                        >
                          {teacher.plain_password || 'Не установлен'}
                        </code>
                      </p>
                    </Col>
                  </Row>
                </>
              )}

              <hr />
              <div className="d-flex gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/teachers')}>
                  Вернуться к списку
                </Button>
                {isDirector && (
                  <>
                    <Button variant="outline-secondary" onClick={() => setShowEditModal(true)}>
                      Редактировать профиль
                    </Button>
                    <Button variant="danger" onClick={handleDeleteTeacher}>
                      Удалить учителя
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно для редактирования профиля */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Редактирование профиля учителя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Фамилия</Form.Label>
                  <Form.Control
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditChange}
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Имя</Form.Label>
                  <Form.Control
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditChange}
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Отчество</Form.Label>
                  <Form.Control
                    name="middle_name"
                    value={editForm.middle_name}
                    onChange={handleEditChange}
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Телефон</Form.Label>
                  <Form.Control
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    maxLength={20}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Должности</Form.Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                {allPositions.map(p => (
                  <Form.Check
                    key={p.id}
                    type="checkbox"
                    label={p.name}
                    value={p.id}
                    checked={editForm.position_ids.includes(p.id)}
                    onChange={handleEditChange}
                    name="position_ids"
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleEditSubmit} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeacherDetail;