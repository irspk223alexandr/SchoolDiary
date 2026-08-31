import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Table, Form, Button, Alert, Spinner } from 'react-bootstrap';

const ManageLessonTimes = () => {
  const navigate = useNavigate();
  const [times, setTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchTimes();
  }, []);

  const fetchTimes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lesson-times');
      setTimes(res.data);
    } catch (err) {
      setError('Ошибка загрузки настроек времени');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lessonNumber) => {
    setEditing(lessonNumber);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setEditing(null);
    setValidationErrors({});
  };

  // Проверка корректности времени на клиенте
  const validateTime = (lessonNumber, start, end, allTimes) => {
    const errors = {};

    // 1. Начало < окончание
    if (start >= end) {
      errors[lessonNumber] = 'Начало должно быть меньше окончания';
      return errors;
    }

    // 2. Проверка пересечений
    const otherLessons = allTimes.filter(t => t.lesson_number !== lessonNumber);
    for (const other of otherLessons) {
      // Пересечение: start < other.end && other.start < end
      if (start < other.end_time && other.start_time < end) {
        errors[lessonNumber] = `Пересекается с уроком ${other.lesson_number}`;
        break;
      }
    }

    return errors;
  };

  const handleSave = async (lessonNumber) => {
    const time = times.find(t => t.lesson_number === lessonNumber);
    if (!time) return;

    const { start_time, end_time } = time;

    // Клиентская валидация
    const errors = validateTime(lessonNumber, start_time, end_time, times);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/lesson-times', {
        lesson_number: lessonNumber,
        start_time,
        end_time
      });
      setSuccess(`Время для урока ${lessonNumber} обновлено`);
      setEditing(null);
      await fetchTimes();
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Ошибка сохранения';
      setError(serverMessage);
      // Если сервер вернул ошибку валидации, показываем её
      if (serverMessage.includes('пересекаются') || serverMessage.includes('начала')) {
        setValidationErrors({ [lessonNumber]: serverMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (lessonNumber, field, value) => {
    setTimes(prev => prev.map(t => 
      t.lesson_number === lessonNumber ? { ...t, [field]: value } : t
    ));
    // Убираем ошибку для этого урока при изменении
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[lessonNumber];
      return newErrors;
    });
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Настройка времени уроков</h3>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          ← Назад в админку
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>№ урока</th>
            <th>Начало</th>
            <th>Окончание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {times.map(time => {
            const errorMsg = validationErrors[time.lesson_number];
            return (
              <tr key={time.lesson_number}>
                <td>{time.lesson_number}</td>
                <td>
                  {editing === time.lesson_number ? (
                    <Form.Control
                      type="time"
                      value={time.start_time}
                      onChange={e => handleChange(time.lesson_number, 'start_time', e.target.value)}
                      isInvalid={!!errorMsg}
                    />
                  ) : (
                    time.start_time
                  )}
                </td>
                <td>
                  {editing === time.lesson_number ? (
                    <Form.Control
                      type="time"
                      value={time.end_time}
                      onChange={e => handleChange(time.lesson_number, 'end_time', e.target.value)}
                      isInvalid={!!errorMsg}
                    />
                  ) : (
                    time.end_time
                  )}
                </td>
                <td>
                  {editing === time.lesson_number ? (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleSave(time.lesson_number)}>
                        Сохранить
                      </Button>
                      <Button variant="secondary" size="sm" className="ms-1" onClick={handleCancel}>
                        Отмена
                      </Button>
                      {errorMsg && (
                        <div className="text-danger small mt-1">{errorMsg}</div>
                      )}
                    </>
                  ) : (
                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(time.lesson_number)}>
                      Редактировать
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
};

export default ManageLessonTimes;