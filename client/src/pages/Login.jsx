import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';   // добавлено
import { login } from '../store/authSlice';
import api from '../api/axios';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();   // добавлено

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/signin', { login: loginInput, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      dispatch(login({ token, user }));
      navigate('/profile');
    } catch (err) {
      console.error('Ошибка входа:', err.response?.data);
      
      if (err.response?.status === 404) {
        setError('❌ Пользователь с таким логином не найден');
      } else if (err.response?.status === 401) {
        setError('❌ Неверный пароль');
      } else if (err.response?.status === 403) {
        setError('❌ Аккаунт не подтверждён. Проверьте почту.');
      } else {
        setError(err.response?.data?.message || '❌ Ошибка входа. Попробуйте позже.');
      }
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: 400 }}>
      <h2>Вход в дневник</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Логин</Form.Label>
          <Form.Control
            type="text"
            value={loginInput}
            onChange={e => setLoginInput(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary">Войти</Button>
      </Form>
    </Container>
  );
};

export default Login;