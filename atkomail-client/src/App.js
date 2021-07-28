import React from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { Security, SecureRoute, LoginCallback } from '@okta/okta-react';
import { Grid } from 'semantic-ui-react';
import config from './config';
import Home from './Home';
import Navbar from './Navbar';

const oktaAuth = new OktaAuth(config.oidc);

const App = () => {
  const history = useHistory();
  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    history.replace(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <Navbar />
      <Grid centered columns={1} divided style={{ paddingTop: '40px' }}>
        <Grid.Column>
          <Switch>
            <SecureRoute path="/" exact component={Home} />
            <Route path="/login/callback" component={LoginCallback} />
          </Switch>
        </Grid.Column>
      </Grid>
    </Security>
  );
};

export default App;
