import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Divider, Image, Header, Menu, Container, MenuItem} from 'semantic-ui-react';
import MailRender from './MailRender';
import Mailbox from './Mailbox';
import Switcher from './Switcher';
import './Home.css'
import * as Sentry from "@sentry/react";

const Home = () => {
  const {authState, oktaAuth} = useOktaAuth();
  const [userInfo, setUserInfo] = useState(null);

  const [active, setActive] = useState('MAILBOX')

  const [mailbox, setMailbox] = useState("")
  const [msgId, setMsgID] = useState("")

  const changeMailbox = (e) => {
    setMailbox(e);
    showMailbox()
  }

  const getMail = (event) => {
    setMsgID(event.target.id)
    setActive('MAIL')
  }

  const showMailbox = ()=> {
    setActive('MAILBOX')
  }
  const login = async () => oktaAuth.signInWithRedirect();

  const logout = async () => {
    try {
      await oktaAuth.signOut();
      Sentry.configureScope(scope => scope.setUser(null));
    } catch (err) {
      Sentry.captureException(err);
    }
  };
  
  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      setUserInfo(null);
      Sentry.configureScope(scope => scope.setUser(null));
    } else {
      oktaAuth.getUser().then((info) => {
        setUserInfo(info);
        Sentry.setUser({ email: info.email });
        var val = info.email.split('@')[0]
        setMailbox(val+"@atko.email")
      })
    }
  }, [authState, oktaAuth]);
  if (!authState) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <Container fluid>
      <Menu fluid borderless stackable>
        <Menu.Item header as='a' href='/'><Header as='h2' className='brandText appName'>
            <Image src={'./favicon.png'} size='mini'  verticalAlign='middle'  />ATKO.email
          </Header></Menu.Item>
        <Menu.Item fluid>
          <Switcher changeMailboxEvent={changeMailbox}></Switcher>
        </Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item href="https://oktawiki.atlassian.net/wiki/spaces/ESE/pages/2309622791/Atko.email">Help</Menu.Item>
          {authState.isAuthenticated && (
                <Menu.Item onClick={logout}>Logout</Menu.Item>
              )}
              {!authState.isPending && !authState.isAuthenticated && (
                <Menu.Item onClick={login}>Login</Menu.Item>
              )}
        </Menu.Menu>
      </Menu>
        <Divider hidden />
          {active === 'MAILBOX' ? (
            <Mailbox mailbox={mailbox} getMailEvent={getMail}/>
          ) : active === 'MAIL' ? (
            <MailRender msgId={msgId} showMailboxEvent={showMailbox}/>
          ) : null }
    </Container>
  );
};
export default Home;