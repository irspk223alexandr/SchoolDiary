import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuth, roles, loading } = useSelector(state => state.auth);

  // Показываем загрузку, пока проверяется авторизация
  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    console.log('Доступ запрещён. Роли пользователя:', roles, 'Требуется:', requiredRole);
    return <Navigate to="/profile" />;
  }

  return children;
};

export default PrivateRoute;