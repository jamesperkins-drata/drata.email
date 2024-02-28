import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';
import './polyfills';
import App from './App';
import './index.css';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import GitInfo from 'react-git-info/macro';
TimeAgo.addDefaultLocale(en)

const gitInfo = GitInfo();




/* eslint-disable react/jsx-filename-extension */
ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root'),
);