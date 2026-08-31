import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { updateUser } from '../store/authSlice';
import { Container, Form, Button, Alert, Image, Row, Card, Col } from 'react-bootstrap';
import './Profile.css';

const EditProfile = () => {
  const user = useSelector(state => state.auth.user);
  const roles = useSelector(state => state.auth.roles);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Проверяем роли
  const isDirector = roles && roles.includes('Директор');
  const isTeacher = roles && roles.includes('Преподаватель');
  const isStudent = !isDirector && !isTeacher;

  const [form, setForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    email: '',
    class: '',
    school_name: '',
    school_address: '',
    school_phone: '',
    school_site: '',
    home_address: '',
    home_phone: '',
    insurance_policy: '',
    blood_type: '',
    medical_contraindications: '',
    parent_full_name: '',
    parent_phone: '',
    position: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        last_name: user.last_name || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        email: user.email || '',
        class: user.class || '',
        school_name: user.school_name || '',
        school_address: user.school_address || '',
        school_phone: user.school_phone || '',
        school_site: user.school_site || '',
        home_address: user.home_address || '',
        home_phone: user.home_phone || '',
        insurance_policy: user.insurance_policy || '',
        blood_type: user.blood_type || '',
        medical_contraindications: user.medical_contraindications || '',
        parent_full_name: user.parent_full_name || '',
        parent_phone: user.parent_phone || '',
        position: user.position || ''
      });
      if (user.avatar) {
        setPreview(`http://localhost:8080/uploads/${user.avatar}`);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) formData.append(key, form[key]);
    });
    if (avatar) {
      formData.append('avatar', avatar);
    }
  
    try {
      const res = await api.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(updateUser(res.data.user));
      setSuccess('Профиль обновлён!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      console.error('Ошибка:', err.response?.data);
      
      // Обработка ошибки дублирования email
      if (err.response?.data?.error === 'EMAIL_EXISTS') {
        setError('❌ Этот email уже используется другим пользователем. Пожалуйста, введите другой email.');
      } else if (err.response?.data?.error === 'LOGIN_EXISTS') {
        setError('❌ Этот логин уже занят. Пожалуйста, введите другой логин.');
      } else {
        setError(err.response?.data?.message || 'Ошибка обновления профиля');
      }
    }
  };

  return (
    <Container className="mt-4">
      <h3>Редактирование профиля</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Аватар */}
          <Col md={3}>
        <Form.Group className="mb-3">
          {preview && (
            <div className="mb-2">
                <Image src={preview} className="avatar-profile" />            </div>
          )}
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </Form.Group>
          </Col>
        {/* Основные поля — для всех */}
        <Col md={9}>
          <Card>
            <Card.Body>
            
          <Row>
            <Col>
              <Form.Group className="mb-2">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control name="last_name" value={form.last_name} onChange={handleChange} maxLength={100} placeholder="Фамилия" />
          </Form.Group>
            </Col>
            <Col>
          <Form.Group className="mb-2">
            <Form.Label>Имя</Form.Label>
            <Form.Control name="first_name" value={form.first_name} onChange={handleChange} maxLength={100} placeholder="Имя" />
          </Form.Group>
            </Col>
            <Col>
          <Form.Group className="mb-2">
            <Form.Label>Отчество</Form.Label>
            <Form.Control name="middle_name" value={form.middle_name} onChange={handleChange} maxLength={100} placeholder="Отчество" />
          </Form.Group>
            </Col>
        </Row>
        <hr />
        <Row>
          <Col>
        <Form.Group className="mb-2">
          <Form.Label>Телефон</Form.Label>
          <Form.Control name="phone" value={form.phone} onChange={handleChange} maxLength={20} placeholder="+7 900 000-00-00" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control name="email" type="email" value={form.email} onChange={handleChange} placeholder="@mail.ru" />
        </Form.Group>
        {isStudent && (
          <Form.Group className="mb-2">
              <Form.Label>Домашний адрес</Form.Label>
              <Form.Control name="home_address" value={form.home_address} onChange={handleChange} placeholder="Домашний адрес" />
            </Form.Group>)}
          </Col>
          <Col>
        {/* Школа — для всех */}
        <Form.Group className="mb-2">
          <Form.Label>Название школы</Form.Label>
          <Form.Control name="school_name" value={form.school_name} onChange={handleChange} placeholder="Название школы" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Адрес школы</Form.Label>
          <Form.Control name="school_address" value={form.school_address} onChange={handleChange} placeholder="Адрес школы" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Телефон школы</Form.Label>
          <Form.Control name="school_phone" value={form.school_phone} onChange={handleChange} maxLength={20} placeholder="+7 900 (000)-00-00" />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Сайт школы</Form.Label>
          <Form.Control name="school_site" value={form.school_site} onChange={handleChange} placeholder="https://" />
        </Form.Group>
          </Col>
        </Row>

          <hr />
          <Row>
            
        {/* Ученические поля — только для учеников */}
        {isStudent && (
          <><Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Медицинский полис</Form.Label>
              <Form.Control name="insurance_policy" value={form.insurance_policy} onChange={handleChange} placeholder="1234 5678 9101 1121"/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Группа крови</Form.Label>
              <Form.Control name="blood_type" value={form.blood_type} onChange={handleChange} maxLength={2} placeholder="1+" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Медицинские противопоказания</Form.Label>
              <Form.Control as="textarea" rows={2} name="medical_contraindications" value={form.medical_contraindications} onChange={handleChange} placeholder="Противопоказания" />
            </Form.Group>
            </Col>
            <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>ФИО родителея</Form.Label>
              <Form.Control name="parent_full_name" value={form.parent_full_name} onChange={handleChange} placeholder="Фамилия Имя Отчество" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Телефон родителя</Form.Label>
              <Form.Control name="parent_phone" value={form.parent_phone} onChange={handleChange} maxLength={20} placeholder="+7 900 (000)-00-00" />
            </Form.Group>
            </Col>
          </>
        )}
            
          </Row>
        
        <Button variant="primary" type="submit">Сохранить</Button>
        <Button variant="secondary" className="ms-2" onClick={() => navigate('/profile')}>Отмена</Button>
        
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Form>  
    </Container>
  );
};

export default EditProfile;