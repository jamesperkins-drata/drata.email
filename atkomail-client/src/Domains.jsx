import React, { useState, useEffect, useRef } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Icon, Container, List, Button, Dimmer, Loader,Image, Grid, GridColumn, Popup, Modal, Header, Divider } from 'semantic-ui-react';
import ReactTimeAgo from 'react-time-ago'
import axios from 'axios'
import config from './config'
import * as Sentry from "@sentry/react";
import { OktaAuth } from '@okta/okta-auth-js';


const Domains = (props) => {

    const {oktaAuth} = useOktaAuth();
    const [domains,setDomains] = useState([])
    const [spinner, setSpinner] = React.useState(false)
    const [openInput, setOpenInput] = React.useState(false)
    const [input, setInput] = useState('');


    const getDomains = (e) => {
        setSpinner(true)
        axios.get(config.resourceServer.endpoint +"/domains",
            { 
                headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() }
            }
        )
        .then((data)=>{ setDomains(data.data.domains); setSpinner(false) })
        .catch((error)=> { Sentry.captureException(error) })
    }

    const addDomain = (e) =>{
        setOpenInput(false) 
        setSpinner(true)
        //validate domain
        var data = JSON.stringify({
            "domain": input
          });
        axios.post(config.resourceServer.endpoint +"/domains",data,
            { 
                headers: {
                     Authorization: "Bearer " + oktaAuth.getAccessToken(),
                     'Content-Type' : 'text/json' 
                    },
            }
        )
        .then((data)=>{ getDomains()})
        .catch((error)=> { Sentry.captureException(error); getDomains()})
    }

    const deleteDomain = (e) =>{
        setSpinner(true)
        setDomains([])
        axios.delete(config.resourceServer.endpoint +"/domains/"+e.target.id,
            { 
                headers: {
                     Authorization: "Bearer " + oktaAuth.getAccessToken()
                },
            }
        )
        .then((data)=>{ getDomains()})
        .catch((error)=> { Sentry.captureException(error); getDomains()})
    }

    useEffect(() => {
        getDomains()
    }, [OktaAuth])


    return (
        <Container padded>
             {domains ? (
                <Container>
                    <div>
                        <h1>Domains</h1>
                        <p><Icon verticalAlign='middle' name='flask' class="brandText" /><b>BETA</b> This feature is still very early. Please provide any feedback on <a href="slack://channel?team=T6WPNMPFU&amp;id=C02AERWJZP0"><Icon fitted name='slack' target='_blank'></Icon> atko-email.</a>.</p>
                        <p>Drata.email allows you to use your own domains to recieve email to any address beneath that domain. Note that any mail sent to this domain can be read by user's you choose to share this domain with, this includes sensitive mailboxes such as administrator, webmaster and abuse.</p>
                        <p>To update the domains to which you have access logout and back in.</p>
                    </div>
                    <Divider hidden />
                    <h2>Your Domains <Icon className='clickable' link name="sync" size='small' onClick={getDomains}></Icon></h2>
                    <List divided relaxed>  
                    {domains.length !== 0 ? (
                        domains.map((item) =>
                            <List.Item key={item.domain} >
                                <List.Icon  verticalAlign='middle'>
                                <Button onClick={deleteDomain} id={item.domain} color='red'><Icon fitted name='trash' id={item.domain}></Icon></Button>
                        </List.Icon>
                            <List.Content>
                                <List.Description><b>{item.domain}</b></List.Description>
                                    {item.status &&
                                     <List.Description>
                                     Verification {item.status}
                                     </List.Description>
                                    }
                                    {item.verification &&
                                        <List.Description>
                                        Verification TXT record 
                                        <Popup
                                        content='Copied to clipboard'
                                        eventsEnabled={true}
                                        on='click'
                                        mouseLeaveDelay={500}
                                        trigger={<span className="clickable"> {item.verification} <Icon name='copy' compact onClick={()=>{
                                            navigator.clipboard.writeText(item.verification)
                                            }}></Icon></span>}
                                        />
                                        </List.Description>
                                    }

                                <List.Description>
                                    {item.created &&
                                        <span>Added <ReactTimeAgo date={item.created} locale="en-US"/></span>
                                    }   
                                </List.Description>
                            </List.Content>                           
                            </List.Item> 
                        ))
                        : null }                     
                    </List>
                    <List divided relaxed>
                        {spinner ? (<List.Item>
                            <List.Icon  verticalAlign='middle'>
                                <Loader active inline />
                            </List.Icon>
                            <List.Content>
                                <List.Header><b>loading</b></List.Header>
                                <List.Description>please wait</List.Description>
                            </List.Content>                           
                            </List.Item>
                        ) : null }
                            <List.Item >
                                <List.Icon  verticalAlign='middle'>
                                <Modal
                                    onClose={() => setOpenInput(false)}
                                    onOpen={() => setOpenInput(true)}
                                    open={openInput}
                                    trigger={<Button color='green'><Icon fitted name='plus'></Icon></Button>}>
                                    <Modal.Header>Add Domain</Modal.Header>
                                    <Modal.Content image>
                                        <Modal.Description>
                                        <div class="ui input focus">
                                            <input id="inputDomain" type="text" placeholder="Domain"
                                            value={input} onInput={e => setInput(e.target.value)}
                                            pattern="^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$"/>
                                            </div>
                                        <div>
                                            <p>The MX record for your domain must point to <b>inbound-smtp.us-east-1.amazonaws.com</b>.</p>
                                            <p>Your DNS must contain a TXT record with the name <b>_amazonses</b> with the content of the verification string.</p>
                                        </div>
                                        </Modal.Description>
                                    </Modal.Content>
                                    <Modal.Actions>
                                        <Button color='' onClick={() => setOpenInput(false)}>
                                        Cancel
                                        </Button>
                                        <Button
                                        content="Continue"
                                        labelPosition='right'
                                        icon='checkmark'
                                        onClick={() => {addDomain()}}
                                        positive
                                        />
                                    </Modal.Actions>
                                    </Modal>
                                                            
                            </List.Icon>    
                                    
                            <List.Content>
                                <List.Header>Add new</List.Header>
                            </List.Content>                           
                            </List.Item>                   
                    </List>
                </Container>
                 ) : null }
        </Container>
    )
}
export default Domains;