import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Icon, Input, Button, List} from 'semantic-ui-react';
import MailRender from './MailRender';
import Mailbox from './Mailbox';
import axios from 'axios'
import config from './config'

const Home = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const [userInfo, setUserInfo] = useState(null);

  const [active, setActive] = useState('MAILBOX')

  const [messages,setMessages] = useState(null)
  const [mailbox, setMailbox] = useState('testacc')
  const domain = "atko.email"
  const handleChange = (e) => setMailbox(e.target.value);
  const [msgId, setMsgID] = useState("")
  
  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      setUserInfo(null);
    } else {
      oktaAuth.getUser().then((info) => {
        setUserInfo(info);
        getMailbox()
      });
    }
  }, [authState, oktaAuth]); // Update if authState changes

  if (!authState) {
    return (
      <div>Loading...</div>
    );
  }

  const getMail = (event) => {
    setMsgID(event.target.id)
    setActive('MAIL')
  }

  const showMailbox = ()=> {
    setActive('MAILBOX')
    getMailbox()
  }

  const getMailbox = (e) => {
      if(e){
      e.preventDefault();
      }
      axios
      .get(config.resourceServer.endpoint +"mail/"+mailbox+"@"+domain, {
        headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
      })
      .then((data)=>{
          console.log(data)
          setMessages(data.data.messages);
      })
      .catch((error)=> {
        console.error(error)
      })
    };


  return (
    <div>
      <div>
          <Icon name="mail" />
          <Input id="mailbox" name="mailbox" placeholder='anything' onChange={handleChange} value={mailbox}/>
          <Input id="domain" name="domain" value={domain} disabled />
          <Button animated onClick={showMailbox}>
              <Button.Content visible>GO</Button.Content>
              <Button.Content hidden>
                  <Icon name='arrow right' />
              </Button.Content>
          </Button>
      </div>
      {active === 'MAILBOX' ? (
        <Mailbox mailbox={mailbox} domain={domain} getMailEvent={getMail} messages={messages}/>
      ) : active === 'MAIL' ? (
        <MailRender msgId={msgId} showMailboxEvent={showMailbox}/>
      ) : null }

    </div>
  );
};
export default Home;