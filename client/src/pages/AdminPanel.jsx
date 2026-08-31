import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <h3>Админ-панель</h3>
      <div className="d-flex flex-wrap gap-2 mt-3">
        <Link to="/admin/create-user" className="btn btn-primary">
          Создать пользователя
        </Link>
        <Link to="/classes" className="btn btn-info">
          Управление классами
        </Link>
        <Link to="/admin/schedule" className="btn btn-warning">
          Управление расписанием
        </Link>
        <Link to="/admin/lesson-times" className="btn btn-warning me-2">
          Настройка времени уроков
        </Link>
      </div>
    </Container>
  );
};

export default AdminPanel;