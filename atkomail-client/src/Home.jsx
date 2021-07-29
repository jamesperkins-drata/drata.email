import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Icon, Input, Button, Divider, Grid, GridRow} from 'semantic-ui-react';
import MailRender from './MailRender';
import Mailbox from './Mailbox';
import axios from 'axios'
import config from './config'

const Home = () => {
  const {authState, oktaAuth} = useOktaAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [active, setActive] = useState('MAILBOX')
  const [mailbox, setMailbox] = useState("")
  const [msgId, setMsgID] = useState("")

  const domain = "atko.email"
  const handleChange = (e) => setMailbox(e.target.value);



  const getMail = (event) => {
    setMsgID(event.target.id)
    setActive('MAIL')
  }

  const showMailbox = ()=> {
    setActive(null)
    setActive('MAILBOX')
  }

  useEffect(() => {
    if (!authState || !authState.isAuthenticated) {
      setUserInfo(null);
    } else {
      oktaAuth.getUser().then((info) => {
        setUserInfo(info);
        setMailbox(info.email.split('@')[0])
      })
    }
  }, [authState, oktaAuth]);
  if (!authState) {
    return (
      <div>Loading...</div>
    );
  }


  return (
    <GridRow>
      <Grid padded>
      <Grid.Row color='grey' centered >
        <Grid.Column centered textAlign='center'>
          <h2>Simple demonstration emails</h2>
          <p>Collect email from any address under a domain.</p>
          <div>
              <Icon name="mail" size='large' />
              <span>
                <Input id="mailbox" name="mailbox" placeholder='' onChange={handleChange} value={mailbox}/>
                <b style={{marginLeft:'.25rem', marginRight:'.25rem'}}>@</b>
                <Input disabled value={domain}></Input> 
              </span>
              <Button fitted positive animated onClick={showMailbox} style={{marginLeft:'.25rem', marginTop:'-.3rem'}}>
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
          <Mailbox mailbox={mailbox} domain={domain} getMailEvent={getMail}/>
        ) : active === 'MAIL' ? (
          <MailRender msgId={msgId} showMailboxEvent={showMailbox}/>
        ) : null }
    </GridRow>
  );
};
export default Home;