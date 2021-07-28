import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Icon, Input, Button, Divider, Grid, GridRow} from 'semantic-ui-react';
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
      .get(config.resourceServer.endpoint +"/mail/"+mailbox+"@"+domain, {
        headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
      })
      .then((data)=>{
          setMessages(data.data.messages);
      })
      .catch((error)=> {
        console.error(error)
      })
    };


  return (
    <GridRow>
      <Grid padded>
      <Grid.Row color='grey' centered >
        <Grid.Column centered textAlign='center'>
          <h2>Simple demonstration emails</h2>
          
          <div>
              <Icon name="mail" size='large' />
              <span>
                <Input id="mailbox" name="mailbox" placeholder='anything' onChange={handleChange} value={mailbox} />
                <b>@</b>
                <Input disabled value={domain}></Input> 
              </span>
              <Button compact positive animated onClick={showMailbox} style={{marginLeft:'.25rem'}}>
                  <Button.Content visible>GO</Button.Content>
                  <Button.Content hidden>
                      <Icon name='arrow right' />
                  </Button.Content>
              </Button>
          </div>
          <p>Any email will be automatically deleted after 24 hours.</p>
        </Grid.Column> 
      </Grid.Row>
      </Grid>
      <Divider hidden />
        {active === 'MAILBOX' ? (
          <Mailbox mailbox={mailbox} domain={domain} getMailEvent={getMail} messages={messages}/>
        ) : active === 'MAIL' ? (
          <MailRender msgId={msgId} showMailboxEvent={showMailbox}/>
        ) : null }
    </GridRow>
  );
};
export default Home;