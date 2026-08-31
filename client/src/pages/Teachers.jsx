import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import './Profile.css';
import { Container, Row, Col, Card, Image, Button, Spinner, Alert } from 'react-bootstrap';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const roles = useSelector(state => state.auth.roles || []);
  const isDirector = roles.includes('Директор');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error('Ошибка загрузки учителей:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки учителей');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (teacherId) => {
    navigate(`/teacher/${teacherId}`);
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
      <h2>Учителя</h2>
      
      {teachers.length === 0 ? (
        <Alert variant="info">Нет учителей</Alert>
      ) : (
        <Row>
          {teachers.map(teacher => (
            <Col md={4} key={teacher.id} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <Image
                    src={`http://localhost:8080/uploads/${teacher.avatar || 'default.png'}`}
                    className="avatar-card"
                  />
                  <Card.Title>
                    {teacher.last_name} {teacher.first_name} {teacher.middle_name || ''}
                  </Card.Title>
                  <Card.Text>
                    <strong>{teacher.positions?.join(', ') || 'Должность не указана'}</strong>
                  </Card.Text>
                  <Button 
                    variant={isDirector ? "outline-info" : "outline-primary"} 
                    onClick={() => handleViewDetails(teacher.id)}
                  >
                    {isDirector ? 'Подробнее' : 'Подробнее'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Teachers;