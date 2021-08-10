import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Divider, Image, Header, Menu, Container} from 'semantic-ui-react';
import MailRender from './MailRender';
import Mailbox from './Mailbox';
import Switcher from './Switcher';
import './Home.css'

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
    } catch (err) {
        throw err;
    }
  };

  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      setUserInfo(null);
    } else {
      oktaAuth.getUser().then((info) => {
        setUserInfo(info);
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
      <Menu borderless fluid >
        <Menu.Item header as='a' href='/'><Header as='h2' className='brandText appName'>
            <Image src={'./favicon.png'} size='mini'  verticalAlign='middle'  />ATKO.email
          </Header></Menu.Item>
        <Menu.Item fluid>
          <Switcher changeMailboxEvent={changeMailbox}></Switcher>
        </Menu.Item>
        <Menu.Item position='right' href="https://oktawiki.atlassian.net/wiki/spaces/ESE/pages/2309622791/Atko.email">Help</Menu.Item>
        {authState.isAuthenticated && (
              <Menu.Item position='right' onClick={logout}>Logout</Menu.Item>
            )}
            {!authState.isPending && !authState.isAuthenticated && (
              <Menu.Item position='right' onClick={login}>Login</Menu.Item>
            )}
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