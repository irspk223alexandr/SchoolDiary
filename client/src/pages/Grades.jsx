import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { Container, Form, Table, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

const Grades = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [month, setMonth] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const roles = useSelector(state => state.auth.roles || []);
  const isStudent = roles.includes('Ученик');
  const isTeacher = roles.includes('Преподаватель');
  const isDirector = roles.includes('Директор');
  const canEdit = isTeacher || isDirector;
  const [quarter, setQuarter] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем список предметов (для ученика – только его предметы, но пока оставим общий)
        const subjectsRes = await api.get('/schedule/subjects');
        setSubjects(subjectsRes.data);

        if (!isStudent) {
          // Для учителя/директора также загружаем классы
          const classesRes = await api.get('/director/classes');
          setClasses(classesRes.data);
        } else {
          // Для ученика класс определяется на сервере, поэтому поле класса не требуется
          setSelectedClass('auto'); // просто метка, фактически не используется
        }
      } catch (err) {
        console.error('Ошибка загрузки списков:', err);
      }
    };
    fetchData();
    const now = new Date();
    setMonth(now.toISOString().slice(0, 7));
  }, [isStudent]);

  const fetchGrades = async () => {
    // Для ученика class_id не обязателен
    if (!selectedSubject || (!isStudent && !selectedClass)) {
      setError('Выберите предмет' + (isStudent ? '' : ' и класс'));
      return;
    }
    
    console.log('🔄 ===== ЗАПРОС ОЦЕНОК =====');
    console.log('🔄 Параметры:', {
      class_id: isStudent ? undefined : selectedClass,
      subject_id: selectedSubject,
      month: month,
      quarter: quarter
    });
    
    setLoading(true);
    setError('');
    try {
      const params = {
        subject_id: selectedSubject,
        month: month,
        quarter: quarter
      };
      if (!isStudent) {
        params.class_id = selectedClass;
      }
      const res = await api.get('/grades', { params });
      
      console.log('📥 Ответ от сервера:', res.data);
      console.log('📥 Учеников:', res.data.students?.length || 0);
      console.log('📥 Уроков:', res.data.lessons?.length || 0);
      console.log('📥 Оценок:', res.data.grades?.length || 0);
      
      setData(res.data);
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err.response?.data);
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (studentId, scheduleId, date, currentGrade) => {
    if (!canEdit) return;
    setEditingCell({ studentId, scheduleId, date });
    setEditValue(currentGrade !== null ? String(currentGrade) : '');
  };
  
  const saveGrade = async () => {
    const { studentId, scheduleId, date } = editingCell;
    const grade = parseInt(editValue);
    
    if (isNaN(grade) || grade < 1 || grade > 5) {
      console.error('❌ Ошибка: оценка должна быть от 1 до 5');
      return;
    }
    
    try {
      const response = await api.post('/grades', { 
        student_id: studentId, 
        schedule_id: scheduleId, 
        date: date,
        grade: grade,
        quarter: quarter
      });
      console.log('✅ Ответ сервера:', response.data);
      
      const dateStr = formatDate(date);
      const filteredGrades = data.grades.filter(
        g => !(g.student_id === studentId && g.schedule_id === scheduleId && formatDate(g.date) === dateStr)
      );
      
      const updatedGrades = [
        ...filteredGrades,
        { 
          student_id: studentId, 
          schedule_id: scheduleId, 
          date: dateStr, 
          grade: grade,
          quarter: quarter
        }
      ];
      
      setData({ ...data, grades: updatedGrades });
      setEditingCell(null);
      setEditValue('');
      
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err.response?.data);
      alert('Ошибка сохранения: ' + (err.response?.data?.message || ''));
    }
  };
  
  const getGrade = (studentId, scheduleId, date) => {
    if (!data?.grades) return null;
    
    const dateStr = formatDate(date);
    const found = data.grades.find(g => {
      const gradeDate = formatDate(g.date);
      return g.student_id === studentId && g.schedule_id === scheduleId && gradeDate === dateStr;
    });
    
    return found ? found.grade : null;
  };

  const deleteGrade = async (studentId, scheduleId, date) => {
    if (!window.confirm('Удалить оценку?')) return;
    try {
      await api.delete('/grades', { 
        data: { 
          student_id: studentId, 
          schedule_id: scheduleId, 
          date: date,
          quarter: quarter
        } 
      });
      const dateStr = formatDate(date);
      setData({
        ...data,
        grades: data.grades.filter(
          g => !(g.student_id === studentId && g.schedule_id === scheduleId && formatDate(g.date) === dateStr)
        )
      });
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.message || ''));
    }
  };

  // Рендер формы
  return (
    <Container className="mt-4">
      <h3>Оценки</h3>
      
      <Form className="mb-3">
        <Row>
          {!isStudent && (
            <Col>
              <Form.Group className="mb-2">
                <Form.Label>Класс</Form.Label>
                <Form.Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  <option value="">Выберите класс</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.grade}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          <Col>
            <Form.Group className="mb-2">
              <Form.Label>Предмет</Form.Label>
              <Form.Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">Выберите предмет</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-2">
              <Form.Label>Месяц</Form.Label>
              <Form.Control type="month" value={month} onChange={e => setMonth(e.target.value)} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-2">
              <Form.Label>Четверть</Form.Label>
              <Form.Select value={quarter} onChange={e => setQuarter(parseInt(e.target.value))}>
                <option value={1}>1 четверть</option>
                <option value={2}>2 четверть</option>
                <option value={3}>3 четверть</option>
                <option value={4}>4 четверть</option>
              </Form.Select>
            </Form.Group> 
          </Col>
          <Button variant="primary" onClick={fetchGrades}>Показать</Button>
        </Row>
      </Form>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      {data && data.lessons.length === 0 ? (
        <Alert variant="warning">Нет уроков по выбранному предмету в этом месяце</Alert>
      ) : data && (
        <div style={{ overflowX: 'auto' }}>
          <Table bordered striped hover size="sm">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 1, minWidth: '200px' }}>
                  ФИО
                </th>
                {data.lessons.map((lesson) => (
                  <th key={`${lesson.schedule_id}_${lesson.date}`} style={{ minWidth: '80px', textAlign: 'center' }}>
                    {formatDisplayDate(lesson.date)}
                    <br />
                    <small>ур.{lesson.lesson_number}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.id}>
                  <td style={{ position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>
                    {student.last_name} {student.first_name} {student.middle_name}
                  </td>
                  {data.lessons.map((lesson) => {
                    const grade = getGrade(student.id, lesson.schedule_id, lesson.date);
                    const isEditing = editingCell &&
                      editingCell.studentId === student.id &&
                      editingCell.scheduleId === lesson.schedule_id &&
                      editingCell.date === lesson.date;
                    return (
                      <td
                        key={`${student.id}_${lesson.schedule_id}_${lesson.date}`}
                        style={{
                          textAlign: 'center',
                          cursor: canEdit ? 'pointer' : 'default',
                          backgroundColor: isEditing ? '#ffeeba' : 'inherit'
                        }}
                        onClick={() => canEdit && handleEdit(student.id, lesson.schedule_id, lesson.date, grade)}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveGrade}
                            onKeyDown={(e) => e.key === 'Enter' && saveGrade()}
                            autoFocus
                            style={{ width: '50px', textAlign: 'center' }}
                          />
                        ) : (
                          grade !== null ? (
                            <span>
                              {grade}
                              {canEdit && (
                                <span
                                  style={{ marginLeft: '4px', cursor: 'pointer', color: 'red' }}
                                  onClick={(e) => { e.stopPropagation(); deleteGrade(student.id, lesson.schedule_id, lesson.date); }}
                                >
                                  ×
                                </span>
                              )}
                            </span>
                          ) : '—'
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
    </Container>
  );
};

export default Grades;