import React, { useState, useEffect } from 'react'
import { useOktaAuth } from '@okta/okta-react';
import axios from 'axios'
import config from './config'
import { Icon, Container, Button} from 'semantic-ui-react';
import ReactTimeAgo from 'react-time-ago'
import ReactHtmlParser from 'react-html-parser'; 
import * as Sentry from "@sentry/react";

const MailRender = (props) => {
    const { oktaAuth } = useOktaAuth();
    const [msg,setMsg] = useState(null)
    const [plainText, setPlainText] = useState(false)
    const [hasHTML, setHasHTML] = useState(false)

    const deleteMail = (e) => {
        axios.delete(config.resourceServer.endpoint +"/mail/"+props.msgId,
            { headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() }}
        )
        .then((data)=>{ props.showMailboxEvent() })
        .catch((error)=> {  Sentry.captureException(error) })
    };

    useEffect(() => {
        axios.get(config.resourceServer.endpoint +"/mail/"+props.msgId,
            { headers: { Authorization: "Bearer " + oktaAuth.getAccessToken() }}
        )
        .then((data)=>{
            setMsg(data.data);
            if(!data.data.html) {
                setPlainText(true)
                setHasHTML(false)
            } else {
                setHasHTML(true)
            }
        })
        .catch((error)=> { Sentry.captureException(error) })
        return () => {
        }
    }, [props.msgId, oktaAuth])

    return (
        <Container padded>
            <Container style={{paddingBottom:'20px'}}>
                <Button onClick={props.showMailboxEvent}>Back to mailbox</Button>
                {
                    hasHTML && plainText ?
                        (<Button onClick={()=>setPlainText(false)}>Show as HTML</Button>) 
                    : hasHTML && plainText === false ?
                        (<Button onClick={()=>setPlainText(true)}>Show as plaintext</Button>) 
                    : null
                }
                <Button color='red' onClick={deleteMail}><Icon fitted name='trash' size='small'/></Button>
            </Container>
            {
                msg ? (
                <div>
                    <div><b>To:</b> {ReactHtmlParser (msg.to.html)}</div>
                    <div><b>From:</b> {ReactHtmlParser (msg.from.html)}</div>
                    <div><b>Subject:</b> {msg.subject}</div>
                    <div><b>Date:</b> <ReactTimeAgo date={msg.date} locale="en-US"/> ({msg.date})</div>
                    {plainText ? (<div dangerouslySetInnerHTML={{ __html: msg.textAsHtml }} />) : (<div> { ReactHtmlParser (msg.html) } </div>)}
                </div>
            ) : (
                <Container>
                    <div>Loading</div>
                    <div><Icon loading name='spinner' /></div>
                </Container>
                )
        }
        </Container>
    )
}
export default MailRender;