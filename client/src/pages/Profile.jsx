import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Row, Col, Card, Image, Button } from 'react-bootstrap';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const user = useSelector(state => state.auth.user);
  const roles = useSelector(state => state.auth.roles || []);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      }
    };
    fetchProfile();
  }, []);

  if (!profile) return <div>Загрузка...</div>;

  const isDirector = roles.includes('Директор');
  const isTeacher = roles.includes('Преподаватель');
  const isStudent = !isDirector && !isTeacher;

  const showField = (value) => {
    if (!value) return false;
    const trimmed = value.toString().trim();
    return trimmed !== '' && trimmed !== '-' && trimmed !== '—';
  };

  return (
    <Container className="mt-4">
      <h2>Личный кабинет</h2>

      <Row>
        <Col md={3}>
          <Image
            src={`http://localhost:8080/uploads/${profile.avatar || 'default.png'}`}
            className="avatar-profile"
            fluid
          />
        </Col>
        <Col md={9}>
          <Card>
            <Card.Body>
              <h4>{profile.last_name} {profile.first_name} {profile.middle_name}</h4>

              <hr />

              <Row>
                <Col md={6}>
                  {isStudent && (
                    <p><strong>Класс:</strong> {profile.class_name || 'Не назначен'}</p>
                  )}
                  {showField(profile.phone) && (
                    <p><strong>Телефон:</strong> {profile.phone}</p>
                  )}
                  <p><strong>Email:</strong> {profile.email}</p>
                  {showField(profile.home_address) && (
                    <p><strong>Домашний адрес:</strong> {profile.home_address}</p>
                  )}
                  {showField(profile.position) && (
                    <p><strong>Должность:</strong> {profile.position}</p>
                  )}
                  {isTeacher && profile.taught_classes && profile.taught_classes.length > 0 && (
                    <p><strong>Классы:</strong> {profile.taught_classes.join(', ')}</p>
                  )}
                </Col>
                <Col md={6}>
                  {showField(profile.school_name) && (
                    <p><strong>Школа:</strong> {profile.school_name}</p>
                  )}
                  {showField(profile.school_address) && (
                    <p><strong>Адрес школы:</strong> {profile.school_address}</p>
                  )}
                  {showField(profile.school_phone) && (
                    <p><strong>Телефон школы:</strong> {profile.school_phone}</p>
                  )}
                </Col>
              </Row>

              {isStudent && (
                <>
                  <hr />
                  
                  <Row>
                    <Col md={6}><h5>Дополнительная информация</h5>
                      <p><strong>Медицинский полис:</strong> {profile.insurance_policy || 'Не указан'}</p>
                      <p><strong>Группа крови:</strong> {profile.blood_type || 'Не указана'}</p>
                      <p><strong>Противопоказания:</strong> {profile.medical_contraindications || 'Нет'}</p>
                    </Col>
                    <Col md={6}><h5>Родители</h5>
                      <p><strong>ФИО родителя:</strong> {profile.parent_full_name || 'Не указаны'}</p>
                      <p><strong>Телефон родителя:</strong> {profile.parent_phone || 'Не указан'}</p>
                    </Col>
                  </Row>
                </>
              )}

              <hr />
              <Button variant="outline-primary" onClick={() => navigate('/profile/edit')}>
                Редактировать
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;