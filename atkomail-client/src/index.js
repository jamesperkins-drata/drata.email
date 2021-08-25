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
TimeAgo.addDefaultLocale(en)

Sentry.init({
  dsn: "https://f65e6bc426164cb583bc42f2a9d4eed9@o876653.ingest.sentry.io/5890468",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
  autoSessionTracking: true,
  release: "atkomail@1.0",
});


/* eslint-disable react/jsx-filename-extension */
ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root'),
);