import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuth, user, roles } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuth) return null;

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/profile">📚 Школьный дневник</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/profile">Профиль</Nav.Link>
            <Nav.Link as={Link} to="/schedule">Расписание</Nav.Link>
            <Nav.Link as={Link} to="/grades">Оценки</Nav.Link>
            <Nav.Link as={Link} to="/progress">Успеваемость</Nav.Link>
            <Nav.Link as={Link} to="/teachers">Учителя</Nav.Link>
            <Nav.Link as={Link} to="/students">Ученики</Nav.Link>
            {roles.includes('Директор') && (
              <>
                <Nav.Link as={Link} to="/admin">Админка</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            <span className="navbar-text me-3" style={{ color: 'white' }}>
              {user?.last_name} {user?.first_name}
            </span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;