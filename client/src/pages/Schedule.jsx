import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { Container, Table, Spinner, Alert, Form, Button, Modal } from 'react-bootstrap';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roles = useSelector(state => state.auth.roles || []);
  const isDirector = roles.includes('Директор');
  const isTeacher = roles.includes('Преподаватель');
  const user = useSelector(state => state.auth.user);

  const [lessonTimes, setLessonTimes] = useState({});
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [homeworkText, setHomeworkText] = useState('');
  const [saving, setSaving] = useState(false);

  const canEditHomework = isDirector || isTeacher;

  // Форматирование времени без секунд
  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // "HH:MM"
  };

  // Получение понедельника текущей недели
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1); // если воскресенье (0) -> отнимаем 6, иначе day-1
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Форматирование даты в YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchLessonTimes = async () => {
      try {
        const res = await api.get('/lesson-times');
        const map = {};
        res.data.forEach(t => {
          map[t.lesson_number] = { start: t.start_time, end: t.end_time };
        });
        setLessonTimes(map);
      } catch (err) {
        console.error('Ошибка загрузки времени уроков:', err);
      }
    };
    fetchLessonTimes();
  }, []);

  useEffect(() => {
    if (isDirector || isTeacher) {
      api.get('/director/classes')
        .then(res => setClasses(res.data))
        .catch(console.error);
    }
    const now = new Date();
    const monday = getMonday(now);
    setWeekStart(formatDate(monday));
  }, []);

  useEffect(() => {
    if (weekStart) {
      fetchSchedule();
    }
  }, [weekStart, selectedClass]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { week: weekStart };
      if (selectedClass) {
        params.class_id = selectedClass;
      }
      const res = await api.get('/schedule', { params });
      setSchedule(res.data.schedule || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки расписания');
    } finally {
      setLoading(false);
    }
  };

  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  const getDaySchedule = (dayIndex) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    const dateStr = formatDate(date);
    return schedule.filter(item => item.date === dateStr).sort((a, b) => a.lesson_number - b.lesson_number);
  };

  const changeWeek = (delta) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + delta * 7);
    setWeekStart(formatDate(date));
  };

  const openHomeworkEditor = (lesson) => {
    if (!canEditHomework) return;
    setEditingLesson(lesson);
    setHomeworkText(lesson.homework || '');
    setShowHomeworkModal(true);
  };

  const saveHomework = async () => {
    setSaving(true);
    try {
      await api.put(`/schedule/template/item/${editingLesson.id}/homework`, {
        date: editingLesson.date,
        content: homeworkText
      });
      const updatedSchedule = schedule.map(item => {
        if (item.id === editingLesson.id && item.date === editingLesson.date) {
          return { ...item, homework: homeworkText };
        }
        return item;
      });
      setSchedule(updatedSchedule);
      setShowHomeworkModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка сохранения ДЗ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Загрузка расписания...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <h3>Расписание</h3>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h3 style={{ textAlign: 'center' }}>Расписание на неделю</h3>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => changeWeek(-1)}>←</Button>
        <span style={{ fontWeight: 'bold' }}>
          {weekStart ? new Date(weekStart).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
        </span>
        <Button variant="outline-secondary" onClick={() => changeWeek(1)}>→</Button>
      </div>
      
      {(isDirector || isTeacher) && (
        <div className="mb-3">
          <Form.Select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">Выберите класс</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.grade} класс</option>
            ))}
          </Form.Select>
        </div>
      )}
      
      {schedule.length === 0 ? (
        <Alert variant="info">Нет уроков на эту неделю</Alert>
      ) : (
        <div className="table-responsive">
          <Table bordered hover>
            <thead>
              <tr>
                <th>Время</th>
                {weekDays.map((day, i) => (
                  <th key={i}>
                    {day}
                    <br />
                    <small>
                      {weekStart ? new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + i)).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : ''}
                    </small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7,8].map(lessonNum => (
                <tr key={lessonNum}>
                  <td style={{ fontWeight: 'bold' }}>
                    {lessonTimes[lessonNum] ? (
                      `${formatTime(lessonTimes[lessonNum].start)} – ${formatTime(lessonTimes[lessonNum].end)}`
                    ) : (
                      lessonNum
                    )}
                  </td>
                  {weekDays.map((_, dayIndex) => {
                    const lessons = getDaySchedule(dayIndex);
                    const lesson = lessons.find(l => l.lesson_number === lessonNum);
                    return (
                      <td key={`${dayIndex}-${lessonNum}`}>
                        {lesson ? (
                          <>
                            <strong>{lesson.subject_name}</strong>
                            <br />
                            <small>{lesson.teacher_name}</small>
                            <br />
                            <small 
                              className="text-muted"
                              style={{ 
                                cursor: canEditHomework ? 'pointer' : 'default',
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: canEditHomework && lesson.homework ? '#e8f5e9' : 'transparent'
                              }}
                              onClick={() => openHomeworkEditor(lesson)}
                              title={canEditHomework ? 'Нажмите, чтобы изменить ДЗ' : ''}
                            >
                              ДЗ: {lesson.homework || (canEditHomework ? '— (нажмите, чтобы добавить)' : '—')}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showHomeworkModal} onHide={() => setShowHomeworkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Редактирование домашнего задания</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingLesson && (
            <>
              <p><strong>Предмет:</strong> {editingLesson.subject_name}</p>
              <p><strong>Учитель:</strong> {editingLesson.teacher_name}</p>
              <Form.Group className="mb-2">
                <Form.Label>Дата</Form.Label>
                <Form.Control
                  type="date"
                  value={editingLesson?.date || ''}
                  disabled
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Домашнее задание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={homeworkText}
                  onChange={e => setHomeworkText(e.target.value)}
                  placeholder="Введите домашнее задание..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHomeworkModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={saveHomework} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Modal.Footer>
      </Modal>

      {canEditHomework && (
        <div className="mt-2 text-muted small">
          <p>💡 Нажмите на <strong>ДЗ</strong> в расписании, чтобы добавить или изменить домашнее задание.</p>
        </div>
      )}
    </Container>
  );
};

export default Schedule;