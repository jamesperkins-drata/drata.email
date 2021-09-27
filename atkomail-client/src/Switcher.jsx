import { useOktaAuth } from '@okta/okta-react';
import React, { useState, useEffect } from 'react';
import { Icon, Input, Button, Grid, Form, Select, GridColumn, Label} from 'semantic-ui-react';
import './Switcher.css'

const Switcher = (props) => {

    const {authState, oktaAuth} = useOktaAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [mailbox, setMailbox] = useState("")
    const [domain, setDomain] = useState("atko.email")
    const [domainOptions,setDomainOptions] = useState([])
  


    function changeMailbox(){
        props.changeMailboxEvent(mailbox+"@"+domain)
    }  

    useEffect(() => {
        if (!authState || !authState.isAuthenticated) {
          setUserInfo(null);
        } else {
            oktaAuth.getUser().then((info) => {
                setUserInfo(info);
                //show the user any available domains
                var domains = []
                if(info.maildomains){
                    info.maildomains.forEach(element => {
                        var domain = element.split(':')[1]
                        domains.push({key: domain, text: domain, value: domain})

                    });
                }
                else {
                    domains.push({key: 'atko.email', text: 'atko.email', value: 'atko.email'})
                }
                setDomainOptions(domains)
                //default the user to a mailbox with their sub
                var val = info.email.split('@')[0]
                setMailbox(val)
            })
        }
      }, [authState, oktaAuth]);
      if (!authState) {
        return (
          <div>Loading...</div>
        );
      }

    return(
        <Form style={{width:'600px'}}>
            <Grid>
                <GridColumn width={6} className="switcherCol">
                <Input fluid
                value={mailbox}
                onInput={e => setMailbox(e.target.value)}
                labelPosition='right'>
                    <input/>  
                    <Label><Icon name='at' style={{margin:"0em"}} /></Label>
                </Input>
                </GridColumn>
                <GridColumn width={6} className="switcherCol">
                <Select
                fluid
                control={Select}
                options={domainOptions}
                value={domain}
                onChange={(e,{value})=> setDomain(value)}
                />
                </GridColumn>
                <GridColumn width={2} className="switcherCol">
                    <Button className="brandColor" inverted fluid fitted animated onClick={changeMailbox}>
                    <Button.Content visible>GO</Button.Content>
                    <Button.Content hidden>
                        <Icon inverted name='arrow right' />
                    </Button.Content>
                </Button>
                </GridColumn>
            </Grid>      
      </Form>
    )
}
export default Switcher;