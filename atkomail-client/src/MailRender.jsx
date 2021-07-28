import React, { useState, useEffect } from 'react'
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios'
import config from './config'
import { Icon, Input, Button, List} from 'semantic-ui-react';
import ReactHtmlParser from 'react-html-parser'; 

const MailRender = (props) => {
    const { authState, oktaAuth } = useOktaAuth();
    const [msg,setMsg] = useState(null)

    const getMail = (e) => {
        axios
        .get(config.resourceServer.endpoint +"mail/"+props.msgId, {
          headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
        })
        .then((data)=>{
            console.log(data)
            setMsg(data.data);
        })
        .catch((error)=> {console.error(error)})
      };

    const deleteMail = (e) => {
        axios
        .delete(config.resourceServer.endpoint +"mail/"+props.msgId, {
          headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() },
        })
        .then((data)=>{
            props.showMailboxEvent()
        })
        .catch((error)=> {console.error(error)})
    };

    useEffect(() => {
        getMail()
        return () => {
            console.log("clean")
        }
    }, [])

    return (
        <div>
            <div><Button onClick={props.showMailboxEvent}>Back to mailbox</Button><Button onClick={deleteMail}><Icon fitted name='trash' size='small'/></Button></div>
            {
                msg ? (
                <div>
                    <div><b>To:</b> {ReactHtmlParser (msg.to.html)}</div>
                    <div><b>From:</b> {ReactHtmlParser (msg.from.html)}</div>
                    <div><b>Subject:</b>{msg.subject}</div>
                    <div> { ReactHtmlParser (msg.html) } </div>
                </div>
            ) : (
                <div>
                    <div>loading</div>
                    <div><Icon loading name='spinner' /></div>
                </div>
                )
        }
        </div>
    )
}
export default MailRender;