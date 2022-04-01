import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Divider, Icon, Header, Menu, Container, MenuItem} from 'semantic-ui-react';
import MailRender from './MailRender';
import Mailbox from './Mailbox';
import Domains from './Domains'
import Switcher from './Switcher';
import {ThemeProvider} from "styled-components";
import { GlobalStyles } from "./components/Globalstyle";
import { lightTheme, darkTheme } from "./components/Themes"
import  {useDarkMode} from "./components/useDarkMode"
import ThemeToggle from './components/ThemeToggle'
import './Home.css'
import * as Sentry from "@sentry/react";

const Home = () => {
  const {authState, oktaAuth} = useOktaAuth();
  const [features, setFeatures] = useState([])
  const [active, setActive] = useState('MAILBOX')

  const [theme, themeToggler] = useDarkMode();
  const themeMode = theme === 'light' ? lightTheme : darkTheme;

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

  const showDomains = ()=> {
    setActive('DOMAINS')
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
      Sentry.configureScope(scope => scope.setUser(null));
    } else {
      oktaAuth.getUser().then((info) => {
        if(info.features){
          setFeatures(info.features)
        }
        Sentry.setUser({ email: info.email });
      })
    }
  }, [authState, oktaAuth,setFeatures]);
  if (!authState) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <ThemeProvider theme={themeMode}>
    <GlobalStyles/>
    <Container fluid>
      <Menu fluid borderless stackable>
        <Menu.Item header as='a' href='/'><Header as='h2' className='brandText appName'>
            <Icon verticalAlign='middle' name='envelope open' size='tiny' class="brandText" className="appIco"  />ATKO.email
          </Header></Menu.Item>
        <Menu.Item fluid>
          <Switcher changeMailboxEvent={changeMailbox}></Switcher>
        </Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item><ThemeToggle theme={theme} toggleTheme={themeToggler}></ThemeToggle></Menu.Item>
          {features.includes('ff:customdomain') && (
                <Menu.Item onClick={showDomains}>Domains  <Icon verticalAlign='middle' name='flask' class="brandText" /></Menu.Item>
          )}
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
          ) : active === 'DOMAINS' ? (
            <Domains/>
          )
          : null }
    </Container>
    </ThemeProvider>
  );
};
export default Home;