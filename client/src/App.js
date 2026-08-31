import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Login from './pages/Login';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';
import Students from './pages/Students';
import AdminPanel from './pages/AdminPanel';
import ClassManager from './pages/ClassManager';
import PrivateRoute from './components/PrivateRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import TeacherDetail from './pages/TeacherDetail';
import StudentDetail from './pages/StudentDetail';
import Grades from './pages/Grades';
import AdminSchedule from './pages/AdminSchedule';
import CreateUser from './pages/CreateUser';
import ManageLessonTimes from './pages/ManageLessonTimes';

function App() {
  const { isAuth, loading } = useSelector(state => state.auth);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      {isAuth && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={isAuth ? '/profile' : '/login'} />} />
        
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="/profile/edit" element={
          <PrivateRoute><EditProfile /></PrivateRoute>
        } />
        <Route path="/teachers" element={
          <PrivateRoute><Teachers /></PrivateRoute>
        } />
        <Route path="/schedule" element={
          <PrivateRoute><Schedule /></PrivateRoute>
        } />
        <Route path="/progress" element={
          <PrivateRoute><Progress /></PrivateRoute>
        } />
        <Route path="/students" element={
  <PrivateRoute><Students /></PrivateRoute>
} />
        <Route path="/admin" element={
          <PrivateRoute requiredRole="Директор"><AdminPanel /></PrivateRoute>
        } />
        <Route path="/classes" element={
          <PrivateRoute requiredRole="Директор"><ClassManager /></PrivateRoute>
        } />
        <Route path="/teacher/:id" element={
          <PrivateRoute><TeacherDetail /></PrivateRoute>
        } />
        <Route path="/student/:id" element={
          <PrivateRoute><StudentDetail /></PrivateRoute>
        } />
        <Route path="/grades" element={
  <PrivateRoute><Grades /></PrivateRoute>
} />
        <Route path="/admin/schedule" element={
  <PrivateRoute requiredRole="Директор"><AdminSchedule /></PrivateRoute>
} />
        <Route path="/admin/create-user" element={
          <PrivateRoute requiredRole="Директор"><CreateUser /></PrivateRoute>
        } />
        <Route path="/admin/lesson-times" element={
          <PrivateRoute requiredRole="Директор"><ManageLessonTimes /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;