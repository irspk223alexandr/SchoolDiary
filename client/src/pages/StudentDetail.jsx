import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import './Profile.css';
import { Container, Card, Row, Col, Image, Button, Alert, Spinner } from 'react-bootstrap';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roles = useSelector(state => state.auth.roles || []);
  const isDirector = roles.includes('Директор');

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      // Используем маршрут /user/profile/:id (уже есть)
      const res = await api.get(`/user/profile/${id}`);
      setStudent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных ученика');
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
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Назад
        </Button>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Ученик не найден</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Назад
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      
      <h2>Профиль ученика</h2>
      
      <Row>
        <Col md={3}>
        <Image
            src={`http://localhost:8080/uploads/${student.avatar || 'default.png'}`}
            className="avatar-profile"
            fluid
            />
        </Col>
        <Col md={9}>
          <Card>
            <Card.Body>
              <h4>{student.last_name} {student.first_name} {student.middle_name}</h4>
              
              <hr />
              
              <Row>
                <Col md={6}>
                  <p><strong>Класс:</strong> {student.class_name || 'Не назначен'}</p>
                  <p><strong>Телефон:</strong> {student.phone || 'Не указан'}</p>
                  <p><strong>Email:</strong> {student.email}</p>
                  <p><strong>Домашний адрес:</strong> {student.home_address || 'Не указан'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Школа:</strong> {student.school_name || 'Не указана'}</p>
                  <p><strong>Адрес школы:</strong> {student.school_address || 'Не указан'}</p>
                  <p><strong>Телефон школы:</strong> {student.school_phone || 'Не указан'}</p>
                </Col>
              </Row>

              <hr />
              
              <Row>
                <Col md={6}><h5>Дополнительная информация</h5>
                  <p><strong>Медицинский полис:</strong> {student.insurance_policy || 'Не указан'}</p>
                  <p><strong>Группа крови:</strong> {student.blood_type || 'Не указана'}</p>
                  <p><strong>Противопоказания:</strong> {student.medical_contraindications || 'Нет'}</p>
                </Col>
                <Col md={6}><h5>Родители</h5>
              <p><strong>ФИО родителя:</strong> {student.parent_full_name || 'Не указаны'}</p>
              <p><strong>Телефон родителя:</strong> {student.parent_phone || 'Не указан'}</p>
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
                          onClick={() => copyToClipboard(student.login)}
                          title="Нажмите, чтобы скопировать"
                        >
                          {student.login}
                        </code>
                      </p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <strong>Пароль:</strong>{' '}
                        <code 
                          style={{ cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}
                          onClick={() => copyToClipboard(student.plain_password)}
                          title="Нажмите, чтобы скопировать"
                        >
                          {student.plain_password || 'Не установлен'}
                        </code>
                      </p>
                    </Col>
                  </Row>
                </>
              )}

              <hr />
              <Button variant="outline-primary" onClick={() => navigate(-1)}>
                Вернуться назад
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetail;