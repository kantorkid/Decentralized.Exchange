import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.css';
import App from './components/App';
import configureStore from './store/configureStore';
import * as serviceWorker from './serviceWorker';

const store = configureStore();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
