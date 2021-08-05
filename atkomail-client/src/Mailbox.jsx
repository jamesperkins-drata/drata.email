import React, { useState, useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Icon, Container, List, Button} from 'semantic-ui-react';
import ReactTimeAgo from 'react-time-ago'
import axios from 'axios'
import config from './config'


const Mailbox = (props) => {

    const {oktaAuth } = useOktaAuth();
    const [messages,setMessages] = useState(null)

    const getMailbox = (e) => {
        setMessages(null)
        if(e){
        e.preventDefault();
        }
        axios
        .get(config.resourceServer.endpoint +"/mail/"+props.mailbox+"@"+props.domain, {
          headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
        })
        .then((data)=>{
            setMessages(data.data.messages);
        })
        .catch((error)=> {
          console.error(error)
        })
      };
    
    
    const deleteMail = (e) => {
        axios
        .delete(config.resourceServer.endpoint +"/mail/"+e.target.id, {
          headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
        })
        .then((data)=>{
            getMailbox()
        })
        .catch((error)=> {console.error(error)})
    };

    useEffect(() => {
        setMessages(null)
        if(props.mailbox){
            axios
            .get(config.resourceServer.endpoint +"/mail/"+props.mailbox+"@"+props.domain, {
            headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
            })
            .then((data)=>{
                setMessages(data.data.messages);
            })
            .catch((error)=> {
            console.error(error)
            })
        }
    }, [props.mailbox, props.domain, oktaAuth])

    return (
        <Container padded>
            {messages ? (
                <Container>
                    <div>{props.mailbox}@{props.domain} has {messages.length} {messages.length === 1 ?(<span>message</span>):(<span>messages</span>)} <Icon link name="sync" onClick={getMailbox}></Icon></div>
                    
                    <List divided relaxed>
                        {messages.map((msg) =>
                            <List.Item key={msg.id} >
                            <List.Icon name='mail' size='large' verticalAlign='middle' onClick=""/>
                            <List.Content>
                                <List.Header as='a' onClick={props.getMailEvent} id={msg.id} >{msg.from.value[0].name} : {msg.subject}</List.Header>
                                <List.Description as='a'><ReactTimeAgo date={msg.date} locale="en-US"/></List.Description>
                            </List.Content>
                            <List.Icon verticalAlign='middle'><Button onClick={deleteMail} id={msg.id} color='red'><Icon color='white' fitted name='trash'></Icon></Button></List.Icon>
                            </List.Item> 
                        )}
                    </List>
                </Container>
            ) : (
            <Container padded>
                <div>loading...</div>
                <div><Icon loading name='spinner' /></div>
            </Container>
            )
            }
        </Container>
    )
}
export default Mailbox;