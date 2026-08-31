import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { checkAuth } from './store/thunks'; // импортируем
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Проверяем авторизацию до рендера
store.dispatch(checkAuth()).finally(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
});